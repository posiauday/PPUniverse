import { contentRepository } from "../../../lib/content";
import { GUIDES_FEED_LIMIT, buildGuidesFeed } from "../../../lib/guides-feed";
import { getSiteUrl } from "../../../lib/site-url";

// Reads the database, so it renders per request (see apps/web/app/page.tsx).
export const dynamic = "force-dynamic";

/**
 * GET /guides/feed.xml: the RSS 2.0 feed of published guides (MVP-046). Like
 * /updates/feed.xml: without a valid site origin it is a 404, and a database
 * failure propagates (5xx) so a reader never reads an outage as "every guide
 * was removed".
 */
export async function GET(): Promise<Response> {
  const site = getSiteUrl();
  if (!site.ok) return new Response("Not found", { status: 404 });
  const guides = await contentRepository.listPublishedArticleSummaries({
    limit: GUIDES_FEED_LIMIT,
  });
  return new Response(buildGuidesFeed(site.origin, guides), {
    status: 200,
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
      "Cache-Control": "public, max-age=900",
    },
  });
}
