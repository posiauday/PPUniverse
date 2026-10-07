import { describe, expect, it } from "vitest";
import { SPEED_BUDGET, medianVitals, overBudget, totalBlockingTime } from "./web-vitals.js";

describe("the speed budget's maths (MVP-042)", () => {
  it("counts only each long task's time over 50 ms, after the first contentful paint", () => {
    const tbt = totalBlockingTime({
      fcp: 1000,
      longTasks: [
        { start: 500, duration: 300 }, // before FCP: ignored
        { start: 1200, duration: 120 }, // 70 ms blocking
        { start: 2000, duration: 50 }, // exactly 50: 0 ms
        { start: 2500, duration: 260 }, // 210 ms
      ],
    });
    expect(tbt).toBe(280);
  });

  it("takes the median of each metric separately", () => {
    expect(
      medianVitals([
        { lcpMs: 3000, cls: 0, tbtMs: 100 },
        { lcpMs: 1000, cls: 0.2, tbtMs: 300 },
        { lcpMs: 2000, cls: 0.05, tbtMs: 200 },
      ]),
    ).toEqual({ lcpMs: 2000, cls: 0.05, tbtMs: 200 });
  });

  it("names every budget line a page breaks, and nothing at the limits", () => {
    expect(overBudget({ lcpMs: 2500, cls: 0.099, tbtMs: 200 })).toEqual([]);
    expect(overBudget({ lcpMs: 2600, cls: 0.1, tbtMs: 450 })).toEqual([
      `LCP 2600 ms > ${SPEED_BUDGET.lcpMs} ms`,
      `CLS 0.100 >= ${SPEED_BUDGET.cls}`,
      `TBT 450 ms > ${SPEED_BUDGET.tbtMs} ms`,
    ]);
  });
});
