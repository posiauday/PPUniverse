import { beforeEach, describe, expect, it, vi } from "vitest";

const queryRaw = vi.fn();
const captureException = vi.fn();

vi.mock("@ppu/db", () => ({
  prisma: { $queryRaw: (...args: unknown[]) => queryRaw(...args) },
}));

vi.mock("../../../lib/error-monitoring", () => ({
  errorMonitoring: { captureException, captureMessage: vi.fn() },
}));

const { GET } = await import("./route");

describe("GET /api/health", () => {
  beforeEach(() => {
    queryRaw.mockReset();
    captureException.mockClear();
  });

  it("returns 200 and ok when the database responds", async () => {
    queryRaw.mockResolvedValue([{ "?column?": 1 }]);
    const response = await GET();
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ status: "ok", checks: { database: "ok" } });
  });

  it("returns 503 and reports to error monitoring when the database check fails", async () => {
    queryRaw.mockRejectedValue(new Error("connection refused"));
    const response = await GET();
    expect(response.status).toBe(503);
    expect(await response.json()).toEqual({ status: "error", checks: { database: "error" } });
    expect(captureException).toHaveBeenCalledTimes(1);
  });
});
