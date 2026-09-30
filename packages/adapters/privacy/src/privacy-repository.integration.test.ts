import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { PrismaPrivacyRepository } from "./privacy-repository.js";

/**
 * Runs only when DATABASE_URL points at a real, migrated Postgres database
 * (packages/db/prisma/schema), matching @ppu/adapter-entitlements's own
 * integration-test pattern exactly.
 */
const hasDatabase = Boolean(process.env["DATABASE_URL"]);

describe.skipIf(!hasDatabase)("PrismaPrivacyRepository (integration)", () => {
  let db: import("@ppu/db").PrismaClient;
  let repo: PrismaPrivacyRepository;
  const createdUserIds: string[] = [];
  let policyVersionId: string;

  beforeAll(async () => {
    const { prisma } = await import("@ppu/db");
    db = prisma;
    repo = new PrismaPrivacyRepository(db);

    const policyVersion = await db.policyVersion.create({
      data: {
        documentType: "TERMS_OF_SERVICE",
        version: "privacy-repo-test-v1",
        effectiveAt: new Date(),
      },
    });
    policyVersionId = policyVersion.id;
  });

  afterAll(async () => {
    // Children first — ConsentRecord/DeletionRequest use Restrict FKs on
    // userId (see the last test in this file for why), so the user row
    // cannot be deleted while either still references it.
    await db.deletionRequestEvent.deleteMany({
      where: { deletionRequest: { userId: { in: createdUserIds } } },
    });
    await db.deletionRequest.deleteMany({ where: { userId: { in: createdUserIds } } });
    await db.consentRecord.deleteMany({ where: { userId: { in: createdUserIds } } });
    await db.user.deleteMany({ where: { id: { in: createdUserIds } } });
    await db.policyVersion.deleteMany({ where: { id: policyVersionId } });
    await db.$disconnect();
  });

  async function createTestUser(email: string) {
    const user = await db.user.create({ data: { email } });
    createdUserIds.push(user.id);
    return user;
  }

  it("recordConsent is append-only: granting then withdrawing produces two rows, not a mutation", async () => {
    const user = await createTestUser("privacy-repo-consent@example.test");

    const granted = await repo.recordConsent({
      userId: user.id,
      category: "MARKETING_EMAIL",
      granted: true,
      policyVersionId: null,
    });
    const withdrawn = await repo.recordConsent({
      userId: user.id,
      category: "MARKETING_EMAIL",
      granted: false,
      policyVersionId: null,
    });

    expect(granted.id).not.toBe(withdrawn.id);
    const all = await db.consentRecord.findMany({ where: { userId: user.id } });
    expect(all).toHaveLength(2);
  });

  it("getCurrentConsent returns the latest row per category, not every row", async () => {
    const user = await createTestUser("privacy-repo-current-consent@example.test");

    await repo.recordConsent({
      userId: user.id,
      category: "TERMS_OF_SERVICE",
      granted: true,
      policyVersionId,
    });
    await repo.recordConsent({
      userId: user.id,
      category: "MARKETING_EMAIL",
      granted: true,
      policyVersionId: null,
    });
    const latestMarketing = await repo.recordConsent({
      userId: user.id,
      category: "MARKETING_EMAIL",
      granted: false,
      policyVersionId: null,
    });

    const current = await repo.getCurrentConsent(user.id);
    expect(current).toHaveLength(2);
    const marketing = current.find((c) => c.category === "MARKETING_EMAIL");
    expect(marketing?.id).toBe(latestMarketing.id);
    expect(marketing?.granted).toBe(false);
    const terms = current.find((c) => c.category === "TERMS_OF_SERVICE");
    expect(terms?.granted).toBe(true);
    expect(terms?.policyVersionId).toBe(policyVersionId);
  });

  it("createDeletionRequest creates the request and its SUBMITTED event atomically", async () => {
    const user = await createTestUser("privacy-repo-create-request@example.test");

    const request = await repo.createDeletionRequest(user.id);

    expect(request.userId).toBe(user.id);
    expect(request.events).toHaveLength(1);
    expect(request.events[0]?.toState).toBe("SUBMITTED");
    expect(request.events[0]?.actorUserId).toBe(user.id);
  });

  it("full lifecycle: submit -> under_review -> approved -> completed, in order", async () => {
    const user = await createTestUser("privacy-repo-lifecycle@example.test");
    const admin = await createTestUser("privacy-repo-lifecycle-admin@example.test");

    const request = await repo.createDeletionRequest(user.id);
    await repo.appendDeletionRequestEvent(request.id, "UNDER_REVIEW", admin.id, null);
    await repo.appendDeletionRequestEvent(request.id, "APPROVED", admin.id, null);
    await repo.appendDeletionRequestEvent(request.id, "COMPLETED", admin.id, null);

    const full = await repo.getDeletionRequestById(request.id);
    expect(full?.events.map((e) => e.toState)).toEqual([
      "SUBMITTED",
      "UNDER_REVIEW",
      "APPROVED",
      "COMPLETED",
    ]);
  });

  it("submit -> withdraw records a reason-less self-service withdrawal", async () => {
    const user = await createTestUser("privacy-repo-withdraw@example.test");

    const request = await repo.createDeletionRequest(user.id);
    const withdrawal = await repo.appendDeletionRequestEvent(
      request.id,
      "WITHDRAWN",
      user.id,
      null,
    );

    expect(withdrawal.toState).toBe("WITHDRAWN");
    expect(withdrawal.actorUserId).toBe(user.id);
  });

  it("a denied transition records the required reason", async () => {
    const user = await createTestUser("privacy-repo-denied@example.test");
    const admin = await createTestUser("privacy-repo-denied-admin@example.test");

    const request = await repo.createDeletionRequest(user.id);
    await repo.appendDeletionRequestEvent(request.id, "UNDER_REVIEW", admin.id, null);
    const denial = await repo.appendDeletionRequestEvent(
      request.id,
      "DENIED",
      admin.id,
      "Outstanding entitlement dispute.",
    );

    expect(denial.reason).toBe("Outstanding entitlement dispute.");
  });

  it("getLatestDeletionRequestForUser returns the most recently created request, or null", async () => {
    const user = await createTestUser("privacy-repo-latest@example.test");
    expect(await repo.getLatestDeletionRequestForUser(user.id)).toBeNull();

    const request = await repo.createDeletionRequest(user.id);

    const latest = await repo.getLatestDeletionRequestForUser(user.id);
    expect(latest?.id).toBe(request.id);
  });

  it("listActiveDeletionRequests includes SUBMITTED and excludes WITHDRAWN", async () => {
    const submittedUser = await createTestUser("privacy-repo-active-submitted@example.test");
    const withdrawnUser = await createTestUser("privacy-repo-active-withdrawn@example.test");

    const submitted = await repo.createDeletionRequest(submittedUser.id);
    const withdrawn = await repo.createDeletionRequest(withdrawnUser.id);
    await repo.appendDeletionRequestEvent(withdrawn.id, "WITHDRAWN", withdrawnUser.id, null);

    const active = await repo.listActiveDeletionRequests();
    const activeIds = active.map((r) => r.id);
    expect(activeIds).toContain(submitted.id);
    expect(activeIds).not.toContain(withdrawn.id);
  });

  it("a User row cannot be hard-deleted while a ConsentRecord references it (Restrict FK, decided 2026-09-22)", async () => {
    const user = await createTestUser("privacy-repo-restrict@example.test");
    await repo.recordConsent({
      userId: user.id,
      category: "MARKETING_EMAIL",
      granted: true,
      policyVersionId: null,
    });

    await expect(db.user.delete({ where: { id: user.id } })).rejects.toThrow();

    // Clean up in dependency order so the outer afterAll's bulk delete still
    // succeeds for this user (proving the FK held, not a leftover mistake).
    await db.consentRecord.deleteMany({ where: { userId: user.id } });
  });
});
