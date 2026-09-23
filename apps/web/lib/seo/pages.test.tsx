import type { Metadata } from "next";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

/**
 * Wiring tests (MVP-021): call the REAL page, layout, robots, sitemap and
 * next.config modules with a mocked repository and check what they actually
 * emit — metadata, JSON-LD, robots, sitemap and headers — for each scenario the
 * product owner's canonical/indexing policy names.
 */

const repository = vi.hoisted(() => ({
  listCategories: vi.fn(),
  findCategoryBySlug: vi.fn(),
  findPublishedProductDetailBySlug: vi.fn(),
  searchProducts: vi.fn(),
  listSitemapEntries: vi.fn(),
}));

const content = vi.hoisted(() => ({
  listPublishedArticleSlugs: vi.fn(),
}));

vi.mock("../catalog", () => ({ catalogRepository: repository }));
vi.mock("../content", () => ({ contentRepository: content }));
vi.mock("@ppu/telemetry", () => ({
  logger: { debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));
// MVP-010: ProductPage now calls getServerSession, which needs a real
// Next.js request scope that rendering the page directly here doesn't
// provide. These SEO tests aren't about the entitlement UI, so a guest
// (no session) is a safe, non-behavior-changing default — it also means the
// entitlement lookup branch never executes, so no @ppu/db mock is needed
// either.
vi.mock("next-auth/next", () => ({ getServerSession: vi.fn().mockResolvedValue(null) }));
vi.mock("next/link", async () => {
  const { createElement } = await import("react");
  return {
    default: (props: { href: string; children?: unknown; className?: string }) =>
      createElement("a", { href: props.href, className: props.className }, props.children as never),
  };
});

import config from "../../next.config";
import { metadata as layoutMetadata } from "../../app/layout";
import CategoryPage, {
  generateMetadata as categoryMetadata,
} from "../../app/categories/[slug]/page";
import HomePage, { generateMetadata as homeMetadata } from "../../app/page";
import ProductPage, { generateMetadata as productMetadata } from "../../app/products/[slug]/page";
import robots from "../../app/robots";
import sitemap from "../../app/sitemap";

const ORIGIN = "https://example.com";

const category = {
  id: "c1",
  slug: "power-apps-components",
  name: "Power Apps Components",
  description: "Reusable controls.",
  assetType: "POWER_APPS_COMPONENT",
};

const productRow = {
  id: "p1",
  slug: "sample-component",
  name: "Sample Component",
  summary: "A reusable form control.",
  status: "PUBLISHED",
  categoryId: "c1",
};

const productDetail = {
  ...productRow,
  category,
  licenses: [],
  currentVersion: "1.2.0",
  support: null,
  compatibility: [],
};

const JSON_LD_BLOCK = /<script type="application\/ld\+json">([\s\S]*?)<\/script>/g;
const jsonLdBlocks = (markup: string): Array<Record<string, unknown>> =>
  [...markup.matchAll(JSON_LD_BLOCK)].map((match) => JSON.parse(match[1] ?? ""));
const scriptElementCount = (markup: string): number => (markup.match(/<script/gi) ?? []).length;

const canonicalOf = (metadata: Metadata): unknown => metadata.alternates?.canonical;

/** Sets up a category with `total` PUBLISHED products; `searchProducts` reports it for every call. */
function givenCategoryWith(total: number): void {
  repository.findCategoryBySlug.mockResolvedValue(category);
  repository.searchProducts.mockImplementation(
    async (options: { page: number; pageSize: number }) => ({
      items: total > 0 ? [productRow] : [],
      total,
      page: options.page,
      pageSize: options.pageSize,
    }),
  );
}

const categoryProps = (searchParams: Record<string, string | undefined> = {}) => ({
  params: Promise.resolve({ slug: category.slug }),
  searchParams: Promise.resolve(searchParams),
});
const productProps = (slug = "sample-component") => ({ params: Promise.resolve({ slug }) });

beforeEach(() => {
  vi.stubEnv("NODE_ENV", "test");
  vi.stubEnv("NEXT_PUBLIC_SITE_URL", ORIGIN);
  repository.listCategories.mockResolvedValue([category]);
  repository.findPublishedProductDetailBySlug.mockResolvedValue(productDetail);
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.clearAllMocks();
});

describe("root layout", () => {
  it("is noindex, nofollow by default — every page must opt in to being indexed", () => {
    expect(layoutMetadata.robots).toEqual({ index: false, follow: false });
  });
});

describe("home page", () => {
  it("is indexable with an absolute self-canonical", () => {
    const metadata = homeMetadata();
    expect(metadata.robots).toEqual({ index: true, follow: true });
    expect(canonicalOf(metadata)).toBe("https://example.com/");
  });

  it("emits WebSite JSON-LD with only the site name and URL", async () => {
    const markup = renderToStaticMarkup(await HomePage());
    expect(jsonLdBlocks(markup)).toEqual([
      {
        "@context": "https://schema.org",
        "@type": "WebSite",
        name: "Power Platform Universe",
        url: "https://example.com/",
      },
    ]);
  });
});

describe("category page — canonical and robots policy", () => {
  it("base URL with PUBLISHED products: index, follow, self-canonical to the base URL", async () => {
    givenCategoryWith(30);
    const metadata = await categoryMetadata(categoryProps());
    expect(metadata.robots).toEqual({ index: true, follow: true });
    expect(canonicalOf(metadata)).toBe("https://example.com/categories/power-apps-components");
  });

  it("emits CollectionPage JSON-LD on the clean, indexable base URL only", async () => {
    givenCategoryWith(30);
    const markup = renderToStaticMarkup(await CategoryPage(categoryProps()));
    expect(jsonLdBlocks(markup)).toEqual([
      {
        "@context": "https://schema.org",
        "@type": "CollectionPage",
        name: "Power Apps Components",
        description: "Reusable controls.",
        url: "https://example.com/categories/power-apps-components",
      },
    ]);
  });

  it("?page=1: index, follow, canonical normalized to the base URL", async () => {
    givenCategoryWith(30);
    const metadata = await categoryMetadata(categoryProps({ page: "1" }));
    expect(metadata.robots).toEqual({ index: true, follow: true });
    expect(canonicalOf(metadata)).toBe("https://example.com/categories/power-apps-components");
  });

  it("valid ?page=2: index, follow, self-canonical to the exact paginated URL", async () => {
    givenCategoryWith(30);
    const metadata = await categoryMetadata(categoryProps({ page: "2" }));
    expect(metadata.robots).toEqual({ index: true, follow: true });
    expect(canonicalOf(metadata)).toBe(
      "https://example.com/categories/power-apps-components?page=2",
    );
  });

  it("decides a paginated URL from the category's PUBLISHED total (first page, no query), not the page requested", async () => {
    givenCategoryWith(30);
    await categoryMetadata(categoryProps({ page: "2" }));
    expect(repository.searchProducts).toHaveBeenCalledWith(
      expect.objectContaining({ page: 1, query: undefined, categorySlug: category.slug }),
    );
  });

  it("does not emit CollectionPage JSON-LD on a paginated URL", async () => {
    givenCategoryWith(30);
    const markup = renderToStaticMarkup(await CategoryPage(categoryProps({ page: "2" })));
    expect(jsonLdBlocks(markup)).toEqual([]);
  });

  it.each([
    ["?q=button", { q: "button" }],
    ["?sort=newest", { sort: "newest" }],
    ["a filter parameter", { license: "personal" }],
    ["mixed page and q", { page: "2", q: "button" }],
    ["mixed page and sort", { page: "2", sort: "recent" }],
  ])(
    "%s: noindex, follow with the clean base canonical, and no query is made for it",
    async (_label, params) => {
      givenCategoryWith(30);
      const metadata = await categoryMetadata(categoryProps(params));
      expect(metadata.robots).toEqual({ index: false, follow: true });
      expect(canonicalOf(metadata)).toBe("https://example.com/categories/power-apps-components");
      expect(repository.searchProducts).not.toHaveBeenCalled();
    },
  );

  it("empty category: noindex, follow, canonical to the base URL, still rendered (not a 404)", async () => {
    givenCategoryWith(0);
    const metadata = await categoryMetadata(categoryProps());
    expect(metadata.robots).toEqual({ index: false, follow: true });
    expect(canonicalOf(metadata)).toBe("https://example.com/categories/power-apps-components");

    const markup = renderToStaticMarkup(await CategoryPage(categoryProps()));
    expect(markup).toContain("No products have been published in this category yet");
    expect(jsonLdBlocks(markup)).toEqual([]);
  });

  it.each(["9", "999", "0", "-1", "abc", "1.5"])(
    "out-of-range or invalid ?page=%s: noindex, follow with the base canonical",
    async (page) => {
      givenCategoryWith(30);
      const metadata = await categoryMetadata(categoryProps({ page }));
      expect(metadata.robots).toEqual({ index: false, follow: true });
      expect(canonicalOf(metadata)).toBe("https://example.com/categories/power-apps-components");
    },
  );

  it("an unknown category is noindex metadata and a 404 page", async () => {
    repository.findCategoryBySlug.mockResolvedValue(null);
    expect(await categoryMetadata(categoryProps())).toEqual({
      title: "Category not found",
      robots: { index: false, follow: false },
    });
    await expect(CategoryPage(categoryProps())).rejects.toThrow();
  });

  it("leaves MVP-004's search unchanged: a search still runs with the query, sort and page it was given", async () => {
    givenCategoryWith(30);
    await CategoryPage(categoryProps({ q: "button", sort: "alphabetical", page: "2" }));
    expect(repository.searchProducts).toHaveBeenCalledWith({
      query: "button",
      categorySlug: category.slug,
      sort: "alphabetical",
      page: 2,
      pageSize: 12,
    });
  });
});

describe("product page", () => {
  it("is indexable with an absolute self-canonical", async () => {
    const metadata = await productMetadata(productProps());
    expect(metadata.robots).toEqual({ index: true, follow: true });
    expect(canonicalOf(metadata)).toBe("https://example.com/products/sample-component");
    expect(metadata.description).toBe("A reusable form control.");
  });

  it("emits Product JSON-LD from real published data only — no Offer, price, rating or review", async () => {
    const markup = renderToStaticMarkup(await ProductPage(productProps()));
    expect(jsonLdBlocks(markup)).toEqual([
      {
        "@context": "https://schema.org",
        "@type": "Product",
        name: "Sample Component",
        description: "A reusable form control.",
        url: "https://example.com/products/sample-component",
        category: "Power Apps Components",
        additionalProperty: [{ "@type": "PropertyValue", name: "Version", value: "1.2.0" }],
      },
    ]);
    const json = markup.match(JSON_LD_BLOCK)?.join("") ?? "";
    for (const forbidden of [
      "offers",
      "price",
      "availability",
      "aggregateRating",
      "review",
      "seller",
      "brand",
      "image",
    ]) {
      expect(json, forbidden).not.toContain(`"${forbidden}"`);
    }
  });

  it("omits the version when no release is published", async () => {
    repository.findPublishedProductDetailBySlug.mockResolvedValue({
      ...productDetail,
      currentVersion: null,
    });
    const [block] = jsonLdBlocks(renderToStaticMarkup(await ProductPage(productProps())));
    expect(block).not.toHaveProperty("additionalProperty");
  });

  it("keeps malicious product text inert: it cannot terminate the script or create another element", async () => {
    repository.findPublishedProductDetailBySlug.mockResolvedValue({
      ...productDetail,
      name: "</script><script>alert(1)</script>",
      summary: "<img src=x onerror=alert(1)><!-- <script>",
    });
    const markup = renderToStaticMarkup(await ProductPage(productProps()));

    expect(scriptElementCount(markup)).toBe(1);
    expect(markup).not.toContain("<img src=x");
    const [block] = jsonLdBlocks(markup);
    expect(block?.["name"]).toBe("</script><script>alert(1)</script>");
    expect(block?.["description"]).toBe("<img src=x onerror=alert(1)><!-- <script>");
  });

  it("an unknown or unpublished product is noindex metadata and a 404 — no draft leaks into JSON-LD", async () => {
    repository.findPublishedProductDetailBySlug.mockResolvedValue(null);
    expect(await productMetadata(productProps("draft-product"))).toEqual({
      title: "Product not found",
      robots: { index: false, follow: false },
    });
    await expect(ProductPage(productProps("draft-product"))).rejects.toThrow();
  });
});

describe("when the site origin is unavailable in production", () => {
  beforeEach(() => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "");
  });

  it("emits no canonical or og:url and no JSON-LD anywhere, but pages still render", async () => {
    givenCategoryWith(30);

    expect(homeMetadata().alternates).toBeUndefined();
    expect((await categoryMetadata(categoryProps())).alternates).toBeUndefined();
    expect((await productMetadata(productProps())).alternates).toBeUndefined();

    const home = renderToStaticMarkup(await HomePage());
    const categoryMarkup = renderToStaticMarkup(await CategoryPage(categoryProps()));
    const productMarkup = renderToStaticMarkup(await ProductPage(productProps()));
    for (const markup of [home, categoryMarkup, productMarkup]) {
      expect(scriptElementCount(markup)).toBe(0);
    }
    expect(productMarkup).toContain("Sample Component");
  });

  it("serves robots.txt without a Sitemap line, and an empty sitemap that never touches the database", async () => {
    expect("sitemap" in robots()).toBe(false);
    expect(await sitemap()).toEqual([]);
    expect(repository.listSitemapEntries).not.toHaveBeenCalled();
    expect(content.listPublishedArticleSlugs).not.toHaveBeenCalled();
  });
});

