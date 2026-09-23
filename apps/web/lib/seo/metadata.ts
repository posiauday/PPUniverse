import { normalizeDisplayText } from "@ppu/domain-catalog";
import type { Metadata } from "next";
import type { SiteUrlResult } from "../site-url";
import { categoryUrl, homeUrl, learnUrl, productUrl } from "./canonical";
import type { CategoryIndexingDecision } from "./category-indexing";
import {
  MAX_META_DESCRIPTION_LENGTH,
  OPEN_GRAPH_LOCALE,
  SITE_DESCRIPTION,
  SITE_NAME,
} from "./site";

/**
 * Page metadata builders (MVP-021, FR-017). Pure functions: given the validated
 * site origin and server data, return the Next.js Metadata for a page.
 *
 * Posture: deny by default. The root layout is `noindex, nofollow`; only the
 * home page, indexable category pages and published product pages opt in.
 *
 * When the site origin is unavailable (production misconfiguration) the
 * canonical and `og:url` are omitted rather than guessed — fail safe.
 *
 * There is deliberately no `og:image` / Twitter image: no approved public media
 * exists yet (screenshots are a proposed future story), and a relative image URL
 * would resolve against localhost when no metadataBase is set.
 *
 * Creator-supplied text (names, summaries) is normalized (control, zero-width
 * and bidirectional-override characters removed); Next.js escapes the values
 * when it renders the tags.
 */

export interface RobotsDirective {
  index: boolean;
  follow: boolean;
}

export const INDEXABLE_ROBOTS: RobotsDirective = { index: true, follow: true };
export const NOINDEX_FOLLOW_ROBOTS: RobotsDirective = { index: false, follow: true };
/** The root-layout default, and the directive for pages that must never be indexed. */
export const NOINDEX_ROBOTS: RobotsDirective = { index: false, follow: false };

const ELLIPSIS = "…";

/** Cleans creator text for a meta description and trims it to the length cap without splitting a word or a surrogate pair. */
export function toMetaDescription(text: string | null | undefined, fallback: string): string {
  const cleaned = normalizeDisplayText(text) ?? fallback;
  if (cleaned.length <= MAX_META_DESCRIPTION_LENGTH) return cleaned;

  let cut = cleaned.slice(0, MAX_META_DESCRIPTION_LENGTH - 1);
  const last = cut.charCodeAt(cut.length - 1);
  if (last >= 0xd800 && last <= 0xdbff) cut = cut.slice(0, -1);

  const atWordBoundary = cut.replace(/\s+\S*$/, "");
  const kept = atWordBoundary.length >= MAX_META_DESCRIPTION_LENGTH / 2 ? atWordBoundary : cut;
  return `${kept.trimEnd()}${ELLIPSIS}`;
}

interface PageSeo {
  title: string;
  socialTitle: string;
  description: string;
  url: string | undefined;
  robots: RobotsDirective;
}

function composeMetadata(seo: PageSeo): Metadata {
  return {
    title: seo.title,
    description: seo.description,
    robots: seo.robots,
    ...(seo.url ? { alternates: { canonical: seo.url } } : {}),
    openGraph: {
      type: "website",
      siteName: SITE_NAME,
      locale: OPEN_GRAPH_LOCALE,
      title: seo.socialTitle,
      description: seo.description,
      ...(seo.url ? { url: seo.url } : {}),
    },
    twitter: { card: "summary", title: seo.socialTitle, description: seo.description },
  };
}

export function buildHomeMetadata(site: SiteUrlResult): Metadata {
  return composeMetadata({
    title: SITE_NAME,
    socialTitle: SITE_NAME,
    description: SITE_DESCRIPTION,
    url: site.ok ? homeUrl(site.origin) : undefined,
    robots: INDEXABLE_ROBOTS,
  });
}

export function buildCategoryMetadata(input: {
  site: SiteUrlResult;
  category: { slug: string; name: string; description: string | null };
  decision: CategoryIndexingDecision;
}): Metadata {
  const { site, category, decision } = input;
  const name = normalizeDisplayText(category.name) ?? SITE_NAME;
  return composeMetadata({
    title: `${name} | ${SITE_NAME}`,
    socialTitle: name,
    description: toMetaDescription(category.description, `Browse ${name} on ${SITE_NAME}.`),
    url: site.ok ? categoryUrl(site.origin, category.slug, decision.canonicalPage) : undefined,
    robots: decision.index ? INDEXABLE_ROBOTS : NOINDEX_FOLLOW_ROBOTS,
  });
}

export function buildProductMetadata(input: {
  site: SiteUrlResult;
  product: { slug: string; name: string; summary: string };
}): Metadata {
  const { site, product } = input;
  const name = normalizeDisplayText(product.name) ?? SITE_NAME;
  return composeMetadata({
    title: `${name} | ${SITE_NAME}`,
    socialTitle: name,
    description: toMetaDescription(product.summary, `${name} on ${SITE_NAME}.`),
    url: site.ok ? productUrl(site.origin, product.slug) : undefined,
    robots: INDEXABLE_ROBOTS,
  });
}

/** MVP-017, FR-014: published Article pages (tutorials, patterns, comparison
 * pages), indexable like published products. `excerpt` is the meta
 * description source; falls back the same way buildProductMetadata does. */
export function buildLearnMetadata(input: {
  site: SiteUrlResult;
  article: { slug: string; title: string; excerpt: string | null };
}): Metadata {
  const { site, article } = input;
  const title = normalizeDisplayText(article.title) ?? SITE_NAME;
  return composeMetadata({
    title: `${title} | ${SITE_NAME}`,
    socialTitle: title,
    description: toMetaDescription(article.excerpt, `${title} on ${SITE_NAME}.`),
    url: site.ok ? learnUrl(site.origin, article.slug) : undefined,
    robots: INDEXABLE_ROBOTS,
  });
}

/** For unknown or unpublished slugs: the response is a 404, and the metadata says noindex too. */
export function buildNotFoundMetadata(title: string): Metadata {
  return { title, robots: NOINDEX_ROBOTS };
}
