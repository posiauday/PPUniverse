import { describe, expect, it } from "vitest";
import {
  aggregateFindings,
  collapseAttempts,
  formatDuration,
  summarize,
  type RecordedResult,
} from "./summary.js";

function result(overrides: Partial<RecordedResult> = {}): RecordedResult {
  return {
    project: "chromium",
    title: "page matrix › home @ 320px",
    status: "passed",
    retry: 0,
    durationMs: 1500,
    annotations: [],
    ...overrides,
  };
}

describe("run summary", () => {
  it("counts passes, failures and skips per engine", () => {
    const text = summarize({
      wallMs: 125_000,
      results: [
        result({ project: "chromium", title: "a" }),
        result({ project: "chromium", title: "b", status: "failed" }),
        result({ project: "firefox", title: "a" }),
        result({ project: "webkit", title: "a", status: "skipped" }),
      ],
    });
    expect(text).toContain("**4 tests**: 2 passed, 1 failed, 1 skipped, 0 passed only on a retry");
    expect(text).toContain("| chromium | 1 | 1 | 0 | 0 |");
    expect(text).toContain("| firefox | 1 | 0 | 0 | 0 |");
    expect(text).toContain("| webkit | 0 | 0 | 1 | 0 |");
    expect(text).toContain("**2m 05s**");
  });

  it("lists skipped tests instead of hiding them, and says when there are none", () => {
    expect(summarize({ wallMs: 1000, results: [result()] })).toContain("**Skipped tests:** none.");
    const withSkip = summarize({
      wallMs: 1000,
      results: [result({ project: "webkit", title: "keyboard › x", status: "skipped" })],
    });
    expect(withSkip).toContain("[webkit] keyboard › x");
    expect(withSkip).toContain("must be explained and approved");
  });

  it("makes a retried test visible, and flags one that only passed on a retry as flaky", () => {
    const outcomes = collapseAttempts([
      result({ title: "flaky one", status: "failed", retry: 0 }),
      result({ title: "flaky one", status: "passed", retry: 1 }),
      result({ title: "steady" }),
    ]);
    expect(outcomes.find((o) => o.title === "flaky one")).toMatchObject({
      flaky: true,
      attempts: 2,
    });
    expect(outcomes.find((o) => o.title === "steady")).toMatchObject({ flaky: false, attempts: 1 });

    const text = summarize({
      wallMs: 1000,
      results: [
        result({ title: "flaky one", status: "failed", retry: 0 }),
        result({ title: "flaky one", status: "passed", retry: 1 }),
      ],
    });
    expect(text).toContain("1 passed only on a retry");
    expect(text).toContain("flaky one (2 attempts, final: passed)");
    expect(text).not.toContain("**Retries:** none");
  });

  it("uses the final attempt: a test that still fails after a retry counts as failed", () => {
    const text = summarize({
      wallMs: 1000,
      results: [
        result({ title: "broken", status: "failed", retry: 0 }),
        result({ title: "broken", status: "failed", retry: 1 }),
      ],
    });
    expect(text).toContain("**1 tests**: 0 passed, 1 failed");
    expect(text).toContain("Failing tests (1)");
  });

  it("aggregates advisory findings by rule across engines and states", () => {
    const annotations = (label: string) => [
      { type: "axe-advisory", description: `${label}: heading-order (2)` },
      { type: "axe-advisory", description: `${label}: region (1)` },
    ];
    const findings = aggregateFindings(
      collapseAttempts([
        result({ project: "chromium", title: "t1", annotations: annotations("search@320") }),
        result({ project: "firefox", title: "t1", annotations: annotations("search@320") }),
        result({
          project: "chromium",
          title: "t2",
          annotations: [{ type: "axe-advisory", description: "home@320: region (1)" }],
        }),
      ]),
      "axe-advisory",
    );
    expect(findings.map((f) => f.rule)).toEqual(["region", "heading-order"]);
    expect(findings[0]).toMatchObject({ rule: "region", occurrences: 3 });
    expect([...(findings[0]?.engines ?? [])].sort()).toEqual(["chromium", "firefox"]);
  });

  it("separates advisory findings from items that need manual review", () => {
    const text = summarize({
      wallMs: 1000,
      results: [
        result({
          annotations: [
            { type: "axe-advisory", description: "home@320: landmark-one-main (1)" },
            { type: "axe-needs-review", description: "product@320: color-contrast (3)" },
          ],
        }),
      ],
    });
    expect(text).toContain("#### Advisory findings");
    expect(text).toContain("`landmark-one-main`");
    expect(text).toContain("#### Needs manual review");
    expect(text).toContain("`color-contrast`");
  });

  it("always prints what the run does not show, and never claims conformance", () => {
    const text = summarize({ wallMs: 1000, results: [result()] });
    expect(text).toContain(
      "Not verified: screen readers (NVDA, JAWS, VoiceOver), voice control, switch access, magnification",
    );
    expect(text).toContain("not a cross-browser functional regression suite");
    expect(text).toContain("not a claim of conformance");
    expect(text).not.toMatch(/WCAG[- ]compliant|is accessible|certified|audited/i);
  });

  it("carries engine builds and engine limitations from annotations", () => {
    const text = summarize({
      wallMs: 1000,
      results: [
        result({
          annotations: [
            { type: "engine-version", description: "chromium 149.0.7827.2" },
            { type: "keyboard-limitation", description: "Tab does not visit links in this engine" },
          ],
        }),
      ],
    });
    expect(text).toContain("- chromium 149.0.7827.2");
    expect(text).toContain("- Tab does not visit links in this engine");
  });

  it("formats durations", () => {
    expect(formatDuration(45_000)).toBe("45s");
    expect(formatDuration(60_000)).toBe("1m 00s");
    expect(formatDuration(487_400)).toBe("8m 07s");
  });
});
