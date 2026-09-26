import { beforeEach, describe, expect, it, vi } from "vitest";

const getServerSession = vi.fn();
const findUnique = vi.fn();
const listProductsForAdmin = vi.fn();
const createProductDraft = vi.fn();
const listCategories = vi.fn();

class PrismaClientKnownRequestError extends Error {
  code: string;
  meta?: unknown;
  constructor(message: string, opts: { code: string; meta?: unknown }) {
    super(message);
    this.code = opts.code;
    this.meta = opts.meta;
  }
}

vi.mock("next-auth/next", () => ({
  getServerSession: (...args: unknown[]) => getServerSession(...args),
}));
vi.mock("@ppu/db", () => ({
  prisma: {
    user: { findUnique: (...args: unknown[]) => findUnique(...args) },
  },
  Prisma: { PrismaClientKnownRequestError },
}));
vi.mock("../../../../lib/catalog", () => ({
  catalogRepository: {
    listProductsForAdmin: (...args: unknown[]) => listProductsForAdmin(...args),
    createProductDraft: (...args: unknown[]) => createProductDraft(...args),
    listCategories: (...args: unknown[]) => listCategories(...args),
  },
}));

const { GET, POST } = await import("./route");

function makeGetRequest() {
  return new Request("http://localhost/api/admin/products", { method: "GET" });
}

function makePostRequest(body: unknown) {
  return new Request("http://localhost/api/admin/products", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

const VALID_BODY = {
  name: "Approval Workflow Starter Kit",
  slug: "approval-workflow-starter-kit",
  summary: "A starter kit for approval workflows.",
  categoryId: "category-1",
};

const CATEGORIES = [{ id: "category-1", slug: "power-apps-components" }];

describe("GET /api/admin/products", () => {
  beforeEach(() => {
    getServerSession.mockReset();
    findUnique.mockReset();
    listProductsForAdmin.mockReset();
  });

  it("returns 404, not 401, when there is no session", async () => {
    getServerSession.mockResolvedValue(null);

    const response = await GET(makeGetRequest());

    expect(response.status).toBe(404);
    const body = await response.json();
    expect(body.code).toBe("NOT_FOUND");
    expect(listProductsForAdmin).not.toHaveBeenCalled();
  });

  it("returns the identical 404 body for a signed-in MEMBER as for no session", async () => {
    getServerSession.mockResolvedValue({ user: { id: "user-1" } });
    findUnique.mockResolvedValue({ role: "MEMBER" });

    const response = await GET(makeGetRequest());

    expect(response.status).toBe(404);
    expect(listProductsForAdmin).not.toHaveBeenCalled();
  });

  it("returns the product list for an ADMIN", async () => {
    getServerSession.mockResolvedValue({ user: { id: "admin-1" } });
    findUnique.mockResolvedValue({ role: "ADMIN" });
    listProductsForAdmin.mockResolvedValue([{ id: "product-1", status: "DRAFT" }]);

    const response = await GET(makeGetRequest());

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.products).toHaveLength(1);
  });
});

describe("POST /api/admin/products", () => {
  beforeEach(() => {
    getServerSession.mockReset();
    findUnique.mockReset();
    createProductDraft.mockReset();
    listCategories.mockReset();
    listCategories.mockResolvedValue(CATEGORIES);
  });

  it("returns 404, not 401, when there is no session", async () => {
    getServerSession.mockResolvedValue(null);

    const response = await POST(makePostRequest(VALID_BODY));

    expect(response.status).toBe(404);
    expect(createProductDraft).not.toHaveBeenCalled();
  });

  it("returns the identical 404 body for a signed-in MEMBER as for no session", async () => {
    getServerSession.mockResolvedValue({ user: { id: "user-1" } });
    findUnique.mockResolvedValue({ role: "MEMBER" });

    const response = await POST(makePostRequest(VALID_BODY));

    expect(response.status).toBe(404);
    expect(createProductDraft).not.toHaveBeenCalled();
  });

  it("rejects an invalid slug (400) before touching the repository", async () => {
    getServerSession.mockResolvedValue({ user: { id: "admin-1" } });
    findUnique.mockResolvedValue({ role: "ADMIN" });

    const response = await POST(makePostRequest({ ...VALID_BODY, slug: "Not A Slug" }));

    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.fieldErrors.slug).toBeDefined();
    expect(createProductDraft).not.toHaveBeenCalled();
  });

  it("rejects an empty name", async () => {
    getServerSession.mockResolvedValue({ user: { id: "admin-1" } });
    findUnique.mockResolvedValue({ role: "ADMIN" });

    const response = await POST(makePostRequest({ ...VALID_BODY, name: "   " }));

    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.fieldErrors.name).toBeDefined();
  });

  it("rejects an empty summary", async () => {
    getServerSession.mockResolvedValue({ user: { id: "admin-1" } });
    findUnique.mockResolvedValue({ role: "ADMIN" });

    const response = await POST(makePostRequest({ ...VALID_BODY, summary: "" }));

    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.fieldErrors.summary).toBeDefined();
  });

  it("rejects a categoryId that does not reference a real category", async () => {
    getServerSession.mockResolvedValue({ user: { id: "admin-1" } });
    findUnique.mockResolvedValue({ role: "ADMIN" });

    const response = await POST(makePostRequest({ ...VALID_BODY, categoryId: "does-not-exist" }));

    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.fieldErrors.categoryId).toBeDefined();
    expect(createProductDraft).not.toHaveBeenCalled();
  });

  it("returns 409 when the slug is already in use", async () => {
    getServerSession.mockResolvedValue({ user: { id: "admin-1" } });
    findUnique.mockResolvedValue({ role: "ADMIN" });
    createProductDraft.mockRejectedValue(
      new PrismaClientKnownRequestError("Unique constraint failed", {
        code: "P2002",
        meta: { target: ["slug"] },
      }),
    );

    const response = await POST(makePostRequest(VALID_BODY));

    expect(response.status).toBe(409);
    const body = await response.json();
    expect(body.fieldErrors.slug).toBeDefined();
  });

  it("creates the product as DRAFT", async () => {
    getServerSession.mockResolvedValue({ user: { id: "admin-1" } });
    findUnique.mockResolvedValue({ role: "ADMIN" });
    createProductDraft.mockResolvedValue({ id: "new-product", ...VALID_BODY, status: "DRAFT" });

    const response = await POST(makePostRequest(VALID_BODY));

    expect(response.status).toBe(201);
    expect(createProductDraft).toHaveBeenCalledWith(
      expect.objectContaining({ slug: VALID_BODY.slug }),
    );
  });
});
