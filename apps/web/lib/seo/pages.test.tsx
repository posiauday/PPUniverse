import type { Metadata } from "next";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { SITE_NAME } from "./site.js";

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
  listPublishedArticleSummaries: vi.fn(),
  findPublishedArticleBySlug: vi.fn(),
}));

// MVP-007 slice 2: the product page reads the product's price. Free by
// default here; one test below sets a price explicitly.
const commerce = vi.hoisted(() => ({
  findProductPrice: vi.fn().mockResolvedValue(null),
}));

vi.mock("../catalog", () => ({ catalogRepository: repository }));
vi.mock("../content", () => ({ contentRepository: content }));
const updates = vi.hoisted(() => ({
  listPublishedUpdates: vi.fn().mockResolvedValue([]),
  listPublishedUpdateTimes: vi.fn().mockResolvedValue([]),
}));
vi.mock("../updates", () => ({ updateRepository: updates }));
vi.mock("../commerce", () => ({ commerceRepository: commerce }));
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
// MVP-027: the root layout loads next/font, which only works inside a
// Next.js build; these tests read the layout's metadata, not its fonts.
vi.mock("next/font/google", () => {
  const font = () => ({ className: "font", variable: "--font", style: {} });
  return { Bricolage_Grotesque: font, Instrument_Serif: font, Geist: font, Geist_Mono: font };
});
vi.mock("next/link", async () => {
  const { createElement } = await import("react");
  return {
    default: (props: {
      href: string;
      children?: unknown;
      className?: string;
      "aria-current"?: "page";
    }) =>
      createElement(
        "a",
        { href: props.href, className: props.className, "aria-current": props["aria-current"] },
        props.children as never,
      ),
  };
});

import config from "../../next.config";
import { metadata as layoutMetadata } from "../../app/layout";
import CategoryPage, {
  generateMetadata as categoryMetadata,
} from "../../app/categories/[slug]/page";
import LearnArticlePage, {
  generateMetadata as learnArticleMetadata,
} from "../../app/learn/[slug]/page";
import LearnIndexPage, { generateMetadata as learnIndexMetadata } from "../../app/learn/page";
import HomePage, { generateMetadata as homeMetadata } from "../../app/page";
import TechnologyPage, {
  generateMetadata as technologyMetadata,
} from "../../app/[technology]/page";
import GovernancePage, { generateMetadata as governanceMetadata } from "../../app/governance/page";
import UpdatesPage, { generateMetadata as updatesMetadata } from "../../app/updates/page";
import TechnologyTabPage, {
  generateMetadata as technologyTabMetadata,
} from "../../app/[technology]/[tab]/page";
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
      // Search results always carry the product's category (the home page
      // shows it on each card), so the fixture does too.
      items: total > 0 ? [{ ...productRow, category }] : [],
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

const PUBLISHED_AT = new Date("2026-09-01T00:00:00.000Z");
const UPDATED_AT = new Date("2026-09-20T00:00:00.000Z");
const articleRow = {
  id: "a1",
  slug: "intro-tutorial",
  title: "Intro Tutorial",
  type: "TUTORIAL",
  body: "## Step one\n\nDo the thing.",
  excerpt: "Start here.",
  status: "PUBLISHED",
  publishedAt: PUBLISHED_AT,
  updatedAt: UPDATED_AT,
};
const summary = (slug: string, type = "TUTORIAL") => ({
  slug,
  title: `Title ${slug}`,
  type,
  excerpt: null,
  publishedAt: PUBLISHED_AT,
});
const articleProps = (slug = "intro-tutorial") => ({ params: Promise.resolve({ slug }) });
const imageOf = (metadata: Metadata): unknown =>
  (metadata.openGraph as { images?: Array<{ url: string }> } | undefined)?.images?.[0]?.url;

