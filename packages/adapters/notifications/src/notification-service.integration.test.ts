import { PrismaPrivacyRepository } from "@ppu/adapter-privacy";
import type { EmailAdapter, EmailMessage } from "@ppu/adapter-email";
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { PrismaNotificationService } from "./notification-service.js";

/**
 * Runs only when DATABASE_URL points at a real, migrated Postgres database,
 * matching @ppu/adapter-privacy's own integration-test pattern exactly. The
 * EmailAdapter is a mock throughout — no real vendor call, ever, from a
 * test (question 6 of the pre-work analysis).
 *
 * SIGNIN_LINK is used as the messageType in the sendOptional tests below
 * purely as a convenient stand-in — sendOptional's consent-gating mechanism
 * is generic over message type; no optional message type actually exists
 * yet (isTransactionalMessageType is total and both real types return
 * true), consistent with building the seam before anything exercises it.
 */
const hasDatabase = Boolean(process.env["DATABASE_URL"]);

describe.skipIf(!hasDatabase)("PrismaNotificationService (integration)", () => {
  let db: import("@ppu/db").PrismaClient;
  let privacyRepository: PrismaPrivacyRepository;
  let service: PrismaNotificationService;
  let sendMock: ReturnType<typeof vi.fn<(message: EmailMessage) => Promise<void>>>;
  const createdUserIds: string[] = [];

  beforeAll(async () => {
    const { prisma } = await import("@ppu/db");
    db = prisma;
    privacyRepository = new PrismaPrivacyRepository(db);
  });

  beforeEach(() => {
    sendMock = vi.fn().mockResolvedValue(undefined);
    const emailAdapter: EmailAdapter = { send: sendMock };
    service = new PrismaNotificationService(db, emailAdapter, privacyRepository);
  });

  afterAll(async () => {
    // Children first — EmailSend/ConsentRecord use Restrict FKs on userId.
    await db.emailSend.deleteMany({ where: { userId: { in: createdUserIds } } });
    await db.consentRecord.deleteMany({ where: { userId: { in: createdUserIds } } });
    await db.user.deleteMany({ where: { id: { in: createdUserIds } } });
    await db.$disconnect();
  });

  async function createTestUser(email: string) {
    const user = await db.user.create({ data: { email } });
    createdUserIds.push(user.id);
    return user;
  }

  it("sendTransactional always sends and records SENT", async () => {
    const user = await createTestUser("notif-repo-transactional@example.test");

    const record = await service.sendTransactional("SIGNIN_LINK", user.id, {
      to: user.email,
      subject: "Sign in",
      text: "Click here",
    });

    expect(record.status).toBe("SENT");
    expect(sendMock).toHaveBeenCalledTimes(1);
    const rows = await db.emailSend.findMany({ where: { userId: user.id } });
    expect(rows).toHaveLength(1);
    expect(rows[0]?.status).toBe("SENT");
  });

  it("sendTransactional records FAILED and re-throws on adapter failure", async () => {
    const user = await createTestUser("notif-repo-fail@example.test");
    sendMock.mockRejectedValue(new Error("provider down"));

    await expect(
      service.sendTransactional("SIGNIN_LINK", user.id, {
        to: user.email,
        subject: "Sign in",
        text: "Click here",
      }),
    ).rejects.toThrow("provider down");

    const rows = await db.emailSend.findMany({ where: { userId: user.id } });
    expect(rows).toHaveLength(1);
    expect(rows[0]?.status).toBe("FAILED");
  });

  it("sendTransactional accepts a null userId for a not-yet-registered recipient", async () => {
    const record = await service.sendTransactional("SIGNIN_LINK", null, {
      to: "not-yet-a-user@example.test",
      subject: "Sign in",
      text: "Click here",
    });

    expect(record.userId).toBeNull();
    expect(record.status).toBe("SENT");
  });

  it("sendOptional skips and never calls the adapter when consent is not granted", async () => {
    const user = await createTestUser("notif-repo-no-consent@example.test");

    const record = await service.sendOptional("SIGNIN_LINK", user.id, "MARKETING_EMAIL", {
      to: user.email,
      subject: "Notice",
      text: "Body",
    });

    expect(record.status).toBe("SKIPPED_NO_CONSENT");
    expect(sendMock).not.toHaveBeenCalled();
  });

  it("sendOptional sends when consent is granted", async () => {
    const user = await createTestUser("notif-repo-granted@example.test");
    await privacyRepository.recordConsent({
      userId: user.id,
      category: "MARKETING_EMAIL",
      granted: true,
      policyVersionId: null,
    });

    const record = await service.sendOptional("SIGNIN_LINK", user.id, "MARKETING_EMAIL", {
      to: user.email,
      subject: "Notice",
      text: "Body",
    });

    expect(record.status).toBe("SENT");
    expect(sendMock).toHaveBeenCalledTimes(1);
  });

  it("sendOptional re-checks consent freshly: granted then withdrawn is respected", async () => {
    const user = await createTestUser("notif-repo-withdrawn@example.test");
    await privacyRepository.recordConsent({
      userId: user.id,
      category: "MARKETING_EMAIL",
      granted: true,
      policyVersionId: null,
    });
    await privacyRepository.recordConsent({
      userId: user.id,
      category: "MARKETING_EMAIL",
      granted: false,
      policyVersionId: null,
    });

    const record = await service.sendOptional("SIGNIN_LINK", user.id, "MARKETING_EMAIL", {
      to: user.email,
      subject: "Notice",
      text: "Body",
    });

    expect(record.status).toBe("SKIPPED_NO_CONSENT");
    expect(sendMock).not.toHaveBeenCalled();
  });

  it("a User row cannot be hard-deleted while an EmailSend references it (Restrict FK)", async () => {
    const user = await createTestUser("notif-repo-restrict@example.test");
    await service.sendTransactional("SIGNIN_LINK", user.id, {
      to: user.email,
      subject: "Sign in",
      text: "Click here",
    });

    await expect(db.user.delete({ where: { id: user.id } })).rejects.toThrow();

    await db.emailSend.deleteMany({ where: { userId: user.id } });
  });
});
