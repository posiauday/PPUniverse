/**
 * Feature flags (CLAUDE.md: "Use feature flags for incomplete or risky
 * modules"). Read on the server at request time, so a flag is switched in the
 * hosting environment without a code change.
 *
 * FEATURE_COMPONENTS: the component catalog's navigation links. Off until the
 * first product is published, so the top bar never leads to an empty catalog
 * (docs/final-decisions.md, "Navigation restructure", decision 1). Since
 * MVP-049 it also switches on the Power Apps component library pages
 * (/components); while it's off they are a 404. Publishing and testing in
 * /admin/components work either way.
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

/**
 * FEATURE_LEARN: the public Learn module at /topics (MVP-048). Off until the
 * first topic is published: off, /topics and its pages answer 404, they stay
 * out of the sitemap, and the top bar's Learn button keeps opening the guides
 * (/learn). On, the Learn button opens /topics (docs/plans/learn-module.md,
 * "Where it lives"). The admin works either way.
 */
export function learnEnabled(): boolean {
  return process.env["FEATURE_LEARN"] === "on";
}