beforeEach(() => {
  vi.stubEnv("NODE_ENV", "test");
  vi.stubEnv("NEXT_PUBLIC_SITE_URL", ORIGIN);
  repository.listCategories.mockResolvedValue([category]);
  repository.findPublishedProductDetailBySlug.mockResolvedValue(productDetail);
  content.listPublishedArticleSummaries.mockResolvedValue([]);
  repository.searchProducts.mockResolvedValue({ items: [], total: 0, page: 1, pageSize: 4 });
  content.findPublishedArticleBySlug.mockResolvedValue(articleRow);
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
        name: SITE_NAME,
        url: "https://example.com/",
      },
    ]);
  });
});

describe("home page — learning content (SEO story)", () => {
  it("links to /learn and lists the newest articles when any are published", async () => {
    content.listPublishedArticleSummaries.mockResolvedValue([summary("a"), summary("b")]);
    const markup = renderToStaticMarkup(await HomePage());
    // MVP-031: one query feeds the guide counts, the starter guides and the
    // newest six, so it asks for every published summary (the /learn ceiling).
    expect(content.listPublishedArticleSummaries).toHaveBeenCalledWith({ limit: 500 });
    expect(markup).toContain(`id="home-learn"`);
    expect(markup).toContain('href="/learn/a"');
    expect(markup).toContain('href="/learn"');
  });

  it("omits the section, but keeps the /learn link, when nothing is published", async () => {
    const markup = renderToStaticMarkup(await HomePage());
    expect(markup).not.toContain(`id="home-learn"`);
    expect(markup).toContain('href="/learn"');
  });

  it("carries the site share image as an absolute URL", () => {
    const metadata = homeMetadata();
    expect(imageOf(metadata)).toBe("https://example.com/og");
    expect(metadata.twitter).toMatchObject({ card: "summary_large_image" });
  });
});

describe("home page — Daylight layout (MVP-031; was Premium 3, MVP-027 slice 2)", () => {
  const text = (markup: string) => markup.replace(/<[^>]+>/g, "");

  it("leads with the hero headline as its only h1, linking to Learn and to the technologies", async () => {
    const markup = renderToStaticMarkup(await HomePage());
    expect(markup.match(/<h1/g)).toHaveLength(1);
    expect(text(markup)).toContain("Build Power Platform apps that actually hold up.");
    expect(markup).toContain('href="/learn"');
    expect(markup).toContain('href="#technologies"');
    expect(markup).toContain('id="technologies"');
  });

  it("keeps the hero illustration out of the accessibility tree", async () => {
    const markup = renderToStaticMarkup(await HomePage());
    expect(markup).toMatch(/<div aria-hidden="true"[^>]*>[\s\S]*Site inspections/);
  });

  it("shows the real guide count, and leaves the announcement out when nothing is published", async () => {
    expect(text(renderToStaticMarkup(await HomePage()))).not.toContain("free guide");
    content.listPublishedArticleSummaries.mockResolvedValue([summary("a"), summary("b")]);
    expect(text(renderToStaticMarkup(await HomePage()))).toContain(
      "2 free guides across six technologies",
    );
  });

  it("lists the named starter guides only while they are published", async () => {
    expect(renderToStaticMarkup(await HomePage())).not.toContain("Start with the");
    content.listPublishedArticleSummaries.mockResolvedValue([
      summary("why-are-my-totals-wrong"),
      summary("unrelated"),
    ]);
    const markup = renderToStaticMarkup(await HomePage());
    expect(text(markup)).toContain("Start here.");
    expect(markup).toContain('href="/learn/why-are-my-totals-wrong"');
  });

  it("shows the newest published products, and leaves the section out when there are none", async () => {
    repository.searchProducts.mockResolvedValue({
      items: [{ ...productRow, category }],
      total: 1,
      page: 1,
      pageSize: 4,
    });
    const markup = renderToStaticMarkup(await HomePage());
    expect(repository.searchProducts).toHaveBeenCalledWith({
      sort: "recent",
      page: 1,
      pageSize: 4,
    });
    expect(markup).toContain(`id="home-components"`);
    expect(markup).toContain('href="/products/sample-component"');

    repository.searchProducts.mockResolvedValue({ items: [], total: 0, page: 1, pageSize: 4 });
    expect(renderToStaticMarkup(await HomePage())).not.toContain(`id="home-components"`);
  });
});

