import type { Metadata } from "next";
import { describe, expect, it } from "vitest";
import type { SiteUrlResult } from "../site-url.js";
import type { CategoryIndexingDecision } from "./category-indexing.js";
import {
  buildCategoryMetadata,
  buildHomeMetadata,
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
    expect(metadata.twitter).toMatchObject({ card: "summary", title: SITE_NAME });
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

describe("social preview", () => {
  it("never emits an image — no approved public media exists", () => {
    for (const metadata of [
      buildHomeMetadata(SITE),
      buildCategoryMetadata({ site: SITE, category, decision: BASE }),
      buildProductMetadata({ site: SITE, product }),
    ]) {
      expect((metadata.openGraph as { images?: unknown }).images).toBeUndefined();
      expect((metadata.twitter as { images?: unknown }).images).toBeUndefined();
      expect((metadata.twitter as { card?: string }).card).toBe("summary");
    }
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
