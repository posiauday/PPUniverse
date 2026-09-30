import { beforeEach, describe, expect, it, vi } from "vitest";

const getServerSession = vi.fn();
const findUnique = vi.fn();
const findArticleById = vi.fn();
const findArticleBySlug = vi.fn();
const updateArticle = vi.fn();

vi.mock("next-auth/next", () => ({
  getServerSession: (...args: unknown[]) => getServerSession(...args),
}));
vi.mock("@ppu/db", () => ({
  prisma: {
    user: { findUnique: (...args: unknown[]) => findUnique(...args) },
  },
}));
vi.mock("../../../../../lib/content", () => ({
  contentRepository: {
    findArticleById: (...args: unknown[]) => findArticleById(...args),
    findArticleBySlug: (...args: unknown[]) => findArticleBySlug(...args),
    updateArticle: (...args: unknown[]) => updateArticle(...args),
  },
}));

const { GET, PATCH } = await import("./route");

const EXISTING_ARTICLE = {
  id: "article-1",
  slug: "existing-slug",
  title: "Existing title",
  type: "TUTORIAL",
  body: "Existing body.",
  excerpt: null,
  status: "DRAFT",
  publishedAt: null,
  authorUserId: "admin-1",
};

function makeGetRequest() {
  return new Request("http://localhost/api/admin/content/article-1", { method: "GET" });
}

function makePatchRequest(body: unknown) {
  return new Request("http://localhost/api/admin/content/article-1", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

const params = Promise.resolve({ id: "article-1" });

const VALID_UPDATE = {
  slug: "existing-slug",
  title: "Updated title",
  type: "PATTERN",
  excerpt: "Updated excerpt.",
  body: "Updated body.",
};

describe("GET /api/admin/content/[id]", () => {
  beforeEach(() => {
    getServerSession.mockReset();
    findUnique.mockReset();
    findArticleById.mockReset();
  });

  it("returns 404, not 401, when there is no session", async () => {
    getServerSession.mockResolvedValue(null);

    const response = await GET(makeGetRequest(), { params });

    expect(response.status).toBe(404);
    expect(findArticleById).not.toHaveBeenCalled();
  });

  it("returns the identical 404 body for a signed-in MEMBER as for no session", async () => {
    getServerSession.mockResolvedValue({ user: { id: "user-1" } });
    findUnique.mockResolvedValue({ role: "MEMBER" });

    const response = await GET(makeGetRequest(), { params });

    expect(response.status).toBe(404);
    expect(findArticleById).not.toHaveBeenCalled();
  });

  it("returns 404 for an unknown article id, even for an admin", async () => {
    getServerSession.mockResolvedValue({ user: { id: "admin-1" } });
    findUnique.mockResolvedValue({ role: "ADMIN" });
    findArticleById.mockResolvedValue(null);

    const response = await GET(makeGetRequest(), { params });

    expect(response.status).toBe(404);
  });

  it("returns the article for an admin", async () => {
    getServerSession.mockResolvedValue({ user: { id: "admin-1" } });
    findUnique.mockResolvedValue({ role: "ADMIN" });
    findArticleById.mockResolvedValue(EXISTING_ARTICLE);

    const response = await GET(makeGetRequest(), { params });

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.article.id).toBe("article-1");
  });
});

describe("PATCH /api/admin/content/[id]", () => {
  beforeEach(() => {
    getServerSession.mockReset();
    findUnique.mockReset();
    findArticleById.mockReset();
    findArticleBySlug.mockReset();
    updateArticle.mockReset();
  });

  it("returns 404, not 401, when there is no session", async () => {
    getServerSession.mockResolvedValue(null);

    const response = await PATCH(makePatchRequest(VALID_UPDATE), { params });

    expect(response.status).toBe(404);
    expect(updateArticle).not.toHaveBeenCalled();
  });

  it("returns the identical 404 body for a signed-in MEMBER as for no session", async () => {
    getServerSession.mockResolvedValue({ user: { id: "user-1" } });
    findUnique.mockResolvedValue({ role: "MEMBER" });

    const response = await PATCH(makePatchRequest(VALID_UPDATE), { params });

    expect(response.status).toBe(404);
    expect(updateArticle).not.toHaveBeenCalled();
  });

  it("returns 404 for an unknown article id", async () => {
    getServerSession.mockResolvedValue({ user: { id: "admin-1" } });
    findUnique.mockResolvedValue({ role: "ADMIN" });
    findArticleById.mockResolvedValue(null);

    const response = await PATCH(makePatchRequest(VALID_UPDATE), { params });

    expect(response.status).toBe(404);
    expect(updateArticle).not.toHaveBeenCalled();
  });

  it("rejects an invalid body payload (400)", async () => {
    getServerSession.mockResolvedValue({ user: { id: "admin-1" } });
    findUnique.mockResolvedValue({ role: "ADMIN" });
    findArticleById.mockResolvedValue(EXISTING_ARTICLE);

    const response = await PATCH(makePatchRequest({ ...VALID_UPDATE, type: "NOT_A_TYPE" }), {
      params,
    });

    expect(response.status).toBe(400);
    expect(updateArticle).not.toHaveBeenCalled();
  });

  it("returns 409 when renaming to a slug another article already owns", async () => {
    getServerSession.mockResolvedValue({ user: { id: "admin-1" } });
    findUnique.mockResolvedValue({ role: "ADMIN" });
    findArticleById.mockResolvedValue(EXISTING_ARTICLE);
    findArticleBySlug.mockResolvedValue({ id: "different-article-id" });

    const response = await PATCH(
      makePatchRequest({ ...VALID_UPDATE, slug: "someone-elses-slug" }),
      {
        params,
      },
    );

    expect(response.status).toBe(409);
    expect(updateArticle).not.toHaveBeenCalled();
  });

  it("allows keeping the same slug without a uniqueness lookup against itself", async () => {
    getServerSession.mockResolvedValue({ user: { id: "admin-1" } });
    findUnique.mockResolvedValue({ role: "ADMIN" });
    findArticleById.mockResolvedValue(EXISTING_ARTICLE);
    updateArticle.mockResolvedValue({ ...EXISTING_ARTICLE, ...VALID_UPDATE });

    const response = await PATCH(makePatchRequest(VALID_UPDATE), { params });

    expect(response.status).toBe(200);
    expect(findArticleBySlug).not.toHaveBeenCalled();
  });

  it("never accepts a client-supplied status or publishedAt (not part of the update payload at all)", async () => {
    getServerSession.mockResolvedValue({ user: { id: "admin-1" } });
    findUnique.mockResolvedValue({ role: "ADMIN" });
    findArticleById.mockResolvedValue(EXISTING_ARTICLE);
    updateArticle.mockResolvedValue({ ...EXISTING_ARTICLE, ...VALID_UPDATE });

    await PATCH(
      makePatchRequest({ ...VALID_UPDATE, status: "PUBLISHED", publishedAt: "2020-01-01" }),
      { params },
    );

    const callArgs = updateArticle.mock.calls[0]?.[1];
    expect(callArgs).not.toHaveProperty("status");
    expect(callArgs).not.toHaveProperty("publishedAt");
  });
});
