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
