import type { MetadataRoute } from "next";
import type { SiteUrlResult } from "../site-url";

/**
 * robots.txt (MVP-021, FR-017).
 *
 * - Everything is crawlable except `/api/` (JSON, nothing to index).
 * - `/signin`, `/account` and `/search` are deliberately NOT disallowed: a
 *   crawler that is blocked from a URL can never read its `noindex`, and the URL
 *   can still be indexed by address. Those pages carry `noindex` (root-layout
 *   default and, for API responses and sign-in/account, an `X-Robots-Tag` header)
 *   instead.
 * - Admin, creator and preview paths are not listed: robots.txt is public and
 *   would advertise them. The default-noindex posture covers them.
 * - The `Sitemap:` line appears only when the site origin is valid.
 */
export function buildRobots(site: SiteUrlResult): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: "*", allow: "/", disallow: ["/api/"] }],
    ...(site.ok ? { sitemap: `${site.origin}/sitemap.xml` } : {}),
  };
}
