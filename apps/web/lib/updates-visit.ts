/**
 * "New since your last visit" for platform updates (MVP-033 slice D;
 * docs/final-decisions.md, "Governance & admin area and the Updates badge").
 * The last-visit time is kept only in this browser's localStorage, never sent
 * to the server; the Privacy notice says so. Every access is guarded, since
 * storage can be blocked or unavailable (private windows, strict settings):
 * then nothing is remembered and the default window applies.
 */

export const LAST_VISIT_KEY = "lcs-updates-last-visit";

/** Fired on window when /updates marks a visit, so the header badge clears at once. */
export const VISITED_EVENT = "lcs:updates-visited";

/** With no recorded visit, updates from the last two weeks count as new. */
export const FIRST_VISIT_WINDOW_MS = 14 * 24 * 60 * 60 * 1000;

/** The badge shows at most "9+". */
export const MAX_BADGE_COUNT = 9;

export function readLastVisit(): number | null {
  try {
    const value = window.localStorage.getItem(LAST_VISIT_KEY);
    const time = value === null ? NaN : Number(value);
    return Number.isFinite(time) ? time : null;
  } catch {
    return null;
  }
}

export function markVisited(now: number): void {
  try {
    window.localStorage.setItem(LAST_VISIT_KEY, String(now));
  } catch {
    // Storage unavailable: nothing to remember.
  }
  window.dispatchEvent(new Event(VISITED_EVENT));
}

/** How many of the published times are newer than the last visit (or, with
 * none, inside the first-visit window). */
export function countNew(publishedTimes: readonly string[], lastVisit: number | null, now: number) {
  const since = lastVisit ?? now - FIRST_VISIT_WINDOW_MS;
  return publishedTimes.filter((time) => Date.parse(time) > since).length;
}

export function badgeText(count: number): string {
  return count > MAX_BADGE_COUNT ? `${MAX_BADGE_COUNT}+` : String(count);
}
