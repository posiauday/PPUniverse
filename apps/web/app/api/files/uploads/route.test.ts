import { beforeEach, describe, expect, it, vi } from "vitest";

const getServerSession = vi.fn();
const findUnique = vi.fn();
const getSignedUploadUrl = vi.fn();

vi.mock("next-auth/next", () => ({
  getServerSession: (...args: unknown[]) => getServerSession(...args),
}));
vi.mock("@ppu/db", () => ({
  prisma: { user: { findUnique: (...args: unknown[]) => findUnique(...args) } },
}));
vi.mock("../../../../lib/auth", () => ({ authOptions: {} }));
vi.mock("../../../../lib/storage", () => ({
  storageAdapter: { getSignedUploadUrl: (...args: unknown[]) => getSignedUploadUrl(...args) },
}));

const { POST } = await import("./route");

function makeRequest() {
  return new Request("http://localhost/api/files/uploads", {
    method: "POST",
    body: JSON.stringify({
      filename: "app.zip",
      declaredMimeType: "application/zip",
      sizeBytes: 1024,
    }),
  });
}

/**
 * BUG-020: upload URLs are for admins only. The publishing model is
 * first-party (visitors never upload), so a signed-in member, like a
 * signed-out visitor, gets the same 404 and no URL is ever minted.
 */
describe("POST /api/files/uploads (BUG-020)", () => {
  beforeEach(() => {
    getServerSession.mockReset();
    findUnique.mockReset();
    getSignedUploadUrl.mockReset();
    getSignedUploadUrl.mockResolvedValue("https://storage.example.test/signed");
  });

  it("returns 404 to a signed-out visitor without minting a URL", async () => {
    getServerSession.mockResolvedValue(null);
    const response = await POST(makeRequest());
    expect(response.status).toBe(404);
    expect(getSignedUploadUrl).not.toHaveBeenCalled();
  });

  it("returns the same 404 to a signed-in member", async () => {
    getServerSession.mockResolvedValue({ user: { id: "member-1" } });
    findUnique.mockResolvedValue({ role: "MEMBER" });
    const response = await POST(makeRequest());
    expect(response.status).toBe(404);
    expect(getSignedUploadUrl).not.toHaveBeenCalled();
  });

  it("checks the role in the database, not the session", async () => {
    getServerSession.mockResolvedValue({ user: { id: "member-1", role: "ADMIN" } });
    findUnique.mockResolvedValue({ role: "MEMBER" });
    const response = await POST(makeRequest());
    expect(response.status).toBe(404);
  });

  it("mints a quarantine upload URL for an admin, keyed under the admin's id", async () => {
    getServerSession.mockResolvedValue({ user: { id: "admin-1" } });
    findUnique.mockResolvedValue({ role: "ADMIN" });
    const response = await POST(makeRequest());
    expect(response.status).toBe(200);
    const body = (await response.json()) as { storageKey: string; uploadUrl: string };
    expect(body.storageKey.startsWith("admin-1/")).toBe(true);
    expect(getSignedUploadUrl).toHaveBeenCalledWith(
      "quarantine",
      body.storageKey,
      "application/zip",
    );
  });
});
