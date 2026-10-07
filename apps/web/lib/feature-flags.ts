/**
 * Feature flags (CLAUDE.md: "Use feature flags for incomplete or risky
 * modules"). Read on the server at request time, so a flag is switched in the
 * hosting environment without a code change.
 *
 * FEATURE_COMPONENTS: the component catalog's navigation links. Off until the
 * first product is published, so the top bar never leads to an empty catalog
 * (docs/final-decisions.md, "Navigation restructure", decision 1).
 */
export function componentsEnabled(): boolean {
  return process.env["FEATURE_COMPONENTS"] === "on";
}

/**
 * FEATURE_COMMENTS: comments on guides and readers' profiles (MVP-040). Off
 * until the product owner approves the Terms and Privacy wording for them
 * (docs/final-decisions.md, "Hub framing ... community solutions": "Before it
 * ships"). Off, the section isn't shown and its routes answer 404.
 */
export function commentsEnabled(): boolean {
  return process.env["FEATURE_COMMENTS"] === "on";
}
