import { describe, expect, it } from "vitest";
import {
  CANVAS_WHITE,
  compositeOver,
  contrastRatio,
  flattenLayers,
  formatRatio,
  relativeLuminance,
} from "./contrast.js";

describe("contrast maths", () => {
  it("gives black on white the maximum ratio of 21:1", () => {
    expect(contrastRatio([0, 0, 0], [255, 255, 255])).toBeCloseTo(21, 5);
  });

  it("gives identical colours the minimum ratio of 1:1", () => {
    expect(contrastRatio([40, 90, 200], [40, 90, 200])).toBeCloseTo(1, 5);
  });

  it("is symmetric", () => {
    expect(contrastRatio([10, 20, 30], [220, 230, 240])).toBeCloseTo(
      contrastRatio([220, 230, 240], [10, 20, 30]),
      10,
    );
  });

  it("matches the published ratios for #767676 (4.54:1) and #777777 (4.48:1) on white", () => {
    expect(contrastRatio([0x76, 0x76, 0x76], CANVAS_WHITE)).toBeCloseTo(4.54, 2);
    expect(contrastRatio([0x77, 0x77, 0x77], CANVAS_WHITE)).toBeCloseTo(4.48, 2);
  });

  it("computes relative luminance at the extremes", () => {
    expect(relativeLuminance([0, 0, 0])).toBe(0);
    expect(relativeLuminance([255, 255, 255])).toBeCloseTo(1, 10);
  });

  it("composites a translucent colour over its backdrop and rounds to 8-bit", () => {
    expect(compositeOver([0, 0, 0, 0.5], [255, 255, 255])).toEqual([128, 128, 128]);
    expect(compositeOver([10, 20, 30, 1], [255, 255, 255])).toEqual([10, 20, 30]);
    expect(compositeOver([10, 20, 30, 0], [200, 100, 50])).toEqual([200, 100, 50]);
  });

  it("flattens layers nearest-first onto the canvas, painting the farthest layer first", () => {
    // Nearest element paints 50% black over a parent painting opaque white over the canvas.
    expect(
      flattenLayers([
        [0, 0, 0, 0.5],
        [255, 255, 255, 1],
      ]),
    ).toEqual([128, 128, 128]);
    // No layers at all means the bare canvas.
    expect(flattenLayers([])).toEqual(CANVAS_WHITE);
  });

  it("formats a ratio to two decimals", () => {
    expect(formatRatio(1.0629)).toBe("1.06:1");
  });
});
