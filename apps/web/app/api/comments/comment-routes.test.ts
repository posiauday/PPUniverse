import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

/**
 * Comments and profiles (MVP-040): the HTTP layer, with the repositories and
 * the session mocked. The repository itself is tested against Postgres in
 * @ppu/adapter-content.
 */
const content = vi.hoisted(() => ({ findPublishedArticleBySlug: vi.fn() }));
const feedback = vi.hoisted(() => ({ consumeAllowance: vi.fn() }));
const comments = vi.hoisted(() => ({
  getOrCreateProfile: vi.fn(),
  create: vi.fn(),
  report: vi.fn(),
  deleteOwn: vi.fn(),
  setDisplayName: vi.fn(),
  setAvatarSeed: vi.fn(),
  setRemoved: vi.fn(),
  setAccepted: vi.fn(),
  clearReports: vi.fn(),
}));
const session = vi.hoisted(() => ({ userId: null as string | null, admin: false }));
const logs = vi.hoisted(() => ({ info: vi.fn() }));

vi.mock("../../../lib/content", () => ({ contentRepository: content }));
vi.mock("../../../lib/feedback", async (importOriginal) => ({
  ...(await importOriginal<typeof import("../../../lib/feedback")>()),
  feedbackRepository: feedback,
}));
vi.mock("../../../lib/comments", async (importOriginal) => ({
  ...(await importOriginal<typeof import("../../../lib/comments")>()),
  commentRepository: comments,
  currentUserId: async () => session.userId,
}));
vi.mock("../../../lib/require-admin", async (importOriginal) => ({
  ...(await importOriginal<typeof import("../../../lib/require-admin")>()),
  requireAdmin: async () => (session.admin ? { userId: "admin-1" } : null),
}));
vi.mock("@ppu/db", () => ({ prisma: {} }));
vi.mock("@ppu/telemetry", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@ppu/telemetry")>()),
  logger: { info: logs.info, warn: vi.fn(), error: vi.fn() },
}));

const create = await import("../guides/[slug]/comments/route");
const report = await import("./[id]/report/route");
const remove = await import("./[id]/delete/route");
const profile = await import("../account/profile/route");
const moderate = await import("../admin/comments/[id]/[action]/route");

const ORIGIN = "https://lowcodestacks.example";

function post(path: string, body: unknown, origin: string | null = ORIGIN) {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "x-nf-client-connection-ip": "203.0.113.5",
  };
  if (origin) headers["Origin"] = origin;
  return new Request(`${ORIGIN}${path}`, {
    method: "POST",
    headers,
    body: typeof body === "string" ? body : JSON.stringify(body),
  });
}

const slug = { params: Promise.resolve({ slug: "a-guide" }) };
const id = { params: Promise.resolve({ id: "c-1" }) };
const BODY = "Turn on pagination in the action's settings, then set a threshold.";

beforeEach(() => {
  vi.stubEnv("NEXT_PUBLIC_SITE_URL", ORIGIN);
  vi.stubEnv("FEATURE_COMMENTS", "on");
  session.userId = "user-1";
  session.admin = false;
  content.findPublishedArticleBySlug.mockResolvedValue({ id: "art-1", slug: "a-guide" });
  feedback.consumeAllowance.mockResolvedValue(true);
  comments.getOrCreateProfile.mockResolvedValue({
    displayName: "Tidy Trigger 418",
    avatarSeed: "s",
  });
  comments.create.mockResolvedValue({ id: "c-1" });
  comments.report.mockResolvedValue(true);
  comments.deleteOwn.mockResolvedValue(true);
  comments.setDisplayName.mockResolvedValue(true);
  comments.setRemoved.mockResolvedValue(true);
  comments.setAccepted.mockResolvedValue(true);
  comments.clearReports.mockResolvedValue(true);
});

afterEach(() => {
  vi.clearAllMocks();
  vi.unstubAllEnvs();
});

describe("POST /api/guides/[slug]/comments", () => {
  it("posts a signed-in reader's comment on a published guide, without logging its text", async () => {
    const response = await create.POST(post("/api/guides/a-guide/comments", { body: BODY }), slug);
    expect(response.status).toBe(200);
    expect(response.headers.get("Cache-Control")).toBe("no-store");
    expect(comments.getOrCreateProfile).toHaveBeenCalledWith("user-1", expect.any(Function));
    expect(comments.create).toHaveBeenCalledWith("art-1", "user-1", BODY);
    expect(JSON.stringify(logs.info.mock.calls)).not.toContain("pagination");
  });

  it("answers 404 for everything while comments are off", async () => {
    vi.stubEnv("FEATURE_COMMENTS", "");
    expect(
      (await create.POST(post("/api/guides/a-guide/comments", { body: BODY }), slug)).status,
    ).toBe(404);
    expect((await report.POST(post("/api/comments/c-1/report", {}), id)).status).toBe(404);
    expect((await remove.POST(post("/api/comments/c-1/delete", {}), id)).status).toBe(404);
    expect((await profile.POST(post("/api/account/profile", { avatar: "new" }))).status).toBe(404);
    session.admin = true;
    const admin = { params: Promise.resolve({ id: "c-1", action: "remove" }) };
    expect((await moderate.POST(post("/api/admin/comments/c-1/remove", {}), admin)).status).toBe(
      404,
    );
    expect(comments.create).not.toHaveBeenCalled();
  });

  it("refuses guests, other sites, bad text and unpublished guides", async () => {
    session.userId = null;
    expect(
      (await create.POST(post("/api/guides/a-guide/comments", { body: BODY }), slug)).status,
    ).toBe(401);
    session.userId = "user-1";
    expect(
      (await create.POST(post("/api/guides/a-guide/comments", { body: BODY }, null), slug)).status,
    ).toBe(403);
    const short = await create.POST(post("/api/guides/a-guide/comments", { body: "short" }), slug);
    expect(short.status).toBe(400);
    expect(await short.json()).toEqual({ error: "too-short" });
    const links = "https://a.example https://b.example https://c.example are three links";
    const tooMany = await create.POST(post("/api/guides/a-guide/comments", { body: links }), slug);
    expect(await tooMany.json()).toEqual({ error: "too-many-links" });
    content.findPublishedArticleBySlug.mockResolvedValueOnce(null);
    expect(
      (await create.POST(post("/api/guides/a-guide/comments", { body: BODY }), slug)).status,
    ).toBe(404);
    expect(comments.create).not.toHaveBeenCalled();
  });

  it("limits how often a reader can post", async () => {
    feedback.consumeAllowance.mockResolvedValueOnce(false);
    const response = await create.POST(post("/api/guides/a-guide/comments", { body: BODY }), slug);
    expect(response.status).toBe(429);
    expect(comments.create).not.toHaveBeenCalled();
  });
});

