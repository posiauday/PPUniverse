import { NextResponse } from "next/server";
import { sessionCookie } from "./password-auth";

// Shared with the feedback routes (MVP-039): moved to request-guards.ts.
export { noStore, readFields, type Fields } from "./request-guards";

/** Shared request handling for the /api/auth/password/* routes (MVP-036). */

/** A success response that also signs the person in. */
export function signedIn(session: { sessionToken: string; expires: Date }): NextResponse {
  const response = NextResponse.json({ ok: true });
  const cookie = sessionCookie(session.sessionToken, session.expires);
  response.cookies.set(cookie.name, cookie.value, cookie.options);
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
