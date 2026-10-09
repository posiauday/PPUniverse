import type { SitemapEntries } from "@ppu/domain-catalog";
import type { ArticleSitemapEntries } from "@ppu/domain-content";
import { describe, expect, it, vi } from "vitest";
import type { SiteUrlResult } from "../site-url.js";
import {
  MAX_COMPONENT_URLS,
  MAX_LEARN_URLS,
  MAX_SITEMAP_URLS,
  buildSitemap,
  generateSitemap,
} from "./sitemap.js";
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

// The home page and the /guides hub take one slot each.
// The home page and /guides hub take one slot each, and MVP-028's technology
// section tabs (MAX_SECTION_PATHS) are reserved up front.
const CATALOG_BUDGET = Math.ceil(
  (MAX_SITEMAP_URLS - 2 - 4 - MAX_SECTION_PATHS - MAX_LEARN_URLS - MAX_COMPONENT_URLS) / 2,
);
const ARTICLE_BUDGET =
  MAX_SITEMAP_URLS -
  2 -
  4 -
  MAX_SECTION_PATHS -
  MAX_LEARN_URLS -
  MAX_COMPONENT_URLS -
  CATALOG_BUDGET;

describe("buildSitemap", () => {
  it("lists the home page, category base URLs, product URLs, the /guides hub and Article URLs — as absolute URLs", () => {
    expect(buildSitemap("https://example.com", ENTRIES, ARTICLES.entries)).toEqual([
      { url: "https://example.com/" },
      { url: "https://example.com/categories/power-apps-components" },
      { url: "https://example.com/categories/power-bi-templates" },
      { url: "https://example.com/products/alpha" },
      { url: "https://example.com/products/beta" },
      { url: "https://example.com/guides", lastModified: UPDATED },
      { url: "https://example.com/guides/intro-tutorial", lastModified: UPDATED },
      { url: "https://example.com/about" },
      { url: "https://example.com/privacy" },
      { url: "https://example.com/terms" },
      { url: "https://example.com/how-we-write" },
    ]);
  });

  it("lists only the home page for an empty catalog and no Articles (no empty /guides hub)", () => {
    expect(
      buildSitemap("https://example.com", { categorySlugs: [], productSlugs: [] }, []),
    ).toEqual([
      { url: "https://example.com/" },
      { url: "https://example.com/about" },
      { url: "https://example.com/privacy" },
      { url: "https://example.com/terms" },
      { url: "https://example.com/how-we-write" },
    ]);
  });

  it("dates the /guides hub by its most recently updated Article", () => {
    const older = new Date("2026-01-01T00:00:00.000Z");
    const newer = new Date("2026-06-01T00:00:00.000Z");
    const result = buildSitemap("https://example.com", { categorySlugs: [], productSlugs: [] }, [
      { slug: "a", updatedAt: older },
      { slug: "b", updatedAt: newer },
      { slug: "c", updatedAt: older },
    ]);
    expect(result[1]).toEqual({ url: "https://example.com/guides", lastModified: newer });
  });

  it("never includes a paginated, search, sort or filter URL", () => {
    const urls = buildSitemap("https://example.com", ENTRIES, ARTICLES.entries).map(
      (entry) => entry.url,
    );
    for (const url of urls) {
      expect(url).not.toContain("?");
    }
  });

  it("gives Articles and the /guides hub a real lastmod, and catalog pages none; never priority or changefreq", () => {
    for (const entry of buildSitemap("https://example.com", ENTRIES, ARTICLES.entries)) {
      if (entry.url.startsWith("https://example.com/guides")) {
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
    expect(result[3]?.url).toBe("https://example.com/guides/d%20e%2Ff");
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

  it("splits the remaining budget between catalog entries and Article slugs (the home page and /guides hub take one each)", async () => {
    const { deps, listSitemapEntries, listPublishedArticleSlugs } = make();
    const sitemap = await generateSitemap(deps);
    expect(sitemap).toHaveLength(11);
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

  it("lists the component library after the Learn pages, capped at MAX_COMPONENT_URLS (MVP-049)", async () => {
    const changed = new Date("2026-10-08T00:00:00Z");
    const { deps } = make({
      listLearnEntries: async () => [{ path: "/topics" }],
      listComponentEntries: async () => [
        { path: "/components" },
        { path: "/components/button", lastModified: changed },
      ],
    });
    const urls = (await generateSitemap(deps)).map((entry) => entry.url);
    const at = (url: string) => urls.indexOf(url);
    expect(at("https://example.com/components")).toBeGreaterThan(at("https://example.com/topics"));
    expect(at("https://example.com/components/button")).toBeLessThan(
      at("https://example.com/about"),
    );

    const many = make({
      listComponentEntries: async () =>
        Array.from({ length: MAX_COMPONENT_URLS + 5 }, (_, i) => ({ path: `/components/c${i}` })),
    });
    const capped = await generateSitemap(many.deps);
    expect(capped.filter((entry) => /\/components\/c\d+$/.test(entry.url))).toHaveLength(
      MAX_COMPONENT_URLS,
    );
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
    expect(sitemap).toHaveLength(11);
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

describe("Learn pages in the sitemap (MVP-048)", () => {
  it("lists them before the info pages, with their last-changed dates", () => {
    const changed = new Date("2026-10-07T00:00:00Z");
    const result = buildSitemap(
      "https://example.com",
      { categorySlugs: [], productSlugs: [] },
      [],
      [],
      [
        { path: "/topics" },
        { path: "/topics/power-apps-delegation/which-formulas-delegate", lastModified: changed },
      ],
    );
    expect(result.map((entry) => entry.url)).toEqual([
      "https://example.com/",
      "https://example.com/topics",
      "https://example.com/topics/power-apps-delegation/which-formulas-delegate",
      "https://example.com/about",
      "https://example.com/privacy",
      "https://example.com/terms",
      "https://example.com/how-we-write",
    ]);
    expect(result[2]?.lastModified).toEqual(changed);
  });
});
