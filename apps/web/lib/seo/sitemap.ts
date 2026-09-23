import type { CatalogRepository, SitemapEntries } from "@ppu/domain-catalog";
import type { ContentRepository } from "@ppu/domain-content";
import type { LogFields } from "@ppu/telemetry";
import type { MetadataRoute } from "next";
import type { SiteUrlResult } from "../site-url";
import { categoryUrl, homeUrl, learnUrl, productUrl } from "./canonical";

/** sitemaps.org limit for one sitemap file; a sitemap index is the documented follow-up beyond it. */
export const MAX_SITEMAP_URLS = 50_000;

/**
 * sitemap.xml contents (MVP-021, FR-017; extended by MVP-017, FR-014): the
 * home page, categories that currently have at least one PUBLISHED product
 * (base URLs only — paginated URLs are not enumerated), PUBLISHED products,
 * and PUBLISHED Articles. Never DRAFT or any other status; never search,
 * sort, filter or paginated variants. No `lastmod`: the evidence tables do
 * not bump `products.updatedAt`, and an inaccurate date is worse than none
 * (Article's own `updatedAt` is real, but is deliberately left out here too,
 * for the same one-rule-for-every-entry-type reason).
 */
export function buildSitemap(
  origin: string,
  entries: Pick<SitemapEntries, "categorySlugs" | "productSlugs">,
  articleSlugs: readonly string[],
): MetadataRoute.Sitemap {
  return [
    { url: homeUrl(origin) },
    ...entries.categorySlugs.map((slug) => ({ url: categoryUrl(origin, slug) })),
    ...entries.productSlugs.map((slug) => ({ url: productUrl(origin, slug) })),
    ...articleSlugs.map((slug) => ({ url: learnUrl(origin, slug) })),
  ];
}

export interface SitemapDeps {
  getSite: () => SiteUrlResult;
  repository: Pick<CatalogRepository, "listSitemapEntries">;
  contentRepository: Pick<ContentRepository, "listPublishedArticleSlugs">;
  warn: (event: string, fields: LogFields) => void;
}

/**
 * Without a valid site origin the sitemap is a valid, EMPTY document — it never
 * emits guessed URLs. A database failure is NOT swallowed: the error propagates
 * (a 5xx), so crawlers do not read an outage as "every page was removed".
 */
export async function generateSitemap(deps: SitemapDeps): Promise<MetadataRoute.Sitemap> {
  const site = deps.getSite();
  if (!site.ok) return [];

  // The home page takes one slot; split the remaining budget between the
  // catalog entries and Article slugs so one domain's growth cannot silently
  // starve the other's sitemap coverage.
  const budget = MAX_SITEMAP_URLS - 1;
  const catalogBudget = Math.ceil(budget / 2);
  const articleBudget = budget - catalogBudget;

  const entries = await deps.repository.listSitemapEntries(catalogBudget);
  const articles = await deps.contentRepository.listPublishedArticleSlugs(articleBudget);
  if (entries.truncated || articles.truncated) {
    deps.warn("seo.sitemap_truncated", {
      limit: MAX_SITEMAP_URLS,
      categories: entries.categorySlugs.length,
      products: entries.productSlugs.length,
      articles: articles.slugs.length,
    });
  }
  return buildSitemap(site.origin, entries, articles.slugs);
}
