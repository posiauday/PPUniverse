import { NextResponse } from "next/server";
import { logger } from "@ppu/telemetry";
import { clientIp, passwordAuth } from "../../../../../lib/password-auth";
import { noStore, readFields, signedIn } from "../../../../../lib/password-request";
import { withObservability } from "../../../../../lib/observability";

/**
 * Sign in with an email and password (MVP-036). A wrong password and an
 * unknown email get the same answer; too many failures lock the account and
 * the address for 15 minutes.
 */
export const POST = withObservability(
  "POST /api/auth/password/signin",
  async (request: Request) => {
    const read = await readFields(request, ["email", "password"]);
    if ("response" in read) return noStore(read.response);
    const result = await passwordAuth.signIn({
      email: read.fields["email"] ?? "",
      password: read.fields["password"] ?? "",
      ip: clientIp(request),
    });
    if (!result.ok) {
      logger.info("auth.password.signin_failed", { reason: result.reason });
      return noStore(
        NextResponse.json(
          { error: result.reason },
          { status: result.reason === "locked" ? 429 : 401 },
        ),
      );
    }
    logger.info("auth.password.signin", { userId: result.userId });
    return noStore(signedIn(await passwordAuth.startSession(result.userId)));
  },
);