describe("/learn hub (SEO story)", () => {
  it("is indexable with a self-canonical once an article is published", async () => {
    content.listPublishedArticleSummaries.mockResolvedValue([summary("a")]);
    const metadata = await learnIndexMetadata();
    expect(metadata.robots).toEqual({ index: true, follow: true });
    expect(canonicalOf(metadata)).toBe("https://example.com/learn");
  });

  it("stays noindex (links still followed) while it has no articles", async () => {
    const metadata = await learnIndexMetadata();
    expect(metadata.robots).toEqual({ index: false, follow: true });
  });

  it("groups articles by type, skipping empty types, with CollectionPage and BreadcrumbList JSON-LD", async () => {
    content.listPublishedArticleSummaries.mockResolvedValue([
      summary("t1", "TUTORIAL"),
      summary("c1", "COMPARISON"),
    ]);
    const markup = renderToStaticMarkup(await LearnIndexPage());
    expect(markup).toContain(">Fix a problem</h2>");
    expect(markup).toContain(">Choose the right tool</h2>");
    expect(markup).not.toContain(">Design it to last</h2>");
    expect(markup.indexOf("Fix a problem")).toBeLessThan(markup.indexOf("Choose the right tool"));
    expect(jsonLdBlocks(markup).map((block) => block["@type"])).toEqual([
      "CollectionPage",
      "BreadcrumbList",
    ]);
  });

  it("leads with a problem-first search, goal chips and a technology filter (TD-026)", async () => {
    content.listPublishedArticleSummaries.mockResolvedValue([
      summary("t1", "TUTORIAL"),
      summary("k1", "KPI_GUIDE"),
    ]);
    const markup = renderToStaticMarkup(await LearnIndexPage());
    expect(markup).toContain("What are you");
    expect(markup).toContain('action="/search"');
    expect(markup).toContain('href="#tutorials"');
    expect(markup).toContain('href="#kpi-guides"');
    expect(markup).not.toContain('href="#patterns"');
    expect(markup).toContain('href="/learn?technology=governance"');
    expect(markup).toMatch(/aria-current="page"[^>]*>All technologies</);
  });

  it("narrows to one technology, and ignores an unknown one", async () => {
    content.listPublishedArticleSummaries.mockResolvedValue([
      { ...summary("apps-guide"), technology: "POWER_APPS", title: "Apps guide" },
      { ...summary("bi-guide"), technology: "POWER_BI", title: "BI guide" },
    ]);
    const filtered = renderToStaticMarkup(
      await LearnIndexPage({ searchParams: Promise.resolve({ technology: "power-bi" }) }),
    );
    expect(filtered).toContain("BI guide");
    expect(filtered).not.toContain("Apps guide");
    expect(filtered).toMatch(/aria-current="page"[^>]*>Power BI</);
    const unknown = renderToStaticMarkup(
      await LearnIndexPage({ searchParams: Promise.resolve({ technology: "nope" }) }),
    );
    expect(unknown).toContain("Apps guide");
    expect(unknown).toContain("BI guide");
  });

  it("points an area with no guides yet to its hub", async () => {
    content.listPublishedArticleSummaries.mockResolvedValue([summary("t1", "TUTORIAL")]);
    const markup = renderToStaticMarkup(
      await LearnIndexPage({ searchParams: Promise.resolve({ technology: "governance" }) }),
    );
    expect(markup).toContain("No Governance &amp; admin guides are published yet.");
    expect(markup).toContain('href="/governance"');
  });

  it("shows an empty state and no CollectionPage when nothing is published", async () => {
    const markup = renderToStaticMarkup(await LearnIndexPage());
    expect(markup).toContain("No articles are published yet.");
    expect(jsonLdBlocks(markup).map((block) => block["@type"])).toEqual(["BreadcrumbList"]);
  });
});

