import { normalizeDisplayText } from "@ppu/domain-catalog";
import type { JsonLdObject, JsonLdValue } from "@ppu/ui";
import { homeUrl } from "./canonical";
import { SITE_NAME } from "./site";

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

/** Home page. `name` is the working site name (open question 1); no Organization/Brand. */
export function buildWebSiteJsonLd(origin: string): JsonLdObject {
  return {
    "@context": SCHEMA_CONTEXT,
    "@type": "WebSite",
    name: SITE_NAME,
    url: homeUrl(origin),
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
