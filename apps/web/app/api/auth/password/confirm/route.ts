import { NextResponse } from "next/server";
import { passwordAuth } from "../../../../../lib/password-auth";
import { noStore, readFields, signedIn } from "../../../../../lib/password-request";
import { withObservability } from "../../../../../lib/observability";

/** Confirms a sign-up from its emailed link, then signs the person in (MVP-036). */
export const POST = withObservability(
  "POST /api/auth/password/confirm",
  async (request: Request) => {
    const read = await readFields(request, ["token"]);
    if ("response" in read) return noStore(read.response);
    const result = await passwordAuth.confirmSignUp(read.fields["token"] ?? "");
    if (!result.ok) return noStore(NextResponse.json({ error: "invalid-link" }, { status: 400 }));
    return noStore(signedIn(await passwordAuth.startSession(result.userId)));
  },
);
