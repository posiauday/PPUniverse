import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { PrismaCommentRepository } from "./comment-repository.js";

/** Runs only against a real, migrated Postgres (see content-repository.integration.test.ts). */
const hasDatabase = Boolean(process.env["DATABASE_URL"]);

/** A fixed sequence of "random" numbers, so generated names are predictable. */
function sequence(...values: number[]): () => number {
  let call = 0;
  return () => values[call++ % values.length]!;
}

describe.skipIf(!hasDatabase)("PrismaCommentRepository (integration, MVP-040)", () => {
  let db: import("@ppu/db").PrismaClient;
  let repo: PrismaCommentRepository;
  let articleId = "";
  const userIds: string[] = [];

  beforeAll(async () => {
    const { prisma } = await import("@ppu/db");
    db = prisma;
    repo = new PrismaCommentRepository(db);
    for (const email of ["comments-a@example.test", "comments-b@example.test"]) {
      const user = await db.user.create({ data: { email, name: "Real Name From Google" } });
      userIds.push(user.id);
    }
    const article = await db.article.create({
      data: {
        slug: "comment-repo-guide",
        title: "Comment repo guide",
        type: "TUTORIAL",
        body: "Body.",
        status: "PUBLISHED",
        publishedAt: new Date(),
        authorUserId: userIds[0]!,
      },
    });
    articleId = article.id;
  });

  afterAll(async () => {
    await db.articleComment.deleteMany({ where: { articleId } });
    await db.article.deleteMany({ where: { id: articleId } });
    await db.user.deleteMany({ where: { id: { in: userIds } } });
    await db.$disconnect();
  });

  it("gives each reader a unique generated name once, and keeps it", async () => {
    const [a, b] = userIds as [string, string];
    const first = await repo.getOrCreateProfile(a, sequence(0, 0, 0, 0.5));
    // The first draw seeds the avatar; the next three pick the name.
    expect(first.displayName).toBe("Swift Trigger 550");
    expect(await repo.getOrCreateProfile(a, sequence(0.9, 0.9, 0.9))).toEqual(first);
    // The same "random" draw for another reader collides, so they get the next.
    const second = await repo.getOrCreateProfile(b, sequence(0, 0, 0, 0.5, 0.5, 0.5));
    expect(second.displayName).not.toBe(first.displayName);
  });

  it("refuses a display name another reader has, in any case", async () => {
    const [a, b] = userIds as [string, string];
    expect(await repo.setDisplayName(a, "Priya K")).toBe(true);
    expect(await repo.setDisplayName(b, "PRIYA k")).toBe(false);
  });

  it("lists visible comments with the profile only, the accepted one first", async () => {
    const [a, b] = userIds as [string, string];
    const one = await repo.create(articleId, a, "First comment, from A.");
    const two = await repo.create(articleId, b, "Second comment, from B.");
    expect(await repo.setAccepted(two.id, true)).toBe(true);

    const list = await repo.listVisible(articleId, a);
    expect(list.map((c) => c.id)).toEqual([two.id, one.id]);
    expect(list[0]).toMatchObject({ accepted: true, mine: false });
    expect(list[1]).toMatchObject({ displayName: "Priya K", mine: true });
    // Nothing but the display name and avatar describes the author.
    expect(JSON.stringify(list)).not.toMatch(/example\.test|Real Name From Google/);
  });

  it("keeps one accepted comment per guide; removing one un-accepts and hides it", async () => {
    const [a] = userIds as [string, string];
    const third = await repo.create(articleId, a, "Third comment, from A.");
    await repo.setAccepted(third.id, true);
    const accepted = (await repo.listVisible(articleId, null)).filter((c) => c.accepted);
    expect(accepted.map((c) => c.id)).toEqual([third.id]);

    expect(await repo.setRemoved(third.id, true)).toBe(true);
    const visible = await repo.listVisible(articleId, null);
    expect(visible.map((c) => c.id)).not.toContain(third.id);
    expect(visible.some((c) => c.accepted)).toBe(false);
    // A removed comment can't be reported or accepted.
    expect(await repo.report(third.id)).toBe(false);
    expect(await repo.setAccepted(third.id, true)).toBe(false);
  });

  it("records reports for the admin, and lets authors delete only their own", async () => {
    const [a, b] = userIds as [string, string];
    const mine = await repo.create(articleId, a, "Reported comment, from A.");
    expect(await repo.report(mine.id)).toBe(true);
    expect(await repo.report(mine.id)).toBe(true);
    const reported = await repo.listForAdmin("reported", 50);
    expect(reported.find((c) => c.id === mine.id)).toMatchObject({ reportCount: 2, removed: false });

    // Keeping it clears the reports, so it leaves the reported list.
    const kept = await repo.create(articleId, b, "Reported, then kept, from B.");
    await repo.report(kept.id);
    expect(await repo.clearReports(kept.id)).toBe(true);
    const stillReported = await repo.listForAdmin("reported", 50);
    expect(stillReported.map((c) => c.id)).not.toContain(kept.id);
    expect(stillReported.map((c) => c.id)).toContain(mine.id);

    expect(await repo.deleteOwn(mine.id, b)).toBe(false);
    expect(await repo.deleteOwn(mine.id, a)).toBe(true);
    expect(await db.commentReport.count({ where: { commentId: mine.id } })).toBe(0);
  });
});
