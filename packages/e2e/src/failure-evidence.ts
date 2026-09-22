import type {
  ConsoleMessage,
  Page,
  Request as PWRequest,
  Response as PWResponse,
  TestInfo,
} from "@playwright/test";
import { installFailureEvidenceTracer } from "./failure-evidence-inpage.js";
import type { TitleTraceEvent } from "./title-trace.js";

/**
 * Failure-evidence capture (decision, 2026-09-21: MVP-023 run 4 Firefox failures). Test
 * logic only: no product code, no suite configuration (workers, retries, timeouts,
 * engines, widths, rules) is touched.
 *
 * Listeners are attached for every test (cheap: a few `page.on` registrations and one
 * `addInitScript`). Collecting and attaching evidence — the only part with any real
 * cost — happens ONLY when a test does not pass, so a green run pays nothing extra.
 */

export interface ConsoleEntry {
  atMs: number;
  type: string;
  text: string;
}

export interface NetworkEntry {
  atMs: number;
  event: "request" | "response" | "requestfailed";
  method: string;
  url: string;
  status: number | null;
  failure: string | null;
}

export interface FailureEvidenceSink {
  install(page: Page): void;
  attachOnFailure(page: Page, testInfo: TestInfo): Promise<void>;
}

export function createFailureEvidenceSink(): FailureEvidenceSink {
  const startedAt = Date.now();
  const consoleLog: ConsoleEntry[] = [];
  const networkLog: NetworkEntry[] = [];
  const elapsed = (): number => Date.now() - startedAt;

  return {
    install(page: Page) {
      page.on("console", (msg: ConsoleMessage) => {
        consoleLog.push({ atMs: elapsed(), type: msg.type(), text: msg.text() });
      });
      page.on("pageerror", (err: Error) => {
        consoleLog.push({ atMs: elapsed(), type: "pageerror", text: String(err) });
      });
      page.on("request", (req: PWRequest) => {
        networkLog.push({
          atMs: elapsed(),
          event: "request",
          method: req.method(),
          url: req.url(),
          status: null,
          failure: null,
        });
      });
      page.on("requestfailed", (req: PWRequest) => {
        networkLog.push({
          atMs: elapsed(),
          event: "requestfailed",
          method: req.method(),
          url: req.url(),
          status: null,
          failure: req.failure()?.errorText ?? null,
        });
      });
      page.on("response", (res: PWResponse) => {
        networkLog.push({
          atMs: elapsed(),
          event: "response",
          method: res.request().method(),
          url: res.url(),
          status: res.status(),
          failure: null,
        });
      });
      // Installed before any app script runs, on every navigation (new document).
      void page.addInitScript(installFailureEvidenceTracer);
    },

    async attachOnFailure(page: Page, testInfo: TestInfo) {
      if (testInfo.status === "passed" || testInfo.status === "skipped") return;

      const titleTrace = await page
        .evaluate(
          () =>
            (window as unknown as { __e2eTitleTrace?: TitleTraceEvent[] }).__e2eTitleTrace ?? [],
        )
        .catch((error: unknown) => [
          {
            kind: "title" as const,
            atMs: -1,
            title: `(could not read: ${String(error)})`,
            via: "initial" as const,
          },
        ]);
      const html = await page
        .content()
        .catch((error: unknown) => `<!-- page.content() failed: ${String(error)} -->`);

      await testInfo.attach("failure-console.json", {
        contentType: "application/json",
        body: JSON.stringify(consoleLog, null, 2),
      });
      await testInfo.attach("failure-network.json", {
        contentType: "application/json",
        body: JSON.stringify(networkLog, null, 2),
      });
      await testInfo.attach("failure-title-trace.json", {
        contentType: "application/json",
        body: JSON.stringify(titleTrace, null, 2),
      });
      await testInfo.attach("failure-page.html", { contentType: "text/html", body: html });
    },
  };
}
