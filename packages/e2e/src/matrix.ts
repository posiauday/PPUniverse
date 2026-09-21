/**
 * The supported-browser and responsive-breakpoint matrices (NFR-008, decisions
 * Q33 and Q34, docs/final-decisions.md). Kept in one place so the Playwright
 * config, the specs and the documentation cannot drift apart.
 */

/**
 * Playwright engine projects for the blocking gate. Edge is covered by Chromium;
 * no branded-channel or moving-channel build may gate a merge (Q33).
 */
export const ENGINES = ["chromium", "firefox", "webkit"] as const;
export type Engine = (typeof ENGINES)[number];

/**
 * Tested viewport widths in CSS pixels: 320 is the WCAG 2.2 reflow check, the
 * others sample mobile, tablet and desktop either side of the repository's
 * Tailwind breakpoints (640 and 1024) (Q34).
 */
export const VIEWPORT_WIDTHS = [320, 375, 768, 1280] as const;
export type ViewportWidth = (typeof VIEWPORT_WIDTHS)[number];

export const REFLOW_WIDTH: ViewportWidth = 320;
export const VIEWPORT_HEIGHT = 900;
