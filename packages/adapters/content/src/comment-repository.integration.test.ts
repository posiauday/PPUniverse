import type { CommentTarget } from "@ppu/domain-content";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { PrismaCommentRepository } from "./comment-repository.js";

/** Runs only against a real, migrated Postgres (see content-repository.integration.test.ts). */
const hasDatabase = Boolean(process.env["DATABASE_URL"]);

/** A fixed sequence of "random" numbers, so generated names are predictable. */
function sequence(...values: number[]): () => number {
  let call = 0;
  return () => values[call++ % values.length]!;
}

describe.skipIf(!hasDatabase)("PrismaCommentRepository (integration, MVP-040, MVP-051, MVP-053)", () => {
  let db: import("@ppu/db").PrismaClient;
  let repo: PrismaCommentRepository;
  let articleId = "";
  let componentId = "";
  let guide: CommentTarget;
  let component: CommentTarget;
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
    guide = { kind: "guide", articleId };
    const library = await db.libraryComponent.create({
      data: {
        slug: "comment-repo-component",
        title: "Comment repo component",
        componentName: "lcsCommentRepo",
        category: "buttons",
        summary: "A component to comment on.",
        guide: "Guide.",
        yaml: "ComponentDefinitions: {}",
        properties: [],
        variations: [],
        version: "1.0.0",
        status: "PUBLISHED",
        publishedAt: new Date(),
        authorUserId: userIds[0]!,
      },
    });
    componentId = library.id;
    component = { kind: "component", componentId };
  });

  afterAll(async () => {
    await db.articleComment.deleteMany({ where: { OR: [{ articleId }, { componentId }] } });
    await db.article.deleteMany({ where: { id: articleId } });
    await db.libraryComponent.deleteMany({ where: { id: componentId } });
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
    const one = await repo.create(guide, a, "First comment, from A.");
    const two = await repo.create(guide, b, "Second comment, from B.");
    expect(await repo.setAccepted(two.id, true)).toBe(true);

    const list = await repo.listVisible(guide, a);
    expect(list.map((c) => c.id)).toEqual([two.id, one.id]);
    expect(list[0]).toMatchObject({ accepted: true, mine: false });
    expect(list[1]).toMatchObject({ displayName: "Priya K", mine: true });
    // Nothing but the display name and avatar describes the author.
    expect(JSON.stringify(list)).not.toMatch(/example\.test|Real Name From Google/);
  });

  it("keeps one accepted comment per guide; removing one un-accepts and hides it", async () => {
    const [a] = userIds as [string, string];
    const third = await repo.create(guide, a, "Third comment, from A.");
    await repo.setAccepted(third.id, true);
    const accepted = (await repo.listVisible(guide, null)).filter((c) => c.accepted);
    expect(accepted.map((c) => c.id)).toEqual([third.id]);

    expect(await repo.setRemoved(third.id, true)).toBe(true);
    const visible = await repo.listVisible(guide, null);
    expect(visible.map((c) => c.id)).not.toContain(third.id);
    expect(visible.some((c) => c.accepted)).toBe(false);
    // A removed comment can't be reported or accepted.
    expect(await repo.report(third.id)).toBe(false);
    expect(await repo.setAccepted(third.id, true)).toBe(false);
  });

  it("records reports for the admin, and lets authors delete only their own", async () => {
    const [a, b] = userIds as [string, string];
    const mine = await repo.create(guide, a, "Reported comment, from A.");
    expect(await repo.report(mine.id)).toBe(true);
    expect(await repo.report(mine.id)).toBe(true);
    const reported = await repo.listForAdmin("reported", 50);
    expect(reported.find((c) => c.id === mine.id)).toMatchObject({ reportCount: 2, removed: false });

    // Keeping it clears the reports, so it leaves the reported list.
    const kept = await repo.create(guide, b, "Reported, then kept, from B.");
    await repo.report(kept.id);
    expect(await repo.clearReports(kept.id)).toBe(true);
    const stillReported = await repo.listForAdmin("reported", 50);
    expect(stillReported.map((c) => c.id)).not.toContain(kept.id);
    expect(stillReported.map((c) => c.id)).toContain(mine.id);

    expect(await repo.deleteOwn(mine.id, b)).toBe(false);
    expect(await repo.deleteOwn(mine.id, a)).toBe(true);
    expect(await db.commentReport.count({ where: { commentId: mine.id } })).toBe(0);
  });
  it("keeps comments on a component apart from the guide's, with its own accepted answer", async () => {
    const [a, b] = userIds as [string, string];
    const question = await repo.create(component, a, "How do I change the accent colour?");
    const answer = await repo.create(component, b, "Set AccentColor to your brand colour.");
    const onGuide = await repo.create(guide, b, "A comment on the guide.");
    expect(await repo.setAccepted(onGuide.id, true)).toBe(true);

    const list = await repo.listVisible(component, a);
    expect(list.map((c) => c.id)).toEqual([question.id, answer.id]);
    expect(list[0]).toMatchObject({ mine: true, accepted: false });

    // Accepting the component's answer leaves the guide's accepted comment alone.
    expect(await repo.setAccepted(answer.id, true)).toBe(true);
    expect((await repo.listVisible(component, null))[0]).toMatchObject({ id: answer.id, accepted: true });
    expect((await repo.listVisible(guide, null)).find((c) => c.id === onGuide.id)?.accepted).toBe(true);

    const latest = await repo.listForAdmin("latest", 50);
    expect(latest.find((c) => c.id === answer.id)?.on).toEqual({
      kind: "component",
      slug: "comment-repo-component",
      title: "Comment repo component",
    });
    expect(latest.find((c) => c.id === onGuide.id)?.on).toMatchObject({ kind: "guide" });
  });

  it("refuses a comment on both a guide and a component, or on neither (one target)", async () => {
    const [a] = userIds as [string];
    await expect(
      db.articleComment.create({ data: { articleId, componentId, userId: a, body: "Both." } }),
    ).rejects.toThrow();
    await expect(db.articleComment.create({ data: { userId: a, body: "Neither." } })).rejects.toThrow();
  });

  it("keeps one live team post per component, first, never reported or accepted (MVP-053)", async () => {
    const [a, b] = userIds as [string, string];
    expect(await repo.findTeamPost(componentId)).toBeNull();
    const first = await repo.saveTeamPost(componentId, a, "Welcome! A tip and a question.");
    // Saving again changes the live post's text rather than adding a second one.
    const again = await repo.saveTeamPost(componentId, b, "Welcome! A better tip and a question.");
    expect(again.id).toBe(first.id);
    expect(await repo.findTeamPost(componentId)).toEqual({
      id: first.id,
      body: "Welcome! A better tip and a question.",
    });

    const list = await repo.listVisible(component, b);
    expect(list[0]).toMatchObject({ id: first.id, team: true });
    expect(list.slice(1).every((c) => !c.team)).toBe(true);
    // Readers can't report it, and it can't be the accepted answer.
    expect(await repo.report(first.id)).toBe(false);
    expect(await repo.setAccepted(first.id, true)).toBe(false);
    expect((await repo.listForAdmin("latest", 50)).find((c) => c.id === first.id)?.team).toBe(true);

    // Once removed, the next save starts a new team post.
    expect(await repo.setRemoved(first.id, true)).toBe(true);
    expect(await repo.findTeamPost(componentId)).toBeNull();
    const next = await repo.saveTeamPost(componentId, a, "Welcome back! A fresh tip.");
    expect(next.id).not.toBe(first.id);
  });
});
