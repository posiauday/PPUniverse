import type { ArticleSearchHit } from "@ppu/domain-content";
import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * Site search (MVP-031, "Board fidelity pass"; open question 63): guides
 * first with the matches marked, then components. The repositories are
 * mocked; the SQL is covered by @ppu/adapter-content's integration test.
 */

const catalog = vi.hoisted(() => ({ searchProducts: vi.fn() }));
const content = vi.hoisted(() => ({ searchPublishedArticles: vi.fn() }));

vi.mock("../../lib/catalog", () => ({ catalogRepository: catalog }));
vi.mock("../../lib/content", () => ({ contentRepository: content }));
vi.mock("@ppu/telemetry", () => ({
  logger: { debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));
vi.mock("next/link", async () => {
  const { createElement } = await import("react");
  return {
    default: (props: { href: string; children?: unknown; className?: string }) =>
      createElement("a", { href: props.href, className: props.className }, props.children as never),
  };
});

const { default: SearchPage, generateMetadata } = await import("./page");

const S = String.fromCharCode(1);
const E = String.fromCharCode(2);

const hit: ArticleSearchHit = {
  slug: "power-apps-delegation-500-rows",
  title: "Delegation in Power Apps: why your gallery stops at 500 rows",
  type: "TUTORIAL",
  technology: "POWER_APPS",
  topic: null,
  excerpt: null,
  publishedAt: new Date("2026-09-30T00:00:00Z"),
  titleMarked: `${S}Delegation${E} in Power Apps: why your gallery stops at 500 rows`,
  snippetMarked: `here is why ${S}delegation${E} causes it`,
};

const noProducts = { items: [], total: 0, page: 1, pageSize: 12 };

const render = async (searchParams: Record<string, string>) =>
  renderToStaticMarkup(await SearchPage({ searchParams: Promise.resolve(searchParams) }));

beforeEach(() => {
  vi.clearAllMocks();
  catalog.searchProducts.mockResolvedValue(noProducts);
  content.searchPublishedArticles.mockResolvedValue([]);
});

describe("search page", () => {
  it("stays out of search indexes but lets crawlers follow its links", () => {
    expect(generateMetadata().robots).toEqual({ index: false, follow: true });
  });

  it("searches guides with the query and lists them with the matches marked", async () => {
    content.searchPublishedArticles.mockResolvedValue([hit]);
    const html = await render({ q: "delegation" });

    expect(content.searchPublishedArticles).toHaveBeenCalledWith({
      query: "delegation",
      limit: 20,
    });
    expect(html).toContain("1 guide matches");
    expect(html).toContain('href="/guides/power-apps-delegation-500-rows"');
    expect(html).toMatch(/<mark[^>]*>Delegation<\/mark> in Power Apps/);
    expect(html).toMatch(/why <mark[^>]*>delegation<\/mark> causes it/);
    expect(html).toContain("Power Apps · Fix a problem");
    expect(html).not.toContain(S);
    expect(html).not.toContain(E);
  });

  it("searches one area's guides when a hub sends its area, and says so (MVP-037)", async () => {
    const html = await render({ q: "trigger", tech: "power-automate" });
    expect(content.searchPublishedArticles).toHaveBeenCalledWith({
      query: "trigger",
      limit: 20,
      technology: "POWER_AUTOMATE",
    });
    expect(html).toContain("Power Automate guides only");
    expect(html).toContain('href="/search?q=trigger"');
    // The search box keeps the area, so searching again stays in it.
    expect(html).toContain('name="tech" value="power-automate"');
  });

  it("ignores an unknown area and searches everything", async () => {
    const html = await render({ q: "trigger", tech: "not-an-area" });
    expect(content.searchPublishedArticles).toHaveBeenCalledWith({ query: "trigger", limit: 20 });
    expect(html).not.toContain("guides only");
  });

  it("does not search guides without a query, or on a later page of components", async () => {
    await render({});
    await render({ q: "delegation", page: "2" });
    expect(content.searchPublishedArticles).not.toHaveBeenCalled();
  });

  it("says when nothing matched, and points to Learn", async () => {
    const html = await render({ q: "zzz" });
    expect(html).toContain("Nothing matched");
    expect(html).toContain('href="/guides"');
  });

  it("lists matching components after the guides", async () => {
    content.searchPublishedArticles.mockResolvedValue([hit]);
    catalog.searchProducts.mockResolvedValue({
      items: [
        {
          id: "p1",
          slug: "sample-component",
          name: "Sample Component",
          summary: "A reusable form control.",
          category: { name: "Forms", slug: "forms" },
        },
      ],
      total: 1,
      page: 1,
      pageSize: 12,
    });
    const html = await render({ q: "delegation" });
    expect(html).toContain("plus <b");
    expect(html.indexOf("power-apps-delegation-500-rows")).toBeLessThan(
      html.indexOf("Sample Component"),
    );
    expect(html).toContain('id="search-components"');
  });
});
