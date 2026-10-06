import { NextResponse } from "next/server";
import { isSameOrigin, sessionCookie } from "./password-auth";

/** Shared request handling for the /api/auth/password/* routes (MVP-036). */

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

/** A success response that also signs the person in. */
export function signedIn(session: { sessionToken: string; expires: Date }): NextResponse {
  const response = NextResponse.json({ ok: true });
  const cookie = sessionCookie(session.sessionToken, session.expires);
  response.cookies.set(cookie.name, cookie.value, cookie.options);
  return response;
}

/** Auth answers must never be cached, by a browser or anything in between. */
export function noStore(response: NextResponse): NextResponse {
  response.headers.set("Cache-Control", "no-store");
  return response;
}

/**
 * How long sign-up and "forgot password" take at least. For an existing
 * account they send an email and for an unknown one they may not, so without
 * a floor the response time would reveal which emails have accounts. Sending
 * normally takes well under a second.
 */
export const MIN_ANSWER_MS = 1500;

/** Runs `work`, then waits until at least `ms` has passed since it started. */
export async function atLeast<T>(ms: number, work: () => Promise<T>): Promise<T> {
  const started = Date.now();
  const result = await work();
  const left = ms - (Date.now() - started);
  if (left > 0) await new Promise((resolve) => setTimeout(resolve, left));
  return result;
}
