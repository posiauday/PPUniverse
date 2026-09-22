/**
 * Builds the Markdown summary of an accessibility run (job summary and PR evidence).
 * Pure functions over recorded results, so the report logic is unit-tested without
 * running a browser. What it must never do is make a run look better than it was:
 * skips and retries are listed, advisory findings are listed, and the limits of what
 * the suite can show are always printed.
 */

export interface RecordedResult {
  project: string;
  title: string;
  status: "passed" | "failed" | "timedOut" | "skipped" | "interrupted";
  retry: number;
  durationMs: number;
  annotations: { type: string; description?: string | undefined }[];
}

export interface SummaryInput {
  results: RecordedResult[];
  /** Wall-clock of the Playwright run, in milliseconds. */
  wallMs: number;
}

interface TestOutcome {
  project: string;
  title: string;
  /** The final attempt's status. */
  status: RecordedResult["status"];
  attempts: number;
  /** Passed only after an earlier attempt failed. */
  flaky: boolean;
  annotations: RecordedResult["annotations"];
}

const FAILED: ReadonlySet<string> = new Set(["failed", "timedOut", "interrupted"]);

/** Collapses per-attempt results into one outcome per test per project. */
export function collapseAttempts(results: readonly RecordedResult[]): TestOutcome[] {
  const byTest = new Map<string, RecordedResult[]>();
  for (const result of results) {
    const key = JSON.stringify([result.project, result.title]);
    byTest.set(key, [...(byTest.get(key) ?? []), result]);
  }
  return [...byTest.values()].map((attempts) => {
    const ordered = [...attempts].sort((a, b) => a.retry - b.retry);
    const last = ordered[ordered.length - 1] as RecordedResult;
    return {
      project: last.project,
      title: last.title,
      status: last.status,
      attempts: ordered.length,
      flaky: last.status === "passed" && ordered.some((attempt) => FAILED.has(attempt.status)),
      annotations: last.annotations,
    };
  });
}

