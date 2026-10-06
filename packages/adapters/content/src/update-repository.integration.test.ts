import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { PrismaUpdateRepository } from "./update-repository.js";

/** Runs only against a real, migrated Postgres (see content-repository.integration.test.ts). */
const hasDatabase = Boolean(process.env["DATABASE_URL"]);

describe.skipIf(!hasDatabase)("PrismaUpdateRepository (integration, MVP-033)", () => {
  let db: import("@ppu/db").PrismaClient;
  let repo: PrismaUpdateRepository;
  const createdUserIds: string[] = [];
  const createdUpdateIds: string[] = [];

  beforeAll(async () => {
    const { prisma } = await import("@ppu/db");
    db = prisma;
    repo = new PrismaUpdateRepository(db);
  });

  afterAll(async () => {
    await db.updatePublishEvent.deleteMany({ where: { updateId: { in: createdUpdateIds } } });
    await db.updateItem.deleteMany({ where: { id: { in: createdUpdateIds } } });
    await db.user.deleteMany({ where: { id: { in: createdUserIds } } });
    await db.$disconnect();
  });

  async function author(email: string) {
    const user = await db.user.create({ data: { email, role: "ADMIN" } });
    createdUserIds.push(user.id);
    return user;
  }

  const input = (slug: string) => ({
    slug,
    title: `Title ${slug}`,
    summary: "What changed.",
    technology: "POWER_AUTOMATE" as const,
    kind: "RETIREMENT" as const,
    action: "Move approvers to Teams",
    sourceUrl: "https://learn.microsoft.com/power-platform/important-changes-coming",
    effectiveDate: new Date("2026-08-31T00:00:00Z"),
    replacement: "Approvals app in Microsoft Teams",
  });

  it("creates DRAFT, keeps the effective date as a calendar date, and edits content only", async () => {
    const user = await author("update-repo-create@example.test");
    const created = await repo.createUpdate({ ...input("update-repo-a"), authorUserId: user.id });
    createdUpdateIds.push(created.id);
    expect(created).toMatchObject({ status: "DRAFT", publishedAt: null, kind: "RETIREMENT" });
    expect(created.effectiveDate?.toISOString()).toBe("2026-08-31T00:00:00.000Z");

    const edited = await repo.updateUpdate(created.id, {
      ...input("update-repo-a"),
      title: "Edited",
      action: null,
    });
    expect(edited).toMatchObject({ title: "Edited", action: null, status: "DRAFT" });
  });

  it("publishes once, with one audit event, and lists only PUBLISHED updates newest first", async () => {
    const user = await author("update-repo-publish@example.test");
    const draft = await repo.createUpdate({ ...input("update-repo-draft"), authorUserId: user.id });
    const first = await repo.createUpdate({ ...input("update-repo-first"), authorUserId: user.id });
    const second = await repo.createUpdate({ ...input("update-repo-second"), authorUserId: user.id });
    createdUpdateIds.push(draft.id, first.id, second.id);

    await repo.publishUpdate(first.id, user.id);
    const published = await repo.publishUpdate(second.id, user.id);
    expect(published.status).toBe("PUBLISHED");
    await expect(repo.publishUpdate(second.id, user.id)).rejects.toThrow(/status PUBLISHED/);
    expect(await db.updatePublishEvent.count({ where: { updateId: second.id } })).toBe(1);

    const list = (await repo.listPublishedUpdates({ limit: 50 }))
      .map((u) => u.slug)
      .filter((slug) => slug.startsWith("update-repo-"));
    expect(list).toEqual(["update-repo-second", "update-repo-first"]);
    const times = await repo.listPublishedUpdateTimes(50);
    expect(times.length).toBeGreaterThanOrEqual(2);
    expect(times[0]?.getTime()).toBeGreaterThanOrEqual(times[1]?.getTime() ?? 0);
  });
});
