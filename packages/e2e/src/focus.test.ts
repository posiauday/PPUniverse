import { describe, expect, it } from "vitest";
import { describeFocusProblem, evaluateFocus, type FocusFacts } from "./focus.js";

const WHITE_PAGE: FocusFacts["backdropLayers"] = [[255, 255, 255, 1]];

function facts(overrides: Partial<FocusFacts> = {}): FocusFacts {
  return {
    element: 'button "Search"',
    outlineStyle: "solid",
    outlineWidthPx: 2,
    outlineOffsetPx: 2,
    outlineColor: [27, 29, 36, 1],
    boxShadow: "none",
    backdropLayers: WHITE_PAGE,
    backdropUncertain: false,
    ...overrides,
  };
}

describe("focus indicator verdict", () => {
  it("passes a dark outline over a white page", () => {
    const indicator = evaluateFocus(facts());
    expect(indicator.ratio).toBeGreaterThan(10);
    expect(describeFocusProblem(indicator)).toBeNull();
  });

  it("fails the near-white outline that BUG-003 measured at about 1.06:1", () => {
    // currentColor on a white-text button over a white page is near-white on white.
    const indicator = evaluateFocus(facts({ outlineColor: [250, 250, 250, 1] }));
    expect(indicator.ratio).toBeLessThan(1.1);
    expect(describeFocusProblem(indicator)).toMatch(/below 3:1/);
  });

  it("fails an element whose outline is removed", () => {
    const none = evaluateFocus(facts({ outlineStyle: "none" }));
    expect(none.ratio).toBeNull();
    expect(describeFocusProblem(none)).toMatch(/no visible outline/);

    const zero = evaluateFocus(facts({ outlineWidthPx: 0 }));
    expect(describeFocusProblem(zero)).toMatch(/no visible outline/);
  });

  it("flags, rather than passes, an outline-less element that has only a box-shadow", () => {
    const indicator = evaluateFocus(facts({ outlineStyle: "none", boxShadow: "0 0 0 2px red" }));
    expect(describeFocusProblem(indicator)).toMatch(/box-shadow/);
  });

  it("composites a translucent outline over the real backdrop before measuring", () => {
    // A 30% black outline over white is a light grey: far below 3:1.
    const indicator = evaluateFocus(facts({ outlineColor: [0, 0, 0, 0.3] }));
    expect(indicator.ratio).toBeLessThan(3);
  });

  it("measures against the nearest opaque backdrop, not the page token", () => {
    // The same dark outline over a dark card backdrop fails.
    const dark = evaluateFocus(facts({ backdropLayers: [[20, 22, 28, 1]] }));
    expect(describeFocusProblem(dark)).toMatch(/below 3:1/);
  });

  it("reports an unmeasurable backdrop instead of guessing", () => {
    const indicator = evaluateFocus(facts({ backdropUncertain: true }));
    expect(describeFocusProblem(indicator)).toMatch(/cannot be measured/);
  });

  it("honours a stricter minimum when asked", () => {
    const indicator = evaluateFocus(facts({ outlineColor: [110, 110, 110, 1] }));
    expect(describeFocusProblem(indicator, 3)).toBeNull();
    expect(describeFocusProblem(indicator, 7)).toMatch(/below 7:1/);
  });
});
