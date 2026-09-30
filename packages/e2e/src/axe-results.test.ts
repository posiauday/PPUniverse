import axe from "axe-core";
import type { Result } from "axe-core";
import { describe, expect, it } from "vitest";
import {
  BLOCKING_TAGS,
  SCANNED_TAGS,
  formatViolations,
  isBlocking,
  partitionAxeResults,
  summarizeFindings,
} from "./axe-results.js";

function rule(id: string, tags: string[], nodes = 1): Result {
  return {
    id,
    impact: "serious",
    tags,
    description: `${id} description`,
    help: `${id} help`,
    helpUrl: `https://dequeuniversity.com/rules/axe/4.13/${id}`,
    nodes: Array.from({ length: nodes }, (_, i) => ({
      html: `<div id="n${i}"></div>`,
      target: [`#n${i}`],
      failureSummary: "Fix any of the following:\n  something is wrong",
    })),
  } as unknown as Result;
}

describe("axe rule selection", () => {
  it("scans exactly the blocking WCAG tags plus best-practice", () => {
    expect([...BLOCKING_TAGS]).toEqual(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"]);
    expect(SCANNED_TAGS).toEqual([...BLOCKING_TAGS, "best-practice"]);
  });

  it("actually selects the rules the gate relies on in the installed axe-core", () => {
    // Guards against a tag being renamed or emptied in a future axe-core, which
    // would leave the gate scanning nothing while still reporting green.
    const selected = new Set(axe.getRules([...SCANNED_TAGS]).map((r) => r.ruleId));
    for (const id of [
      "color-contrast",
      "label",
      "image-alt",
      "button-name",
      "link-name",
      "document-title",
      "html-has-lang",
      "landmark-one-main",
      "heading-order",
    ]) {
      expect(selected.has(id), `${id} should be scanned`).toBe(true);
    }
  });

  it("finds rules under every blocking tag", () => {
    for (const tag of BLOCKING_TAGS) {
      expect(axe.getRules([tag]).length, `no rules carry ${tag}`).toBeGreaterThan(0);
    }
  });
});

describe("classifying axe results", () => {
  it("treats any wcag* tagged rule as blocking and best-practice-only as advisory", () => {
    expect(isBlocking(rule("color-contrast", ["cat.color", "wcag2aa", "wcag143"]))).toBe(true);
    expect(
      isBlocking(rule("target-size", ["cat.sensory-and-visual-cues", "wcag22aa", "wcag258"])),
    ).toBe(true);
    expect(isBlocking(rule("heading-order", ["cat.semantics", "best-practice"]))).toBe(false);
    expect(isBlocking(rule("region", ["cat.keyboard", "best-practice"]))).toBe(false);
  });

  it("partitions violations and keeps incomplete results out of the blocking set", () => {
    const outcome = partitionAxeResults({
      url: "http://localhost/x",
      violations: [rule("image-alt", ["wcag2a"]), rule("heading-order", ["best-practice"])],
      incomplete: [rule("color-contrast", ["wcag2aa"])],
      passes: [rule("label", ["wcag2a"]), rule("html-has-lang", ["wcag2a"])],
    });
    expect(outcome.blocking.map((r) => r.id)).toEqual(["image-alt"]);
    expect(outcome.advisory.map((r) => r.id)).toEqual(["heading-order"]);
    expect(outcome.needsReview.map((r) => r.id)).toEqual(["color-contrast"]);
    expect(outcome.passCount).toBe(2);
  });

  it("formats a readable failure message with the rule, link and elements", () => {
    const text = formatViolations([rule("image-alt", ["wcag2a"], 7)]);
    expect(text).toContain("image-alt [serious]");
    expect(text).toContain("https://dequeuniversity.com/rules/axe/4.13/image-alt");
    expect(text).toContain("#n0");
    expect(text).toContain("... and 2 more");
    expect(formatViolations([])).toBe("no violations");
  });

  it("summarises findings compactly for reports", () => {
    expect(summarizeFindings([rule("region", ["best-practice"], 3)])).toEqual([
      {
        id: "region",
        impact: "serious",
        help: "region help",
        helpUrl: "https://dequeuniversity.com/rules/axe/4.13/region",
        tags: ["best-practice"],
        nodeCount: 3,
      },
    ]);
  });
});
