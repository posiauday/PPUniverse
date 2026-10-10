import { NextResponse } from "next/server";
import { siteOrigin } from "./site-url";

/**
 * Guards shared by the public POST routes that change data: password
 * sign-in (MVP-036) and guide feedback (MVP-039, MVP-038).
 */

/**
 * Rejects requests from other sites: the browser's Origin header must be this
 * site's public address, or the address the request was sent to (the standard
 * same-origin check; it also covers a deploy preview and the accessibility
 * suite's local server, whose public address is set to a placeholder). Another
 * site's page always sends its own origin, so it matches neither.
 */
export function isSameOrigin(request: Request): boolean {
  const origin = request.headers.get("origin");
  if (!origin) return false;
  if (origin === siteOrigin()) return true;
  try {
    return origin === new URL(request.url).origin;
  } catch {
    return false;
  }
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
  maxBytes = MAX_BODY_BYTES,
): Promise<{ fields: Fields } | { response: NextResponse }> {
  const read = await readJson(request, maxBytes);
  if ("response" in read) return read;
  const { body } = read;
  const fields: Fields = {};
  for (const name of names) {
    const value = (body as Record<string, unknown>)[name];
    if (typeof value !== "string") return { response: badRequest() };
    fields[name] = value;
  }
  return { fields };
}

/**
 * Reads a small JSON object from a same-origin POST, or returns the response
 * to send instead (403 for another origin, 400 for a bad or oversized body).
 */
export async function readJson(
  request: Request,
  maxBytes = MAX_BODY_BYTES,
): Promise<{ body: Record<string, unknown> } | { response: NextResponse }> {
  if (!isSameOrigin(request))
    return { response: NextResponse.json({ error: "forbidden" }, { status: 403 }) };
  const text = await request.text();
  if (new TextEncoder().encode(text).length > maxBytes) return { response: badRequest() };
  let body: unknown;
  try {
    body = JSON.parse(text);
  } catch {
    return { response: badRequest() };
  }
  if (typeof body !== "object" || body === null || Array.isArray(body)) {
    return { response: badRequest() };
  }
  return { body: body as Record<string, unknown> };
}

function badRequest() {
  return NextResponse.json({ error: "bad-request" }, { status: 400 });
}

/** These answers must never be cached, by a browser or anything in between. */
export function noStore(response: NextResponse): NextResponse {
  response.headers.set("Cache-Control", "no-store");
  return response;
}
