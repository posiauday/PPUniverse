import {
  allStops,
  measureFocusIndicator,
  tabUntilFocused,
  traverseTabOrder,
} from "../../../src/browser.js";
import { describeFocusProblem } from "../../../src/focus.js";
import { expect, test } from "../../../src/fixtures.js";
import { REFLOW_WIDTH, VIEWPORT_HEIGHT } from "../../../src/matrix.js";

/**
 * BUG-003 (WCAG 2.4.7 Focus Visible, 1.4.11 Non-text Contrast): the keyboard focus
 * ring used `currentColor`, which is near-white on the white-text Search button
 * over a white page (measured 1.06:1), so the button showed no focus indicator.
 */
test.describe("BUG-003: keyboard focus is visible on the Search button", () => {
  for (const width of [REFLOW_WIDTH, 1280]) {
    test(`the Search button's focus indicator is at least 3:1 at ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: VIEWPORT_HEIGHT });
      await page.goto("/search");
      await tabUntilFocused(page, page.getByRole("button", { name: "Search", exact: true }));

      const indicator = await measureFocusIndicator(page);
      if (!indicator) throw new Error("the Search button should have keyboard focus");
      expect(describeFocusProblem(indicator)).toBeNull();
    });
  }

  test("every keyboard stop on the search and category pages has a visible focus indicator", async ({
    page,
    seed,
  }) => {
    for (const path of ["/search", `/categories/${seed.populatedCategory.slug}`]) {
      await page.goto(path);
      const traversal = await traverseTabOrder(page);
      const stops = allStops(traversal);
      expect(stops.length, `${path}: expected keyboard stops`).toBeGreaterThan(0);
      expect(traversal.unreached, `${path}: controls no keyboard route reached`).toEqual([]);
      const problems = stops
        .map((stop) => describeFocusProblem(stop.indicator))
        .filter((problem): problem is string => problem !== null);
      expect(problems, `${path}: ${problems.join("; ")}`).toEqual([]);
    }
  });
});
