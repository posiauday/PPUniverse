import { beforeEach, describe, expect, it, vi } from "vitest";

const getServerSession = vi.fn();
const findUnique = vi.fn();
const repo = {
  listTopics: vi.fn(),
  createTopic: vi.fn(),
  updateTopic: vi.fn(),
  publishTopic: vi.fn(),
  findTopicById: vi.fn(),
  findTopicBySlug: vi.fn(),
  findTopicWithLessons: vi.fn(),
  createLesson: vi.fn(),
  updateLesson: vi.fn(),
  publishLesson: vi.fn(),
  findLessonById: vi.fn(),
};

vi.mock("next-auth/next", () => ({
  getServerSession: (...args: unknown[]) => getServerSession(...args),
}));
vi.mock("@ppu/db", () => ({
  prisma: { user: { findUnique: (...args: unknown[]) => findUnique(...args) } },
}));
vi.mock("../../../../lib/learn", () => ({ learnRepository: repo }));
const notifyIndexNow = vi.fn();
vi.mock("../../../../lib/indexnow", () => ({
  notifyIndexNow: (...args: unknown[]) => notifyIndexNow(...args),
}));
vi.mock("../../../../lib/site-url", () => ({
  getSiteUrl: () => ({ ok: true, origin: "https://example.com" }),
}));

const { GET, POST } = await import("./route");
const { PATCH: PATCH_TOPIC } = await import("./[id]/route");
const { POST: PUBLISH_TOPIC } = await import("./[id]/publish/route");
const { POST: CREATE_LESSON } = await import("./[id]/lessons/route");
const { PATCH: PATCH_LESSON } = await import("../lessons/[id]/route");
const { POST: PUBLISH_LESSON } = await import("../lessons/[id]/publish/route");

const TOPIC = {
  slug: "power-apps-delegation",
  title: "Delegation in Power Apps",
  summary: "Why a gallery stops at 500 rows.",
  technology: "POWER_APPS",
  sortOrder: "1",
};

const BODY = [
  "## The idea",
  "",
  "A.",
  "",
  "## How it works",
  "",
  "B.",
  "",
  "## The important things",
  "",
  "C.",
  "",
  "## Try it",
  "",
  "D.",
  "",
  "## Check yourself",
  "",
  "> [!CHECK] Q1?",
  "> - [x] A",
  ">   Yes.",
  "> - [ ] B",
  ">   No.",
  "",
  "> [!CHECK] Q2?",
  "> - [ ] A",
  ">   No.",
  "> - [x] B",
  ">   Yes.",
  "",
  "## Sources",
  "",
  "- [Delegation](https://learn.microsoft.com/power-apps/maker/canvas-apps/delegation-overview)",
].join("\n");

const LESSON = {
  title: "Which formulas delegate",
  slug: "which-formulas-delegate",
  position: "2",
  minutes: "12",
  outcomes: "Tell a delegable formula from one that isn't\nKnow why the warning matters",
  checkedOn: "2026-10-07",
  body: BODY,
};

