import { PrismaPasswordAuthStore, PwnedPasswordsChecker } from "@ppu/adapter-identity";
import { prisma } from "@ppu/db";
import {
  PasswordAuth,
  PASSWORD_PROBLEM_MESSAGES,
  type PasswordProblem,
} from "@ppu/domain-identity";
import { logger } from "@ppu/telemetry";
import { notificationService } from "./email";
import { EMAILS, renderEmail } from "./email-templates";
import { SITE_NAME } from "./seo/site";
import { siteOrigin } from "./site-url";

// Re-exported: callers built before MVP-044 and the feedback routes import them from here.
export { siteOrigin };
export { clientIp, isSameOrigin } from "./request-guards";

/**
 * Email and password sign-in, wired to the real database, Have I Been Pwned
 * and the shared email service (MVP-036; docs/plans/mvp-036-password-sign-in.md).
 * The flows themselves live in @ppu/domain-identity.
 */

function link(path: string, token: string): string {
  return `${siteOrigin() ?? ""}${path}?token=${encodeURIComponent(token)}`;
}

export const passwordAuth = new PasswordAuth({
  store: new PrismaPasswordAuthStore(prisma),
  breaches: new PwnedPasswordsChecker(),
  siteName: SITE_NAME,
  onBreachCheckUnavailable: () => logger.warn("auth.password.breach_check_unavailable", {}),
  mailer: {
    async sendConfirmSignup(email, token) {
      const url = link("/password/confirm", token);
      await notificationService.sendTransactional("PASSWORD_CONFIRM", null, {
        to: email,
        ...renderEmail(EMAILS.confirmSignUp(url), siteOrigin()),
      });
    },
    async sendSetPassword(email, token, userId) {
      const url = link("/password/reset", token);
      await notificationService.sendTransactional("PASSWORD_SET_LINK", userId, {
        to: email,
        ...renderEmail(EMAILS.setPassword(url), siteOrigin()),
      });
    },
  },
});

export function problemMessages(problems: PasswordProblem[]): string[] {
  return problems.map((problem) => PASSWORD_PROBLEM_MESSAGES[problem]);
}

/** The session cookie Auth.js reads (next-auth v4's names and flags), so a password sign-in is a normal session. */
export function sessionCookie(sessionToken: string, expires: Date) {
  const secure = (process.env["NEXTAUTH_URL"] ?? siteOrigin() ?? "").startsWith("https://");
  return {
    name: secure ? "__Secure-next-auth.session-token" : "next-auth.session-token",
    value: sessionToken,
    options: { httpOnly: true, sameSite: "lax" as const, path: "/", secure, expires },
  };
}
