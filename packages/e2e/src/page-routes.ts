/**
 * The page routes (Next.js App Router patterns) the accessibility gate covers.
 *
 * Kept apart from src/pages.ts so the route-coverage guard (a plain unit test) can
 * read it without importing Playwright or the database client. A new `page.tsx` in
 * apps/web/app that is not listed here makes src/route-coverage.test.ts fail, so a
 * page cannot be added without being gated or explicitly excluded.
 */
export const GATED_ROUTES = [
  "/",
  "/categories/[slug]",
  "/products/[slug]",
  "/search",
  "/signin",
  "/signin/confirm",
  "/signup",
  "/password/confirm",
  "/password/forgot",
  "/password/reset",
  "/account",
  "/account/sessions",
  "/account/privacy",
  "/account/profile",
  "/account/welcome",
  "/admin/deletion-requests",
  "/unsubscribe",
  "/guides",
  "/components",
  "/components/[slug]",
  "/guides/[slug]",
  "/admin/content",
  "/admin/content/new",
  "/admin/content/[id]/edit",
  "/admin/updates",
  "/admin/updates/new",
  "/admin/updates/[id]/edit",
  "/admin/topics",
  "/admin/topics/new",
  "/admin/topics/[id]/edit",
  "/admin/topics/[id]/lessons/new",
  "/admin/lessons/[id]/edit",
  "/admin/components",
  "/admin/components/[id]",
  "/admin/products",
  "/admin/products/new",
  "/admin/products/[id]/edit",
  "/admin/audit",
  "/admin/feedback",
  "/admin/comments",
  "/admin/users",
  "/admin/settings",
  "/admin",
  "/[technology]",
  "/[technology]/[tab]",
  "/governance",
  "/updates",
  "/topics",
  "/topics/[topic]",
  "/topics/[topic]/[lesson]",
  "/about",
  "/privacy",
  "/terms",
  "/how-we-write",
] as const;

export type GatedRoute = (typeof GATED_ROUTES)[number];

/**
 * Special UI files the guard knows about. `not-found.tsx` is exercised by the 404
 * states in src/pages.ts. Any other special file (error, global-error, loading,
 * template, default) must be added here together with the states that exercise it.
 */
export const ACKNOWLEDGED_SPECIAL_FILES: readonly string[] = ["not-found.tsx"];
