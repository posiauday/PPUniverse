import { measureBorderContrast } from "../../../src/browser.js";
import { expect, test } from "../../../src/fixtures.js";
import { REFLOW_WIDTH, VIEWPORT_HEIGHT } from "../../../src/matrix.js";

/**
 * BUG-004, part 1 (WCAG 1.4.11 Non-text Contrast): the search input's border was
 * measured at 1.35:1 against the page; a control's visible boundary needs 3:1.
 */
test.describe("BUG-004: the search input boundary has enough contrast", () => {
  for (const width of [REFLOW_WIDTH, 1280]) {
    test(`the input border is at least 3:1 against the page at ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: VIEWPORT_HEIGHT });
      await page.goto("/search");

      const boundary = await measureBorderContrast(
        page.getByRole("searchbox", { name: "Search products" }),
      );
      expect(boundary.ratioOutside, "the search input should have a visible border").not.toBeNull();
      expect(
        boundary.ratioOutside as number,
        "border against the colour outside the input",
      ).toBeGreaterThanOrEqual(3);
      expect(
        boundary.ratioInside as number,
        "border against the colour inside the input",
      ).toBeGreaterThanOrEqual(3);
    });
  }
});
