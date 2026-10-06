import { describe, expect, it, vi } from "vitest";

const logger = vi.hoisted(() => ({ error: vi.fn() }));
vi.mock("@ppu/telemetry", () => ({ logger }));

import { BADGE_UPDATE_LIMIT, loadUpdateTimes } from "./update-times";

describe("loadUpdateTimes (MVP-033 slice D)", () => {
  it("returns the newest published times as ISO strings", async () => {
    const list = vi.fn().mockResolvedValue([new Date("2026-10-02T00:00:00Z")]);
    expect(await loadUpdateTimes({ listPublishedUpdateTimes: list })).toEqual([
      "2026-10-02T00:00:00.000Z",
    ]);
    expect(list).toHaveBeenCalledWith(BADGE_UPDATE_LIMIT);
  });

  it("shows no badge, and logs, when the read fails, rather than breaking the page", async () => {
    const list = vi.fn().mockRejectedValue(new Error("down"));
    expect(await loadUpdateTimes({ listPublishedUpdateTimes: list })).toEqual([]);
    expect(logger.error).toHaveBeenCalledWith("updates.badge_load_failed", { error: "Error" });
  });
});
