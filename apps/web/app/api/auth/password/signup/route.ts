import { NextResponse } from "next/server";
import { clientIp, passwordAuth, problemMessages } from "../../../../../lib/password-auth";
import { MIN_ANSWER_MS, atLeast, noStore, readFields } from "../../../../../lib/password-request";
import { withObservability } from "../../../../../lib/observability";

/**
 * Sign up with an email and password (MVP-036). Always answers "check your
 * email" for a valid request, whether or not the address already has an
 * account; the password only works after the emailed link is confirmed.
 * The person must agree to the Terms of use and the Privacy notice
 * (`acceptTerms: "yes"`); the agreement is recorded when the link is
 * confirmed (docs/final-decisions.md, 2026-10-08, "Accounts accept the Terms
 * when they're made").
 */
export const POST = withObservability(
  "POST /api/auth/password/signup",
  async (request: Request) => {
    const read = await readFields(request, ["email", "password", "acceptTerms"]);
    if ("response" in read) return noStore(read.response);
    if (read.fields["acceptTerms"] !== "yes")
      return noStore(NextResponse.json({ error: "terms" }, { status: 400 }));
    const result = await atLeast(MIN_ANSWER_MS, () =>
      passwordAuth.signUp({
        email: read.fields["email"] ?? "",
        password: read.fields["password"] ?? "",
        ip: clientIp(request),
      }),
    );
    if (result.ok) return noStore(NextResponse.json({ ok: true }));
    if ("invalidEmail" in result)
      return noStore(NextResponse.json({ error: "invalid-email" }, { status: 400 }));
    return noStore(
      NextResponse.json(
        { error: "weak-password", problems: problemMessages(result.problems) },
        { status: 400 },
      ),
    );
  },
);
