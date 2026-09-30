import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  FileScanNotCleanError,
  FileScanNotFoundError,
  ReleaseAlreadyPublishedError,
  ReleaseNotFoundError,
} from "@ppu/domain-catalog";

const getServerSession = vi.fn();
const findUnique = vi.fn();
const findProductByIdForAdmin = vi.fn();
const attachReleaseFile = vi.fn();
const detachReleaseFile = vi.fn();
const listReleasesForAdmin = vi.fn();

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
    findProductByIdForAdmin: (...args: unknown[]) => findProductByIdForAdmin(...args),
    attachReleaseFile: (...args: unknown[]) => attachReleaseFile(...args),
    detachReleaseFile: (...args: unknown[]) => detachReleaseFile(...args),
    listReleasesForAdmin: (...args: unknown[]) => listReleasesForAdmin(...args),
  },
}));

const { POST, DELETE } = await import("./route");

const params = Promise.resolve({ id: "product-1", releaseId: "release-1" });

function makeRequest(body: unknown, method: "POST" | "DELETE" = "POST") {
  return new Request("http://localhost/api/admin/products/product-1/releases/release-1/files", {
    method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("POST /api/admin/products/[id]/releases/[releaseId]/files", () => {
  beforeEach(() => {
    getServerSession.mockReset();
    findUnique.mockReset();
    findProductByIdForAdmin.mockReset();
    attachReleaseFile.mockReset();
    detachReleaseFile.mockReset();
    listReleasesForAdmin.mockReset();
    findProductByIdForAdmin.mockResolvedValue({ id: "product-1", status: "DRAFT" });
    listReleasesForAdmin.mockResolvedValue([
      { id: "release-1", version: "1.0.0", files: [{ fileScanId: "file-1", status: "CLEAN" }] },
    ]);
  });

  it("returns 404, not 401, when there is no session", async () => {
    getServerSession.mockResolvedValue(null);

    const response = await POST(makeRequest({ fileScanId: "file-1" }), { params });

    expect(response.status).toBe(404);
    expect(attachReleaseFile).not.toHaveBeenCalled();
  });

  it("returns the identical 404 body for a signed-in MEMBER as for no session", async () => {
    getServerSession.mockResolvedValue({ user: { id: "user-1" } });
    findUnique.mockResolvedValue({ role: "MEMBER" });

    const response = await POST(makeRequest({ fileScanId: "file-1" }), { params });

    expect(response.status).toBe(404);
    expect(attachReleaseFile).not.toHaveBeenCalled();
  });

  it("returns 404 for an unknown product id", async () => {
    getServerSession.mockResolvedValue({ user: { id: "admin-1" } });
    findUnique.mockResolvedValue({ role: "ADMIN" });
    findProductByIdForAdmin.mockResolvedValue(null);

    const response = await POST(makeRequest({ fileScanId: "file-1" }), { params });

    expect(response.status).toBe(404);
  });

  it("rejects a missing fileScanId", async () => {
    getServerSession.mockResolvedValue({ user: { id: "admin-1" } });
    findUnique.mockResolvedValue({ role: "ADMIN" });

    const response = await POST(makeRequest({}), { params });

    expect(response.status).toBe(400);
    expect(attachReleaseFile).not.toHaveBeenCalled();
  });

  it("returns 400 when the repository rejects a non-CLEAN file -- never trusts the client's claim", async () => {
    getServerSession.mockResolvedValue({ user: { id: "admin-1" } });
    findUnique.mockResolvedValue({ role: "ADMIN" });
    attachReleaseFile.mockRejectedValue(new FileScanNotCleanError("file-1", "QUARANTINED"));

    const response = await POST(makeRequest({ fileScanId: "file-1" }), { params });

    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.fieldErrors.fileScanId[0]).toContain("not CLEAN");
  });

  it("returns 400 when the referenced FileScan doesn't exist", async () => {
    getServerSession.mockResolvedValue({ user: { id: "admin-1" } });
    findUnique.mockResolvedValue({ role: "ADMIN" });
    attachReleaseFile.mockRejectedValue(new FileScanNotFoundError("file-1"));

    const response = await POST(makeRequest({ fileScanId: "file-1" }), { params });

    expect(response.status).toBe(400);
  });

  it("returns 404 when the release doesn't belong to this product", async () => {
    getServerSession.mockResolvedValue({ user: { id: "admin-1" } });
    findUnique.mockResolvedValue({ role: "ADMIN" });
    attachReleaseFile.mockRejectedValue(new ReleaseNotFoundError("release-1"));

    const response = await POST(makeRequest({ fileScanId: "file-1" }), { params });

    expect(response.status).toBe(404);
  });

  it("returns 409 when the release is already published -- files are immutable", async () => {
    getServerSession.mockResolvedValue({ user: { id: "admin-1" } });
    findUnique.mockResolvedValue({ role: "ADMIN" });
    attachReleaseFile.mockRejectedValue(new ReleaseAlreadyPublishedError("release-1"));

    const response = await POST(makeRequest({ fileScanId: "file-1" }), { params });

    expect(response.status).toBe(409);
    const body = await response.json();
    expect(body.code).toBe("INVALID_STATE");
  });

  it("attaches a CLEAN file to a draft release and returns the updated release", async () => {
    getServerSession.mockResolvedValue({ user: { id: "admin-1" } });
    findUnique.mockResolvedValue({ role: "ADMIN" });
    attachReleaseFile.mockResolvedValue(undefined);

    const response = await POST(makeRequest({ fileScanId: "file-1" }), { params });

    expect(response.status).toBe(200);
    expect(attachReleaseFile).toHaveBeenCalledWith("product-1", "release-1", "file-1");
    const body = await response.json();
    expect(body.release.id).toBe("release-1");
  });
});

describe("DELETE /api/admin/products/[id]/releases/[releaseId]/files", () => {
  beforeEach(() => {
    getServerSession.mockReset();
    findUnique.mockReset();
    findProductByIdForAdmin.mockReset();
    attachReleaseFile.mockReset();
    detachReleaseFile.mockReset();
    listReleasesForAdmin.mockReset();
    findProductByIdForAdmin.mockResolvedValue({ id: "product-1", status: "DRAFT" });
    listReleasesForAdmin.mockResolvedValue([{ id: "release-1", version: "1.0.0", files: [] }]);
  });

  it("returns 404, not 401, when there is no session", async () => {
    getServerSession.mockResolvedValue(null);

    const response = await DELETE(makeRequest({ fileScanId: "file-1" }, "DELETE"), { params });

    expect(response.status).toBe(404);
    expect(detachReleaseFile).not.toHaveBeenCalled();
  });

  it("returns the identical 404 body for a signed-in MEMBER as for no session", async () => {
    getServerSession.mockResolvedValue({ user: { id: "user-1" } });
    findUnique.mockResolvedValue({ role: "MEMBER" });

    const response = await DELETE(makeRequest({ fileScanId: "file-1" }, "DELETE"), { params });

    expect(response.status).toBe(404);
    expect(detachReleaseFile).not.toHaveBeenCalled();
  });

  it("rejects a missing fileScanId", async () => {
    getServerSession.mockResolvedValue({ user: { id: "admin-1" } });
    findUnique.mockResolvedValue({ role: "ADMIN" });

    const response = await DELETE(makeRequest({}, "DELETE"), { params });

    expect(response.status).toBe(400);
    expect(detachReleaseFile).not.toHaveBeenCalled();
  });

  it("returns 409 when the release is already published -- files are immutable", async () => {
    getServerSession.mockResolvedValue({ user: { id: "admin-1" } });
    findUnique.mockResolvedValue({ role: "ADMIN" });
    detachReleaseFile.mockRejectedValue(new ReleaseAlreadyPublishedError("release-1"));

    const response = await DELETE(makeRequest({ fileScanId: "file-1" }, "DELETE"), { params });

    expect(response.status).toBe(409);
    const body = await response.json();
    expect(body.code).toBe("INVALID_STATE");
  });

  it("returns 404 when the release doesn't belong to this product", async () => {
    getServerSession.mockResolvedValue({ user: { id: "admin-1" } });
    findUnique.mockResolvedValue({ role: "ADMIN" });
    detachReleaseFile.mockRejectedValue(new ReleaseNotFoundError("release-1"));

    const response = await DELETE(makeRequest({ fileScanId: "file-1" }, "DELETE"), { params });

    expect(response.status).toBe(404);
  });

  it("detaches a file from a draft release and returns the updated release, attributing the action to the signed-in admin", async () => {
    getServerSession.mockResolvedValue({ user: { id: "admin-1" } });
    findUnique.mockResolvedValue({ role: "ADMIN" });
    detachReleaseFile.mockResolvedValue(undefined);

    const response = await DELETE(makeRequest({ fileScanId: "file-1" }, "DELETE"), { params });

    expect(response.status).toBe(200);
    expect(detachReleaseFile).toHaveBeenCalledWith("product-1", "release-1", "file-1");
    const body = await response.json();
    expect(body.release.id).toBe("release-1");
  });
});
