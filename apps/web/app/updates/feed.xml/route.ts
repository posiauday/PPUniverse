import { getSiteUrl } from "../../../lib/site-url";
import { FEED_ITEM_LIMIT, buildUpdatesFeed } from "../../../lib/updates-feed";
import { updateRepository } from "../../../lib/updates";

// Reads the database, so it renders per request (see apps/web/app/page.tsx).
export const dynamic = "force-dynamic";

/**
 * GET /updates/feed.xml: the RSS 2.0 feed of published platform updates
 * (MVP-033, open question 66). Without a valid site origin there are no
 * absolute links to give, so it is a 404 rather than a feed of guessed URLs.
 * A database failure propagates (5xx), as for the sitemap, so a feed reader
 * never reads an outage as "every item was removed".
 */
export async function GET(): Promise<Response> {
  const site = getSiteUrl();
  if (!site.ok) return new Response("Not found", { status: 404 });
  const updates = await updateRepository.listPublishedUpdates({ limit: FEED_ITEM_LIMIT });
  return new Response(buildUpdatesFeed(site.origin, updates), {
    status: 200,
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
      "Cache-Control": "public, max-age=900",
    },
  });
}
