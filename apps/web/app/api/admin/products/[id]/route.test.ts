import { beforeEach, describe, expect, it, vi } from "vitest";

const getServerSession = vi.fn();
const findUnique = vi.fn();
const findProductByIdForAdmin = vi.fn();
const updateProductDraft = vi.fn();
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
vi.mock("../../../../../lib/catalog", () => ({
  catalogRepository: {
    findProductByIdForAdmin: (...args: unknown[]) => findProductByIdForAdmin(...args),
    updateProductDraft: (...args: unknown[]) => updateProductDraft(...args),
    listCategories: (...args: unknown[]) => listCategories(...args),
  },
}));

const { GET, PATCH } = await import("./route");

const params = Promise.resolve({ id: "product-1" });
const CATEGORIES = [{ id: "category-1", slug: "power-apps-components" }];
const VALID_BODY = {
  name: "Approval Workflow Starter Kit",
  slug: "approval-workflow-starter-kit",
  summary: "A starter kit for approval workflows.",
  categoryId: "category-1",
};

function makeGetRequest() {
  return new Request("http://localhost/api/admin/products/product-1", { method: "GET" });
}

function makePatchRequest(body: unknown) {
  return new Request("http://localhost/api/admin/products/product-1", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("GET /api/admin/products/[id]", () => {
  beforeEach(() => {
    getServerSession.mockReset();
    findUnique.mockReset();
    findProductByIdForAdmin.mockReset();
  });

  it("returns 404, not 401, when there is no session", async () => {
    getServerSession.mockResolvedValue(null);

    const response = await GET(makeGetRequest(), { params });

    expect(response.status).toBe(404);
    expect(findProductByIdForAdmin).not.toHaveBeenCalled();
  });

  it("returns the identical 404 body for a signed-in MEMBER as for no session", async () => {
    getServerSession.mockResolvedValue({ user: { id: "user-1" } });
    findUnique.mockResolvedValue({ role: "MEMBER" });

    const response = await GET(makeGetRequest(), { params });

    expect(response.status).toBe(404);
    expect(findProductByIdForAdmin).not.toHaveBeenCalled();
  });

  it("returns 404 for an unknown product id", async () => {
    getServerSession.mockResolvedValue({ user: { id: "admin-1" } });
    findUnique.mockResolvedValue({ role: "ADMIN" });
    findProductByIdForAdmin.mockResolvedValue(null);

    const response = await GET(makeGetRequest(), { params });

    expect(response.status).toBe(404);
  });

  it("returns the product for an ADMIN", async () => {
    getServerSession.mockResolvedValue({ user: { id: "admin-1" } });
    findUnique.mockResolvedValue({ role: "ADMIN" });
    findProductByIdForAdmin.mockResolvedValue({ id: "product-1", status: "DRAFT" });

    const response = await GET(makeGetRequest(), { params });

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.product.id).toBe("product-1");
  });
});

describe("PATCH /api/admin/products/[id]", () => {
  beforeEach(() => {
    getServerSession.mockReset();
    findUnique.mockReset();
    findProductByIdForAdmin.mockReset();
    updateProductDraft.mockReset();
    listCategories.mockReset();
    listCategories.mockResolvedValue(CATEGORIES);
  });

  it("returns 404, not 401, when there is no session", async () => {
    getServerSession.mockResolvedValue(null);

    const response = await PATCH(makePatchRequest(VALID_BODY), { params });

    expect(response.status).toBe(404);
    expect(updateProductDraft).not.toHaveBeenCalled();
  });

  it("returns the identical 404 body for a signed-in MEMBER as for no session", async () => {
    getServerSession.mockResolvedValue({ user: { id: "user-1" } });
    findUnique.mockResolvedValue({ role: "MEMBER" });

    const response = await PATCH(makePatchRequest(VALID_BODY), { params });

    expect(response.status).toBe(404);
    expect(updateProductDraft).not.toHaveBeenCalled();
  });

  it("returns 404 for an unknown product id", async () => {
    getServerSession.mockResolvedValue({ user: { id: "admin-1" } });
    findUnique.mockResolvedValue({ role: "ADMIN" });
    findProductByIdForAdmin.mockResolvedValue(null);

    const response = await PATCH(makePatchRequest(VALID_BODY), { params });

    expect(response.status).toBe(404);
    expect(updateProductDraft).not.toHaveBeenCalled();
  });

  it("rejects an invalid body (400) before touching the repository write", async () => {
    getServerSession.mockResolvedValue({ user: { id: "admin-1" } });
    findUnique.mockResolvedValue({ role: "ADMIN" });
    findProductByIdForAdmin.mockResolvedValue({ id: "product-1", status: "DRAFT" });

    const response = await PATCH(makePatchRequest({ ...VALID_BODY, slug: "Not A Slug" }), {
      params,
    });

    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.fieldErrors.slug).toBeDefined();
    expect(updateProductDraft).not.toHaveBeenCalled();
  });

  it("never accepts a status or publishedAt field -- ProductUpdateInput has no such fields", async () => {
    getServerSession.mockResolvedValue({ user: { id: "admin-1" } });
    findUnique.mockResolvedValue({ role: "ADMIN" });
    findProductByIdForAdmin.mockResolvedValue({ id: "product-1", status: "DRAFT" });
    updateProductDraft.mockResolvedValue({ id: "product-1", ...VALID_BODY, status: "DRAFT" });

    await PATCH(
      makePatchRequest({
        ...VALID_BODY,
        status: "PUBLISHED",
        publishedAt: new Date().toISOString(),
      }),
      { params },
    );

    const callArgs = updateProductDraft.mock.calls[0]?.[1] as Record<string, unknown>;
    expect(callArgs).not.toHaveProperty("status");
    expect(callArgs).not.toHaveProperty("publishedAt");
  });

  it("returns 409 when the new slug is already in use", async () => {
    getServerSession.mockResolvedValue({ user: { id: "admin-1" } });
    findUnique.mockResolvedValue({ role: "ADMIN" });
    findProductByIdForAdmin.mockResolvedValue({ id: "product-1", status: "DRAFT" });
    updateProductDraft.mockRejectedValue(
      new PrismaClientKnownRequestError("Unique constraint failed", {
        code: "P2002",
        meta: { target: ["slug"] },
      }),
    );

    const response = await PATCH(makePatchRequest(VALID_BODY), { params });

    expect(response.status).toBe(409);
  });

  it("updates the product's core fields", async () => {
    getServerSession.mockResolvedValue({ user: { id: "admin-1" } });
    findUnique.mockResolvedValue({ role: "ADMIN" });
    findProductByIdForAdmin.mockResolvedValue({ id: "product-1", status: "DRAFT" });
    updateProductDraft.mockResolvedValue({ id: "product-1", ...VALID_BODY, status: "DRAFT" });

    const response = await PATCH(makePatchRequest(VALID_BODY), { params });

    expect(response.status).toBe(200);
    expect(updateProductDraft).toHaveBeenCalledWith(
      "product-1",
      expect.objectContaining({ name: VALID_BODY.name }),
    );
  });
});
