import { PrismaPasswordAuthStore, PwnedPasswordsChecker } from "@ppu/adapter-identity";
import { prisma } from "@ppu/db";
import {
  PasswordAuth,
  PASSWORD_PROBLEM_MESSAGES,
  type PasswordProblem,
} from "@ppu/domain-identity";
import { logger } from "@ppu/telemetry";
import { notificationService } from "./email";
import { SITE_NAME } from "./seo/site";
import { getSiteUrl } from "./site-url";

/**
 * Email and password sign-in, wired to the real database, Have I Been Pwned
 * and the shared email service (MVP-036; docs/plans/mvp-036-password-sign-in.md).
 * The flows themselves live in @ppu/domain-identity.
 */

/** The site origin links are built from: the canonical public origin, then NEXTAUTH_URL. */
export function siteOrigin(): string | null {
  const site = getSiteUrl();
  if (site.ok) return site.origin;
  const auth = process.env["NEXTAUTH_URL"];
  try {
    return auth ? new URL(auth).origin : null;
  } catch {
    return null;
  }
}

function link(path: string, token: string): string {
  return `${siteOrigin() ?? ""}${path}?token=${encodeURIComponent(token)}`;
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
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
        subject: `Confirm your email for ${SITE_NAME}`,
        text: `Open this link, then press "Confirm" to finish creating your account. It works once and expires in 1 hour: ${url}\n\nIf you didn't sign up, ignore this email.`,
        html: `<p>Open this link, then press <strong>Confirm</strong> to finish creating your account. It works once and expires in 1 hour: <a href="${escapeHtml(url)}">${escapeHtml(url)}</a></p><p>If you didn't sign up, ignore this email.</p>`,
      });
    },
    async sendSetPassword(email, token, userId) {
      const url = link("/password/reset", token);
      await notificationService.sendTransactional("PASSWORD_SET_LINK", userId, {
        to: email,
        subject: `Set your ${SITE_NAME} password`,
        text: `Someone asked to set a password for your account. Open this link to choose one. It works once and expires in 1 hour: ${url}\n\nIf it wasn't you, ignore this email: your account hasn't changed.`,
        html: `<p>Someone asked to set a password for your account. Open this link to choose one. It works once and expires in 1 hour: <a href="${escapeHtml(url)}">${escapeHtml(url)}</a></p><p>If it wasn't you, ignore this email: your account hasn't changed.</p>`,
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

/** Rejects requests from other sites: the browser's Origin header must be this site's. */
export function isSameOrigin(request: Request): boolean {
  const origin = request.headers.get("origin");
  const expected = siteOrigin();
  return !!origin && !!expected && origin === expected;
}

/** The caller's address, as Netlify reports it (falls back to the first forwarded hop). */
export function clientIp(request: Request): string {
  return (
    request.headers.get("x-nf-client-connection-ip") ??
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    "unknown"
  );
}
