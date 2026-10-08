import { serializeJsonLd, type JsonLdObject } from "@ppu/ui";
import { describe, expect, it } from "vitest";
import {
  buildArticleJsonLd,
  buildBreadcrumbJsonLd,
  buildCollectionPageJsonLd,
  buildProductJsonLd,
  buildOrganizationJsonLd,
  buildWebSiteJsonLd,
  type ProductJsonLdInput,
} from "./json-ld.js";
import { SITE_DESCRIPTION, SITE_NAME } from "./site.js";

const PRODUCT: ProductJsonLdInput = {
  url: "https://example.com/products/sample-component",
  name: "Sample Component",
  summary: "A reusable form control.",
  categoryName: "Power Apps Components",
  currentVersion: "1.2.0",
};

/** Properties that must never appear in Product JSON-LD until the data is modeled and approved. */
const FORBIDDEN_KEYS = [
  "offers",
  "price",
  "priceCurrency",
  "availability",
  "aggregateRating",
  "review",
  "reviews",
  "seller",
  "brand",
  "image",
  "author",
  "creator",
  "manufacturer",
  "sku",
  "gtin",
  "mpn",
];

const ALLOWED_PRODUCT_KEYS = [
  "@context",
  "@type",
  "name",
  "description",
  "url",
  "category",
  "additionalProperty",
];

function collectKeys(value: unknown, keys: string[] = []): string[] {
  if (Array.isArray(value)) {
    for (const item of value) collectKeys(item, keys);
  } else if (value !== null && typeof value === "object") {
    for (const [key, child] of Object.entries(value)) {
      keys.push(key);
      collectKeys(child, keys);
    }
  }
  return keys;
}

/** True when any value anywhere is an empty placeholder: "", null, undefined, {}, or []. */
function hasEmptyPlaceholder(value: unknown): boolean {
  if (value === null || value === undefined || value === "") return true;
  if (Array.isArray(value)) return value.length === 0 || value.some(hasEmptyPlaceholder);
  if (typeof value === "object") {
    const entries = Object.values(value as Record<string, unknown>);
    return entries.length === 0 || entries.some(hasEmptyPlaceholder);
  }
  return false;
}

describe("buildProductJsonLd", () => {
  it("emits exactly the approved fields for a fully populated published product", () => {
    expect(buildProductJsonLd(PRODUCT)).toEqual({
      "@context": "https://schema.org",
      "@type": "Product",
      name: "Sample Component",
      description: "A reusable form control.",
      url: "https://example.com/products/sample-component",
      category: "Power Apps Components",
      additionalProperty: [{ "@type": "PropertyValue", name: "Version", value: "1.2.0" }],
    });
  });

  it("only ever uses keys from the approved allow-list", () => {
    const keys = collectKeys(buildProductJsonLd(PRODUCT));
    const topLevel = Object.keys(buildProductJsonLd(PRODUCT) ?? {});
    expect(topLevel.every((key) => ALLOWED_PRODUCT_KEYS.includes(key))).toBe(true);
    expect(
      keys.filter(
        (key) => !["@type", "name", "value"].includes(key) && !ALLOWED_PRODUCT_KEYS.includes(key),
      ),
    ).toEqual([]);
  });

  it("never includes offers, price, availability, ratings, reviews, seller, brand, image or creator identity", () => {
    const keys = collectKeys(buildProductJsonLd(PRODUCT));
    for (const forbidden of FORBIDDEN_KEYS) {
      expect(keys, forbidden).not.toContain(forbidden);
    }
  });

  it("makes no certification, endorsement, Microsoft or verification claim", () => {
    const text = JSON.stringify(buildProductJsonLd(PRODUCT));
    expect(text).not.toMatch(
      /microsoft|certified|approved|endorse|officially supported|marketplace verified/i,
    );
  });

  it("omits unavailable properties entirely — no empty strings, nulls, objects or arrays", () => {
    const sparse = buildProductJsonLd({
      ...PRODUCT,
      summary: null,
      categoryName: "   ",
      currentVersion: null,
    });
    expect(sparse).toEqual({
      "@context": "https://schema.org",
      "@type": "Product",
      name: "Sample Component",
      url: "https://example.com/products/sample-component",
    });
    expect(hasEmptyPlaceholder(sparse)).toBe(false);
    expect(hasEmptyPlaceholder(buildProductJsonLd(PRODUCT))).toBe(false);
  });

  it("omits the version property when there is no published release", () => {
    expect(collectKeys(buildProductJsonLd({ ...PRODUCT, currentVersion: null }))).not.toContain(
      "additionalProperty",
    );
  });

  it("returns null rather than an object without a usable name", () => {
    expect(buildProductJsonLd({ ...PRODUCT, name: "   " })).toBeNull();
  });

  it("removes control, zero-width and bidirectional-override characters from creator text", () => {
    const zeroWidth = String.fromCharCode(0x200b);
    const override = String.fromCharCode(0x202e);
    const result = buildProductJsonLd({
      ...PRODUCT,
      name: `Evil${override}Name`,
      summary: `Sum${zeroWidth}mary`,
    });
    expect(result).toMatchObject({ name: "EvilName", description: "Summary" });
  });

  describe("injection safety through the real builder and serializer", () => {
    const hostile: ProductJsonLdInput = {
      url: "https://example.com/products/x",
      name: "</script><script>alert(1)</script>",
      summary: "<img src=x onerror=alert(1)><!-- <script>",
      categoryName: "</SCRIPT>",
      currentVersion: "<1.0>",
    };

    it("keeps hostile creator text as inert JSON string values", () => {
      const document = buildProductJsonLd(hostile) as JsonLdObject;
      const serialized = serializeJsonLd(document);

      expect(serialized).not.toMatch(/[<>&]/);
      expect(JSON.parse(serialized)).toEqual(document);
      expect(JSON.parse(serialized).name).toBe("</script><script>alert(1)</script>");
    });
  });
});

