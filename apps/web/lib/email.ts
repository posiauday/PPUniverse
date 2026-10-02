import { ResendEmailAdapter, selectEmailAdapter, type EmailAdapter } from "@ppu/adapter-email";
import { PrismaNotificationService } from "@ppu/adapter-notifications";
import { PrismaPrivacyRepository } from "@ppu/adapter-privacy";
import { prisma } from "@ppu/db";

/**
 * Shared email-sending selection and orchestration (MVP-018, FR-013;
 * docs/final-decisions.md, "MVP-018 open question 49"). Resend when
 * RESEND_API_KEY is configured. Without it, production still starts, but
 * every send fails closed and logs nothing (BUG-019: the console transport
 * used to write the full sign-in link, a working credential, to the logs).
 * The console transport runs only outside production, or when a test
 * harness sets EMAIL_TRANSPORT=log. One selection, reused everywhere a
 * message is sent (auth.ts, the deletion-request route), so there is never
 * a second parallel sending path.
 */
const resendApiKey = process.env["RESEND_API_KEY"];
export const EMAIL_FROM = process.env["EMAIL_FROM"] ?? "no-reply@example.com";

const emailAdapter: EmailAdapter = selectEmailAdapter({
  provider: resendApiKey
    ? new ResendEmailAdapter({ apiKey: resendApiKey, from: EMAIL_FROM })
    : null,
  production: process.env["NODE_ENV"] === "production",
  logTransport: process.env["EMAIL_TRANSPORT"] === "log",
});

export const notificationService = new PrismaNotificationService(
  prisma,
  emailAdapter,
  new PrismaPrivacyRepository(prisma),
);
