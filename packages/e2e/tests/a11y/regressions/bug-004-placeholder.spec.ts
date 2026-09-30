import { measurePlaceholderContrast } from "../../../src/browser.js";
import { expect, test } from "../../../src/fixtures.js";
import { REFLOW_WIDTH, VIEWPORT_HEIGHT } from "../../../src/matrix.js";

/**
 * BUG-004, part 2 (WCAG 1.4.3 Contrast (Minimum)): the search input's placeholder
 * was measured at 3.46:1; text needs 4.5:1.
 */
test.describe("BUG-004: the search input placeholder has enough contrast", () => {
  for (const width of [REFLOW_WIDTH, 1280]) {
    test(`the placeholder text is at least 4.5:1 at ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: VIEWPORT_HEIGHT });
      await page.goto("/search");

      const placeholder = await measurePlaceholderContrast(
        page.getByRole("searchbox", { name: "Search products" }),
      );
      expect(placeholder.placeholder, "the input should have placeholder text").not.toBe("");
      expect(
        placeholder.ratio,
        "placeholder text against the input background",
      ).toBeGreaterThanOrEqual(4.5);
    });
  }
});
