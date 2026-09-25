import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  ProductNotDraftError,
  ProductNotFoundError,
  ProductNotReadyError,
  ReleaseAlreadyPublishedError,
  ReleaseNotFoundForProductError,
  ReleaseNotReadyError,
} from "@ppu/domain-catalog";

const getServerSession = vi.fn();
const findUnique = vi.fn();
const publishProductWithRelease = vi.fn();

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
    publishProductWithRelease: (...args: unknown[]) => publishProductWithRelease(...args),
  },
}));

const { POST } = await import("./route");

const params = Promise.resolve({ id: "product-1" });

function makeRequest(body: unknown = { releaseId: "release-1" }) {
  return new Request("http://localhost/api/admin/products/product-1/publish", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

describe("POST /api/admin/products/[id]/publish", () => {
  beforeEach(() => {
    getServerSession.mockReset();
    findUnique.mockReset();
    publishProductWithRelease.mockReset();
  });

  it("returns 404, not 401, when there is no session", async () => {
    getServerSession.mockResolvedValue(null);

    const response = await POST(makeRequest(), { params });

    expect(response.status).toBe(404);
    expect(publishProductWithRelease).not.toHaveBeenCalled();
  });

  it("returns the identical 404 body for a signed-in MEMBER as for no session", async () => {
    getServerSession.mockResolvedValue({ user: { id: "user-1" } });
    findUnique.mockResolvedValue({ role: "MEMBER" });

    const response = await POST(makeRequest(), { params });

    expect(response.status).toBe(404);
    expect(publishProductWithRelease).not.toHaveBeenCalled();
  });

  it("returns 400 VALIDATION when releaseId is missing", async () => {
    getServerSession.mockResolvedValue({ user: { id: "admin-1" } });
    findUnique.mockResolvedValue({ role: "ADMIN" });

    const response = await POST(makeRequest({}), { params });

    expect(response.status).toBe(400);
    expect(publishProductWithRelease).not.toHaveBeenCalled();
  });

  it("returns 404 for an unknown product id", async () => {
    getServerSession.mockResolvedValue({ user: { id: "admin-1" } });
    findUnique.mockResolvedValue({ role: "ADMIN" });
    publishProductWithRelease.mockRejectedValue(new ProductNotFoundError("product-1"));

    const response = await POST(makeRequest(), { params });

    expect(response.status).toBe(404);
  });

  it("returns 404 when the selected release belongs to a different product", async () => {
    getServerSession.mockResolvedValue({ user: { id: "admin-1" } });
    findUnique.mockResolvedValue({ role: "ADMIN" });
    publishProductWithRelease.mockRejectedValue(
      new ReleaseNotFoundForProductError("release-1", "product-1"),
    );

    const response = await POST(makeRequest(), { params });

    expect(response.status).toBe(404);
    const body = await response.json();
    expect(body.fieldErrors).toHaveProperty("releaseId");
  });

  it("returns 409 INVALID_STATE for an already-PUBLISHED product", async () => {
    getServerSession.mockResolvedValue({ user: { id: "admin-1" } });
    findUnique.mockResolvedValue({ role: "ADMIN" });
    publishProductWithRelease.mockRejectedValue(
      new ProductNotDraftError("product-1", "PUBLISHED"),
    );

    const response = await POST(makeRequest(), { params });

    expect(response.status).toBe(409);
    const body = await response.json();
    expect(body.code).toBe("INVALID_STATE");
  });

  it("returns 409 INVALID_STATE when the selected release is already published", async () => {
    getServerSession.mockResolvedValue({ user: { id: "admin-1" } });
    findUnique.mockResolvedValue({ role: "ADMIN" });
    publishProductWithRelease.mockRejectedValue(new ReleaseAlreadyPublishedError("release-1"));

    const response = await POST(makeRequest(), { params });

    expect(response.status).toBe(409);
    const body = await response.json();
    expect(body.code).toBe("INVALID_STATE");
  });

  it("returns 409 PUBLISH_NOT_READY naming 'release' when the selected release has no CLEAN file", async () => {
    getServerSession.mockResolvedValue({ user: { id: "admin-1" } });
    findUnique.mockResolvedValue({ role: "ADMIN" });
    publishProductWithRelease.mockRejectedValue(new ReleaseNotReadyError("release-1"));

    const response = await POST(makeRequest(), { params });

    expect(response.status).toBe(409);
    const body = await response.json();
    expect(body.code).toBe("PUBLISH_NOT_READY");
    expect(Object.keys(body.fieldErrors)).toEqual(["release"]);
  });

  it("returns 409 PUBLISH_NOT_READY with the full missing-field list, not just the first", async () => {
    getServerSession.mockResolvedValue({ user: { id: "admin-1" } });
    findUnique.mockResolvedValue({ role: "ADMIN" });
    publishProductWithRelease.mockRejectedValue(
      new ProductNotReadyError(["license", "supportPolicy", "compatibility"]),
    );

    const response = await POST(makeRequest(), { params });

    expect(response.status).toBe(409);
    const body = await response.json();
    expect(body.code).toBe("PUBLISH_NOT_READY");
    expect(Object.keys(body.fieldErrors)).toEqual(["license", "supportPolicy", "compatibility"]);
  });

  it("returns 409 naming only what's missing when the product is partially ready", async () => {
    getServerSession.mockResolvedValue({ user: { id: "admin-1" } });
    findUnique.mockResolvedValue({ role: "ADMIN" });
    publishProductWithRelease.mockRejectedValue(new ProductNotReadyError(["supportPolicy"]));

    const response = await POST(makeRequest(), { params });

    expect(response.status).toBe(409);
    const body = await response.json();
    expect(Object.keys(body.fieldErrors)).toEqual(["supportPolicy"]);
  });

  it("publishes the selected release, attributing the action to the signed-in admin", async () => {
    getServerSession.mockResolvedValue({ user: { id: "admin-1" } });
    findUnique.mockResolvedValue({ role: "ADMIN" });
    publishProductWithRelease.mockResolvedValue({
      product: { id: "product-1", status: "PUBLISHED" },
      release: { id: "release-1", publishedAt: new Date().toISOString() },
    });

    const response = await POST(makeRequest(), { params });

    expect(response.status).toBe(200);
    expect(publishProductWithRelease).toHaveBeenCalledWith("product-1", "release-1");
    const body = await response.json();
    expect(body.release.id).toBe("release-1");
  });
});
