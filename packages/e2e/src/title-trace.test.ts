import { describe, expect, it } from "vitest";
import {
  checkAnnouncerMoments,
  classifyTitleTrace,
  findTitleGaps,
  type TitleTraceEvent,
} from "./title-trace.js";

type TitleEvent = Extract<TitleTraceEvent, { kind: "title" }>;

const SITE = "Power Platform Universe";
const title = (
  atMs: number,
  t: string,
  via: TitleEvent["via"] = "title-element",
): TitleTraceEvent => ({
  kind: "title",
  atMs,
  title: t,
  via,
});
const announcer = (atMs: number, text: string, documentTitleThen: string): TitleTraceEvent => ({
  kind: "announcer",
  atMs,
  text,
  documentTitleThen,
});

describe("findTitleGaps", () => {
  it("finds no gap when the title is always descriptive", () => {
    const events = [
      title(0, `Active sessions | ${SITE}`, "initial"),
      title(50, `Active sessions | ${SITE}`),
    ];
    expect(findTitleGaps(events, SITE)).toEqual([]);
  });

  it("finds a closed gap and its duration", () => {
    const events = [
      title(0, `Active sessions | ${SITE}`, "initial"),
      title(100, ""),
      title(260, `Active sessions | ${SITE}`),
    ];
    expect(findTitleGaps(events, SITE)).toEqual([
      { from: `Active sessions | ${SITE}`, startMs: 100, endMs: 260, durationMs: 160 },
    ]);
  });

  it("treats the bare site name, not just an empty string, as non-descriptive", () => {
    const events = [
      title(0, `Active sessions | ${SITE}`, "initial"),
      title(50, SITE),
      title(180, `Active sessions | ${SITE}`),
    ];
    expect(findTitleGaps(events, SITE)).toEqual([
      { from: `Active sessions | ${SITE}`, startMs: 50, endMs: 180, durationMs: 130 },
    ]);
  });

  it("leaves a gap open (endMs null) if the trace ends before the title recovers", () => {
    const events = [title(0, `Active sessions | ${SITE}`, "initial"), title(90, "")];
    expect(findTitleGaps(events, SITE)).toEqual([
      { from: `Active sessions | ${SITE}`, startMs: 90, endMs: null, durationMs: null },
    ]);
  });

  it("finds multiple gaps and attributes each its own preceding good title", () => {
    const events = [
      title(0, "A", "initial"),
      title(10, ""),
      title(20, "A"),
      title(200, "B"),
      title(210, ""),
      title(400, "B"),
    ];
    expect(findTitleGaps(events, "Site")).toEqual([
      { from: "A", startMs: 10, endMs: 20, durationMs: 10 },
      { from: "B", startMs: 210, endMs: 400, durationMs: 190 },
    ]);
  });

  it("ignores announcer events when looking for title gaps", () => {
    const events = [title(0, `X | ${SITE}`, "initial"), announcer(5, "X", "")];
    expect(findTitleGaps(events, SITE)).toEqual([]);
  });
});

describe("checkAnnouncerMoments", () => {
  it("flags an announcer firing while the recorded document.title was empty", () => {
    const events = [
      announcer(120, "Active sessions", ""),
      announcer(500, "Search", `Search | ${SITE}`),
    ];
    const checks = checkAnnouncerMoments(events, SITE);
    expect(checks).toEqual([
      {
        atMs: 120,
        announcedText: "Active sessions",
        documentTitleThen: "",
        titleWasEmptyOrBareAtThatMoment: true,
      },
      {
        atMs: 500,
        announcedText: "Search",
        documentTitleThen: `Search | ${SITE}`,
        titleWasEmptyOrBareAtThatMoment: false,
      },
    ]);
  });
});

describe("classifyTitleTrace (the fixed, pre-registered criterion)", () => {
  it("is a product defect when the empty window is at or above 100ms", () => {
    const events = [title(0, `X | ${SITE}`, "initial"), title(50, ""), title(151, `X | ${SITE}`)];
    const result = classifyTitleTrace(events, SITE);
    expect(result.verdict).toBe("product-defect");
    expect(result.reason).toMatch(/101ms|sustained/);
  });

  it("is a product defect when the announcer fires while the title is empty, even if the gap is short", () => {
    const events = [
      title(0, `X | ${SITE}`, "initial"),
      title(50, ""),
      announcer(52, "X", ""),
      title(70, `X | ${SITE}`),
    ];
    const result = classifyTitleTrace(events, SITE);
    expect(result.verdict).toBe("product-defect");
    expect(result.reason).toContain("route announcer fired");
  });

  it("is a product defect when the title never recovers in the trace", () => {
    const events = [title(0, `X | ${SITE}`, "initial"), title(50, "")];
    expect(classifyTitleTrace(events, SITE).verdict).toBe("product-defect");
  });

  it("is a test defect when the title is populated throughout with no gap at all", () => {
    const events = [
      title(0, `X | ${SITE}`, "initial"),
      title(20, `X | ${SITE}`),
      title(500, `Y | ${SITE}`),
    ];
    const result = classifyTitleTrace(events, SITE);
    expect(result.verdict).toBe("test-defect");
    expect(result.reason).toMatch(/no gap/);
  });

  it("is ambiguous for a sub-threshold gap with no announcer overlap, per the pre-registered rule", () => {
    const events = [title(0, `X | ${SITE}`, "initial"), title(50, ""), title(90, `X | ${SITE}`)];
    const result = classifyTitleTrace(events, SITE);
    expect(result.verdict).toBe("ambiguous");
    expect(result.reason).toContain("40ms");
  });

  it("is ambiguous when nothing was captured", () => {
    expect(classifyTitleTrace([], SITE).verdict).toBe("ambiguous");
  });
});
