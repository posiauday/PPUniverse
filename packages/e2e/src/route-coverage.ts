import { basename } from "node:path";

/**
 * Pure logic behind the route-coverage guard (see route-coverage.test.ts). It works
 * on lists of file paths relative to apps/web/app, so it can be tested against both
 * the real tree and synthetic ones that prove it can fail.
 */

export const PAGE_FILE = /(^|\/)page\.(tsx|ts|jsx|js)$/;
// tsx/jsx too: a route handler may use JSX (the next/og share images do).
export const ROUTE_HANDLER_FILE = /(^|\/)route\.(ts|tsx|js|jsx)$/;
export const SPECIAL_UI_FILE =
  /^(not-found|error|global-error|loading|template|default)\.(tsx|ts|jsx|js)$/;

/** Metadata files that generate non-HTML responses (robots.txt, sitemap.xml, the favicon). */
export const METADATA_FILES: readonly string[] = ["robots.ts", "sitemap.ts", "icon.svg"];

/**
 * Route handlers outside /api that are known to return images, never HTML: the
 * share images (SEO story, apps/web/lib/seo/share-image.tsx). They live outside
 * /api because robots.txt disallows /api/, and social crawlers honour it.
 */
export const IMAGE_ROUTE_FILES: readonly string[] = [
  "og/route.tsx",
  "og/learn/[slug]/route.tsx",
  "og/products/[slug]/route.tsx",
];

/**
 * Route handlers outside /api that return feeds or plain text, never HTML: the
 * Updates and guides RSS feeds (MVP-033, open question 66; MVP-046), each
 * beside the page it mirrors so feed readers find it, and the IndexNow key
 * file (MVP-046), which must sit at the site root to cover every URL.
 */
export const FEED_ROUTE_FILES: readonly string[] = [
  "updates/feed.xml/route.ts",
  "guides/feed.xml/route.ts",
  "indexnow-key.txt/route.ts",
];

/** "categories/[slug]/page.tsx" -> "/categories/[slug]"; route groups "(x)" do not appear in URLs. */
export function routeOf(file: string): string {
  const segments = file
    .split("/")
    .slice(0, -1)
    .filter((segment) => !(segment.startsWith("(") && segment.endsWith(")")));
  return `/${segments.join("/")}`;
}

export function discoverPageRoutes(files: readonly string[]): string[] {
  return [...new Set(files.filter((file) => PAGE_FILE.test(file)).map(routeOf))].sort();
}

/** Page routes that exist in the app but are not gated. */
export function ungatedRoutes(files: readonly string[], gated: readonly string[]): string[] {
  return discoverPageRoutes(files).filter((route) => !gated.includes(route));
}

/** Gated routes that no longer exist in the app. */
export function staleGatedRoutes(files: readonly string[], gated: readonly string[]): string[] {
  const existing = discoverPageRoutes(files);
  return gated.filter((route) => !existing.includes(route));
}

export function specialUiFiles(files: readonly string[]): string[] {
  return files.filter((file) => SPECIAL_UI_FILE.test(basename(file)));
}

export function unacknowledgedSpecialFiles(
  files: readonly string[],
  acknowledged: readonly string[],
): string[] {
  return specialUiFiles(files).filter((file) => !acknowledged.includes(basename(file)));
}

/** Route handlers outside /api could render HTML pages, so they need a decision
 * (IMAGE_ROUTE_FILES and FEED_ROUTE_FILES are those decisions). */
export function handlersOutsideApi(files: readonly string[]): string[] {
  return files.filter(
    (file) =>
      ROUTE_HANDLER_FILE.test(file) &&
      !file.startsWith("api/") &&
      !IMAGE_ROUTE_FILES.includes(file) &&
      !FEED_ROUTE_FILES.includes(file),
  );
}
