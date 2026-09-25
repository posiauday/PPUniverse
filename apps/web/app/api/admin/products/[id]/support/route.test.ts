import { beforeEach, describe, expect, it, vi } from "vitest";

const getServerSession = vi.fn();
const findUnique = vi.fn();
const findProductByIdForAdmin = vi.fn();
const upsertSupportPolicy = vi.fn();

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
    upsertSupportPolicy: (...args: unknown[]) => upsertSupportPolicy(...args),
  },
}));

const { PUT } = await import("./route");

const params = Promise.resolve({ id: "product-1" });

function makeRequest(body: unknown) {
  return new Request("http://localhost/api/admin/products/product-1/support", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("PUT /api/admin/products/[id]/support", () => {
  beforeEach(() => {
    getServerSession.mockReset();
    findUnique.mockReset();
    findProductByIdForAdmin.mockReset();
    upsertSupportPolicy.mockReset();
    findProductByIdForAdmin.mockResolvedValue({ id: "product-1", status: "DRAFT" });
  });

  it("returns 404, not 401, when there is no session", async () => {
    getServerSession.mockResolvedValue(null);

    const response = await PUT(makeRequest({ status: "UNSUPPORTED", channel: null }), { params });

    expect(response.status).toBe(404);
    expect(upsertSupportPolicy).not.toHaveBeenCalled();
  });

  it("returns the identical 404 body for a signed-in MEMBER as for no session", async () => {
    getServerSession.mockResolvedValue({ user: { id: "user-1" } });
    findUnique.mockResolvedValue({ role: "MEMBER" });

    const response = await PUT(makeRequest({ status: "UNSUPPORTED", channel: null }), { params });

    expect(response.status).toBe(404);
    expect(upsertSupportPolicy).not.toHaveBeenCalled();
  });

  it("returns 404 for an unknown product id", async () => {
    getServerSession.mockResolvedValue({ user: { id: "admin-1" } });
    findUnique.mockResolvedValue({ role: "ADMIN" });
    findProductByIdForAdmin.mockResolvedValue(null);

    const response = await PUT(makeRequest({ status: "UNSUPPORTED", channel: null }), { params });

    expect(response.status).toBe(404);
  });

  it("rejects an invalid status", async () => {
    getServerSession.mockResolvedValue({ user: { id: "admin-1" } });
    findUnique.mockResolvedValue({ role: "ADMIN" });

    const response = await PUT(makeRequest({ status: "NOT_A_STATUS", channel: null }), { params });

    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.fieldErrors.status).toBeDefined();
    expect(upsertSupportPolicy).not.toHaveBeenCalled();
  });

  it("requires a channel unless status is UNSUPPORTED", async () => {
    getServerSession.mockResolvedValue({ user: { id: "admin-1" } });
    findUnique.mockResolvedValue({ role: "ADMIN" });

    const response = await PUT(makeRequest({ status: "COMMUNITY_SUPPORTED", channel: null }), {
      params,
    });

    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.fieldErrors.channel).toBeDefined();
    expect(upsertSupportPolicy).not.toHaveBeenCalled();
  });

  it("accepts UNSUPPORTED with no channel", async () => {
    getServerSession.mockResolvedValue({ user: { id: "admin-1" } });
    findUnique.mockResolvedValue({ role: "ADMIN" });
    upsertSupportPolicy.mockResolvedValue({ status: "UNSUPPORTED", channel: null });

    const response = await PUT(makeRequest({ status: "UNSUPPORTED", channel: null }), { params });

    expect(response.status).toBe(200);
    expect(upsertSupportPolicy).toHaveBeenCalledWith("product-1", {
      status: "UNSUPPORTED",
      channel: null,
    });
  });

  it("accepts a supported status with a channel", async () => {
    getServerSession.mockResolvedValue({ user: { id: "admin-1" } });
    findUnique.mockResolvedValue({ role: "ADMIN" });
    upsertSupportPolicy.mockResolvedValue({
      status: "COMMUNITY_SUPPORTED",
      channel: "https://example.test/support",
    });

    const response = await PUT(
      makeRequest({ status: "COMMUNITY_SUPPORTED", channel: "https://example.test/support" }),
      { params },
    );

    expect(response.status).toBe(200);
    expect(upsertSupportPolicy).toHaveBeenCalledWith("product-1", {
      status: "COMMUNITY_SUPPORTED",
      channel: "https://example.test/support",
    });
  });
});
