import { NextResponse } from "next/server";
import { clientIp, passwordAuth, problemMessages } from "../../../../../lib/password-auth";
import { MIN_ANSWER_MS, atLeast, noStore, readFields } from "../../../../../lib/password-request";
import { withObservability } from "../../../../../lib/observability";

/**
 * Sign up with an email and password (MVP-036). Always answers "check your
 * email" for a valid request, whether or not the address already has an
 * account; the password only works after the emailed link is confirmed.
 */
export const POST = withObservability(
  "POST /api/auth/password/signup",
  async (request: Request) => {
    const read = await readFields(request, ["email", "password"]);
    if ("response" in read) return noStore(read.response);
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
