import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  ProductNotFoundError,
  ProductNotPublishedError,
  ProductNotReadyError,
  ReleaseAlreadyPublishedError,
  ReleaseNotFoundForProductError,
  ReleaseNotReadyError,
} from "@ppu/domain-catalog";

const getServerSession = vi.fn();
const findUnique = vi.fn();
const publishSubsequentRelease = vi.fn();

vi.mock("next-auth/next", () => ({
  getServerSession: (...args: unknown[]) => getServerSession(...args),
}));
vi.mock("@ppu/db", () => ({
  prisma: {
    user: { findUnique: (...args: unknown[]) => findUnique(...args) },
  },
}));
vi.mock("../../../../../../../../lib/catalog", () => ({
  catalogRepository: {
    publishSubsequentRelease: (...args: unknown[]) => publishSubsequentRelease(...args),
  },
}));

const { POST } = await import("./route");

const params = Promise.resolve({ id: "product-1", releaseId: "release-2" });

function makeRequest() {
  return new Request("http://localhost/api/admin/products/product-1/releases/release-2/publish", {
    method: "POST",
  });
}

describe("POST /api/admin/products/[id]/releases/[releaseId]/publish", () => {
  beforeEach(() => {
    getServerSession.mockReset();
    findUnique.mockReset();
    publishSubsequentRelease.mockReset();
  });

  it("returns 404, not 401, when there is no session", async () => {
    getServerSession.mockResolvedValue(null);

    const response = await POST(makeRequest(), { params });

    expect(response.status).toBe(404);
    expect(publishSubsequentRelease).not.toHaveBeenCalled();
  });

  it("returns the identical 404 body for a signed-in MEMBER as for no session", async () => {
    getServerSession.mockResolvedValue({ user: { id: "user-1" } });
    findUnique.mockResolvedValue({ role: "MEMBER" });

    const response = await POST(makeRequest(), { params });

    expect(response.status).toBe(404);
    expect(publishSubsequentRelease).not.toHaveBeenCalled();
  });

  it("returns 404 for an unknown product id", async () => {
    getServerSession.mockResolvedValue({ user: { id: "admin-1" } });
    findUnique.mockResolvedValue({ role: "ADMIN" });
    publishSubsequentRelease.mockRejectedValue(new ProductNotFoundError("product-1"));

    const response = await POST(makeRequest(), { params });

    expect(response.status).toBe(404);
  });

  it("returns 404 when the release belongs to a different product", async () => {
    getServerSession.mockResolvedValue({ user: { id: "admin-1" } });
    findUnique.mockResolvedValue({ role: "ADMIN" });
    publishSubsequentRelease.mockRejectedValue(
      new ReleaseNotFoundForProductError("release-2", "product-1"),
    );

    const response = await POST(makeRequest(), { params });

    expect(response.status).toBe(404);
  });

  it("returns 409 INVALID_STATE when the product is not yet PUBLISHED (still DRAFT)", async () => {
    getServerSession.mockResolvedValue({ user: { id: "admin-1" } });
    findUnique.mockResolvedValue({ role: "ADMIN" });
    publishSubsequentRelease.mockRejectedValue(new ProductNotPublishedError("product-1", "DRAFT"));

    const response = await POST(makeRequest(), { params });

    expect(response.status).toBe(409);
    const body = await response.json();
    expect(body.code).toBe("INVALID_STATE");
  });

  it("returns 409 INVALID_STATE when the release is already published", async () => {
    getServerSession.mockResolvedValue({ user: { id: "admin-1" } });
    findUnique.mockResolvedValue({ role: "ADMIN" });
    publishSubsequentRelease.mockRejectedValue(new ReleaseAlreadyPublishedError("release-2"));

    const response = await POST(makeRequest(), { params });

    expect(response.status).toBe(409);
    const body = await response.json();
    expect(body.code).toBe("INVALID_STATE");
  });

  it("returns 409 PUBLISH_NOT_READY naming 'release' when the release has no CLEAN file", async () => {
    getServerSession.mockResolvedValue({ user: { id: "admin-1" } });
    findUnique.mockResolvedValue({ role: "ADMIN" });
    publishSubsequentRelease.mockRejectedValue(new ReleaseNotReadyError("release-2"));

    const response = await POST(makeRequest(), { params });

    expect(response.status).toBe(409);
    const body = await response.json();
    expect(body.code).toBe("PUBLISH_NOT_READY");
    expect(Object.keys(body.fieldErrors)).toEqual(["release"]);
  });

  it("returns 409 PUBLISH_NOT_READY with the full missing-field list when Product-level fields are gone", async () => {
    getServerSession.mockResolvedValue({ user: { id: "admin-1" } });
    findUnique.mockResolvedValue({ role: "ADMIN" });
    publishSubsequentRelease.mockRejectedValue(
      new ProductNotReadyError(["license", "compatibility"]),
    );

    const response = await POST(makeRequest(), { params });

    expect(response.status).toBe(409);
    const body = await response.json();
    expect(Object.keys(body.fieldErrors)).toEqual(["license", "compatibility"]);
  });

  it("publishes the subsequent release, attributing the action to the signed-in admin", async () => {
    getServerSession.mockResolvedValue({ user: { id: "admin-1" } });
    findUnique.mockResolvedValue({ role: "ADMIN" });
    publishSubsequentRelease.mockResolvedValue({
      product: { id: "product-1", status: "PUBLISHED" },
      release: { id: "release-2", publishedAt: new Date().toISOString() },
    });

    const response = await POST(makeRequest(), { params });

    expect(response.status).toBe(200);
    expect(publishSubsequentRelease).toHaveBeenCalledWith("product-1", "release-2", "admin-1");
    const body = await response.json();
    expect(body.release.id).toBe("release-2");
  });
});
