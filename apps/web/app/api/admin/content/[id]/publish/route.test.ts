import { beforeEach, describe, expect, it, vi } from "vitest";

const getServerSession = vi.fn();
const findUnique = vi.fn();
const findArticleById = vi.fn();
const publishArticle = vi.fn();

vi.mock("next-auth/next", () => ({
  getServerSession: (...args: unknown[]) => getServerSession(...args),
}));
vi.mock("@ppu/db", () => ({
  prisma: {
    user: { findUnique: (...args: unknown[]) => findUnique(...args) },
  },
}));
vi.mock("../../../../../../lib/content", () => ({
  contentRepository: {
    findArticleById: (...args: unknown[]) => findArticleById(...args),
    publishArticle: (...args: unknown[]) => publishArticle(...args),
  },
}));

const { POST } = await import("./route");

const params = Promise.resolve({ id: "article-1" });

function makeRequest() {
  return new Request("http://localhost/api/admin/content/article-1/publish", { method: "POST" });
}

/**
 * Authorization mirrors api/admin/deletion-requests/[id]/route.test.ts:
 * content-publishing authority reuses ADMIN (docs/final-decisions.md,
 * "MVP-017 implementation: content-publishing authorization reuses ADMIN").
 */
describe("POST /api/admin/content/[id]/publish", () => {
  beforeEach(() => {
    getServerSession.mockReset();
    findUnique.mockReset();
    findArticleById.mockReset();
    publishArticle.mockReset();
  });

  it("returns 404, not 401, when there is no session", async () => {
    getServerSession.mockResolvedValue(null);

    const response = await POST(makeRequest(), { params });

    expect(response.status).toBe(404);
    expect(publishArticle).not.toHaveBeenCalled();
  });

  it("returns the identical 404 body for a signed-in MEMBER as for no session", async () => {
    getServerSession.mockResolvedValue({ user: { id: "user-1" } });
    findUnique.mockResolvedValue({ role: "MEMBER" });

    const response = await POST(makeRequest(), { params });

    expect(response.status).toBe(404);
    expect(publishArticle).not.toHaveBeenCalled();
  });

  it("returns 404 for an unknown article id", async () => {
    getServerSession.mockResolvedValue({ user: { id: "admin-1" } });
    findUnique.mockResolvedValue({ role: "ADMIN" });
    findArticleById.mockResolvedValue(null);

    const response = await POST(makeRequest(), { params });

    expect(response.status).toBe(404);
    expect(publishArticle).not.toHaveBeenCalled();
  });

  it("returns 409 for an already-PUBLISHED article (no double-publish) without calling the repository write", async () => {
    getServerSession.mockResolvedValue({ user: { id: "admin-1" } });
    findUnique.mockResolvedValue({ role: "ADMIN" });
    findArticleById.mockResolvedValue({ id: "article-1", status: "PUBLISHED" });

    const response = await POST(makeRequest(), { params });

    expect(response.status).toBe(409);
    expect(publishArticle).not.toHaveBeenCalled();
  });

  it("publishes a DRAFT article, attributing the action to the signed-in admin", async () => {
    getServerSession.mockResolvedValue({ user: { id: "admin-1" } });
    findUnique.mockResolvedValue({ role: "ADMIN" });
    findArticleById.mockResolvedValue({ id: "article-1", status: "DRAFT" });
    publishArticle.mockResolvedValue({
      id: "article-1",
      status: "PUBLISHED",
      publishedAt: new Date(),
    });

    const response = await POST(makeRequest(), { params });

    expect(response.status).toBe(200);
    expect(publishArticle).toHaveBeenCalledWith("article-1", "admin-1");
  });
});
