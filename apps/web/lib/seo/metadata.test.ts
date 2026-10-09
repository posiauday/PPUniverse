import type { Metadata } from "next";
import { describe, expect, it } from "vitest";
import type { SiteUrlResult } from "../site-url.js";
import type { CategoryIndexingDecision } from "./category-indexing.js";
import {
  buildCategoryMetadata,
  buildHomeMetadata,
  buildLearnIndexMetadata,
  buildLearnMetadata,
  buildNotFoundMetadata,
  buildProductMetadata,
  toMetaDescription,
} from "./metadata.js";
import { MAX_META_DESCRIPTION_LENGTH, SITE_DESCRIPTION, SITE_NAME } from "./site.js";

const SITE: SiteUrlResult = { ok: true, origin: "https://example.com" };
const NO_SITE: SiteUrlResult = { ok: false, reason: "MISSING" };

const category = {
  slug: "power-apps-components",
  name: "Power Apps Components",
  description: "Reusable controls.",
};
const product = {
  slug: "sample-component",
  name: "Sample Component",
  summary: "A reusable form control.",
};

const BASE: CategoryIndexingDecision = { index: true, canonicalPage: null, reason: "BASE" };
const PAGE_TWO: CategoryIndexingDecision = { index: true, canonicalPage: 2, reason: "PAGINATED" };
const VARIANT: CategoryIndexingDecision = {
  index: false,
  canonicalPage: null,
  reason: "VARIANT_PARAMS",
};
const EMPTY: CategoryIndexingDecision = {
  index: false,
  canonicalPage: null,
  reason: "EMPTY_CATEGORY",
};

const canonicalOf = (metadata: Metadata): unknown => metadata.alternates?.canonical;

describe("buildHomeMetadata", () => {
  it("is indexable with an absolute self-canonical", () => {
    const metadata = buildHomeMetadata(SITE);
    expect(metadata.title).toBe(SITE_NAME);
    expect(metadata.description).toBe(SITE_DESCRIPTION);
    expect(metadata.robots).toEqual({ index: true, follow: true });
    expect(canonicalOf(metadata)).toBe("https://example.com/");
  });

  it("emits Open Graph and Twitter Card metadata", () => {
    const metadata = buildHomeMetadata(SITE);
    expect(metadata.openGraph).toMatchObject({
      type: "website",
      siteName: SITE_NAME,
      locale: "en_US",
      url: "https://example.com/",
      title: SITE_NAME,
      description: SITE_DESCRIPTION,
    });
    expect(metadata.twitter).toMatchObject({
      card: "summary_large_image",
      title: SITE_NAME,
      images: ["https://example.com/og"],
    });
  });
});

describe("buildCategoryMetadata — canonical and robots follow the approved policy", () => {
  it("base: index, follow, self-canonical to the base URL", () => {
    const metadata = buildCategoryMetadata({ site: SITE, category, decision: BASE });
    expect(metadata.robots).toEqual({ index: true, follow: true });
    expect(canonicalOf(metadata)).toBe("https://example.com/categories/power-apps-components");
  });

  it("valid page N: index, follow, self-canonical to the exact paginated URL", () => {
    const metadata = buildCategoryMetadata({ site: SITE, category, decision: PAGE_TWO });
    expect(metadata.robots).toEqual({ index: true, follow: true });
    expect(canonicalOf(metadata)).toBe(
      "https://example.com/categories/power-apps-components?page=2",
    );
    expect((metadata.openGraph as { url?: string }).url).toBe(
      "https://example.com/categories/power-apps-components?page=2",
    );
  });

  it.each([
    ["a search / sort / filter / mixed variant", VARIANT],
    ["an empty category", EMPTY],
  ])("%s: noindex, follow, canonical to the clean base URL", (_label, decision) => {
    const metadata = buildCategoryMetadata({ site: SITE, category, decision });
    expect(metadata.robots).toEqual({ index: false, follow: true });
    expect(canonicalOf(metadata)).toBe("https://example.com/categories/power-apps-components");
  });

  it("uses the category description, or a fallback when there is none", () => {
    expect(buildCategoryMetadata({ site: SITE, category, decision: BASE }).description).toBe(
      "Reusable controls.",
    );
    expect(
      buildCategoryMetadata({
        site: SITE,
        category: { ...category, description: null },
        decision: BASE,
      }).description,
    ).toBe(`Browse Power Apps Components on ${SITE_NAME}.`);
  });

  it("titles the page '<name> | <site>'", () => {
    expect(buildCategoryMetadata({ site: SITE, category, decision: BASE }).title).toBe(
      `Power Apps Components | ${SITE_NAME}`,
    );
  });
});

describe("buildProductMetadata", () => {
  it("is indexable with an absolute self-canonical and the product's own summary", () => {
    const metadata = buildProductMetadata({ site: SITE, product });
    expect(metadata.title).toBe(`Sample Component | ${SITE_NAME}`);
    expect(metadata.description).toBe("A reusable form control.");
    expect(metadata.robots).toEqual({ index: true, follow: true });
    expect(canonicalOf(metadata)).toBe("https://example.com/products/sample-component");
    expect(metadata.openGraph).toMatchObject({
      url: "https://example.com/products/sample-component",
    });
  });

  it("removes control, zero-width and bidirectional-override characters from creator text", () => {
    const zeroWidth = String.fromCharCode(0x200b);
    const override = String.fromCharCode(0x202e);
    const metadata = buildProductMetadata({
      site: SITE,
      product: { slug: "x", name: `Evil${override}Name`, summary: `Summary${zeroWidth} text` },
    });
    expect(metadata.title).toBe(`EvilName | ${SITE_NAME}`);
    expect(metadata.description).toBe("Summary text");
  });
});

