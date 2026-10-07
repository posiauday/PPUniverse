import { createHash } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { PrismaFeedbackRepository } from "./feedback-repository.js";

/** Runs only against a real, migrated Postgres (see content-repository.integration.test.ts). */
const hasDatabase = Boolean(process.env["DATABASE_URL"]);
const sha = (value: string) => createHash("sha256").update(value).digest("hex");

describe.skipIf(!hasDatabase)("PrismaFeedbackRepository (integration, MVP-039)", () => {
  let db: import("@ppu/db").PrismaClient;
  let repo: PrismaFeedbackRepository;
  let articleId = "";
  let userId = "";
  const keys = [sha("feedback-test:a"), sha("feedback-test:b")];

  beforeAll(async () => {
    const { prisma } = await import("@ppu/db");
    db = prisma;
    repo = new PrismaFeedbackRepository(db);
    await db.authThrottle.deleteMany({ where: { key: { in: keys } } });
    const user = await db.user.create({
      data: { email: "feedback-repo@example.test", role: "ADMIN" },
    });
    userId = user.id;
    const article = await db.article.create({
      data: {
        slug: "feedback-repo-guide",
        title: "Feedback repo guide",
        type: "TUTORIAL",
        body: "Body.",
        status: "PUBLISHED",
        publishedAt: new Date(),
        authorUserId: user.id,
      },
    });
    articleId = article.id;
  });

  afterAll(async () => {
    await db.authThrottle.deleteMany({ where: { key: { in: keys } } });
    await db.article.deleteMany({ where: { id: articleId } });
    await db.user.deleteMany({ where: { id: userId } });
    await db.$disconnect();
  });

  it("counts votes per guide, with no visitor data stored", async () => {
    await repo.recordVote(articleId, true);
    await repo.recordVote(articleId, true);
    await repo.recordVote(articleId, false);
    expect(await repo.voteSummary(articleId)).toEqual({ yes: 2, no: 1 });
    const row = (await repo.listVoteSummaries()).find((r) => r.articleId === articleId);
    expect(row).toMatchObject({ slug: "feedback-repo-guide", yes: 2, no: 1 });
    const columns = Object.keys((await db.articleVote.findFirstOrThrow({ where: { articleId } })) ?? {});
    expect(columns.sort()).toEqual(["articleId", "createdAt", "helpful", "id"]);
  });

  it("lists open reports oldest first, and closing deletes the report", async () => {
    await repo.recordReport(articleId, "The limit is now 10,000 items.");
    const open = (await repo.listOpenReports(50)).filter((r) => r.articleSlug === "feedback-repo-guide");
    expect(open).toHaveLength(1);
    expect(open[0]!.message).toBe("The limit is now 10,000 items.");
    expect(await repo.closeReport(open[0]!.id)).toBe(true);
    expect(await repo.closeReport(open[0]!.id)).toBe(false);
    expect(await db.articleReport.count({ where: { articleId } })).toBe(0);
  });

  it("allows `limit` uses per window, then refuses until the window passes", async () => {
    const now = new Date();
    const hour = 60 * 60 * 1000;
    expect(await repo.consumeAllowance(keys[0]!, 2, hour, now)).toBe(true);
    expect(await repo.consumeAllowance(keys[0]!, 2, hour, now)).toBe(true);
    expect(await repo.consumeAllowance(keys[0]!, 2, hour, now)).toBe(false);
    const later = new Date(now.getTime() + hour + 1);
    expect(await repo.consumeAllowance(keys[0]!, 2, hour, later)).toBe(true);
    expect(await repo.consumeAllowance(keys[1]!, 1, hour, now)).toBe(true);
  });

  it("deletes the guide's votes and reports with the guide", async () => {
    await repo.recordReport(articleId, "Another note for the cascade.");
    const id = articleId;
    await db.article.delete({ where: { id } });
    expect(await db.articleVote.count({ where: { articleId: id } })).toBe(0);
    expect(await db.articleReport.count({ where: { articleId: id } })).toBe(0);
  });
});
