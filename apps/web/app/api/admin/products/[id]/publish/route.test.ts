import { beforeEach, describe, expect, it, vi } from "vitest";

const getServerSession = vi.fn();
const findUnique = vi.fn();
const findProductByIdForAdmin = vi.fn();
const getProductPublishSnapshot = vi.fn();
const publishProduct = vi.fn();

vi.mock("next-auth/next", () => ({
  getServerSession: (...args: unknown[]) => getServerSession(...args),
}));
vi.mock("@ppu/db", () => ({
  prisma: {
    user: { findUnique: (...args: unknown[]) => findUnique(...args) },
  },
}));
vi.mock("../../../../../../lib/catalog", () => ({
  catalogRepository: {
    findProductByIdForAdmin: (...args: unknown[]) => findProductByIdForAdmin(...args),
    getProductPublishSnapshot: (...args: unknown[]) => getProductPublishSnapshot(...args),
    publishProduct: (...args: unknown[]) => publishProduct(...args),
  },
}));

const { POST } = await import("./route");

const params = Promise.resolve({ id: "product-1" });

const READY_SNAPSHOT = {
  licenseCount: 1,
  hasSupportPolicy: true,
  compatibilityCount: 1,
  releasesWithCleanFileCount: 1,
};

function makeRequest() {
  return new Request("http://localhost/api/admin/products/product-1/publish", { method: "POST" });
}

describe("POST /api/admin/products/[id]/publish", () => {
  beforeEach(() => {
    getServerSession.mockReset();
    findUnique.mockReset();
    findProductByIdForAdmin.mockReset();
    getProductPublishSnapshot.mockReset();
    publishProduct.mockReset();
  });

  it("returns 404, not 401, when there is no session", async () => {
    getServerSession.mockResolvedValue(null);

    const response = await POST(makeRequest(), { params });

    expect(response.status).toBe(404);
    expect(publishProduct).not.toHaveBeenCalled();
  });

  it("returns the identical 404 body for a signed-in MEMBER as for no session", async () => {
    getServerSession.mockResolvedValue({ user: { id: "user-1" } });
    findUnique.mockResolvedValue({ role: "MEMBER" });

    const response = await POST(makeRequest(), { params });

    expect(response.status).toBe(404);
    expect(publishProduct).not.toHaveBeenCalled();
  });

  it("returns 404 for an unknown product id", async () => {
    getServerSession.mockResolvedValue({ user: { id: "admin-1" } });
    findUnique.mockResolvedValue({ role: "ADMIN" });
    findProductByIdForAdmin.mockResolvedValue(null);

    const response = await POST(makeRequest(), { params });

    expect(response.status).toBe(404);
    expect(publishProduct).not.toHaveBeenCalled();
  });

  it("returns 409 INVALID_STATE for an already-PUBLISHED product without checking readiness or publishing again", async () => {
    getServerSession.mockResolvedValue({ user: { id: "admin-1" } });
    findUnique.mockResolvedValue({ role: "ADMIN" });
    findProductByIdForAdmin.mockResolvedValue({ id: "product-1", status: "PUBLISHED" });

    const response = await POST(makeRequest(), { params });

    expect(response.status).toBe(409);
    const body = await response.json();
    expect(body.code).toBe("INVALID_STATE");
    expect(getProductPublishSnapshot).not.toHaveBeenCalled();
    expect(publishProduct).not.toHaveBeenCalled();
  });

  it("returns 409 PUBLISH_NOT_READY with the full missing-field list, not just the first", async () => {
    getServerSession.mockResolvedValue({ user: { id: "admin-1" } });
    findUnique.mockResolvedValue({ role: "ADMIN" });
    findProductByIdForAdmin.mockResolvedValue({ id: "product-1", status: "DRAFT" });
    getProductPublishSnapshot.mockResolvedValue({
      licenseCount: 0,
      hasSupportPolicy: false,
      compatibilityCount: 0,
      releasesWithCleanFileCount: 0,
    });

    const response = await POST(makeRequest(), { params });

    expect(response.status).toBe(409);
    const body = await response.json();
    expect(body.code).toBe("PUBLISH_NOT_READY");
    expect(Object.keys(body.fieldErrors)).toEqual([
      "license",
      "supportPolicy",
      "compatibility",
      "release",
    ]);
    expect(publishProduct).not.toHaveBeenCalled();
  });

  it("returns 409 naming only what's missing when the product is partially ready", async () => {
    getServerSession.mockResolvedValue({ user: { id: "admin-1" } });
    findUnique.mockResolvedValue({ role: "ADMIN" });
    findProductByIdForAdmin.mockResolvedValue({ id: "product-1", status: "DRAFT" });
    getProductPublishSnapshot.mockResolvedValue({ ...READY_SNAPSHOT, hasSupportPolicy: false });

    const response = await POST(makeRequest(), { params });

    expect(response.status).toBe(409);
    const body = await response.json();
    expect(Object.keys(body.fieldErrors)).toEqual(["supportPolicy"]);
  });

  it("publishes a fully-ready DRAFT product, attributing the action to the signed-in admin", async () => {
    getServerSession.mockResolvedValue({ user: { id: "admin-1" } });
    findUnique.mockResolvedValue({ role: "ADMIN" });
    findProductByIdForAdmin.mockResolvedValue({ id: "product-1", status: "DRAFT" });
    getProductPublishSnapshot.mockResolvedValue(READY_SNAPSHOT);
    publishProduct.mockResolvedValue({ id: "product-1", status: "PUBLISHED" });

    const response = await POST(makeRequest(), { params });

    expect(response.status).toBe(200);
    expect(publishProduct).toHaveBeenCalledWith("product-1");
  });
});
