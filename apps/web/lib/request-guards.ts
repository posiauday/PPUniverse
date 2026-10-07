import { NextResponse } from "next/server";
import { siteOrigin } from "./site-url";

/**
 * Guards shared by the public POST routes that change data: password
 * sign-in (MVP-036) and guide feedback (MVP-039, MVP-038).
 */

/** Rejects requests from other sites: the browser's Origin header must be this site's. */
export function isSameOrigin(request: Request): boolean {
  const origin = request.headers.get("origin");
  const expected = siteOrigin();
  return !!origin && !!expected && origin === expected;
}

/** The caller's address, as Netlify reports it (falls back to the first forwarded hop). */
export function clientIp(request: Request): string {
  return (
    request.headers.get("x-nf-client-connection-ip") ??
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    "unknown"
  );
}

const MAX_BODY_BYTES = 4096;

export type Fields = Record<string, string>;

/**
 * Reads a small JSON object of string fields from a same-origin POST, or
 * returns the response to send instead (403 for another origin, 400 for a bad body).
 */
export async function readFields(
  request: Request,
  names: string[],
): Promise<{ fields: Fields } | { response: NextResponse }> {
  if (!isSameOrigin(request))
    return { response: NextResponse.json({ error: "forbidden" }, { status: 403 }) };
  const text = await request.text();
  if (text.length > MAX_BODY_BYTES) return { response: badRequest() };
  let body: unknown;
  try {
    body = JSON.parse(text);
  } catch {
    return { response: badRequest() };
  }
  if (typeof body !== "object" || body === null) return { response: badRequest() };
  const fields: Fields = {};
  for (const name of names) {
    const value = (body as Record<string, unknown>)[name];
    if (typeof value !== "string") return { response: badRequest() };
    fields[name] = value;
  }
  return { fields };
}

function badRequest() {
  return NextResponse.json({ error: "bad-request" }, { status: 400 });
}

/** These answers must never be cached, by a browser or anything in between. */
export function noStore(response: NextResponse): NextResponse {
  response.headers.set("Cache-Control", "no-store");
  return response;
}
