import type { AxeResults, Result } from "axe-core";

/**
 * How axe results are classified (decision Q35, docs/final-decisions.md):
 * - rules tagged wcag2a, wcag2aa, wcag21a, wcag21aa or wcag22aa are BLOCKING;
 * - rules tagged best-practice are ADVISORY: reported, never failing the build;
 * - "incomplete" results (axe could not decide) are always advisory and are listed
 *   as needing manual review — they are not passes.
 */
export const BLOCKING_TAGS = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"] as const;
export const ADVISORY_TAG = "best-practice";

/** The tag list handed to axe, so one analysis yields both blocking and advisory findings. */
export const SCANNED_TAGS: readonly string[] = [...BLOCKING_TAGS, ADVISORY_TAG];

const BLOCKING_TAG_SET: ReadonlySet<string> = new Set(BLOCKING_TAGS);

export function isBlocking(result: Pick<Result, "tags">): boolean {
  return result.tags.some((tag) => BLOCKING_TAG_SET.has(tag));
}

export interface AxeOutcome {
  url: string;
  blocking: Result[];
  advisory: Result[];
  needsReview: Result[];
  passCount: number;
}

export function partitionAxeResults(
  results: Pick<AxeResults, "url" | "violations" | "incomplete" | "passes">,
): AxeOutcome {
  return {
    url: results.url,
    blocking: results.violations.filter(isBlocking),
    advisory: results.violations.filter((rule) => !isBlocking(rule)),
    needsReview: results.incomplete,
    passCount: results.passes.length,
  };
}

/** A readable failure message: rule, impact, help link and the offending elements. */
export function formatViolations(violations: readonly Result[]): string {
  if (violations.length === 0) return "no violations";
  return violations
    .map((rule) => {
      const nodes = rule.nodes
        .slice(0, 5)
        .map(
          (node) =>
            `    - ${node.target.join(" ")}\n      ${node.failureSummary?.replace(/\n/g, "\n      ") ?? ""}`,
        )
        .join("\n");
      const more = rule.nodes.length > 5 ? `\n    ... and ${rule.nodes.length - 5} more` : "";
      return `${rule.id} [${rule.impact ?? "n/a"}] ${rule.help} (${rule.helpUrl})\n${nodes}${more}`;
    })
    .join("\n");
}

export interface AxeFindingSummary {
  id: string;
  impact: string | null;
  help: string;
  helpUrl: string;
  tags: string[];
  nodeCount: number;
}

export function summarizeFindings(rules: readonly Result[]): AxeFindingSummary[] {
  return rules.map((rule) => ({
    id: rule.id,
    impact: rule.impact ?? null,
    help: rule.help,
    helpUrl: rule.helpUrl,
    tags: rule.tags,
    nodeCount: rule.nodes.length,
  }));
}
