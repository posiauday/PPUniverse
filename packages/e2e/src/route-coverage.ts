import { basename } from "node:path";

/**
 * Pure logic behind the route-coverage guard (see route-coverage.test.ts). It works
 * on lists of file paths relative to apps/web/app, so it can be tested against both
 * the real tree and synthetic ones that prove it can fail.
 */

export const PAGE_FILE = /(^|\/)page\.(tsx|ts|jsx|js)$/;
export const ROUTE_HANDLER_FILE = /(^|\/)route\.(ts|js)$/;
export const SPECIAL_UI_FILE =
  /^(not-found|error|global-error|loading|template|default)\.(tsx|ts|jsx|js)$/;

/** Metadata files that generate non-HTML responses (robots.txt, sitemap.xml). */
export const METADATA_FILES: readonly string[] = ["robots.ts", "sitemap.ts"];

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

/** Route handlers outside /api could render HTML pages, so they need a decision. */
export function handlersOutsideApi(files: readonly string[]): string[] {
  return files.filter((file) => ROUTE_HANDLER_FILE.test(file) && !file.startsWith("api/"));
}
