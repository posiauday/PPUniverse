// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  FIRST_VISIT_WINDOW_MS,
  LAST_VISIT_KEY,
  VISITED_EVENT,
  badgeText,
  countNew,
  markVisited,
  readLastVisit,
} from "./updates-visit";

afterEach(() => {
  window.localStorage.clear();
  vi.restoreAllMocks();
});

describe("updates visit tracking (MVP-033 slice D)", () => {
  const now = Date.parse("2026-10-03T12:00:00Z");
  const times = ["2026-10-02T00:00:00Z", "2026-09-30T00:00:00Z", "2026-08-01T00:00:00Z"];

  it("counts updates newer than the last visit, or inside the first-visit window", () => {
    expect(countNew(times, Date.parse("2026-10-01T00:00:00Z"), now)).toBe(1);
    expect(countNew(times, null, now)).toBe(2);
    expect(countNew(times, now, now)).toBe(0);
    expect(FIRST_VISIT_WINDOW_MS).toBe(14 * 24 * 60 * 60 * 1000);
  });

  it("caps the badge at 9+", () => {
    expect(badgeText(3)).toBe("3");
    expect(badgeText(12)).toBe("9+");
  });

  it("stores the visit in localStorage only, and announces it", () => {
    const listener = vi.fn();
    window.addEventListener(VISITED_EVENT, listener);
    markVisited(now);
    expect(window.localStorage.getItem(LAST_VISIT_KEY)).toBe(String(now));
    expect(readLastVisit()).toBe(now);
    expect(listener).toHaveBeenCalledTimes(1);
    window.removeEventListener(VISITED_EVENT, listener);
  });

  it("treats blocked or garbled storage as no visit, without throwing", () => {
    window.localStorage.setItem(LAST_VISIT_KEY, "not a number");
    expect(readLastVisit()).toBeNull();
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new Error("blocked");
    });
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("blocked");
    });
    expect(readLastVisit()).toBeNull();
    expect(() => markVisited(now)).not.toThrow();
  });
});