describe("when the site origin is unavailable (production misconfiguration)", () => {
  it("omits every canonical and og:url instead of guessing, but keeps the rest", () => {
    for (const metadata of [
      buildHomeMetadata(NO_SITE),
      buildCategoryMetadata({ site: NO_SITE, category, decision: BASE }),
      buildProductMetadata({ site: NO_SITE, product }),
    ]) {
      expect(metadata.alternates).toBeUndefined();
      expect((metadata.openGraph as { url?: string }).url).toBeUndefined();
      expect(metadata.title).toBeTruthy();
      expect(metadata.description).toBeTruthy();
    }
  });
});

describe("social preview (SEO story: generated share images)", () => {
  const imageOf = (metadata: Metadata) =>
    (metadata.openGraph as { images?: Array<Record<string, unknown>> }).images;

  it("gives every indexable page an absolute 1200x630 share image and a large Twitter card", () => {
    const cases: Array<[Metadata, string]> = [
      [buildHomeMetadata(SITE), "https://example.com/og"],
      [buildCategoryMetadata({ site: SITE, category, decision: BASE }), "https://example.com/og"],
      [
        buildProductMetadata({ site: SITE, product }),
        "https://example.com/og/products/sample-component",
      ],
      [
        buildLearnMetadata({ site: SITE, article: { slug: "a b", title: "T", excerpt: null } }),
        "https://example.com/og/learn/a%20b",
      ],
      [buildLearnIndexMetadata({ site: SITE, hasArticles: true }), "https://example.com/og"],
    ];
    for (const [metadata, url] of cases) {
      expect(imageOf(metadata)).toEqual([
        expect.objectContaining({ url, width: 1200, height: 630 }),
      ]);
      expect(metadata.twitter).toMatchObject({ card: "summary_large_image", images: [url] });
    }
  });

  it("omits the image when the origin is unavailable, rather than a relative URL", () => {
    for (const metadata of [
      buildHomeMetadata(NO_SITE),
      buildProductMetadata({ site: NO_SITE, product }),
      buildLearnIndexMetadata({ site: NO_SITE, hasArticles: true }),
    ]) {
      expect(imageOf(metadata)).toBeUndefined();
      expect((metadata.twitter as { images?: unknown }).images).toBeUndefined();
      expect((metadata.twitter as { card?: string }).card).toBe("summary");
    }
  });
});

describe("buildLearnMetadata", () => {
  it("shares a published guide as an article, with its dates (MVP-046)", () => {
    const metadata = buildLearnMetadata({
      site: SITE,
      article: {
        slug: "intro",
        title: "Intro",
        excerpt: null,
        publishedAt: new Date("2026-10-06T10:00:00Z"),
        updatedAt: new Date("2026-10-07T09:30:00Z"),
      },
    });
    expect(metadata.openGraph).toMatchObject({
      type: "article",
      publishedTime: "2026-10-06T10:00:00.000Z",
      modifiedTime: "2026-10-07T09:30:00.000Z",
    });
    expect(buildHomeMetadata(SITE).openGraph).toMatchObject({ type: "website" });
  });

  it("is indexable with a self-canonical and the excerpt as description", () => {
    const metadata = buildLearnMetadata({
      site: SITE,
      article: { slug: "intro", title: "Intro", excerpt: "Start here." },
    });
    expect(metadata.title).toBe(`Intro | ${SITE_NAME}`);
    expect(metadata.description).toBe("Start here.");
    expect(metadata.robots).toEqual({ index: true, follow: true });
    expect(canonicalOf(metadata)).toBe("https://example.com/guides/intro");
  });
});

describe("buildLearnIndexMetadata", () => {
  it("is indexable once it lists an article, and noindex-follow while empty", () => {
    const populated = buildLearnIndexMetadata({ site: SITE, hasArticles: true });
    expect(populated.robots).toEqual({ index: true, follow: true });
    expect(canonicalOf(populated)).toBe("https://example.com/guides");
    expect(populated.title).toBe(`Power Platform guides | ${SITE_NAME}`);
    expect(buildLearnIndexMetadata({ site: SITE, hasArticles: false }).robots).toEqual({
      index: false,
      follow: true,
    });
  });
});

describe("buildNotFoundMetadata", () => {
  it("is noindex, nofollow", () => {
    expect(buildNotFoundMetadata("Product not found")).toEqual({
      title: "Product not found",
      robots: { index: false, follow: false },
    });
  });
});

describe("toMetaDescription", () => {
  it("returns short text unchanged and falls back for blank text", () => {
    expect(toMetaDescription("Short.", "fallback")).toBe("Short.");
    expect(toMetaDescription("   ", "fallback")).toBe("fallback");
    expect(toMetaDescription(null, "fallback")).toBe("fallback");
  });

  it("trims long text to the cap at a word boundary with an ellipsis", () => {
    const result = toMetaDescription("word ".repeat(200), "fallback");
    expect(result.length).toBeLessThanOrEqual(MAX_META_DESCRIPTION_LENGTH);
    expect(result.endsWith("word…")).toBe(true);
  });

  it("never splits a surrogate pair at the cut point", () => {
    const emoji = String.fromCodePoint(0x1f600);
    const text = "a".repeat(MAX_META_DESCRIPTION_LENGTH - 2) + emoji + "tail";
    const result = toMetaDescription(text, "fallback");

    for (let i = 0; i < result.length; i += 1) {
      const code = result.charCodeAt(i);
      if (code >= 0xd800 && code <= 0xdbff) {
        const next = result.charCodeAt(i + 1);
        expect(next >= 0xdc00 && next <= 0xdfff, "lone high surrogate").toBe(true);
        i += 1;
      } else {
        expect(code >= 0xdc00 && code <= 0xdfff, "lone low surrogate").toBe(false);
      }
    }
  });
});