describe("buildWebSiteJsonLd", () => {
  it("emits only the site name and home URL", () => {
    expect(buildWebSiteJsonLd("https://example.com")).toEqual({
      "@context": "https://schema.org",
      "@type": "WebSite",
      name: SITE_NAME,
      url: "https://example.com/",
    });
  });

  it("has no search action, organization, brand or publisher", () => {
    const keys = collectKeys(buildWebSiteJsonLd("https://example.com"));
    for (const key of ["potentialAction", "publisher", "brand", "author", "creator", "sameAs"]) {
      expect(keys).not.toContain(key);
    }
  });
});

describe("buildOrganizationJsonLd (MVP-046)", () => {
  it("names the brand with its home page, logo and description", () => {
    expect(buildOrganizationJsonLd("https://example.com")).toEqual({
      "@context": "https://schema.org",
      "@type": "Organization",
      name: SITE_NAME,
      url: "https://example.com/",
      logo: "https://example.com/brand/logo-512.png",
      description: SITE_DESCRIPTION,
    });
  });
});

describe("buildCollectionPageJsonLd", () => {
  it("emits name, description and url", () => {
    expect(
      buildCollectionPageJsonLd({
        url: "https://example.com/categories/c",
        name: "Power Apps Components",
        description: "Reusable controls.",
      }),
    ).toEqual({
      "@context": "https://schema.org",
      "@type": "CollectionPage",
      name: "Power Apps Components",
      description: "Reusable controls.",
      url: "https://example.com/categories/c",
    });
  });

  it("omits an absent description and returns null without a name", () => {
    const withoutDescription = buildCollectionPageJsonLd({
      url: "https://example.com/categories/c",
      name: "C",
      description: null,
    });
    expect(collectKeys(withoutDescription)).not.toContain("description");
    expect(hasEmptyPlaceholder(withoutDescription)).toBe(false);
    expect(
      buildCollectionPageJsonLd({
        url: "https://example.com/categories/c",
        name: " ",
        description: null,
      }),
    ).toBeNull();
  });
});

describe("buildArticleJsonLd (SEO story)", () => {
  const input = {
    origin: "https://example.com",
    url: "https://example.com/learn/intro",
    title: "Intro",
    excerpt: "Start here.",
    publishedAt: new Date("2026-09-01T00:00:00.000Z"),
    updatedAt: new Date("2026-09-20T00:00:00.000Z"),
  };
  const brand = { "@type": "Organization", name: SITE_NAME, url: "https://example.com/" };

  it("carries the share image when one is given (MVP-042)", () => {
    const image = "https://example.com/og/learn/intro";
    expect(buildArticleJsonLd({ ...input, image })).toMatchObject({ image });
    expect(buildArticleJsonLd(input)).not.toHaveProperty("image");
  });

  it("emits TechArticle with dates and the brand as author and publisher", () => {
    expect(buildArticleJsonLd(input)).toEqual({
      "@context": "https://schema.org",
      "@type": "TechArticle",
      headline: "Intro",
      description: "Start here.",
      url: "https://example.com/learn/intro",
      datePublished: "2026-09-01T00:00:00.000Z",
      dateModified: "2026-09-20T00:00:00.000Z",
      author: brand,
      publisher: brand,
    });
  });

  it("never names a person, and returns null for an unpublished or untitled article", () => {
    const keys = collectKeys(buildArticleJsonLd(input) as JsonLdObject);
    expect(keys).not.toContain("givenName");
    expect(JSON.stringify(buildArticleJsonLd(input))).not.toContain('"Person"');
    expect(buildArticleJsonLd({ ...input, publishedAt: null })).toBeNull();
    expect(buildArticleJsonLd({ ...input, title: "  " })).toBeNull();
  });
});

describe("buildBreadcrumbJsonLd (SEO story)", () => {
  it("numbers items from 1 with absolute URLs", () => {
    expect(
      buildBreadcrumbJsonLd([
        { name: SITE_NAME, url: "https://example.com/" },
        { name: "Learn", url: "https://example.com/learn" },
      ]),
    ).toEqual({
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: SITE_NAME, item: "https://example.com/" },
        { "@type": "ListItem", position: 2, name: "Learn", item: "https://example.com/learn" },
      ],
    });
  });

  it("returns null rather than an item with an empty name", () => {
    expect(buildBreadcrumbJsonLd([{ name: " ", url: "https://example.com/" }])).toBeNull();
  });
});
