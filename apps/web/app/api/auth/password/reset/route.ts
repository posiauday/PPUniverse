import { NextResponse } from "next/server";
import { logger } from "@ppu/telemetry";
import { passwordAuth, problemMessages } from "../../../../../lib/password-auth";
import { noStore, readFields, signedIn } from "../../../../../lib/password-request";
import { withObservability } from "../../../../../lib/observability";

/**
 * Sets a new password from an emailed link (MVP-036). Every existing session
 * of the account ends, then this browser is signed in.
 */
export const POST = withObservability("POST /api/auth/password/reset", async (request: Request) => {
  const read = await readFields(request, ["token", "password"]);
  if ("response" in read) return noStore(read.response);
  const result = await passwordAuth.resetPassword({
    token: read.fields["token"] ?? "",
    password: read.fields["password"] ?? "",
  });
  if (result.ok) {
    logger.info("auth.password.set", { userId: result.userId });
    return noStore(signedIn(await passwordAuth.startSession(result.userId)));
  }
  if (result.reason === "weak") {
    return noStore(
      NextResponse.json(
        { error: "weak-password", problems: problemMessages(result.problems) },
        { status: 400 },
      ),
    );
  }
  return noStore(NextResponse.json({ error: "invalid-link" }, { status: 400 }));
});
