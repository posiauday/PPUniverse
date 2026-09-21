import type { SitemapEntries } from "@ppu/domain-catalog";
import { describe, expect, it, vi } from "vitest";
import type { SiteUrlResult } from "../site-url.js";
import { MAX_SITEMAP_URLS, buildSitemap, generateSitemap } from "./sitemap.js";

const SITE: SiteUrlResult = { ok: true, origin: "https://example.com" };
const ENTRIES: SitemapEntries = {
  categorySlugs: ["power-apps-components", "power-bi-templates"],
  productSlugs: ["alpha", "beta"],
  truncated: false,
};

describe("buildSitemap", () => {
  it("lists the home page, category base URLs and product URLs — as absolute URLs", () => {
    expect(buildSitemap("https://example.com", ENTRIES)).toEqual([
      { url: "https://example.com/" },
      { url: "https://example.com/categories/power-apps-components" },
      { url: "https://example.com/categories/power-bi-templates" },
      { url: "https://example.com/products/alpha" },
      { url: "https://example.com/products/beta" },
    ]);
  });

  it("lists only the home page for an empty catalog", () => {
    expect(buildSitemap("https://example.com", { categorySlugs: [], productSlugs: [] })).toEqual([
      { url: "https://example.com/" },
    ]);
  });

  it("never includes a paginated, search, sort or filter URL", () => {
    const urls = buildSitemap("https://example.com", ENTRIES).map((entry) => entry.url);
    for (const url of urls) {
      expect(url).not.toContain("?");
    }
  });

  it("carries no lastmod, priority or changefreq", () => {
    for (const entry of buildSitemap("https://example.com", ENTRIES)) {
      expect(Object.keys(entry)).toEqual(["url"]);
    }
  });

  it("URL-encodes slugs", () => {
    const [, product] = buildSitemap("https://example.com", {
      categorySlugs: [],
      productSlugs: ["a b/c"],
    });
    expect(product?.url).toBe("https://example.com/products/a%20b%2Fc");
  });
});

describe("generateSitemap", () => {
  const make = (overrides: Partial<Parameters<typeof generateSitemap>[0]> = {}) => {
    const listSitemapEntries = vi.fn().mockResolvedValue(ENTRIES);
    const warn = vi.fn();
    return {
      listSitemapEntries,
      warn,
      deps: {
        getSite: () => SITE,
        repository: { listSitemapEntries },
        warn,
        ...overrides,
      },
    };
  };

  it("returns the sitemap for a valid origin, asking for one entry fewer than the limit (the home page takes one)", async () => {
    const { deps, listSitemapEntries } = make();
    const sitemap = await generateSitemap(deps);
    expect(sitemap).toHaveLength(5);
    expect(listSitemapEntries).toHaveBeenCalledWith(MAX_SITEMAP_URLS - 1);
  });

  it("returns an empty sitemap — and never touches the database — when the origin is unavailable", async () => {
    const { deps, listSitemapEntries } = make({
      getSite: () => ({ ok: false, reason: "MISSING" }),
    });
    expect(await generateSitemap(deps)).toEqual([]);
    expect(listSitemapEntries).not.toHaveBeenCalled();
  });

  it("warns when the list was truncated, without hiding the entries it has", async () => {
    const { deps, warn, listSitemapEntries } = make();
    listSitemapEntries.mockResolvedValue({ ...ENTRIES, truncated: true });
    const sitemap = await generateSitemap(deps);
    expect(sitemap).toHaveLength(5);
    expect(warn).toHaveBeenCalledWith("seo.sitemap_truncated", {
      limit: MAX_SITEMAP_URLS,
      categories: 2,
      products: 2,
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
