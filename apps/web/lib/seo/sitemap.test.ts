import type { SitemapEntries } from "@ppu/domain-catalog";
import type { ArticleSitemapEntries } from "@ppu/domain-content";
import { describe, expect, it, vi } from "vitest";
import type { SiteUrlResult } from "../site-url.js";
import { MAX_SITEMAP_URLS, buildSitemap, generateSitemap } from "./sitemap.js";

const SITE: SiteUrlResult = { ok: true, origin: "https://example.com" };
const ENTRIES: SitemapEntries = {
  categorySlugs: ["power-apps-components", "power-bi-templates"],
  productSlugs: ["alpha", "beta"],
  truncated: false,
};
const ARTICLES: ArticleSitemapEntries = { slugs: ["intro-tutorial"], truncated: false };

const CATALOG_BUDGET = Math.ceil((MAX_SITEMAP_URLS - 1) / 2);
const ARTICLE_BUDGET = MAX_SITEMAP_URLS - 1 - CATALOG_BUDGET;

describe("buildSitemap", () => {
  it("lists the home page, category base URLs, product URLs and Article URLs — as absolute URLs", () => {
    expect(buildSitemap("https://example.com", ENTRIES, ARTICLES.slugs)).toEqual([
      { url: "https://example.com/" },
      { url: "https://example.com/categories/power-apps-components" },
      { url: "https://example.com/categories/power-bi-templates" },
      { url: "https://example.com/products/alpha" },
      { url: "https://example.com/products/beta" },
      { url: "https://example.com/learn/intro-tutorial" },
    ]);
  });

  it("lists only the home page for an empty catalog and no Articles", () => {
    expect(
      buildSitemap("https://example.com", { categorySlugs: [], productSlugs: [] }, []),
    ).toEqual([{ url: "https://example.com/" }]);
  });

  it("never includes a paginated, search, sort or filter URL", () => {
    const urls = buildSitemap("https://example.com", ENTRIES, ARTICLES.slugs).map(
      (entry) => entry.url,
    );
    for (const url of urls) {
      expect(url).not.toContain("?");
    }
  });

  it("carries no lastmod, priority or changefreq", () => {
    for (const entry of buildSitemap("https://example.com", ENTRIES, ARTICLES.slugs)) {
      expect(Object.keys(entry)).toEqual(["url"]);
    }
  });

  it("URL-encodes slugs, including Article slugs", () => {
    const result = buildSitemap(
      "https://example.com",
      { categorySlugs: [], productSlugs: ["a b/c"] },
      ["d e/f"],
    );
    expect(result[1]?.url).toBe("https://example.com/products/a%20b%2Fc");
    expect(result[2]?.url).toBe("https://example.com/learn/d%20e%2Ff");
  });
});

describe("generateSitemap", () => {
  const make = (overrides: Partial<Parameters<typeof generateSitemap>[0]> = {}) => {
    const listSitemapEntries = vi.fn().mockResolvedValue(ENTRIES);
    const listPublishedArticleSlugs = vi.fn().mockResolvedValue(ARTICLES);
    const warn = vi.fn();
    return {
      listSitemapEntries,
      listPublishedArticleSlugs,
      warn,
      deps: {
        getSite: () => SITE,
        repository: { listSitemapEntries },
        contentRepository: { listPublishedArticleSlugs },
        warn,
        ...overrides,
      },
    };
  };

  it("splits the remaining budget between catalog entries and Article slugs (the home page takes one)", async () => {
    const { deps, listSitemapEntries, listPublishedArticleSlugs } = make();
    const sitemap = await generateSitemap(deps);
    expect(sitemap).toHaveLength(6);
    expect(listSitemapEntries).toHaveBeenCalledWith(CATALOG_BUDGET);
    expect(listPublishedArticleSlugs).toHaveBeenCalledWith(ARTICLE_BUDGET);
  });

  it("returns an empty sitemap — and never touches the database — when the origin is unavailable", async () => {
    const { deps, listSitemapEntries, listPublishedArticleSlugs } = make({
      getSite: () => ({ ok: false, reason: "MISSING" }),
    });
    expect(await generateSitemap(deps)).toEqual([]);
    expect(listSitemapEntries).not.toHaveBeenCalled();
    expect(listPublishedArticleSlugs).not.toHaveBeenCalled();
  });

  it("warns when the catalog list was truncated, without hiding the entries it has", async () => {
    const { deps, warn, listSitemapEntries } = make();
    listSitemapEntries.mockResolvedValue({ ...ENTRIES, truncated: true });
    const sitemap = await generateSitemap(deps);
    expect(sitemap).toHaveLength(6);
    expect(warn).toHaveBeenCalledWith("seo.sitemap_truncated", {
      limit: MAX_SITEMAP_URLS,
      categories: 2,
      products: 2,
      articles: 1,
    });
  });

  it("warns when the Article list was truncated", async () => {
    const { deps, warn, listPublishedArticleSlugs } = make();
    listPublishedArticleSlugs.mockResolvedValue({ ...ARTICLES, truncated: true });
    await generateSitemap(deps);
    expect(warn).toHaveBeenCalledWith("seo.sitemap_truncated", {
      limit: MAX_SITEMAP_URLS,
      categories: 2,
      products: 2,
      articles: 1,
    });
  });

  it("does not warn when nothing was truncated", async () => {
    const { deps, warn } = make();
    await generateSitemap(deps);
    expect(warn).not.toHaveBeenCalled();
  });

  it("lets a database failure propagate instead of returning an empty sitemap", async () => {
    const { deps, listSitemapEntries } = make();
    listSitemapEntries.mockRejectedValue(new Error("database unavailable"));
    await expect(generateSitemap(deps)).rejects.toThrow("database unavailable");
  });
});
