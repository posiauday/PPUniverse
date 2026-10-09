import type { CatalogRepository, SitemapEntries } from "@ppu/domain-catalog";
import type { ContentRepository } from "@ppu/domain-content";
import type { LogFields } from "@ppu/telemetry";
import type { MetadataRoute } from "next";
import type { SiteUrlResult } from "../site-url";
import { MAX_SECTION_PATHS } from "../technology-sections";
import {
  categoryUrl,
  homeUrl,
  INFO_PAGE_PATHS,
  infoPageUrl,
  learnIndexUrl,
  learnUrl,
  productUrl,
  technologySectionUrl,
} from "./canonical";

/** sitemaps.org limit for one sitemap file; a sitemap index is the documented follow-up beyond it. */
export const MAX_SITEMAP_URLS = 50_000;

/** MVP-048: slots reserved for the Learn module (/topics, its topics and lessons). */
export const MAX_LEARN_URLS = 1_000;

/** MVP-049: slots reserved for the component library (/components and its pages). */
export const MAX_COMPONENT_URLS = 500;

/** A Learn page for the sitemap: its site-relative path and when it last changed. */
export interface LearnSitemapEntry {
  path: string;
  lastModified?: Date;
}

/**
 * sitemap.xml contents (MVP-021, FR-017; extended by MVP-017, FR-014): the
 * home page, About/Privacy/Terms (MVP-032), categories that currently have
 * at least one PUBLISHED product
 * (base URLs only — paginated URLs are not enumerated), PUBLISHED products,
 * the /guides hub, and PUBLISHED Articles. Never DRAFT or any other status;
 * never search, sort, filter or paginated variants.
 *
 * `lastmod` (SEO story; TD-010): each Article carries its real
 * `updatedAt`, which changes on every edit and on publish; the /guides hub
 * carries the newest of them, since its content changes exactly when an
 * article does. Products and categories deliberately have none: editing a
 * product's evidence does not bump `products.updatedAt`, and an
 * inaccurate date is worse than no date.
 */
export function buildSitemap(
  origin: string,
  entries: Pick<SitemapEntries, "categorySlugs" | "productSlugs">,
  articles: ReadonlyArray<{ slug: string; updatedAt: Date }>,
  /** MVP-028: site-relative paths of technology section tabs that have content. */
  sectionPaths: readonly string[] = [],
  /** MVP-048/049: the Learn module's and the component library's pages, when switched on. */
  learn: readonly LearnSitemapEntry[] = [],
): MetadataRoute.Sitemap {
  const newestArticle = articles.reduce<Date | null>(
    (newest, article) => (newest && newest > article.updatedAt ? newest : article.updatedAt),
    null,
  );
  return [
    { url: homeUrl(origin) },
    ...sectionPaths.map((path) => ({ url: technologySectionUrl(origin, path) })),
    ...entries.categorySlugs.map((slug) => ({ url: categoryUrl(origin, slug) })),
    ...entries.productSlugs.map((slug) => ({ url: productUrl(origin, slug) })),
    ...(articles.length > 0
      ? [{ url: learnIndexUrl(origin), lastModified: newestArticle ?? undefined }]
      : []),
    ...articles.map((article) => ({
      url: learnUrl(origin, article.slug),
      lastModified: article.updatedAt,
    })),
    ...learn.map((entry) => ({
      url: technologySectionUrl(origin, entry.path),
      ...(entry.lastModified ? { lastModified: entry.lastModified } : {}),
    })),
    // MVP-032: About, Privacy and Terms, always listed, last.
    ...INFO_PAGE_PATHS.map((path) => ({ url: infoPageUrl(origin, path) })),
  ];
}

export interface SitemapDeps {
  getSite: () => SiteUrlResult;
  repository: Pick<CatalogRepository, "listSitemapEntries">;
  contentRepository: Pick<ContentRepository, "listPublishedArticleSlugs">;
  /** MVP-028: technology section tabs with content (at most MAX_SECTION_PATHS). */
  listSectionPaths: () => Promise<string[]>;
  /** MVP-048: the Learn module's published pages (at most MAX_LEARN_URLS); empty while it is off. */
  listLearnEntries?: () => Promise<LearnSitemapEntry[]>;
  /** MVP-049: the component library's public pages (at most MAX_COMPONENT_URLS); empty while it is off. */
  listComponentEntries?: () => Promise<LearnSitemapEntry[]>;
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

  // The home page and the /guides hub take one slot each; split the remaining budget between the
  // catalog entries and Article slugs so one domain's growth cannot silently
  // starve the other's sitemap coverage.
  // MVP-028: the technology section tabs are reserved up front too.
  // MVP-048: and the Learn module's pages; MVP-049: and the component library's.
  const budget =
    MAX_SITEMAP_URLS -
    2 -
    INFO_PAGE_PATHS.length -
    MAX_SECTION_PATHS -
    MAX_LEARN_URLS -
    MAX_COMPONENT_URLS;
  const catalogBudget = Math.ceil(budget / 2);
  const articleBudget = budget - catalogBudget;

  const entries = await deps.repository.listSitemapEntries(catalogBudget);
  const articles = await deps.contentRepository.listPublishedArticleSlugs(articleBudget);
  if (entries.truncated || articles.truncated) {
    deps.warn("seo.sitemap_truncated", {
      limit: MAX_SITEMAP_URLS,
      categories: entries.categorySlugs.length,
      products: entries.productSlugs.length,
      articles: articles.entries.length,
    });
  }
  const sectionPaths = (await deps.listSectionPaths()).slice(0, MAX_SECTION_PATHS);
  const learn = (await (deps.listLearnEntries?.() ?? Promise.resolve([]))).slice(0, MAX_LEARN_URLS);
  const components = (await (deps.listComponentEntries?.() ?? Promise.resolve([]))).slice(
    0,
    MAX_COMPONENT_URLS,
  );
  return buildSitemap(site.origin, entries, articles.entries, sectionPaths, [
    ...learn,
    ...components,
  ]);
}
