import { indexNowKey } from "../../lib/indexnow";

// Reads the environment per request, so a changed key needs no rebuild.
export const dynamic = "force-dynamic";

/**
 * GET /indexnow-key.txt: the IndexNow key, as UTF-8 text (MVP-046). Search
 * engines fetch it to check that our announcements are really from us. With
 * no key configured it is a 404 and nothing is ever announced.
 */
export function GET(): Response {
  const key = indexNowKey();
  if (!key) return new Response("Not found", { status: 404 });
  return new Response(key, {
    status: 200,
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
