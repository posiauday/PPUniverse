import { test as base, expect } from "@playwright/test";
import { createFailureEvidenceSink } from "./failure-evidence.js";
import { createFixtures, type FixtureSet } from "./seed.js";

/**
 * The name of next-auth's session cookie over plain http, which is what the
 * harness's local server uses. Signing in is done through the REAL server-enforced
 * path: the row lives in the database and the server looks it up like any other
 * session. There is no test-only route, flag or relaxed check in the application
 * (decision Q40).
 */
export const SESSION_COOKIE = "next-auth.session-token";

interface TestFixtures {
  /** Signs the default browser context in as the worker's fixture user. */
  signedIn: void;
  /** Signs the default browser context in as the worker's ADMIN fixture user (MVP-020). */
  signedInAsAdmin: void;
  /**
   * Auto-attached (decision, 2026-09-21: MVP-023 run 4 Firefox failures): records
   * console, network and title/route-announcer evidence for every test, but only
   * attaches it to a test that does NOT pass. Test logic only — no suite configuration
   * (workers, retries, timeouts, engines, widths, rules) is changed by this.
   */
  failureEvidence: void;
}

interface WorkerFixtures {
  /** This worker's temporary rows; created on first use and deleted when the worker ends. */
  seed: FixtureSet;
}

export const test = base.extend<TestFixtures, WorkerFixtures>({
  seed: [
    // Playwright requires the destructuring pattern here even though no fixture is used.
    // eslint-disable-next-line no-empty-pattern
    async ({}, use, workerInfo) => {
      const set = await createFixtures(workerInfo.workerIndex);
      try {
        await use(set);
      } finally {
        await set.cleanup();
      }
    },
    { scope: "worker" },
  ],

  failureEvidence: [
    async ({ page }, use, testInfo) => {
      const sink = createFailureEvidenceSink();
      sink.install(page);
      await use();
      await sink.attachOnFailure(page, testInfo);
    },
    { auto: true },
  ],

  signedIn: [
    async ({ context, seed, baseURL }, use) => {
      await context.addCookies([
        {
          name: SESSION_COOKIE,
          value: seed.currentSession.token,
          url: baseURL ?? "http://localhost:3100",
          httpOnly: true,
          sameSite: "Lax",
        },
      ]);
      await use();
      await context.clearCookies();
    },
    { auto: false },
  ],

  signedInAsAdmin: [
    async ({ context, seed, baseURL }, use) => {
      await context.addCookies([
        {
          name: SESSION_COOKIE,
          value: seed.adminSession.token,
          url: baseURL ?? "http://localhost:3100",
          httpOnly: true,
          sameSite: "Lax",
        },
      ]);
      await use();
      await context.clearCookies();
    },
    { auto: false },
  ],
});

export { expect };
