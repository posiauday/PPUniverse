import { AxeBuilder } from "@axe-core/playwright";
import { expect, type Page, type TestInfo } from "@playwright/test";
import {
  SCANNED_TAGS,
  formatViolations,
  partitionAxeResults,
  summarizeFindings,
  type AxeOutcome,
} from "./axe-results.js";

/** One axe analysis of the page as it is right now, classified per decision Q35. */
export async function runAxe(page: Page): Promise<AxeOutcome> {
  const results = await new AxeBuilder({ page }).withTags([...SCANNED_TAGS]).analyze();
  return partitionAxeResults(results);
}

/**
 * Runs axe and FAILS on blocking findings. Advisory findings (best-practice) and
 * "needs review" results never fail the run: they are attached to the test and
 * recorded as annotations, which the CI summary lists.
 */
export async function expectNoBlockingViolations(
  page: Page,
  testInfo: TestInfo,
  label: string,
): Promise<AxeOutcome> {
  const outcome = await runAxe(page);

  await testInfo.attach(`axe-${label}.json`, {
    contentType: "application/json",
    body: JSON.stringify(
      {
        url: outcome.url,
        blocking: summarizeFindings(outcome.blocking),
        advisory: summarizeFindings(outcome.advisory),
        needsReview: summarizeFindings(outcome.needsReview),
        passCount: outcome.passCount,
      },
      null,
      2,
    ),
  });
  for (const finding of outcome.advisory) {
    testInfo.annotations.push({
      type: "axe-advisory",
      description: `${label}: ${finding.id} (${finding.nodes.length})`,
    });
  }
  for (const finding of outcome.needsReview) {
    testInfo.annotations.push({
      type: "axe-needs-review",
      description: `${label}: ${finding.id} (${finding.nodes.length})`,
    });
  }

  expect(
    outcome.blocking.length,
    `${label}: axe found ${outcome.blocking.length} blocking WCAG A/AA violation(s):\n${formatViolations(outcome.blocking)}`,
  ).toBe(0);
  return outcome;
}
