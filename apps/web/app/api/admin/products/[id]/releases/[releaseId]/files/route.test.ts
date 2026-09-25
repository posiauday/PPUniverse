import { beforeEach, describe, expect, it, vi } from "vitest";

const getServerSession = vi.fn();
const findUnique = vi.fn();
const findProductByIdForAdmin = vi.fn();
const attachReleaseFile = vi.fn();
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
    listReleasesForAdmin: (...args: unknown[]) => listReleasesForAdmin(...args),
  },
}));

const { POST } = await import("./route");

const params = Promise.resolve({ id: "product-1", releaseId: "release-1" });

function makeRequest(body: unknown) {
  return new Request("http://localhost/api/admin/products/product-1/releases/release-1/files", {
    method: "POST",
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
    attachReleaseFile.mockRejectedValue(
      new Error("FileScan file-1 is not CLEAN (status: QUARANTINED)"),
    );

    const response = await POST(makeRequest({ fileScanId: "file-1" }), { params });

    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.fieldErrors.fileScanId[0]).toContain("not CLEAN");
  });

  it("attaches a CLEAN file and returns the updated release", async () => {
    getServerSession.mockResolvedValue({ user: { id: "admin-1" } });
    findUnique.mockResolvedValue({ role: "ADMIN" });
    attachReleaseFile.mockResolvedValue(undefined);

    const response = await POST(makeRequest({ fileScanId: "file-1" }), { params });

    expect(response.status).toBe(200);
    expect(attachReleaseFile).toHaveBeenCalledWith("release-1", "file-1");
    const body = await response.json();
    expect(body.release.id).toBe("release-1");
  });
});
