import { technologyInfo, type PublishedUpdate } from "@ppu/domain-content";
import { SITE_NAME } from "./seo/site";

/** The feed's path, linked from /updates and its <head>. */
export const UPDATES_FEED_PATH = "/updates/feed.xml";

/** How many of the newest published updates the feed carries. */
export const FEED_ITEM_LIMIT = 30;

export const UPDATES_FEED_TITLE = `${SITE_NAME}: Power Platform updates`;

function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

/**
 * The RSS 2.0 feed of published platform updates (MVP-033; open question 66:
 * RSS, not email, so the feed collects no personal data). Each item links to
 * its entry on /updates; the summary is our own text, and the source link is
 * Microsoft's announcement. Google also accepts an RSS 2.0 feed as a sitemap
 * for recent URLs.
 */
export function buildUpdatesFeed(origin: string, updates: readonly PublishedUpdate[]): string {
  const pageUrl = `${origin}/updates`;
  const items = updates.map((update) => {
    const link = `${pageUrl}#${encodeURIComponent(update.slug)}`;
    const technology = update.technology ? technologyInfo(update.technology).name : undefined;
    const description = `${update.summary} Source: ${update.sourceUrl}`;
    return [
      "    <item>",
      `      <title>${escapeXml(update.title)}</title>`,
      `      <link>${escapeXml(link)}</link>`,
      `      <guid isPermaLink="true">${escapeXml(link)}</guid>`,
      `      <pubDate>${update.publishedAt.toUTCString()}</pubDate>`,
      ...(technology ? [`      <category>${escapeXml(technology)}</category>`] : []),
      `      <description>${escapeXml(description)}</description>`,
      "    </item>",
    ].join("\n");
  });
  const lastBuild = updates[0]?.publishedAt.toUTCString();
  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">',
    "  <channel>",
    `    <title>${escapeXml(UPDATES_FEED_TITLE)}</title>`,
    `    <link>${escapeXml(pageUrl)}</link>`,
    `    <atom:link href="${escapeXml(origin + UPDATES_FEED_PATH)}" rel="self" type="application/rss+xml"/>`,
    "    <description>What changed in Power Platform and whether you need to act, linked to Microsoft's announcements.</description>",
    "    <language>en</language>",
    ...(lastBuild ? [`    <lastBuildDate>${lastBuild}</lastBuildDate>`] : []),
    ...items,
    "  </channel>",
    "</rss>",
    "",
  ].join("\n");
}