describe("robots.txt and sitemap.xml routes", () => {
  it("robots.txt blocks only /api/ and references the absolute sitemap", () => {
    expect(robots()).toEqual({
      rules: [{ userAgent: "*", allow: "/", disallow: ["/api/"] }],
      sitemap: "https://example.com/sitemap.xml",
    });
  });

  it("sitemap.xml is built from PUBLISHED data only, as absolute URLs (catalog and Article content)", async () => {
    repository.listSitemapEntries.mockResolvedValue({
      categorySlugs: ["power-apps-components"],
      productSlugs: ["sample-component"],
      truncated: false,
    });
    content.listPublishedArticleSlugs.mockResolvedValue({
      slugs: ["intro-tutorial"],
      truncated: false,
    });
    expect(await sitemap()).toEqual([
      { url: "https://example.com/" },
      { url: "https://example.com/categories/power-apps-components" },
      { url: "https://example.com/products/sample-component" },
      { url: "https://example.com/learn/intro-tutorial" },
    ]);
    // The home page takes one of MAX_SITEMAP_URLS (50,000); the remaining
    // 49,999 is split between the catalog and content repositories (see
    // lib/seo/sitemap.ts's generateSitemap).
    expect(repository.listSitemapEntries).toHaveBeenCalledWith(25_000);
    expect(content.listPublishedArticleSlugs).toHaveBeenCalledWith(24_999);
  });
});

describe("next.config headers", () => {
  it("marks API, account and sign-in responses noindex, nofollow — and nothing else", async () => {
    const rules = (await config.headers?.()) ?? [];
    expect(rules.map((rule) => rule.source)).toEqual(["/api/:path*", "/account/:path*", "/signin"]);
    for (const rule of rules) {
      expect(rule.headers).toEqual([{ key: "X-Robots-Tag", value: "noindex, nofollow" }]);
    }
  });
});
