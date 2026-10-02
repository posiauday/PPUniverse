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
        page.getByRole("main").getByRole("searchbox", { name: "Search guides and components" }),
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

  // MVP-031: the header's own search box (shown from the xl breakpoint) is a
  // text box too, so its edge needs the same 3:1.
  test("the header search box border is at least 3:1 at 1280px", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: VIEWPORT_HEIGHT });
    await page.goto("/");

    const boundary = await measureBorderContrast(
      page.getByRole("banner").getByRole("searchbox", { name: "Search guides and components" }),
    );
    expect(boundary.ratioOutside, "the header search box should have a border").not.toBeNull();
    expect(boundary.ratioOutside as number, "border against the header").toBeGreaterThanOrEqual(3);
    expect(boundary.ratioInside as number, "border against the box").toBeGreaterThanOrEqual(3);
  });
});
