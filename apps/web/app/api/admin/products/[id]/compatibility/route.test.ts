import { beforeEach, describe, expect, it, vi } from "vitest";

const getServerSession = vi.fn();
const findUnique = vi.fn();
const findProductByIdForAdmin = vi.fn();
const upsertCompatibilityEntry = vi.fn();

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
    upsertCompatibilityEntry: (...args: unknown[]) => upsertCompatibilityEntry(...args),
  },
}));

const { POST } = await import("./route");

const params = Promise.resolve({ id: "product-1" });

const VALID_BODY = {
  platformArea: "POWER_APPS",
  minReleaseYear: 2025,
  minReleaseWave: 1,
  notes: null,
  evidenceStatus: "CREATOR_DECLARED",
  evidenceSummary: null,
  lastVerifiedAt: null,
};

function makeRequest(body: unknown) {
  return new Request("http://localhost/api/admin/products/product-1/compatibility", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("POST /api/admin/products/[id]/compatibility", () => {
  beforeEach(() => {
    getServerSession.mockReset();
    findUnique.mockReset();
    findProductByIdForAdmin.mockReset();
    upsertCompatibilityEntry.mockReset();
    findProductByIdForAdmin.mockResolvedValue({ id: "product-1", status: "DRAFT" });
  });

  it("returns 404, not 401, when there is no session", async () => {
    getServerSession.mockResolvedValue(null);

    const response = await POST(makeRequest(VALID_BODY), { params });

    expect(response.status).toBe(404);
    expect(upsertCompatibilityEntry).not.toHaveBeenCalled();
  });

  it("returns the identical 404 body for a signed-in MEMBER as for no session", async () => {
    getServerSession.mockResolvedValue({ user: { id: "user-1" } });
    findUnique.mockResolvedValue({ role: "MEMBER" });

    const response = await POST(makeRequest(VALID_BODY), { params });

    expect(response.status).toBe(404);
    expect(upsertCompatibilityEntry).not.toHaveBeenCalled();
  });

  it("returns 404 for an unknown product id", async () => {
    getServerSession.mockResolvedValue({ user: { id: "admin-1" } });
    findUnique.mockResolvedValue({ role: "ADMIN" });
    findProductByIdForAdmin.mockResolvedValue(null);

    const response = await POST(makeRequest(VALID_BODY), { params });

    expect(response.status).toBe(404);
  });

  it("rejects an invalid platformArea via the shared validator", async () => {
    getServerSession.mockResolvedValue({ user: { id: "admin-1" } });
    findUnique.mockResolvedValue({ role: "ADMIN" });

    const response = await POST(makeRequest({ ...VALID_BODY, platformArea: "NOT_REAL" }), {
      params,
    });

    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.fieldErrors.platformArea).toBeDefined();
    expect(upsertCompatibilityEntry).not.toHaveBeenCalled();
  });

  it("rejects TESTED as reserved/legacy via the shared validator", async () => {
    getServerSession.mockResolvedValue({ user: { id: "admin-1" } });
    findUnique.mockResolvedValue({ role: "ADMIN" });

    const response = await POST(makeRequest({ ...VALID_BODY, evidenceStatus: "TESTED" }), {
      params,
    });

    expect(response.status).toBe(400);
    expect(upsertCompatibilityEntry).not.toHaveBeenCalled();
  });

  it("rejects MARKETPLACE_REVIEWED with a distinct code -- TD-006/TD-008's hard gate, unchanged even for ADMIN", async () => {
    getServerSession.mockResolvedValue({ user: { id: "admin-1" } });
    findUnique.mockResolvedValue({ role: "ADMIN" });

    const response = await POST(
      makeRequest({ ...VALID_BODY, evidenceStatus: "MARKETPLACE_REVIEWED" }),
      { params },
    );

    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.code).toBe("EVIDENCE_STATUS_NOT_PERMITTED_HERE");
    expect(body.fieldErrors.evidenceStatus).toBeDefined();
    expect(upsertCompatibilityEntry).not.toHaveBeenCalled();
  });

  it("upserts a valid Creator Declared entry", async () => {
    getServerSession.mockResolvedValue({ user: { id: "admin-1" } });
    findUnique.mockResolvedValue({ role: "ADMIN" });
    upsertCompatibilityEntry.mockResolvedValue({ id: "compat-1", ...VALID_BODY });

    const response = await POST(makeRequest(VALID_BODY), { params });

    expect(response.status).toBe(200);
    expect(upsertCompatibilityEntry).toHaveBeenCalledWith(
      "product-1",
      expect.objectContaining({ evidenceStatus: "CREATOR_DECLARED" }),
    );
  });
});