describe("article page (SEO story)", () => {
  it("emits TechArticle JSON-LD with the LowCodeStacks brand as author and publisher, plus breadcrumbs", async () => {
    const markup = renderToStaticMarkup(await LearnArticlePage(articleProps()));
    const [article, breadcrumbs] = jsonLdBlocks(markup);
    const brand = { "@type": "Organization", name: SITE_NAME, url: "https://example.com/" };
    expect(article).toMatchObject({
      "@type": "TechArticle",
      headline: "Intro Tutorial",
      author: brand,
      publisher: brand,
      datePublished: PUBLISHED_AT.toISOString(),
      dateModified: UPDATED_AT.toISOString(),
    });
    expect(breadcrumbs).toMatchObject({
      "@type": "BreadcrumbList",
      itemListElement: [
        { position: 1, name: SITE_NAME, item: "https://example.com/" },
        { position: 2, name: "Learn", item: "https://example.com/learn" },
        { position: 3, name: "Intro Tutorial", item: "https://example.com/learn/intro-tutorial" },
      ],
    });
  });

  it("places an article in a technology section under that section in the breadcrumb trail (MVP-029)", async () => {
    content.findPublishedArticleBySlug.mockResolvedValue({
      ...articleRow,
      technology: "POWER_APPS",
    });
    const markup = renderToStaticMarkup(await LearnArticlePage(articleProps()));
    expect(markup).toMatch(
      /<nav aria-label="Breadcrumb"[\s\S]*href="\/power-apps"[\s\S]*Power Apps/,
    );
    const breadcrumbs = jsonLdBlocks(markup).find((block) => block["@type"] === "BreadcrumbList");
    expect(breadcrumbs).toMatchObject({
      itemListElement: [
        { position: 1 },
        { position: 2, name: "Power Apps", item: "https://example.com/power-apps" },
        { position: 3, name: "Intro Tutorial" },
      ],
    });
  });

  it("renders the Markdown body and a 'Keep learning' list of related articles", async () => {
    content.listPublishedArticleSummaries.mockResolvedValue([summary("other")]);
    const markup = renderToStaticMarkup(await LearnArticlePage(articleProps()));
    expect(markup).toContain(">Step one</h2>");
    // MVP-031: "learning" is the heading's serif accent word, so compare text.
    expect(markup.replace(/<[^>]+>/g, "")).toContain("Keep learning");
    expect(markup).toContain('href="/learn/other"');
    expect(content.listPublishedArticleSummaries).toHaveBeenCalledWith({
      limit: 4,
      type: "TUTORIAL",
      excludeSlug: "intro-tutorial",
    });
  });

  it("carries its own share image, built from the slug, as an absolute URL", async () => {
    const metadata = await learnArticleMetadata(articleProps());
    expect(imageOf(metadata)).toBe("https://example.com/og/learn/intro-tutorial");
  });
});

