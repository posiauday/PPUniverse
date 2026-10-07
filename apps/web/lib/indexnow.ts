import { logger } from "@ppu/telemetry";
import { getSiteUrl, type SiteUrlResult } from "./site-url";

/**
 * IndexNow (MVP-042 slice 5; MVP-046): tells Bing and the other IndexNow
 * search engines about a page the moment it's published, instead of waiting
 * for a crawl. Microsoft Copilot answers from Bing's index.
 *
 * Protocol (indexnow.org/documentation): the key is 8 to 128 letters, digits
 * or dashes, served as UTF-8 text from our own host. A key file at the site
 * root covers every URL on the host, so it lives at INDEXNOW_KEY_PATH and each
 * request names it as `keyLocation`. The key is public by design; it lives in
 * the INDEXNOW_KEY environment variable so each environment can have its own,
 * and with no key nothing is sent.
 */
export const INDEXNOW_KEY_PATH = "/indexnow-key.txt";
export const INDEXNOW_ENDPOINT = "https://api.indexnow.org/indexnow";
const KEY_PATTERN = /^[A-Za-z0-9-]{8,128}$/;
/** Publishing waits at most this long for IndexNow, then carries on. */
const TIMEOUT_MS = 3000;

/** The configured key, or null when it is missing or malformed. */
export function indexNowKey(
  value: string | undefined = process.env["INDEXNOW_KEY"],
): string | null {
  const key = value?.trim();
  return key && KEY_PATTERN.test(key) ? key : null;
}

/** Only a real public https site is worth announcing: never localhost or a preview without a site URL. */
function announceableOrigin(site: SiteUrlResult): string | null {
  if (!site.ok) return null;
  const url = new URL(site.origin);
  if (url.protocol !== "https:") return null;
  if (url.hostname === "localhost" || url.hostname.endsWith(".localhost")) return null;
  return site.origin;
}

export interface IndexNowRequest {
  host: string;
  key: string;
  keyLocation: string;
  urlList: string[];
}

/** The request body; URLs not on this host are dropped (IndexNow rejects them with 422). */
export function buildIndexNowRequest(
  origin: string,
  key: string,
  urls: readonly string[],
): IndexNowRequest {
  const host = new URL(origin).host;
  const urlList = [...new Set(urls)].filter((url) => {
    try {
      return new URL(url).host === host;
    } catch {
      return false;
    }
  });
  return { host, key, keyLocation: `${origin}${INDEXNOW_KEY_PATH}`, urlList };
}

export type IndexNowOutcome = "sent" | "skipped" | "failed";

/**
 * Announces `urls`. Never throws and never takes longer than TIMEOUT_MS:
 * publishing must not fail or hang because a search engine is slow. The
 * outcome is logged (URLs only: no personal data is involved).
 */
export async function notifyIndexNow(
  urls: readonly string[],
  deps: {
    site?: SiteUrlResult;
    key?: string | null;
    fetchImpl?: typeof fetch;
  } = {},
): Promise<IndexNowOutcome> {
  const origin = announceableOrigin(deps.site ?? getSiteUrl());
  const key = deps.key === undefined ? indexNowKey() : deps.key;
  if (!origin || !key) return "skipped";
  const body = buildIndexNowRequest(origin, key, urls);
  if (body.urlList.length === 0) return "skipped";
  try {
    const response = await (deps.fetchImpl ?? fetch)(INDEXNOW_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json; charset=utf-8" },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    // 200 is accepted; 202 is accepted while the key is being checked.
    const ok = response.status === 200 || response.status === 202;
    (ok ? logger.info : logger.warn)("seo.indexnow", {
      status: response.status,
      urlCount: body.urlList.length,
    });
    return ok ? "sent" : "failed";
  } catch (error) {
    logger.warn("seo.indexnow", {
      status: "error",
      reason: error instanceof Error ? error.name : "unknown",
    });
    return "failed";
  }
}
