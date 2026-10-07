import { normalizeDisplayText } from "@ppu/domain-catalog";
import type { Metadata } from "next";
import type { SiteUrlResult } from "../site-url";
import {
  categoryUrl,
  homeUrl,
  infoPageUrl,
  type InfoPagePath,
  learnIndexUrl,
  learnShareImageUrl,
  learnUrl,
  productShareImageUrl,
  productUrl,
  siteShareImageUrl,
  technologySectionUrl,
} from "./canonical";
import type { CategoryIndexingDecision } from "./category-indexing";
import { SHARE_IMAGE_SIZE } from "./share-image-size";
import {
  MAX_META_DESCRIPTION_LENGTH,
  OPEN_GRAPH_LOCALE,
  LEARN_INDEX_DESCRIPTION,
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
 * Share images (SEO story): every indexable page carries a generated
 * `og:image` / Twitter large card (lib/seo/share-image.tsx), as an ABSOLUTE
 * URL built from the validated origin. When the origin is unavailable the
 * image is omitted along with the canonical: a relative image URL would
 * resolve against localhost, since no metadataBase is set.
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
  /** Absolute share-image URL; only ever set when the origin is valid. */
  image: string | undefined;
  /** A published guide (MVP-046): shared as an article, with its dates. */
  article?: { publishedTime: string; modifiedTime: string };
}

function composeMetadata(seo: PageSeo): Metadata {
  return {
    title: seo.title,
    description: seo.description,
    robots: seo.robots,
    ...(seo.url ? { alternates: { canonical: seo.url } } : {}),
    openGraph: {
      ...(seo.article
        ? {
            type: "article",
            publishedTime: seo.article.publishedTime,
            modifiedTime: seo.article.modifiedTime,
          }
        : { type: "website" }),
      siteName: SITE_NAME,
      locale: OPEN_GRAPH_LOCALE,
      title: seo.socialTitle,
      description: seo.description,
      ...(seo.url ? { url: seo.url } : {}),
      ...(seo.image
        ? { images: [{ url: seo.image, ...SHARE_IMAGE_SIZE, alt: seo.socialTitle }] }
        : {}),
    },
    twitter: seo.image
      ? {
          card: "summary_large_image",
          title: seo.socialTitle,
          description: seo.description,
          images: [seo.image],
        }
      : { card: "summary", title: seo.socialTitle, description: seo.description },
  };
}

export function buildHomeMetadata(site: SiteUrlResult): Metadata {
  return composeMetadata({
    title: SITE_NAME,
    socialTitle: SITE_NAME,
    description: SITE_DESCRIPTION,
    url: site.ok ? homeUrl(site.origin) : undefined,
    robots: INDEXABLE_ROBOTS,
    image: site.ok ? siteShareImageUrl(site.origin) : undefined,
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
    image: site.ok ? siteShareImageUrl(site.origin) : undefined,
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
    image: site.ok ? productShareImageUrl(site.origin, product.slug) : undefined,
  });
}

/** MVP-017, FR-014: published Article pages (tutorials, patterns, comparison
 * pages), indexable like published products. `excerpt` is the meta
 * description source; falls back the same way buildProductMetadata does. */
export function buildLearnMetadata(input: {
  site: SiteUrlResult;
  article: {
    slug: string;
    title: string;
    excerpt: string | null;
    /** With both dates, the guide is shared as an article (MVP-046). */
    publishedAt?: Date | null;
    updatedAt?: Date;
  };
}): Metadata {
  const { site, article } = input;
  const title = normalizeDisplayText(article.title) ?? SITE_NAME;
  return composeMetadata({
    title: `${title} | ${SITE_NAME}`,
    socialTitle: title,
    description: toMetaDescription(article.excerpt, `${title} on ${SITE_NAME}.`),
    url: site.ok ? learnUrl(site.origin, article.slug) : undefined,
    robots: INDEXABLE_ROBOTS,
    image: site.ok ? learnShareImageUrl(site.origin, article.slug) : undefined,
    ...(article.publishedAt && article.updatedAt
      ? {
          article: {
            publishedTime: article.publishedAt.toISOString(),
            modifiedTime: article.updatedAt.toISOString(),
          },
        }
      : {}),
  });
}

/** The /learn hub (SEO story). Indexable once it lists at least one article;
 * an empty hub is thin content, so it stays noindex (links still followed)
 * until the first article is published. */
export function buildLearnIndexMetadata(input: {
  site: SiteUrlResult;
  hasArticles: boolean;
}): Metadata {
  const { site, hasArticles } = input;
  return composeMetadata({
    title: `Learn Power Platform | ${SITE_NAME}`,
    socialTitle: "Learn Power Platform",
    description: LEARN_INDEX_DESCRIPTION,
    url: site.ok ? learnIndexUrl(site.origin) : undefined,
    robots: hasArticles ? INDEXABLE_ROBOTS : NOINDEX_FOLLOW_ROBOTS,
    image: site.ok ? siteShareImageUrl(site.origin) : undefined,
  });
}

/**
 * A technology section tab (MVP-028). Indexable only when the tab has
 * content: an empty "coming soon" tab is thin content, so it stays
 * noindex (links still followed) until something is published there -- the
 * same rule as the /learn hub and empty category pages.
 */
export function buildTechnologySectionMetadata(input: {
  site: SiteUrlResult;
  path: string;
  title: string;
  description: string;
  hasContent: boolean;
}): Metadata {
  const { site, path, title, description, hasContent } = input;
  return composeMetadata({
    title: `${title} | ${SITE_NAME}`,
    socialTitle: title,
    description: toMetaDescription(description, `${title} on ${SITE_NAME}.`),
    url: site.ok ? technologySectionUrl(site.origin, path) : undefined,
    robots: hasContent ? INDEXABLE_ROBOTS : NOINDEX_FOLLOW_ROBOTS,
    image: site.ok ? siteShareImageUrl(site.origin) : undefined,
  });
}

/** For unknown or unpublished slugs: the response is a 404, and the metadata says noindex too. */
export function buildNotFoundMetadata(title: string): Metadata {
  return { title, robots: NOINDEX_ROBOTS };
}

/** MVP-032: About, Privacy and Terms. Always indexable: they say who runs
 * the site and how it treats people, which readers and search engines both
 * look for (Google's guidance on showing who is behind content). */
export function buildInfoPageMetadata(input: {
  site: SiteUrlResult;
  path: InfoPagePath;
  title: string;
  description: string;
}): Metadata {
  const { site, path, title, description } = input;
  return composeMetadata({
    title: `${title} | ${SITE_NAME}`,
    socialTitle: title,
    description: toMetaDescription(description, description),
    url: site.ok ? infoPageUrl(site.origin, path) : undefined,
    robots: INDEXABLE_ROBOTS,
    image: site.ok ? siteShareImageUrl(site.origin) : undefined,
  });
}