const json = (body: unknown, method = "POST") =>
  new Request("http://localhost/api/admin/topics", {
    method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
const empty = () => new Request("http://localhost/x", { method: "POST" });
const params = (id: string) => ({ params: Promise.resolve({ id }) });

function signedInAs(role: "ADMIN" | "MEMBER" | null) {
  getServerSession.mockResolvedValue(role ? { user: { id: "user-1" } } : null);
  findUnique.mockResolvedValue(role ? { role } : null);
}

const lessonRow = (position: number, overrides: Record<string, unknown> = {}) => ({
  id: `l${position}`,
  topicId: "t1",
  slug: `lesson-${position}`,
  position,
  title: `Lesson ${position}`,
  status: "DRAFT",
  body: BODY,
  ...overrides,
});

beforeEach(() => {
  vi.clearAllMocks();
});

describe("/api/admin/topics and /api/admin/lessons (MVP-048 slice 1b)", () => {
  it.each([null, "MEMBER"] as const)("gives %s the identical 404 on every route", async (role) => {
    signedInAs(role);
    for (const response of [
      await GET(new Request("http://localhost/api/admin/topics")),
      await POST(json(TOPIC)),
      await PATCH_TOPIC(json(TOPIC, "PATCH"), params("t1")),
      await PUBLISH_TOPIC(empty(), params("t1")),
      await CREATE_LESSON(json(LESSON), params("t1")),
      await PATCH_LESSON(json(LESSON, "PATCH"), params("l1")),
      await PUBLISH_LESSON(empty(), params("l1")),
    ]) {
      expect(response.status).toBe(404);
      expect((await response.json()).message).toBe("Not found.");
    }
    expect(repo.createTopic).not.toHaveBeenCalled();
    expect(repo.createLesson).not.toHaveBeenCalled();
    expect(repo.publishTopic).not.toHaveBeenCalled();
    expect(repo.publishLesson).not.toHaveBeenCalled();
  });

  it("creates a DRAFT topic authored by the admin, and refuses a taken slug", async () => {
    signedInAs("ADMIN");
    repo.findTopicBySlug.mockResolvedValueOnce(null);
    repo.createTopic.mockResolvedValue({ id: "t1", status: "DRAFT" });
    const created = await POST(json(TOPIC));
    expect(created.status).toBe(201);
    expect(repo.createTopic).toHaveBeenCalledWith(
      expect.objectContaining({
        slug: "power-apps-delegation",
        sortOrder: 1,
        authorUserId: "user-1",
      }),
    );

    repo.findTopicBySlug.mockResolvedValueOnce({ id: "other" });
    const taken = await POST(json(TOPIC));
    expect(taken.status).toBe(409);
    expect((await taken.json()).fieldErrors.slug).toEqual(["This slug is already in use."]);
  });

  it("reports every invalid topic field", async () => {
    signedInAs("ADMIN");
    const response = await POST(
      json({ ...TOPIC, technology: "EXCEL", sortOrder: "first", slug: "Bad Slug" }),
    );
    expect(response.status).toBe(400);
    expect(Object.keys((await response.json()).fieldErrors).sort()).toEqual([
      "slug",
      "sortOrder",
      "technology",
    ]);
  });

  it("adds a lesson only in the fixed shape, with its outcomes one per line", async () => {
    signedInAs("ADMIN");
    repo.findTopicById.mockResolvedValue({ id: "t1" });
    repo.findTopicWithLessons.mockResolvedValue({ id: "t1", lessons: [lessonRow(1)] });
    repo.createLesson.mockResolvedValue({ id: "l2", status: "DRAFT" });

    const created = await CREATE_LESSON(json(LESSON), params("t1"));
    expect(created.status).toBe(201);
    expect(repo.createLesson).toHaveBeenCalledWith(
      expect.objectContaining({
        topicId: "t1",
        position: 2,
        outcomes: ["Tell a delegable formula from one that isn't", "Know why the warning matters"],
        checkedOn: new Date("2026-10-07T00:00:00Z"),
      }),
    );

    const outOfShape = await CREATE_LESSON(
      json({ ...LESSON, body: BODY.replace("## Sources", "## Reading") }),
      params("t1"),
    );
    expect(outOfShape.status).toBe(400);
    expect((await outOfShape.json()).fieldErrors.body[0]).toContain("must be exactly, in order");
  });

  it("refuses a lesson whose slug or position another lesson in the topic has", async () => {
    signedInAs("ADMIN");
    repo.findTopicById.mockResolvedValue({ id: "t1" });
    repo.findTopicWithLessons.mockResolvedValue({
      id: "t1",
      lessons: [lessonRow(2, { slug: "which-formulas-delegate" })],
    });
    const response = await CREATE_LESSON(json(LESSON), params("t1"));
    expect(response.status).toBe(409);
    expect(Object.keys((await response.json()).fieldErrors).sort()).toEqual(["position", "slug"]);
    expect(repo.createLesson).not.toHaveBeenCalled();
  });

  it("lets a lesson keep its own slug and position when edited", async () => {
    signedInAs("ADMIN");
    repo.findLessonById.mockResolvedValue(
      lessonRow(2, { id: "l2", slug: "which-formulas-delegate" }),
    );
    repo.findTopicWithLessons.mockResolvedValue({
      id: "t1",
      lessons: [lessonRow(2, { id: "l2", slug: "which-formulas-delegate" })],
    });
    repo.updateLesson.mockResolvedValue({ id: "l2" });
    const response = await PATCH_LESSON(json(LESSON, "PATCH"), params("l2"));
    expect(response.status).toBe(200);
    expect(repo.updateLesson).toHaveBeenCalledWith("l2", expect.objectContaining({ position: 2 }));
  });

  it("publishes a topic only with at least 3 lessons, and only once", async () => {
    signedInAs("ADMIN");
    repo.findTopicWithLessons.mockResolvedValueOnce({
      id: "t1",
      status: "DRAFT",
      lessons: [lessonRow(1), lessonRow(2)],
    });
    const tooFew = await PUBLISH_TOPIC(empty(), params("t1"));
    expect(tooFew.status).toBe(409);
    expect((await tooFew.json()).message).toContain("at least 3 lessons");

    repo.findTopicWithLessons.mockResolvedValueOnce({
      id: "t1",
      status: "DRAFT",
      lessons: [lessonRow(1), lessonRow(2), lessonRow(3)],
    });
    repo.publishTopic.mockResolvedValue({ id: "t1", status: "PUBLISHED" });
    expect((await PUBLISH_TOPIC(empty(), params("t1"))).status).toBe(200);
    expect(repo.publishTopic).toHaveBeenCalledWith("t1", "user-1");

    repo.findTopicWithLessons.mockResolvedValueOnce({ id: "t1", status: "PUBLISHED", lessons: [] });
    expect((await PUBLISH_TOPIC(empty(), params("t1"))).status).toBe(409);
  });

  it("publishes a lesson only when its body is in shape", async () => {
    signedInAs("ADMIN");
    repo.findLessonById.mockResolvedValueOnce(lessonRow(1, { body: "## The idea\n\nOnly this." }));
    const broken = await PUBLISH_LESSON(empty(), params("l1"));
    expect(broken.status).toBe(409);
    expect((await broken.json()).message).toContain("Fix the lesson before publishing");
    expect(repo.publishLesson).not.toHaveBeenCalled();

    repo.findLessonById.mockResolvedValueOnce(lessonRow(1));
    repo.publishLesson.mockResolvedValue({ id: "l1", status: "PUBLISHED" });
    expect((await PUBLISH_LESSON(empty(), params("l1"))).status).toBe(200);
    expect(repo.publishLesson).toHaveBeenCalledWith("l1", "user-1");
  });

  it("is a 404 for an unknown topic or lesson", async () => {
    signedInAs("ADMIN");
    repo.findTopicById.mockResolvedValue(null);
    repo.findTopicWithLessons.mockResolvedValue(null);
    repo.findLessonById.mockResolvedValue(null);
    expect((await CREATE_LESSON(json(LESSON), params("nope"))).status).toBe(404);
    expect((await PUBLISH_TOPIC(empty(), params("nope"))).status).toBe(404);
    expect((await PATCH_LESSON(json(LESSON, "PATCH"), params("nope"))).status).toBe(404);
    expect((await PUBLISH_LESSON(empty(), params("nope"))).status).toBe(404);
  });

  it("tells IndexNow about a published lesson only once its page is public", async () => {
    signedInAs("ADMIN");
    repo.publishLesson.mockResolvedValue({ id: "l1", status: "PUBLISHED" });
    process.env["FEATURE_LEARN"] = "on";
    try {
      repo.findLessonById.mockResolvedValueOnce(lessonRow(1));
      repo.findTopicById.mockResolvedValueOnce({ id: "t1", slug: "delegation", status: "DRAFT" });
      await PUBLISH_LESSON(empty(), params("l1"));
      expect(notifyIndexNow).not.toHaveBeenCalled();

      repo.findLessonById.mockResolvedValueOnce(lessonRow(1));
      repo.findTopicById.mockResolvedValueOnce({
        id: "t1",
        slug: "delegation",
        status: "PUBLISHED",
      });
      await PUBLISH_LESSON(empty(), params("l1"));
      expect(notifyIndexNow).toHaveBeenCalledWith(
        ["https://example.com/topics/delegation/lesson-1", "https://example.com/topics/delegation"],
        expect.anything(),
      );
    } finally {
      delete process.env["FEATURE_LEARN"];
    }
  });
});
