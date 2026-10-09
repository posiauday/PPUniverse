import { normalizeDisplayText } from "@ppu/domain-catalog";
import type { JsonLdObject, JsonLdValue } from "@ppu/ui";
import { homeUrl } from "./canonical";
import { SITE_DESCRIPTION, SITE_NAME } from "./site";

/**
 * schema.org structured-data builders (MVP-021, FR-017). Each returns a typed
 * object that `@ppu/ui`'s `JsonLd` component serializes safely; nothing here
 * ever builds markup or concatenates text into a script.
 *
 * Rules (docs/final-decisions.md, 2026-09-21, Q31):
 * - Only fields backed by real PUBLISHED data. A property whose value is
 *   missing is OMITTED entirely — never an empty string, null, empty object or
 *   placeholder.
 * - Product JSON-LD is emitted WITHOUT Offer data. `offers`, `price`,
 *   `priceCurrency`, `availability`, `aggregateRating`, reviews, `seller`,
 *   `brand`, creator identity, images, certification/endorsement and
 *   compatibility claims must NOT be added until the corresponding data is
 *   modeled, approved and implemented (pricing, currency, tax and checkout for
 *   Offer data; an approved public image for `image`).
 * - NO rich-result eligibility claim is made. Google's Product snippet
 *   documentation requires `name` plus one of review, aggregateRating or offers,
 *   so this markup is expected to be schema.org-valid but not eligible.
 */

const SCHEMA_CONTEXT = "https://schema.org";

/** Home page. `name` is the approved product name (open question 1 narrowed to trademark clearance). */
export function buildWebSiteJsonLd(origin: string): JsonLdObject {
  return {
    "@context": SCHEMA_CONTEXT,
    "@type": "WebSite",
    name: SITE_NAME,
    url: homeUrl(origin),
  };
}

/**
 * Home page (MVP-046): LowCodeStacks as an organisation, so search engines and
 * AI tools can tell the brand from the generic phrase "low code stack". Google
 * reads Organization markup on the home page; its logo must be at least
 * 112 x 112 px (public/brand/logo-512.png, the header's mark). No `sameAs`
 * until the product owner names official profiles.
 */
export function buildOrganizationJsonLd(origin: string): JsonLdObject {
  return {
    "@context": SCHEMA_CONTEXT,
    "@type": "Organization",
    name: SITE_NAME,
    url: homeUrl(origin),
    logo: `${origin}/brand/logo-512.png`,
    description: SITE_DESCRIPTION,
  };
}

/** Indexable category listing page. Returns null if there is no usable name. */
export function buildCollectionPageJsonLd(input: {
  url: string;
  name: string;
  description: string | null;
}): JsonLdObject | null {
  const name = normalizeDisplayText(input.name);
  if (!name) return null;

  const document: Record<string, JsonLdValue> = {
    "@context": SCHEMA_CONTEXT,
    "@type": "CollectionPage",
    name,
  };
  const description = normalizeDisplayText(input.description);
  if (description) document["description"] = description;
  document["url"] = input.url;
  return document;
}

export interface ProductJsonLdInput {
  /** The canonical absolute product URL. */
  url: string;
  name: string;
  summary: string | null;
  categoryName: string | null;
  /** The newest published release's version, or null when none is published. */
  currentVersion: string | null;
}

/**
 * Published product pages. The version is expressed as an `additionalProperty`
 * because `version` is not a schema.org Product property, and only when a
 * published release exists.
 */
export function buildProductJsonLd(input: ProductJsonLdInput): JsonLdObject | null {
  const name = normalizeDisplayText(input.name);
  if (!name) return null;

  const document: Record<string, JsonLdValue> = {
    "@context": SCHEMA_CONTEXT,
    "@type": "Product",
    name,
  };
  const description = normalizeDisplayText(input.summary);
  if (description) document["description"] = description;
  document["url"] = input.url;
  const category = normalizeDisplayText(input.categoryName);
  if (category) document["category"] = category;
  const version = normalizeDisplayText(input.currentVersion);
  if (version) {
    document["additionalProperty"] = [
      { "@type": "PropertyValue", name: "Version", value: version },
    ];
  }
  return document;
}

export interface ArticleJsonLdInput {
  /** The validated site origin; the brand Organization links to its home page. */
  origin: string;
  /** The canonical absolute /guides/[slug] URL. */
  url: string;
  title: string;
  excerpt: string | null;
  /** Never null in practice (only called for published Articles), but typed
   * this way so a caller cannot pass a draft's data by mistake. */
  publishedAt: Date | null;
  updatedAt: Date;
  /** The article's share image, absolute (MVP-042: rich results show an image). */
  image?: string;
}

/**
 * Published Article pages (MVP-017, FR-014). `TechArticle` fits tutorials,
 * patterns and comparison pages about Power Platform assets.
 *
 * `author` and `publisher` are the LowCodeStacks brand as an Organization
 * (docs/final-decisions.md, "Business model: free learning first; one price
 * per product; work order", decision 4) -- never the ADMIN who wrote it: no
 * personal identity is ever exposed in public structured data.
 */
export function buildArticleJsonLd(input: ArticleJsonLdInput): JsonLdObject | null {
  const headline = normalizeDisplayText(input.title);
  if (!headline || !input.publishedAt) return null;

  const document: Record<string, JsonLdValue> = {
    "@context": SCHEMA_CONTEXT,
    "@type": "TechArticle",
    headline,
  };
  const description = normalizeDisplayText(input.excerpt);
  if (description) document["description"] = description;
  document["url"] = input.url;
  if (input.image) document["image"] = input.image;
  document["datePublished"] = input.publishedAt.toISOString();
  document["dateModified"] = input.updatedAt.toISOString();
  document["author"] = buildBrandOrganization(input.origin);
  document["publisher"] = buildBrandOrganization(input.origin);
  return document;
}

/** The LowCodeStacks brand, as article author and publisher. */
export function buildBrandOrganization(origin: string): JsonLdObject {
  return { "@type": "Organization", name: SITE_NAME, url: homeUrl(origin) };
}

/**
 * Breadcrumb trail (SEO story): lets search results show
 * "LowCodeStacks > Learn > Title" instead of a raw URL. Each item is an
 * absolute canonical URL; the last one is the current page. Returns null if
 * any name is empty after normalization.
 */
export function buildBreadcrumbJsonLd(
  items: ReadonlyArray<{ name: string; url: string }>,
): JsonLdObject | null {
  const itemListElement: JsonLdValue[] = [];
  for (const [index, item] of items.entries()) {
    const name = normalizeDisplayText(item.name);
    if (!name) return null;
    itemListElement.push({ "@type": "ListItem", position: index + 1, name, item: item.url });
  }
  return { "@context": SCHEMA_CONTEXT, "@type": "BreadcrumbList", itemListElement };
}
