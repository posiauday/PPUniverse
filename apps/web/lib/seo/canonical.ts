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

/** The /learn hub listing every published article (SEO story). */
export function learnIndexUrl(origin: string): string {
  return `${origin}/learn`;
}

/** MVP-017, FR-014: tutorials, patterns and comparison pages. */
export function learnUrl(origin: string, slug: string): string {
  return `${origin}/learn/${encodeURIComponent(slug)}`;
}

/** MVP-048: the Learn module's home, a topic, and a lesson. */
/** MVP-049: the Power Apps component library. */
export function componentsIndexUrl(origin: string): string {
  return `${origin}/components`;
}

export function componentUrl(origin: string, slug: string): string {
  return `${origin}/components/${encodeURIComponent(slug)}`;
}

export function topicsIndexUrl(origin: string): string {
  return `${origin}/topics`;
}

export function topicUrl(origin: string, topicSlug: string): string {
  return `${origin}/topics/${encodeURIComponent(topicSlug)}`;
}

export function lessonUrl(origin: string, topicSlug: string, lessonSlug: string): string {
  return `${topicUrl(origin, topicSlug)}/${encodeURIComponent(lessonSlug)}`;
}

/** Share images (SEO story; lib/seo/share-image.tsx), served under /og, not /api. */
export function siteShareImageUrl(origin: string): string {
  return `${origin}/og`;
}

export function learnShareImageUrl(origin: string, slug: string): string {
  return `${origin}/og/learn/${encodeURIComponent(slug)}`;
}

export function productShareImageUrl(origin: string, slug: string): string {
  return `${origin}/og/products/${encodeURIComponent(slug)}`;
}

/** A technology section tab (MVP-028), from its site-relative path
 * (lib/technology-sections.ts's sectionPath: only fixed slugs and segments). */
export function technologySectionUrl(origin: string, path: string): string {
  return `${origin}${path}`;
}

/** MVP-032: the About, Privacy and Terms pages. */
export const INFO_PAGE_PATHS = ["/about", "/privacy", "/terms", "/how-we-write"] as const;
export type InfoPagePath = (typeof INFO_PAGE_PATHS)[number];

export function infoPageUrl(origin: string, path: InfoPagePath): string {
  return `${origin}${path}`;
}
