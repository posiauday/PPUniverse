/**
 * The site name as it appears in page titles. Duplicated here on purpose: the
 * harness never imports application code, so a change to the app's title format
 * is caught by the specs rather than silently followed.
 *
 * Paired with apps/web/lib/seo/site.ts's own SITE_NAME -- same value, kept
 * independent on purpose (see above). The two must be changed together by
 * hand; there is no shared import between the harness and the app to keep
 * in sync automatically, and adding one would defeat the point of the
 * duplication. Current value: "LowCodeStacks" (docs/final-decisions.md,
 * 2026-09-24, "Product name (open question 1, partial)").
 */
export const SITE_NAME = "LowCodeStacks";

export const titleFor = (pageName: string): string => `${pageName} | ${SITE_NAME}`;
