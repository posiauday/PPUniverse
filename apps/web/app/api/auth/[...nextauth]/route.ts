import NextAuth from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "../../../../lib/auth";
import { clientIp, passwordAuth, siteOrigin } from "../../../../lib/password-auth";

const handler = NextAuth(authOptions);

type Context = { params: Promise<{ nextauth: string[] }> };

/**
 * Auth.js, with one guard in front (site review, 2026-10-10): a request for an
 * emailed sign-in link counts against the same per-address and per-IP mail
 * budget as the password emails (PasswordAuth.allowEmailTo), so nobody can
 * flood an inbox or use up the sending quota. Over the budget, no email is
 * sent and the sign-in page says to wait; the answer has the shape Auth.js's
 * own client expects (a JSON `url` carrying `error`), or a redirect without
 * JavaScript.
 */
async function POST(request: Request, context: Context) {
  if (new URL(request.url).pathname.endsWith("/signin/email")) {
    const form = await request
      .clone()
      .formData()
      .catch(() => null);
    const email = form?.get("email");
    if (
      typeof email === "string" &&
      !(await passwordAuth.allowEmailTo({ email, ip: clientIp(request) }))
    ) {
      const url = `${siteOrigin() ?? new URL(request.url).origin}/signin?error=too-many`;
      return form?.get("json") === "true"
        ? NextResponse.json({ url })
        : NextResponse.redirect(url, 302);
    }
  }
  return handler(request, context);
}

export { handler as GET, POST };
