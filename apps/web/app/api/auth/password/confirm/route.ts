import { NextResponse } from "next/server";
import { passwordAuth } from "../../../../../lib/password-auth";
import { noStore, readFields, signedIn } from "../../../../../lib/password-request";
import { withObservability } from "../../../../../lib/observability";
import { recordTermsAcceptance } from "../../../../../lib/terms-acceptance";
import { logger } from "@ppu/telemetry";

/**
 * Confirms a sign-up from its emailed link, then signs the person in (MVP-036).
 * Every sign-up link comes from a sign-up that agreed to the Terms of use and
 * the Privacy notice, so the agreement is recorded here, against the current
 * Terms version. If that fails, they're still signed in, and the site asks
 * them to accept on their next page.
 */
export const POST = withObservability(
  "POST /api/auth/password/confirm",
  async (request: Request) => {
    const read = await readFields(request, ["token"]);
    if ("response" in read) return noStore(read.response);
    const result = await passwordAuth.confirmSignUp(read.fields["token"] ?? "");
    if (!result.ok) return noStore(NextResponse.json({ error: "invalid-link" }, { status: 400 }));
    await recordTermsAcceptance(result.userId).catch(() =>
      logger.warn("terms.record_failed", { during: "signup-confirm" }),
    );
    return noStore(signedIn(await passwordAuth.startSession(result.userId)));
  },
);
