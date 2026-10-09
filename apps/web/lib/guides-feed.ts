import { technologyInfo, type ArticleSummary } from "@ppu/domain-content";
import type { Metadata } from "next";
import { ARTICLE_KIND } from "./article-types";
import { learnUrl } from "./seo/canonical";
import { SITE_NAME } from "./seo/site";
import type { SiteUrlResult } from "./site-url";
import { escapeXml } from "./xml";

/** The guides feed's path, linked from the home page and /guides in <head>. */
export const GUIDES_FEED_PATH = "/guides/feed.xml";

/** How many of the newest published guides the feed carries. */
export const GUIDES_FEED_LIMIT = 50;

export const GUIDES_FEED_TITLE = `${SITE_NAME}: Power Platform guides`;

/**
 * The RSS 2.0 feed of published guides (MVP-046, AI search readiness), like
 * the updates feed (lib/updates-feed.ts): newest first, each item linking to
 * its guide, with the guide's own excerpt. Feed readers and search engines
 * learn about new guides from it; Google also accepts an RSS 2.0 feed as a
 * sitemap for recent URLs. No personal data: nothing about the author.
 */
export function buildGuidesFeed(origin: string, guides: readonly ArticleSummary[]): string {
  const hubUrl = `${origin}/guides`;
  const items = guides.map((guide) => {
    const link = learnUrl(origin, guide.slug);
    const categories = [
      ...(guide.technology ? [technologyInfo(guide.technology).name] : []),
      ARTICLE_KIND[guide.type].label,
    ];
    return [
      "    <item>",
      `      <title>${escapeXml(guide.title)}</title>`,
      `      <link>${escapeXml(link)}</link>`,
      `      <guid isPermaLink="true">${escapeXml(link)}</guid>`,
      `      <pubDate>${guide.publishedAt.toUTCString()}</pubDate>`,
      ...categories.map((name) => `      <category>${escapeXml(name)}</category>`),
      ...(guide.excerpt ? [`      <description>${escapeXml(guide.excerpt)}</description>`] : []),
      "    </item>",
    ].join("\n");
  });
  const lastBuild = guides[0]?.publishedAt.toUTCString();
  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">',
    "  <channel>",
    `    <title>${escapeXml(GUIDES_FEED_TITLE)}</title>`,
    `    <link>${escapeXml(hubUrl)}</link>`,
    `    <atom:link href="${escapeXml(origin + GUIDES_FEED_PATH)}" rel="self" type="application/rss+xml"/>`,
    "    <description>Free, independent guides to fixing, choosing and designing with Power Platform.</description>",
    "    <language>en</language>",
    ...(lastBuild ? [`    <lastBuildDate>${lastBuild}</lastBuildDate>`] : []),
    ...items,
    "  </channel>",
    "</rss>",
    "",
  ].join("\n");
}

/** Adds the guides feed to a page's <head>, for feed readers that discover it there. */
export function withGuidesFeed(metadata: Metadata, site: SiteUrlResult): Metadata {
  if (!site.ok) return metadata;
  return {
    ...metadata,
    alternates: {
      ...metadata.alternates,
      types: {
        "application/rss+xml": [
          { url: `${site.origin}${GUIDES_FEED_PATH}`, title: GUIDES_FEED_TITLE },
        ],
      },
    },
  };
}
