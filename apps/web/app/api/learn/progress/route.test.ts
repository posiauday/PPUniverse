import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const ORIGIN = "https://example.com";
const currentUserId = vi.fn();
const repo = {
  findPublishedLessonId: vi.fn(),
  setLessonDone: vi.fn(),
  clearProgress: vi.fn(),
};

vi.mock("../../../../lib/comments", () => ({ currentUserId: () => currentUserId() }));
vi.mock("../../../../lib/learn", () => ({ learnRepository: repo }));
vi.mock("@ppu/db", () => ({ prisma: {} }));

const { POST, DELETE } = await import("./route");

function request(method: "POST" | "DELETE", body: unknown, origin: string | null = ORIGIN) {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (origin) headers["Origin"] = origin;
  return new Request(`${ORIGIN}/api/learn/progress`, {
    method,
    headers,
    body: JSON.stringify(body),
  });
}
const MARK = { topic: "delegation", lesson: "lesson-1", done: "true" };

beforeEach(() => {
  vi.clearAllMocks();
  vi.stubEnv("NEXT_PUBLIC_SITE_URL", ORIGIN);
  vi.stubEnv("FEATURE_LEARN", "on");
});
afterEach(() => vi.unstubAllEnvs());

describe("/api/learn/progress (MVP-048)", () => {
  it("marks a published lesson done for the signed-in reader only", async () => {
    currentUserId.mockResolvedValue("reader-1");
    repo.findPublishedLessonId.mockResolvedValue("l1");
    const response = await POST(request("POST", MARK));
    expect(response.status).toBe(200);
    expect(repo.findPublishedLessonId).toHaveBeenCalledWith("delegation", "lesson-1");
    expect(repo.setLessonDone).toHaveBeenCalledWith("reader-1", "l1", true);

    await POST(request("POST", { ...MARK, done: "false" }));
    expect(repo.setLessonDone).toHaveBeenLastCalledWith("reader-1", "l1", false);
  });

  it("needs sign-in, the same origin, a real published lesson and a yes/no", async () => {
    currentUserId.mockResolvedValue(null);
    expect((await POST(request("POST", MARK))).status).toBe(401);
    expect((await DELETE(request("DELETE", {}))).status).toBe(401);

    currentUserId.mockResolvedValue("reader-1");
    expect((await POST(request("POST", MARK, "https://evil.example"))).status).toBe(403);
    expect((await POST(request("POST", { ...MARK, done: "maybe" }))).status).toBe(400);
    repo.findPublishedLessonId.mockResolvedValue(null);
    expect((await POST(request("POST", MARK))).status).toBe(404);
    expect(repo.setLessonDone).not.toHaveBeenCalled();
  });

  it("clears all of the reader's progress", async () => {
    currentUserId.mockResolvedValue("reader-1");
    expect((await DELETE(request("DELETE", {}))).status).toBe(200);
    expect(repo.clearProgress).toHaveBeenCalledWith("reader-1");
  });

  it("is a 404 while the Learn module is off", async () => {
    vi.stubEnv("FEATURE_LEARN", "");
    currentUserId.mockResolvedValue("reader-1");
    expect((await POST(request("POST", MARK))).status).toBe(404);
    expect((await DELETE(request("DELETE", {}))).status).toBe(404);
  });
});
