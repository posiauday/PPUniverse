import { beforeEach, describe, expect, it, vi } from "vitest";

const requireAdmin = vi.hoisted(() => vi.fn());
const closeReport = vi.hoisted(() => vi.fn());

vi.mock("../../../../../../lib/require-admin", async (importOriginal) => ({
  ...(await importOriginal<typeof import("../../../../../../lib/require-admin")>()),
  requireAdmin,
}));
vi.mock("../../../../../../lib/feedback", () => ({ feedbackRepository: { closeReport } }));
vi.mock("@ppu/db", () => ({ prisma: {} }));

const { POST } = await import("./route");
const call = () =>
  POST(new Request("https://example.test/api/admin/reports/r1/close", { method: "POST" }), {
    params: Promise.resolve({ id: "r1" }),
  });

describe("POST /api/admin/reports/[id]/close (MVP-038)", () => {
  beforeEach(() => {
    requireAdmin.mockReset();
    closeReport.mockReset();
  });

  it("gives anyone who isn't an admin the same 404, and closes nothing", async () => {
    requireAdmin.mockResolvedValue(null);
    expect((await call()).status).toBe(404);
    expect(closeReport).not.toHaveBeenCalled();
  });

  it("lets an admin close (delete) a report", async () => {
    requireAdmin.mockResolvedValue({ userId: "admin-1" });
    closeReport.mockResolvedValue(true);
    const response = await call();
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ ok: true, closed: true });
    expect(closeReport).toHaveBeenCalledWith("r1");
  });
});
