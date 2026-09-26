import { beforeEach, describe, expect, it, vi } from "vitest";

const getServerSession = vi.fn();
const findUnique = vi.fn();
const findProductByIdForAdmin = vi.fn();
const createRelease = vi.fn();

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
vi.mock("../../../../../../lib/catalog", () => ({
  catalogRepository: {
    findProductByIdForAdmin: (...args: unknown[]) => findProductByIdForAdmin(...args),
    createRelease: (...args: unknown[]) => createRelease(...args),
  },
}));

const { POST } = await import("./route");

const params = Promise.resolve({ id: "product-1" });

function makeRequest(body: unknown) {
  return new Request("http://localhost/api/admin/products/product-1/releases", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("POST /api/admin/products/[id]/releases", () => {
  beforeEach(() => {
    getServerSession.mockReset();
    findUnique.mockReset();
    findProductByIdForAdmin.mockReset();
    createRelease.mockReset();
    findProductByIdForAdmin.mockResolvedValue({ id: "product-1", status: "DRAFT" });
  });

  it("returns 404, not 401, when there is no session", async () => {
    getServerSession.mockResolvedValue(null);

    const response = await POST(makeRequest({ version: "1.0.0" }), { params });

    expect(response.status).toBe(404);
    expect(createRelease).not.toHaveBeenCalled();
  });

  it("returns the identical 404 body for a signed-in MEMBER as for no session", async () => {
    getServerSession.mockResolvedValue({ user: { id: "user-1" } });
    findUnique.mockResolvedValue({ role: "MEMBER" });

    const response = await POST(makeRequest({ version: "1.0.0" }), { params });

    expect(response.status).toBe(404);
    expect(createRelease).not.toHaveBeenCalled();
  });

  it("returns 404 for an unknown product id", async () => {
    getServerSession.mockResolvedValue({ user: { id: "admin-1" } });
    findUnique.mockResolvedValue({ role: "ADMIN" });
    findProductByIdForAdmin.mockResolvedValue(null);

    const response = await POST(makeRequest({ version: "1.0.0" }), { params });

    expect(response.status).toBe(404);
  });

  it("rejects an empty version", async () => {
    getServerSession.mockResolvedValue({ user: { id: "admin-1" } });
    findUnique.mockResolvedValue({ role: "ADMIN" });

    const response = await POST(makeRequest({ version: "" }), { params });

    expect(response.status).toBe(400);
    expect(createRelease).not.toHaveBeenCalled();
  });

  it("returns 409 for a duplicate version", async () => {
    getServerSession.mockResolvedValue({ user: { id: "admin-1" } });
    findUnique.mockResolvedValue({ role: "ADMIN" });
    createRelease.mockRejectedValue(
      new PrismaClientKnownRequestError("Unique constraint failed", {
        code: "P2002",
        meta: { target: ["productId", "version"] },
      }),
    );

    const response = await POST(makeRequest({ version: "1.0.0" }), { params });

    expect(response.status).toBe(409);
  });

  it("creates the release", async () => {
    getServerSession.mockResolvedValue({ user: { id: "admin-1" } });
    findUnique.mockResolvedValue({ role: "ADMIN" });
    createRelease.mockResolvedValue({ id: "release-1", productId: "product-1", version: "1.0.0" });

    const response = await POST(makeRequest({ version: "1.0.0" }), { params });

    expect(response.status).toBe(201);
    expect(createRelease).toHaveBeenCalledWith("product-1", "1.0.0");
  });
});
