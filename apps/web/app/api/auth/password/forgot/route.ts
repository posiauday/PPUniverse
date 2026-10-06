import { NextResponse } from "next/server";
import { logger } from "@ppu/telemetry";
import { clientIp, passwordAuth } from "../../../../../lib/password-auth";
import { MIN_ANSWER_MS, atLeast, noStore, readFields } from "../../../../../lib/password-request";
import { withObservability } from "../../../../../lib/observability";

/**
 * "Forgot password" (MVP-036). The answer is always the same, so it can't be
 * used to find out which emails have accounts.
 */
export const POST = withObservability(
  "POST /api/auth/password/forgot",
  async (request: Request) => {
    const read = await readFields(request, ["email"]);
    if ("response" in read) return noStore(read.response);
    // Always the same answer, after the same minimum time (MIN_ANSWER_MS). A
    // failed email is logged, not reported: an error only for real accounts
    // would reveal which emails have one.
    await atLeast(MIN_ANSWER_MS, () =>
      passwordAuth
        .requestPasswordReset({ email: read.fields["email"] ?? "", ip: clientIp(request) })
        .catch((error: unknown) =>
          logger.error("auth.password.reset_email_failed", {
            // The name only: a provider message can quote the address.
            error: error instanceof Error ? error.name : "unknown",
          }),
        ),
    );
    return noStore(NextResponse.json({ ok: true }));
  },
);
