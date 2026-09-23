import { beforeEach, describe, expect, it, vi } from "vitest";

const getServerSession = vi.fn();
const findUnique = vi.fn();
const listArticles = vi.fn();
const createArticle = vi.fn();
const findArticleBySlug = vi.fn();

vi.mock("next-auth/next", () => ({
  getServerSession: (...args: unknown[]) => getServerSession(...args),
}));
vi.mock("@ppu/db", () => ({
  prisma: {
    user: { findUnique: (...args: unknown[]) => findUnique(...args) },
  },
}));
vi.mock("../../../../lib/content", () => ({
  contentRepository: {
    listArticles: (...args: unknown[]) => listArticles(...args),
    createArticle: (...args: unknown[]) => createArticle(...args),
    findArticleBySlug: (...args: unknown[]) => findArticleBySlug(...args),
  },
}));

const { GET, POST } = await import("./route");

function makeGetRequest() {
  return new Request("http://localhost/api/admin/content", { method: "GET" });
}

function makePostRequest(body: unknown) {
  return new Request("http://localhost/api/admin/content", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

const VALID_BODY = {
  slug: "getting-started",
  title: "Getting started",
  type: "TUTORIAL",
  excerpt: "An intro.",
  body: "# Heading\n\nSome content.",
};

/**
 * Authorization mirrors api/admin/deletion-requests/[id]/route.test.ts
 * exactly (MVP-017 reuses ADMIN, docs/final-decisions.md, "MVP-017
 * implementation: content-publishing authorization reuses ADMIN"): a MEMBER
 * must receive the identical response an unauthenticated caller gets.
 */
describe("GET /api/admin/content", () => {
  beforeEach(() => {
    getServerSession.mockReset();
    findUnique.mockReset();
    listArticles.mockReset();
  });

  it("returns 404, not 401, when there is no session", async () => {
    getServerSession.mockResolvedValue(null);

    const response = await GET(makeGetRequest());

    expect(response.status).toBe(404);
    const body = await response.json();
    expect(body.code).toBe("NOT_FOUND");
    expect(listArticles).not.toHaveBeenCalled();
  });

  it("returns the identical 404 body for a signed-in MEMBER as for no session", async () => {
    getServerSession.mockResolvedValue({ user: { id: "user-1" } });
    findUnique.mockResolvedValue({ role: "MEMBER" });

    const response = await GET(makeGetRequest());

    expect(response.status).toBe(404);
    expect(listArticles).not.toHaveBeenCalled();
  });

  it("returns the article list for an ADMIN", async () => {
    getServerSession.mockResolvedValue({ user: { id: "admin-1" } });
    findUnique.mockResolvedValue({ role: "ADMIN" });
    listArticles.mockResolvedValue([{ id: "article-1", slug: "a", status: "DRAFT" }]);

    const response = await GET(makeGetRequest());

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.articles).toHaveLength(1);
  });
});

describe("POST /api/admin/content", () => {
  beforeEach(() => {
    getServerSession.mockReset();
    findUnique.mockReset();
    createArticle.mockReset();
    findArticleBySlug.mockReset();
  });

  it("returns 404, not 401, when there is no session", async () => {
    getServerSession.mockResolvedValue(null);

    const response = await POST(makePostRequest(VALID_BODY));

    expect(response.status).toBe(404);
    expect(createArticle).not.toHaveBeenCalled();
  });

  it("returns the identical 404 body for a signed-in MEMBER as for no session", async () => {
    getServerSession.mockResolvedValue({ user: { id: "user-1" } });
    findUnique.mockResolvedValue({ role: "MEMBER" });

    const response = await POST(makePostRequest(VALID_BODY));

    expect(response.status).toBe(404);
    expect(createArticle).not.toHaveBeenCalled();
  });

  it("rejects an invalid slug (400) before touching the repository", async () => {
    getServerSession.mockResolvedValue({ user: { id: "admin-1" } });
    findUnique.mockResolvedValue({ role: "ADMIN" });

    const response = await POST(makePostRequest({ ...VALID_BODY, slug: "Not A Slug" }));

    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.fieldErrors.slug).toBeDefined();
    expect(createArticle).not.toHaveBeenCalled();
  });

  it("rejects an invalid type", async () => {
    getServerSession.mockResolvedValue({ user: { id: "admin-1" } });
    findUnique.mockResolvedValue({ role: "ADMIN" });

    const response = await POST(makePostRequest({ ...VALID_BODY, type: "LEARNING_PATH" }));

    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.fieldErrors.type).toBeDefined();
  });

  it("rejects an empty title", async () => {
    getServerSession.mockResolvedValue({ user: { id: "admin-1" } });
    findUnique.mockResolvedValue({ role: "ADMIN" });

    const response = await POST(makePostRequest({ ...VALID_BODY, title: "   " }));

    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.fieldErrors.title).toBeDefined();
  });

  it("rejects an empty body", async () => {
    getServerSession.mockResolvedValue({ user: { id: "admin-1" } });
    findUnique.mockResolvedValue({ role: "ADMIN" });

    const response = await POST(makePostRequest({ ...VALID_BODY, body: "" }));

    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.fieldErrors.body).toBeDefined();
  });

  it("returns 409 when the slug is already in use", async () => {
    getServerSession.mockResolvedValue({ user: { id: "admin-1" } });
    findUnique.mockResolvedValue({ role: "ADMIN" });
    findArticleBySlug.mockResolvedValue({ id: "existing-article" });

    const response = await POST(makePostRequest(VALID_BODY));

    expect(response.status).toBe(409);
    expect(createArticle).not.toHaveBeenCalled();
  });

  it("creates the article as DRAFT, authored by the signed-in admin", async () => {
    getServerSession.mockResolvedValue({ user: { id: "admin-1" } });
    findUnique.mockResolvedValue({ role: "ADMIN" });
    findArticleBySlug.mockResolvedValue(null);
    createArticle.mockResolvedValue({ id: "new-article", ...VALID_BODY, status: "DRAFT" });

    const response = await POST(makePostRequest(VALID_BODY));

    expect(response.status).toBe(201);
    expect(createArticle).toHaveBeenCalledWith(
      expect.objectContaining({ slug: VALID_BODY.slug, authorUserId: "admin-1" }),
    );
  });
});