describe("technology sections (MVP-028)", () => {
  const tech = (technology: string) => ({ params: Promise.resolve({ technology }) });
  const tab = (technology: string, t: string) => ({
    params: Promise.resolve({ technology, tab: t }),
  });

  it("an empty hub shows every section as coming soon, stays noindex-follow, and emits no CollectionPage", async () => {
    const metadata = await technologyMetadata(tech("power-apps"));
    expect(metadata.robots).toEqual({ index: false, follow: true });
    expect(canonicalOf(metadata)).toBe("https://example.com/power-apps");
    const markup = renderToStaticMarkup(await TechnologyPage(tech("power-apps")));
    expect(markup).toContain("Everything in Power Apps");
    expect(markup).toContain("Coming soon");
    expect(jsonLdBlocks(markup).map((block) => block["@type"])).toEqual(["BreadcrumbList"]);
  });

  it("a hub with guides is indexable and lists each guide in its own section", async () => {
    content.listPublishedArticleSummaries.mockResolvedValue([
      summary("pa-guide"),
      { ...summary("pa-delegation"), topic: "data-and-delegation" },
    ]);
    const metadata = await technologyMetadata(tech("power-apps"));
    expect(metadata.robots).toEqual({ index: true, follow: true });
    expect(metadata.title).toBe(`Power Apps guides | ${SITE_NAME}`);
    const markup = renderToStaticMarkup(await TechnologyPage(tech("power-apps")));
    // A guide with no topic falls into the first section; one with a topic into its own (MVP-033).
    const choose = markup.indexOf('id="choose-and-plan"');
    const data = markup.indexOf('id="data-and-delegation"');
    expect(markup.indexOf('href="/learn/pa-guide"')).toBeGreaterThan(choose);
    expect(markup.indexOf('href="/learn/pa-guide"')).toBeLessThan(data);
    expect(markup.indexOf('href="/learn/pa-delegation"')).toBeGreaterThan(data);
    expect(markup).toContain('href="#start-here"');
    expect(markup).toContain('href="/governance"');
    expect(jsonLdBlocks(markup).map((block) => block["@type"])).toEqual([
      "CollectionPage",
      "BreadcrumbList",
    ]);
    expect(content.listPublishedArticleSummaries).toHaveBeenCalledWith(
      expect.objectContaining({ technology: "POWER_APPS" }),
    );
  });

  it("Governance & admin stays noindex with no guides, and lists its guides once published (MVP-033)", async () => {
    expect((await governanceMetadata()).robots).toEqual({ index: false, follow: true });
    content.listPublishedArticleSummaries.mockResolvedValue([
      { ...summary("dlp-guide"), technology: "GOVERNANCE_ADMIN", topic: "data-policies" },
    ]);
    expect((await governanceMetadata()).robots).toEqual({ index: true, follow: true });
    const markup = renderToStaticMarkup(await GovernancePage());
    expect(markup.indexOf('href="/learn/dlp-guide"')).toBeGreaterThan(
      markup.indexOf('id="data-policies"'),
    );
    expect(content.listPublishedArticleSummaries).toHaveBeenCalledWith(
      expect.objectContaining({ technology: "GOVERNANCE_ADMIN" }),
    );
  });

  it("an old tab address redirects permanently to its hub", async () => {
    await expect(TechnologyTabPage(tab("power-apps", "kpis"))).rejects.toThrow(/NEXT_REDIRECT/);
    expect((await technologyTabMetadata()).robots).toEqual({ index: false, follow: false });
  });

  it("an unknown technology or tab is noindex metadata and a 404", async () => {
    expect((await technologyMetadata(tech("sharepoint"))).robots).toEqual({
      index: false,
      follow: false,
    });
    await expect(TechnologyPage(tech("sharepoint"))).rejects.toThrow(
      /NEXT_HTTP_ERROR_FALLBACK;404/,
    );
    await expect(TechnologyTabPage(tab("power-apps", "learn"))).rejects.toThrow(/404/);
    await expect(TechnologyTabPage(tab("power-apps", "pricing"))).rejects.toThrow(/404/);
    await expect(TechnologyTabPage(tab("nope", "kpis"))).rejects.toThrow(/404/);
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

describe("BUG-002: a repeated query parameter", () => {
  it("renders the category page with the first value instead of throwing", async () => {
    givenCategoryWith(30);
    const props = {
      params: Promise.resolve({ slug: category.slug }),
      searchParams: Promise.resolve({ q: ["forms", "other"], page: ["2", "3"] }),
    };
    const markup = renderToStaticMarkup(await CategoryPage(props));
    expect(markup).toContain("Sample Component");
    expect(repository.searchProducts).toHaveBeenCalledWith(
      expect.objectContaining({ query: "forms", page: 2 }),
    );
  });
});

describe("product page", () => {
  it("is indexable with an absolute self-canonical", async () => {
    const metadata = await productMetadata(productProps());
    expect(metadata.robots).toEqual({ index: true, follow: true });
    expect(canonicalOf(metadata)).toBe("https://example.com/products/sample-component");
    expect(metadata.description).toBe("A reusable form control.");
    expect(imageOf(metadata)).toBe("https://example.com/og/products/sample-component");
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

  it("shows a priced product's price and 'all sales final', but still emits no Offer before checkout exists", async () => {
    commerce.findProductPrice.mockResolvedValueOnce({
      productId: "p1",
      amountCents: 4900,
      currency: "USD",
      updatedAt: new Date(),
    });
    const markup = renderToStaticMarkup(await ProductPage(productProps()));
    expect(markup).toContain("$49.00 USD");
    expect(markup).toContain("All sales are final. No refunds.");
    expect(markup).toContain("Purchasing opens soon.");
    expect(markup).not.toContain("to get this for free");
    const json = markup.match(JSON_LD_BLOCK)?.join("") ?? "";
    expect(json).not.toContain('"offers"');
    expect(json).not.toContain('"price"');
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
    // Nor a share image: a relative one would resolve against localhost.
    expect(imageOf(homeMetadata())).toBeUndefined();
    expect(imageOf(await productMetadata(productProps()))).toBeUndefined();
    expect(imageOf(await learnArticleMetadata(articleProps()))).toBeUndefined();
    expect((homeMetadata().twitter as { card?: string }).card).toBe("summary");

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
    const updatedAt = new Date("2026-09-20T10:00:00.000Z");
    content.listPublishedArticleSlugs.mockResolvedValue({
      entries: [{ slug: "intro-tutorial", updatedAt }],
      truncated: false,
    });
    expect(await sitemap()).toEqual([
      { url: "https://example.com/" },
      { url: "https://example.com/categories/power-apps-components" },
      { url: "https://example.com/products/sample-component" },
      { url: "https://example.com/learn", lastModified: updatedAt },
      { url: "https://example.com/learn/intro-tutorial", lastModified: updatedAt },
      { url: "https://example.com/about" },
      { url: "https://example.com/privacy" },
      { url: "https://example.com/terms" },
    ]);
    // The home page, the /learn hub, About, Privacy and Terms (MVP-032) take
    // one each of MAX_SITEMAP_URLS (50,000) and the 7 hubs (six products and
    // Governance & admin, MVP-033) are reserved; the remaining 49,988 is split
    // between the catalog and content repositories
    // (see lib/seo/sitemap.ts's generateSitemap). No section has content here,
    // so none is listed.
    expect(repository.listSitemapEntries).toHaveBeenCalledWith(24_994);
    expect(content.listPublishedArticleSlugs).toHaveBeenCalledWith(24_994);
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

describe("/updates (MVP-033 slice D)", () => {
  const update = (
    slug: string,
    kind: string,
    effective: string | null,
    replacement: string | null,
  ) => ({
    id: slug,
    slug,
    title: `Title ${slug}`,
    summary: "What changed.",
    technology: "POWER_AUTOMATE",
    kind,
    action: "No action",
    sourceUrl: `https://learn.microsoft.com/x#${slug}`,
    effectiveDate: effective ? new Date(`${effective}T00:00:00Z`) : null,
    replacement,
    publishedAt: new Date("2026-10-01T00:00:00Z"),
  });

  it("stays noindex with an empty state until the first update is published", async () => {
    updates.listPublishedUpdates.mockResolvedValue([]);
    expect((await updatesMetadata()).robots).toEqual({ index: false, follow: true });
    const markup = renderToStaticMarkup(await UpdatesPage());
    expect(markup).toContain("No updates are published yet.");
    expect(markup).not.toContain("Deprecation tracker");
  });

  it("lists updates with Microsoft's link, and tracks only dated deprecations and retirements", async () => {
    updates.listPublishedUpdates.mockResolvedValue([
      update("app-retired", "RETIREMENT", "2026-08-31", "Approvals app in Microsoft Teams"),
      update("grid-deprecated", "DEPRECATION", "2026-03-01", null),
      update("new-feature", "FEATURE", null, null),
    ]);
    expect((await updatesMetadata()).robots).toEqual({ index: true, follow: true });
    const markup = renderToStaticMarkup(await UpdatesPage());
    expect(markup).toContain('id="new-feature"');
    expect(markup).toContain('href="https://learn.microsoft.com/x#new-feature"');
    const tracker = markup.slice(markup.indexOf("Deprecation tracker"));
    expect(tracker).toContain("Removed Aug 2026");
    expect(tracker).toContain("Switch to: Approvals app in Microsoft Teams");
    expect(tracker).toContain("Deprecated Mar 2026");
    expect(tracker).not.toContain("Title new-feature");
    expect(tracker.indexOf("app-retired")).toBeLessThan(tracker.indexOf("grid-deprecated"));
  });
});