export function formatDuration(ms: number): string {
  const totalSeconds = Math.round(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return minutes > 0 ? `${minutes}m ${String(seconds).padStart(2, "0")}s` : `${seconds}s`;
}

interface Finding {
  rule: string;
  labels: Set<string>;
  engines: Set<string>;
  occurrences: number;
}

/** Aggregates annotations such as "search-results@320: heading-order (2)" by axe rule. */
export function aggregateFindings(
  outcomes: readonly TestOutcome[],
  annotationType: string,
): Finding[] {
  const byRule = new Map<string, Finding>();
  for (const outcome of outcomes) {
    for (const annotation of outcome.annotations) {
      if (annotation.type !== annotationType || !annotation.description) continue;
      const match = /^(.*?): ([^\s]+) \(\d+\)$/.exec(annotation.description);
      if (!match) continue;
      const [, label = "", rule = ""] = match;
      const finding = byRule.get(rule) ?? {
        rule,
        labels: new Set<string>(),
        engines: new Set<string>(),
        occurrences: 0,
      };
      finding.labels.add(label);
      finding.engines.add(outcome.project);
      finding.occurrences += 1;
      byRule.set(rule, finding);
    }
  }
  return [...byRule.values()].sort(
    (a, b) => b.occurrences - a.occurrences || a.rule.localeCompare(b.rule),
  );
}

function findingsTable(findings: readonly Finding[]): string {
  const rows = findings.map((finding) => {
    const examples = [...finding.labels].sort().slice(0, 4).join(", ");
    const more = finding.labels.size > 4 ? `, +${finding.labels.size - 4} more` : "";
    return `| \`${finding.rule}\` | ${finding.occurrences} | ${[...finding.engines].sort().join(", ")} | ${examples}${more} |`;
  });
  return ["| Rule | Occurrences | Engines | Where |", "|---|---|---|---|", ...rows].join("\n");
}

export function summarize({ results, wallMs }: SummaryInput): string {
  const outcomes = collapseAttempts(results);
  const projects = [...new Set(outcomes.map((outcome) => outcome.project))].sort();
  const count = (list: readonly TestOutcome[], predicate: (o: TestOutcome) => boolean): number =>
    list.filter(predicate).length;

  const failed = outcomes.filter((outcome) => FAILED.has(outcome.status));
  const skipped = outcomes.filter((outcome) => outcome.status === "skipped");
  const flaky = outcomes.filter((outcome) => outcome.flaky);
  const passed = count(outcomes, (outcome) => outcome.status === "passed");

  const lines: string[] = [];
  lines.push("### Accessibility gate: test results", "");
  lines.push(
    `**${outcomes.length} tests**: ${passed} passed, ${failed.length} failed, ${skipped.length} skipped, ${flaky.length} passed only on a retry. ` +
      `Test execution (Playwright wall-clock, including starting the application server): **${formatDuration(wallMs)}**.`,
    "",
  );

  lines.push("| Engine | Passed | Failed | Skipped | Retried |", "|---|---|---|---|---|");
  for (const project of projects) {
    const own = outcomes.filter((outcome) => outcome.project === project);
    lines.push(
      `| ${project} | ${count(own, (o) => o.status === "passed")} | ${count(own, (o) => FAILED.has(o.status))} | ${count(own, (o) => o.status === "skipped")} | ${count(own, (o) => o.attempts > 1)} |`,
    );
  }
  lines.push("");

  lines.push(
    skipped.length === 0
      ? "**Skipped tests:** none."
      : `**Skipped tests (each must be explained and approved):**\n${skipped.map((o) => `- [${o.project}] ${o.title}`).join("\n")}`,
    "",
  );
  lines.push(
    flaky.length === 0 && count(outcomes, (o) => o.attempts > 1) === 0
      ? "**Retries:** none. (A retry is a visible flake and a defect to fix.)"
      : `**Retries (visible by policy; a flaky accessibility test is a defect):**\n${outcomes
          .filter((o) => o.attempts > 1)
          .map((o) => `- [${o.project}] ${o.title} (${o.attempts} attempts, final: ${o.status})`)
          .join("\n")}`,
    "",
  );

  if (failed.length > 0) {
    lines.push(
      `**Failing tests (${failed.length}):**`,
      ...failed.slice(0, 40).map((o) => `- [${o.project}] ${o.title}`),
      failed.length > 40 ? `- ... and ${failed.length - 40} more` : "",
      "",
    );
  }

  const advisory = aggregateFindings(outcomes, "axe-advisory");
  lines.push("#### Advisory findings (axe best-practice rules; reported, not blocking)", "");
  lines.push(advisory.length === 0 ? "None." : findingsTable(advisory), "");

  const review = aggregateFindings(outcomes, "axe-needs-review");
  lines.push(
    '#### Needs manual review (axe "incomplete": axe could not decide; these are not passes)',
    "",
  );
  lines.push(review.length === 0 ? "None." : findingsTable(review), "");

  const versions = [
    ...new Set(
      outcomes.flatMap((o) =>
        o.annotations
          .filter((a) => a.type === "engine-version" && a.description)
          .map((a) => a.description as string),
      ),
    ),
  ].sort();
  lines.push("#### Engine builds used (Playwright's pinned, bundled browsers)", "");
  lines.push(
    versions.length === 0 ? "Not recorded in this run." : versions.map((v) => `- ${v}`).join("\n"),
    "",
  );

  const limitations = new Set(
    outcomes.flatMap((o) =>
      o.annotations
        .filter((a) => a.type === "keyboard-limitation" && a.description)
        .map((a) => a.description as string),
    ),
  );
  lines.push("#### What this run does not show", "");
  lines.push(
    "- Not verified: screen readers (NVDA, JAWS, VoiceOver), voice control, switch access, magnification, and any browser and assistive-technology pairing.",
    "- The matrix exercises accessibility and rendering checks; it is not a cross-browser functional regression suite.",
    "- Automated checks find only a subset of accessibility problems, and passing them is not a claim of conformance.",
    ...[...limitations].sort().map((text) => `- ${text}`),
    "",
  );

  return lines.join("\n");
}
