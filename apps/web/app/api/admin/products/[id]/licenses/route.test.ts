import { beforeEach, describe, expect, it, vi } from "vitest";

const getServerSession = vi.fn();
const findUnique = vi.fn();
const findProductByIdForAdmin = vi.fn();
const listLicenseDefinitions = vi.fn();
const setProductLicenses = vi.fn();

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
    listLicenseDefinitions: (...args: unknown[]) => listLicenseDefinitions(...args),
    setProductLicenses: (...args: unknown[]) => setProductLicenses(...args),
  },
}));

const { PUT } = await import("./route");

const params = Promise.resolve({ id: "product-1" });
const DEFINITIONS = [
  { id: "license-personal", slug: "personal" },
  { id: "license-enterprise", slug: "enterprise" },
];

function makeRequest(body: unknown) {
  return new Request("http://localhost/api/admin/products/product-1/licenses", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("PUT /api/admin/products/[id]/licenses", () => {
  beforeEach(() => {
    getServerSession.mockReset();
    findUnique.mockReset();
    findProductByIdForAdmin.mockReset();
    listLicenseDefinitions.mockReset();
    setProductLicenses.mockReset();
    listLicenseDefinitions.mockResolvedValue(DEFINITIONS);
    findProductByIdForAdmin.mockResolvedValue({ id: "product-1", status: "DRAFT" });
  });

  it("returns 404, not 401, when there is no session", async () => {
    getServerSession.mockResolvedValue(null);

    const response = await PUT(makeRequest({ licenseDefinitionIds: ["license-personal"] }), {
      params,
    });

    expect(response.status).toBe(404);
    expect(setProductLicenses).not.toHaveBeenCalled();
  });

  it("returns the identical 404 body for a signed-in MEMBER as for no session", async () => {
    getServerSession.mockResolvedValue({ user: { id: "user-1" } });
    findUnique.mockResolvedValue({ role: "MEMBER" });

    const response = await PUT(makeRequest({ licenseDefinitionIds: ["license-personal"] }), {
      params,
    });

    expect(response.status).toBe(404);
    expect(setProductLicenses).not.toHaveBeenCalled();
  });

  it("returns 404 for an unknown product id", async () => {
    getServerSession.mockResolvedValue({ user: { id: "admin-1" } });
    findUnique.mockResolvedValue({ role: "ADMIN" });
    findProductByIdForAdmin.mockResolvedValue(null);

    const response = await PUT(makeRequest({ licenseDefinitionIds: [] }), { params });

    expect(response.status).toBe(404);
  });

  it("rejects a non-array body", async () => {
    getServerSession.mockResolvedValue({ user: { id: "admin-1" } });
    findUnique.mockResolvedValue({ role: "ADMIN" });

    const response = await PUT(makeRequest({ licenseDefinitionIds: "not-an-array" }), { params });

    expect(response.status).toBe(400);
    expect(setProductLicenses).not.toHaveBeenCalled();
  });

  it("rejects an id that doesn't reference a real license definition", async () => {
    getServerSession.mockResolvedValue({ user: { id: "admin-1" } });
    findUnique.mockResolvedValue({ role: "ADMIN" });

    const response = await PUT(makeRequest({ licenseDefinitionIds: ["does-not-exist"] }), {
      params,
    });

    expect(response.status).toBe(400);
    expect(setProductLicenses).not.toHaveBeenCalled();
  });

  it("replaces the assigned set with valid ids", async () => {
    getServerSession.mockResolvedValue({ user: { id: "admin-1" } });
    findUnique.mockResolvedValue({ role: "ADMIN" });

    const response = await PUT(
      makeRequest({ licenseDefinitionIds: ["license-personal", "license-enterprise"] }),
      { params },
    );

    expect(response.status).toBe(200);
    expect(setProductLicenses).toHaveBeenCalledWith("product-1", [
      "license-personal",
      "license-enterprise",
    ]);
  });

  it("accepts an empty array (clearing all assigned licenses)", async () => {
    getServerSession.mockResolvedValue({ user: { id: "admin-1" } });
    findUnique.mockResolvedValue({ role: "ADMIN" });

    const response = await PUT(makeRequest({ licenseDefinitionIds: [] }), { params });

    expect(response.status).toBe(200);
    expect(setProductLicenses).toHaveBeenCalledWith("product-1", []);
  });
});
