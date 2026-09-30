import type { SitemapEntries } from "@ppu/domain-catalog";
import type { ArticleSitemapEntries } from "@ppu/domain-content";
import { describe, expect, it, vi } from "vitest";
import type { SiteUrlResult } from "../site-url.js";
import { MAX_SITEMAP_URLS, buildSitemap, generateSitemap } from "./sitemap.js";
import { MAX_SECTION_PATHS } from "../technology-sections.js";

const SITE: SiteUrlResult = { ok: true, origin: "https://example.com" };
const ENTRIES: SitemapEntries = {
  categorySlugs: ["power-apps-components", "power-bi-templates"],
  productSlugs: ["alpha", "beta"],
  truncated: false,
};
const UPDATED = new Date("2026-09-20T10:00:00.000Z");
const ARTICLES: ArticleSitemapEntries = {
  entries: [{ slug: "intro-tutorial", updatedAt: UPDATED }],
  truncated: false,
};

// The home page and the /learn hub take one slot each.
// The home page and /learn hub take one slot each, and MVP-028's technology
// section tabs (MAX_SECTION_PATHS) are reserved up front.
const CATALOG_BUDGET = Math.ceil((MAX_SITEMAP_URLS - 2 - MAX_SECTION_PATHS) / 2);
const ARTICLE_BUDGET = MAX_SITEMAP_URLS - 2 - MAX_SECTION_PATHS - CATALOG_BUDGET;

describe("buildSitemap", () => {
  it("lists the home page, category base URLs, product URLs, the /learn hub and Article URLs — as absolute URLs", () => {
    expect(buildSitemap("https://example.com", ENTRIES, ARTICLES.entries)).toEqual([
      { url: "https://example.com/" },
      { url: "https://example.com/categories/power-apps-components" },
      { url: "https://example.com/categories/power-bi-templates" },
      { url: "https://example.com/products/alpha" },
      { url: "https://example.com/products/beta" },
      { url: "https://example.com/learn", lastModified: UPDATED },
      { url: "https://example.com/learn/intro-tutorial", lastModified: UPDATED },
    ]);
  });

  it("lists only the home page for an empty catalog and no Articles (no empty /learn hub)", () => {
    expect(
      buildSitemap("https://example.com", { categorySlugs: [], productSlugs: [] }, []),
    ).toEqual([{ url: "https://example.com/" }]);
  });

  it("dates the /learn hub by its most recently updated Article", () => {
    const older = new Date("2026-01-01T00:00:00.000Z");
    const newer = new Date("2026-06-01T00:00:00.000Z");
    const result = buildSitemap("https://example.com", { categorySlugs: [], productSlugs: [] }, [
      { slug: "a", updatedAt: older },
      { slug: "b", updatedAt: newer },
      { slug: "c", updatedAt: older },
    ]);
    expect(result[1]).toEqual({ url: "https://example.com/learn", lastModified: newer });
  });

  it("never includes a paginated, search, sort or filter URL", () => {
    const urls = buildSitemap("https://example.com", ENTRIES, ARTICLES.entries).map(
      (entry) => entry.url,
    );
    for (const url of urls) {
      expect(url).not.toContain("?");
    }
  });

  it("gives Articles and the /learn hub a real lastmod, and catalog pages none; never priority or changefreq", () => {
    for (const entry of buildSitemap("https://example.com", ENTRIES, ARTICLES.entries)) {
      if (entry.url.startsWith("https://example.com/learn")) {
        expect(Object.keys(entry)).toEqual(["url", "lastModified"]);
      } else {
        expect(Object.keys(entry)).toEqual(["url"]);
      }
    }
  });

  it("URL-encodes slugs, including Article slugs", () => {
    const result = buildSitemap(
      "https://example.com",
      { categorySlugs: [], productSlugs: ["a b/c"] },
      [{ slug: "d e/f", updatedAt: UPDATED }],
    );
    expect(result[1]?.url).toBe("https://example.com/products/a%20b%2Fc");
    expect(result[3]?.url).toBe("https://example.com/learn/d%20e%2Ff");
  });
});

describe("generateSitemap", () => {
  const make = (overrides: Partial<Parameters<typeof generateSitemap>[0]> = {}) => {
    const listSitemapEntries = vi.fn().mockResolvedValue(ENTRIES);
    const listPublishedArticleSlugs = vi.fn().mockResolvedValue(ARTICLES);
    const listSectionPaths = vi.fn().mockResolvedValue([]);
    const warn = vi.fn();
    return {
      listSitemapEntries,
      listPublishedArticleSlugs,
      listSectionPaths,
      warn,
      deps: {
        getSite: () => SITE,
        repository: { listSitemapEntries },
        contentRepository: { listPublishedArticleSlugs },
        listSectionPaths,
        warn,
        ...overrides,
      },
    };
  };

  it("splits the remaining budget between catalog entries and Article slugs (the home page and /learn hub take one each)", async () => {
    const { deps, listSitemapEntries, listPublishedArticleSlugs } = make();
    const sitemap = await generateSitemap(deps);
    expect(sitemap).toHaveLength(7);
    expect(listSitemapEntries).toHaveBeenCalledWith(CATALOG_BUDGET);
    expect(listPublishedArticleSlugs).toHaveBeenCalledWith(ARTICLE_BUDGET);
  });

  it("lists technology section tabs with content right after the home page, capped at MAX_SECTION_PATHS (MVP-028)", async () => {
    const { deps, listSectionPaths } = make();
    listSectionPaths.mockResolvedValue(["/power-apps", "/power-apps/components"]);
    const sitemap = await generateSitemap(deps);
    expect(sitemap.slice(0, 3)).toEqual([
      { url: "https://example.com/" },
      { url: "https://example.com/power-apps" },
      { url: "https://example.com/power-apps/components" },
    ]);

    listSectionPaths.mockResolvedValue(
      Array.from({ length: MAX_SECTION_PATHS + 5 }, (_, i) => `/x${i}`),
    );
    const capped = await generateSitemap(deps);
    expect(capped.filter((entry) => /\/x\d+$/.test(entry.url))).toHaveLength(MAX_SECTION_PATHS);
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
    expect(sitemap).toHaveLength(7);
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
