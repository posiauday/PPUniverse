import type { EmailAdapter, EmailMessage } from "@ppu/adapter-email";
import type { PrismaClient } from "@ppu/db";
import type { EmailMessageType, EmailSendRecord, EmailSendStatus } from "@ppu/domain-notifications";
import type { ConsentCategory, PrivacyRepository } from "@ppu/domain-privacy";
import { logger } from "@ppu/telemetry";

/**
 * Send-and-audit orchestration (MVP-018, FR-013). Every send attempt is
 * recorded in EmailSend (append-only — no method here issues an UPDATE),
 * and telemetry carries messageType/status/userId only, never a recipient
 * address or message body (docs/final-decisions.md, "MVP-018 open question
 * 49").
 *
 * sendTransactional always calls the adapter and re-throws on failure after
 * recording it — deliberately, so each call site decides whether a failure
 * should propagate. auth.ts's sign-in path needs the throw (next-auth's own
 * existing error-page behaviour, and the accessibility gate's
 * signin-send-failed state, both depend on it, unchanged by this story).
 * The deletion-request route needs the opposite (question 49, constraint 3:
 * "a send failure MUST NOT fail the request") — it catches and swallows the
 * throw at its own call site, not here, keeping that decision visible where
 * it is made rather than hidden inside a shared service.
 */
export class PrismaNotificationService {
  constructor(
    private readonly db: PrismaClient,
    private readonly emailAdapter: EmailAdapter,
    private readonly privacyRepository: PrivacyRepository,
  ) {}

  async sendTransactional(
    messageType: EmailMessageType,
    userId: string | null,
    message: EmailMessage,
  ): Promise<EmailSendRecord> {
    try {
      await this.emailAdapter.send(message);
      const record = await this.recordSend(userId, messageType, "SENT");
      logger.info("email.send_result", { messageType, status: "SENT", userId });
      return record;
    } catch (error) {
      await this.recordSend(userId, messageType, "FAILED");
      logger.info("email.send_result", { messageType, status: "FAILED", userId });
      throw error;
    }
  }

  /**
   * Checked fresh on every call, never cached across the send boundary
   * (docs/final-decisions.md, "MVP-018 open question 49"). No optional
   * message exists yet to call this with in production — built and tested
   * regardless, the same "enforce the seam before anything exercises it"
   * precedent as revokedAt (MVP-010) and the Restrict FK (MVP-020).
   */
  async sendOptional(
    messageType: EmailMessageType,
    userId: string,
    category: ConsentCategory,
    message: EmailMessage,
  ): Promise<EmailSendRecord> {
    const current = await this.privacyRepository.getCurrentConsent(userId);
    const granted = current.find((c) => c.category === category)?.granted ?? false;
    if (!granted) {
      const record = await this.recordSend(userId, messageType, "SKIPPED_NO_CONSENT");
      logger.info("email.send_result", { messageType, status: "SKIPPED_NO_CONSENT", userId });
      return record;
    }

    try {
      await this.emailAdapter.send(message);
      const record = await this.recordSend(userId, messageType, "SENT");
      logger.info("email.send_result", { messageType, status: "SENT", userId });
      return record;
    } catch (error) {
      await this.recordSend(userId, messageType, "FAILED");
      logger.info("email.send_result", { messageType, status: "FAILED", userId });
      throw error;
    }
  }

  private async recordSend(
    userId: string | null,
    messageType: EmailMessageType,
    status: EmailSendStatus,
  ): Promise<EmailSendRecord> {
    const row = await this.db.emailSend.create({
      data: { userId, messageType, status },
    });
    return {
      id: row.id,
      userId: row.userId,
      messageType: row.messageType as EmailMessageType,
      status: row.status as EmailSendStatus,
      providerMessageId: row.providerMessageId,
      createdAt: row.createdAt,
    };
  }
}
