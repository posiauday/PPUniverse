/**
 * Pure analysis of a page's title-change trace (see in-page-tracer.ts for how it is
 * recorded). Kept separate from any browser API so the classification logic is
 * unit-tested against fixed inputs, not re-derived by eye from a JSON dump each time.
 *
 * Applies the product owner's fixed criterion (2026-09-21, MVP-023 run 4 Firefox
 * failures — decided BEFORE the evidence was read):
 *
 *   PRODUCT DEFECT (WCAG 2.4.2) if the title is empty or non-descriptive for a
 *   SUSTAINED window (>= 100ms, or spanning more than one paint) after a route
 *   change, or if it is empty at the moment Next's route announcer fires.
 *
 *   TEST DEFECT if the title is populated throughout and only a single synchronous
 *   read landed in a sub-frame gap.
 */

export type TitleTraceEvent =
  | {
      kind: "title";
      atMs: number;
      title: string;
      via: "initial" | "title-element" | "document.title-setter";
    }
  | { kind: "announcer"; atMs: number; text: string; documentTitleThen: string };

export interface TitleGap {
  /** The last known-good title before the gap opened. */
  from: string;
  /** When the title became empty or non-descriptive. */
  startMs: number;
  /** When it was next set to something descriptive, or null if it never recovered in the trace. */
  endMs: number | null;
  durationMs: number | null;
}

const SUSTAINED_MS = 100;

function isNonDescriptive(title: string, siteName: string): boolean {
  return title.trim() === "" || title.trim() === siteName.trim();
}

/** Finds every window where the title was empty or equal to the bare site name. */
export function findTitleGaps(events: readonly TitleTraceEvent[], siteName: string): TitleGap[] {
  const titleEvents = events.filter(
    (e): e is Extract<TitleTraceEvent, { kind: "title" }> => e.kind === "title",
  );
  const gaps: TitleGap[] = [];
  let lastGood = "";
  let open: { from: string; startMs: number } | null = null;

  for (const event of titleEvents) {
    const bad = isNonDescriptive(event.title, siteName);
    if (bad && !open) {
      open = { from: lastGood, startMs: event.atMs };
    } else if (!bad) {
      if (open) {
        gaps.push({
          from: open.from,
          startMs: open.startMs,
          endMs: event.atMs,
          durationMs: event.atMs - open.startMs,
        });
        open = null;
      }
      lastGood = event.title;
    }
  }
  if (open) gaps.push({ from: open.from, startMs: open.startMs, endMs: null, durationMs: null });
  return gaps;
}

export interface AnnouncerCheck {
  atMs: number;
  announcedText: string;
  documentTitleThen: string;
  titleWasEmptyOrBareAtThatMoment: boolean;
}

/** For every announcer firing, what the title actually was at that exact moment. */
export function checkAnnouncerMoments(
  events: readonly TitleTraceEvent[],
  siteName: string,
): AnnouncerCheck[] {
  return events
    .filter((e): e is Extract<TitleTraceEvent, { kind: "announcer" }> => e.kind === "announcer")
    .map((e) => ({
      atMs: e.atMs,
      announcedText: e.text,
      documentTitleThen: e.documentTitleThen,
      titleWasEmptyOrBareAtThatMoment: isNonDescriptive(e.documentTitleThen, siteName),
    }));
}

export type Classification =
  | { verdict: "product-defect"; reason: string }
  | { verdict: "test-defect"; reason: string }
  | { verdict: "ambiguous"; reason: string };

export function classifyTitleTrace(
  events: readonly TitleTraceEvent[],
  siteName: string,
): Classification {
  if (events.length === 0) {
    return { verdict: "ambiguous", reason: "no title-trace events were captured" };
  }
  const gaps = findTitleGaps(events, siteName);
  const sustained = gaps.filter((g) => g.durationMs === null || g.durationMs >= SUSTAINED_MS);
  const announcerHits = checkAnnouncerMoments(events, siteName).filter(
    (a) => a.titleWasEmptyOrBareAtThatMoment,
  );

  if (sustained.length > 0) {
    const g = sustained[0]!;
    const dur = g.durationMs === null ? "never recovered in the trace" : `${g.durationMs}ms`;
    return {
      verdict: "product-defect",
      reason: `title was empty or bare from ${g.startMs}ms to ${g.endMs ?? "end"}ms (${dur}), at or above the ${SUSTAINED_MS}ms sustained threshold`,
    };
  }
  if (announcerHits.length > 0) {
    const a = announcerHits[0]!;
    return {
      verdict: "product-defect",
      reason: `the route announcer fired at ${a.atMs}ms announcing "${a.announcedText}" while document.title was "${a.documentTitleThen}" (empty or bare) at that exact moment`,
    };
  }
  if (gaps.length === 0) {
    return {
      verdict: "test-defect",
      reason: "the title was populated throughout the trace; no gap of any length was observed",
    };
  }
  const shortest = Math.min(...gaps.map((g) => g.durationMs ?? Infinity));
  return {
    verdict: "ambiguous",
    reason: `a title gap shorter than ${SUSTAINED_MS}ms was observed (${shortest}ms) and no announcer firing coincided with an empty title; this does not clearly satisfy either side of the criterion`,
  };
}
