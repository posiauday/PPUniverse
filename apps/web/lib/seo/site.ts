/**
 * Site-wide SEO constants. "LowCodeStacks" is the approved product name
 * (docs/final-decisions.md, 2026-09-24, "Product name (open question 1,
 * partial)"; domain: lowcodestacks.com). Open question 1 stays open,
 * narrowed to trademark clearance only -- the name/domain themselves are
 * decided. Kept in exactly one place here so a future name change (should
 * clearance require one) stays a one-line edit.
 *
 * Paired with packages/e2e/src/site.ts's own SITE_NAME, which duplicates
 * this value on purpose (the harness never imports application code, so a
 * drift here is caught by the accessibility gate's title assertions rather
 * than silently followed) -- see that file's comment. The two must be
 * changed together; neither imports the other.
 */
export const SITE_NAME = "LowCodeStacks";

export const SITE_DESCRIPTION =
  "A trusted Power Platform ecosystem for reusable assets and technical learning.";

/** Longer descriptions are trimmed for meta/Open Graph tags; the page itself is never truncated. */
export const MAX_META_DESCRIPTION_LENGTH = 300;

export const OPEN_GRAPH_LOCALE = "en_US";
