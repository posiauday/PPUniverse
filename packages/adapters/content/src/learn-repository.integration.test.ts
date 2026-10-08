import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { PrismaLearnRepository } from "./learn-repository.js";

/** Runs only against a real, migrated Postgres (see content-repository.integration.test.ts). */
const hasDatabase = Boolean(process.env["DATABASE_URL"]);

describe.skipIf(!hasDatabase)("PrismaLearnRepository (integration, MVP-048)", () => {
  let db: import("@ppu/db").PrismaClient;
  let repo: PrismaLearnRepository;
  const createdUserIds: string[] = [];
  const createdTopicIds: string[] = [];

  beforeAll(async () => {
    const { prisma } = await import("@ppu/db");
    db = prisma;
    repo = new PrismaLearnRepository(db);
  });

  afterAll(async () => {
    await db.learnPublishEvent.deleteMany({ where: { topicId: { in: createdTopicIds } } });
    await db.learnLesson.deleteMany({ where: { topicId: { in: createdTopicIds } } });
    await db.learnTopic.deleteMany({ where: { id: { in: createdTopicIds } } });
    await db.user.deleteMany({ where: { id: { in: createdUserIds } } });
    await db.$disconnect();
  });

  async function author(email: string) {
    const user = await db.user.create({ data: { email, role: "ADMIN" } });
    createdUserIds.push(user.id);
    return user;
  }

  async function topic(slug: string, authorUserId: string) {
    const created = await repo.createTopic({
      slug,
      title: `Topic ${slug}`,
      summary: "What it explains.",
      technology: "POWER_APPS",
      sortOrder: 1,
      authorUserId,
    });
    createdTopicIds.push(created.id);
    return created;
  }

  const lesson = (topicId: string, authorUserId: string, position: number) => ({
    topicId,
    authorUserId,
    slug: `lesson-${position}`,
    position,
    title: `Lesson ${position}`,
    minutes: 10,
    outcomes: ["First outcome", "Second outcome"],
    body: "## The idea\n\nText.",
    checkedOn: new Date("2026-10-07T00:00:00Z"),
  });

  it("creates topics and lessons as DRAFT and edits content only", async () => {
    const user = await author("learn-repo-create@example.test");
    const created = await topic("learn-repo-create", user.id);
    expect(created).toMatchObject({ status: "DRAFT", publishedAt: null });

    const first = await repo.createLesson(lesson(created.id, user.id, 1));
    expect(first).toMatchObject({ status: "DRAFT", outcomes: ["First outcome", "Second outcome"] });
    expect(first.checkedOn?.toISOString()).toBe("2026-10-07T00:00:00.000Z");

    const edited = await repo.updateLesson(first.id, { ...lesson(created.id, user.id, 1), title: "Renamed" });
    expect(edited).toMatchObject({ title: "Renamed", status: "DRAFT", publishedAt: null });
    expect(await repo.findLesson(created.id, "lesson-1")).toMatchObject({ id: first.id });
  });

  it("refuses a second lesson at the same position or with the same slug", async () => {
    const user = await author("learn-repo-unique@example.test");
    const created = await topic("learn-repo-unique", user.id);
    await repo.createLesson(lesson(created.id, user.id, 1));
    await expect(
      repo.createLesson({ ...lesson(created.id, user.id, 1), slug: "another" }),
    ).rejects.toThrow();
    await expect(
      repo.createLesson({ ...lesson(created.id, user.id, 2), slug: "lesson-1" }),
    ).rejects.toThrow();
  });

  it("publishes once, with an audit event each, and shows a lesson only when both are published", async () => {
    const user = await author("learn-repo-publish@example.test");
    const created = await topic("learn-repo-publish", user.id);
    const first = await repo.createLesson(lesson(created.id, user.id, 1));
    await repo.createLesson(lesson(created.id, user.id, 2));

    await repo.publishLesson(first.id, user.id);
    expect(await repo.findPublishedLesson("learn-repo-publish", "lesson-1")).toBeNull();

    const published = await repo.publishTopic(created.id, user.id);
    expect(published.status).toBe("PUBLISHED");
    await expect(repo.publishTopic(created.id, user.id)).rejects.toThrow();
    await expect(repo.publishLesson(first.id, user.id)).rejects.toThrow();

    const found = await repo.findPublishedLesson("learn-repo-publish", "lesson-1");
    expect(found?.lesson.title).toBe("Lesson 1");
    expect(found?.topic.lessons.map((l) => l.slug)).toEqual(["lesson-1"]);
    expect(await repo.findPublishedLesson("learn-repo-publish", "lesson-2")).toBeNull();

    const events = await db.learnPublishEvent.findMany({ where: { topicId: created.id } });
    expect(events.map((e) => e.lessonId).sort()).toEqual([first.id, null].sort());

    const listed = await repo.listPublishedTopics({ technology: "POWER_APPS" });
    expect(listed.find((t) => t.id === created.id)?.lessons).toHaveLength(1);
    expect((await repo.listTopics()).find((t) => t.id === created.id)?.lessons).toHaveLength(2);
  });
});