describe("POST /api/comments/[id]/report and /delete", () => {
  it("lets anyone report a comment, within a limit", async () => {
    session.userId = null;
    expect((await report.POST(post("/api/comments/c-1/report", {}), id)).status).toBe(200);
    expect(comments.report).toHaveBeenCalledWith("c-1");
    feedback.consumeAllowance.mockResolvedValueOnce(false);
    expect((await report.POST(post("/api/comments/c-1/report", {}), id)).status).toBe(429);
    comments.report.mockResolvedValueOnce(false);
    expect((await report.POST(post("/api/comments/c-1/report", {}), id)).status).toBe(404);
  });

  it("lets only the author delete, and a guest not at all", async () => {
    expect((await remove.POST(post("/api/comments/c-1/delete", {}), id)).status).toBe(200);
    expect(comments.deleteOwn).toHaveBeenCalledWith("c-1", "user-1");
    comments.deleteOwn.mockResolvedValueOnce(false);
    expect((await remove.POST(post("/api/comments/c-1/delete", {}), id)).status).toBe(404);
    session.userId = null;
    expect((await remove.POST(post("/api/comments/c-1/delete", {}), id)).status).toBe(401);
  });
});

describe("POST /api/account/profile", () => {
  it("saves a valid, free name, and refuses taken or official-looking ones", async () => {
    const saved = await profile.POST(post("/api/account/profile", { displayName: "  Priya  K " }));
    expect(await saved.json()).toEqual({ ok: true, displayName: "Priya K" });
    expect(comments.setDisplayName).toHaveBeenCalledWith("user-1", "Priya K");

    comments.setDisplayName.mockResolvedValueOnce(false);
    const taken = await profile.POST(post("/api/account/profile", { displayName: "Priya K" }));
    expect(taken.status).toBe(409);
    const official = await profile.POST(
      post("/api/account/profile", { displayName: "Site Admin" }),
    );
    expect(await official.json()).toEqual({ error: "reserved" });
  });

  it("limits a reader to ten changes a day, but never an admin", async () => {
    feedback.consumeAllowance.mockResolvedValue(false);
    const limited = await profile.POST(post("/api/account/profile", { avatar: "new" }));
    expect(limited.status).toBe(429);
    expect(await limited.json()).toEqual({ error: "too-many" });

    session.admin = true;
    feedback.consumeAllowance.mockClear();
    expect((await profile.POST(post("/api/account/profile", { avatar: "new" }))).status).toBe(200);
    expect(feedback.consumeAllowance).not.toHaveBeenCalled();
  });

  it("draws a new avatar, and refuses guests", async () => {
    expect((await profile.POST(post("/api/account/profile", { avatar: "new" }))).status).toBe(200);
    expect(comments.setAvatarSeed).toHaveBeenCalledWith("user-1", expect.any(String));
    session.userId = null;
    expect((await profile.POST(post("/api/account/profile", { avatar: "new" }))).status).toBe(401);
  });
});

describe("POST /api/admin/comments/[id]/[action]", () => {
  const as = (action: string) => ({ params: Promise.resolve({ id: "c-1", action }) });

  it("removes, restores, accepts and unaccepts for an admin", async () => {
    session.admin = true;
    for (const action of ["remove", "restore", "keep", "accept", "unaccept"]) {
      expect(
        (await moderate.POST(post(`/api/admin/comments/c-1/${action}`, {}), as(action))).status,
      ).toBe(200);
    }
    expect(comments.setRemoved.mock.calls).toEqual([
      ["c-1", true],
      ["c-1", false],
    ]);
    expect(comments.setAccepted.mock.calls).toEqual([
      ["c-1", true],
      ["c-1", false],
    ]);
    expect(comments.clearReports).toHaveBeenCalledWith("c-1");
  });

  it("is a 404 for anyone else, and for an unknown action", async () => {
    expect(
      (await moderate.POST(post("/api/admin/comments/c-1/remove", {}), as("remove"))).status,
    ).toBe(404);
    session.admin = true;
    expect(
      (await moderate.POST(post("/api/admin/comments/c-1/delete", {}), as("delete"))).status,
    ).toBe(404);
    expect(comments.setRemoved).not.toHaveBeenCalled();
  });
});
