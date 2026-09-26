import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  ProductNotFoundError,
  ProductStatusChangeReasonRequiredError,
  ProductStatusTransitionNotAllowedError,
} from "@ppu/domain-catalog";

const getServerSession = vi.fn();
const findUnique = vi.fn();
const changeProductStatus = vi.fn();

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
    changeProductStatus: (...args: unknown[]) => changeProductStatus(...args),
  },
}));

const { POST } = await import("./route");

const params = Promise.resolve({ id: "product-1" });

function makeRequest(body: unknown = { toStatus: "SUSPENDED", reason: "Temporary pause" }) {
  return new Request("http://localhost/api/admin/products/product-1/status", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

describe("POST /api/admin/products/[id]/status", () => {
  beforeEach(() => {
    getServerSession.mockReset();
    findUnique.mockReset();
    changeProductStatus.mockReset();
  });

  it("returns 404, not 401, when there is no session", async () => {
    getServerSession.mockResolvedValue(null);

    const response = await POST(makeRequest(), { params });

    expect(response.status).toBe(404);
    expect(changeProductStatus).not.toHaveBeenCalled();
  });

  it("returns the identical 404 body for a signed-in MEMBER as for no session", async () => {
    getServerSession.mockResolvedValue({ user: { id: "user-1" } });
    findUnique.mockResolvedValue({ role: "MEMBER" });

    const response = await POST(makeRequest(), { params });

    expect(response.status).toBe(404);
    expect(changeProductStatus).not.toHaveBeenCalled();
  });

  it("returns 400 VALIDATION for an unrecognized toStatus", async () => {
    getServerSession.mockResolvedValue({ user: { id: "admin-1" } });
    findUnique.mockResolvedValue({ role: "ADMIN" });

    const response = await POST(makeRequest({ toStatus: "DRAFT", reason: "x" }), { params });

    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.fieldErrors).toHaveProperty("toStatus");
    expect(changeProductStatus).not.toHaveBeenCalled();
  });

  it("returns 400 VALIDATION when reason is missing", async () => {
    getServerSession.mockResolvedValue({ user: { id: "admin-1" } });
    findUnique.mockResolvedValue({ role: "ADMIN" });

    const response = await POST(makeRequest({ toStatus: "SUSPENDED" }), { params });

    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.fieldErrors).toHaveProperty("reason");
    expect(changeProductStatus).not.toHaveBeenCalled();
  });

  it("returns 400 VALIDATION when reason is blank", async () => {
    getServerSession.mockResolvedValue({ user: { id: "admin-1" } });
    findUnique.mockResolvedValue({ role: "ADMIN" });

    const response = await POST(makeRequest({ toStatus: "SUSPENDED", reason: "   " }), { params });

    expect(response.status).toBe(400);
    expect(changeProductStatus).not.toHaveBeenCalled();
  });

  it("returns 404 for an unknown product id", async () => {
    getServerSession.mockResolvedValue({ user: { id: "admin-1" } });
    findUnique.mockResolvedValue({ role: "ADMIN" });
    changeProductStatus.mockRejectedValue(new ProductNotFoundError("product-1"));

    const response = await POST(makeRequest(), { params });

    expect(response.status).toBe(404);
  });

  it("returns 409 INVALID_STATE for a transition the domain rejects", async () => {
    getServerSession.mockResolvedValue({ user: { id: "admin-1" } });
    findUnique.mockResolvedValue({ role: "ADMIN" });
    changeProductStatus.mockRejectedValue(
      new ProductStatusTransitionNotAllowedError("product-1", "DRAFT", "SUSPENDED"),
    );

    const response = await POST(makeRequest(), { params });

    expect(response.status).toBe(409);
    const body = await response.json();
    expect(body.code).toBe("INVALID_STATE");
  });

  it("returns 400 VALIDATION when the repository itself rejects a blank reason", async () => {
    getServerSession.mockResolvedValue({ user: { id: "admin-1" } });
    findUnique.mockResolvedValue({ role: "ADMIN" });
    changeProductStatus.mockRejectedValue(new ProductStatusChangeReasonRequiredError("product-1"));

    const response = await POST(makeRequest(), { params });

    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.fieldErrors).toHaveProperty("reason");
  });

  it("changes the product's status, attributing the action to the signed-in admin", async () => {
    getServerSession.mockResolvedValue({ user: { id: "admin-1" } });
    findUnique.mockResolvedValue({ role: "ADMIN" });
    changeProductStatus.mockResolvedValue({
      product: { id: "product-1", status: "SUSPENDED" },
      statusEvent: {
        id: "event-1",
        productId: "product-1",
        actorUserId: "admin-1",
        fromStatus: "PUBLISHED",
        toStatus: "SUSPENDED",
        reason: "Temporary pause",
        createdAt: new Date().toISOString(),
      },
    });

    const response = await POST(makeRequest(), { params });

    expect(response.status).toBe(200);
    expect(changeProductStatus).toHaveBeenCalledWith(
      "product-1",
      "SUSPENDED",
      "admin-1",
      "Temporary pause",
    );
    const body = await response.json();
    expect(body.product.status).toBe("SUSPENDED");
  });
});
