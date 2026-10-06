import { beforeEach, describe, expect, it, vi } from "vitest";

const getServerSession = vi.fn();
const findUnique = vi.fn();
const repo = {
  listUpdates: vi.fn(),
  createUpdate: vi.fn(),
  findUpdateBySlug: vi.fn(),
  findUpdateById: vi.fn(),
  updateUpdate: vi.fn(),
  publishUpdate: vi.fn(),
};

vi.mock("next-auth/next", () => ({
  getServerSession: (...args: unknown[]) => getServerSession(...args),
}));
vi.mock("@ppu/db", () => ({
  prisma: { user: { findUnique: (...args: unknown[]) => findUnique(...args) } },
}));
vi.mock("../../../../lib/updates", () => ({ updateRepository: repo }));

const { GET, POST } = await import("./route");
const { PATCH } = await import("./[id]/route");
const { POST: PUBLISH } = await import("./[id]/publish/route");

const VALID = {
  slug: "grid-deprecated",
  title: "Grid controls deprecated",
  summary: "They still work for now.",
  technology: "POWER_APPS",
  kind: "DEPRECATION",
  action: "Plan the switch",
  sourceUrl: "https://learn.microsoft.com/power-platform/important-changes-coming",
  effectiveDate: "2026-03-01",
  replacement: "Power Apps grid control",
};

const json = (body: unknown, method = "POST") =>
  new Request("http://localhost/api/admin/updates", {
    method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
const params = (id: string) => ({ params: Promise.resolve({ id }) });

function signedInAs(role: "ADMIN" | "MEMBER" | null) {
  getServerSession.mockResolvedValue(role ? { user: { id: "user-1" } } : null);
  findUnique.mockResolvedValue(role ? { role } : null);
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("/api/admin/updates (MVP-033 slice D)", () => {
  it.each([null, "MEMBER"] as const)("gives %s the identical 404 on every route", async (role) => {
    signedInAs(role);
    for (const response of [
      await GET(new Request("http://localhost/api/admin/updates")),
      await POST(json(VALID)),
      await PATCH(json(VALID, "PATCH"), params("u1")),
      await PUBLISH(new Request("http://localhost/x", { method: "POST" }), params("u1")),
    ]) {
      expect(response.status).toBe(404);
      expect((await response.json()).message).toBe("Not found.");
    }
    expect(repo.createUpdate).not.toHaveBeenCalled();
    expect(repo.publishUpdate).not.toHaveBeenCalled();
  });

  it("creates a DRAFT from a valid body, with the date as a UTC calendar day", async () => {
    signedInAs("ADMIN");
    repo.findUpdateBySlug.mockResolvedValue(null);
    repo.createUpdate.mockResolvedValue({ id: "u1", status: "DRAFT" });
    const response = await POST(json(VALID));
    expect(response.status).toBe(201);
    expect(repo.createUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        slug: "grid-deprecated",
        kind: "DEPRECATION",
        effectiveDate: new Date("2026-03-01T00:00:00Z"),
        authorUserId: "user-1",
      }),
    );
  });

  it("rejects a source outside microsoft.com and an impossible date, naming each field", async () => {
    signedInAs("ADMIN");
    const response = await POST(
      json({
        ...VALID,
        sourceUrl: "https://microsoft.com.evil.example/x",
        effectiveDate: "2026-02-30",
      }),
    );
    expect(response.status).toBe(400);
    const body = await response.json();
    expect(Object.keys(body.fieldErrors).sort()).toEqual(["effectiveDate", "sourceUrl"]);
    expect(repo.createUpdate).not.toHaveBeenCalled();
  });

  it("refuses a slug already in use (409)", async () => {
    signedInAs("ADMIN");
    repo.findUpdateBySlug.mockResolvedValue({ id: "other" });
    expect((await POST(json(VALID))).status).toBe(409);
  });

  it("edits content only, and 404s an unknown id", async () => {
    signedInAs("ADMIN");
    repo.findUpdateById.mockResolvedValueOnce(null);
    expect((await PATCH(json(VALID, "PATCH"), params("missing"))).status).toBe(404);

    repo.findUpdateById.mockResolvedValue({ id: "u1", slug: "grid-deprecated" });
    repo.updateUpdate.mockResolvedValue({ id: "u1" });
    const response = await PATCH(json({ ...VALID, status: "PUBLISHED" }, "PATCH"), params("u1"));
    expect(response.status).toBe(200);
    expect(repo.updateUpdate).toHaveBeenCalledWith(
      "u1",
      expect.not.objectContaining({ status: expect.anything() }),
    );
  });

  it("publishes a draft once, and refuses an already-published update (409)", async () => {
    signedInAs("ADMIN");
    repo.findUpdateById.mockResolvedValueOnce({ id: "u1", status: "DRAFT" });
    repo.publishUpdate.mockResolvedValue({ id: "u1", status: "PUBLISHED" });
    const request = () => new Request("http://localhost/x", { method: "POST" });
    expect((await PUBLISH(request(), params("u1"))).status).toBe(200);
    expect(repo.publishUpdate).toHaveBeenCalledWith("u1", "user-1");

    repo.findUpdateById.mockResolvedValueOnce({ id: "u1", status: "PUBLISHED" });
    expect((await PUBLISH(request(), params("u1"))).status).toBe(409);
  });
});
