import { mkdirSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";
import type { FullResult, Reporter, TestCase, TestResult } from "@playwright/test/reporter";
import { summarize, type RecordedResult } from "./summary.js";

/**
 * A Playwright reporter that records every attempt and, when the run ends, writes the
 * Markdown summary (see summary.ts) to results/summary.md. The CI job appends that file
 * to the job summary together with its own timing table, so install time and test time
 * are reported separately.
 */
export default class SummaryReporter implements Reporter {
  private results: RecordedResult[] = [];
  private startedAt = Date.now();

  onBegin(): void {
    this.startedAt = Date.now();
  }

  onTestEnd(test: TestCase, result: TestResult): void {
    this.results.push({
      project: test.parent.project()?.name ?? "unknown",
      title: test.titlePath().slice(3).join(" › "),
      status: result.status,
      retry: result.retry,
      durationMs: result.duration,
      annotations: test.annotations.map((annotation) => ({
        type: annotation.type,
        description: annotation.description,
      })),
    });
  }

  onEnd(_result: FullResult): void {
    const markdown = summarize({ results: this.results, wallMs: Date.now() - this.startedAt });
    const output = process.env["E2E_SUMMARY_PATH"] ?? "results/summary.md";
    mkdirSync(dirname(output), { recursive: true });
    writeFileSync(output, markdown);
  }

  printsToStdio(): boolean {
    return false;
  }
}
