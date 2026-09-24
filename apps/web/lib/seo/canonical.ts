/**
 * Absolute URL builders (MVP-021). The origin is always the validated
 * NEXT_PUBLIC_SITE_URL origin (lib/site-url.ts) — never derived from a request —
 * and the path is assembled only from server-controlled data. Metadata, Open
 * Graph, JSON-LD and the sitemap all use these same functions, so they cannot
 * disagree with each other.
 *
 * Normalization: no trailing slash except the root; slugs are URL-encoded;
 * no query string except `?page=N` for N >= 2 on a category (page 1 is the
 * base URL).
 */

export function homeUrl(origin: string): string {
  return `${origin}/`;
}

export function categoryUrl(origin: string, slug: string, page?: number | null): string {
  const base = `${origin}/categories/${encodeURIComponent(slug)}`;
  return typeof page === "number" && Number.isInteger(page) && page >= 2
    ? `${base}?page=${page}`
    : base;
}

export function productUrl(origin: string, slug: string): string {
  return `${origin}/products/${encodeURIComponent(slug)}`;
}

/** MVP-017, FR-014: tutorials, patterns and comparison pages. */
export function learnUrl(origin: string, slug: string): string {
  return `${origin}/learn/${encodeURIComponent(slug)}`;
}
