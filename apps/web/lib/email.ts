import { ConsoleEmailAdapter, ResendEmailAdapter, type EmailAdapter } from "@ppu/adapter-email";
import { PrismaNotificationService } from "@ppu/adapter-notifications";
import { PrismaPrivacyRepository } from "@ppu/adapter-privacy";
import { prisma } from "@ppu/db";

/**
 * Shared email-sending selection and orchestration (MVP-018, FR-013;
 * docs/final-decisions.md, "MVP-018 open question 49"). Resend when
 * RESEND_API_KEY is configured, ConsoleEmailAdapter (logs instead of
 * sending) otherwise — production never fails to start, matching
 * error-monitoring.ts's SENTRY_DSN-absent fallback exactly. One selection,
 * reused everywhere a message is sent (auth.ts, the deletion-request
 * route), so there is never a second parallel sending path.
 */
const resendApiKey = process.env["RESEND_API_KEY"];
export const EMAIL_FROM = process.env["EMAIL_FROM"] ?? "no-reply@example.com";

const emailAdapter: EmailAdapter = resendApiKey
  ? new ResendEmailAdapter({ apiKey: resendApiKey, from: EMAIL_FROM })
  : new ConsoleEmailAdapter();

export const notificationService = new PrismaNotificationService(
  prisma,
  emailAdapter,
  new PrismaPrivacyRepository(prisma),
);
