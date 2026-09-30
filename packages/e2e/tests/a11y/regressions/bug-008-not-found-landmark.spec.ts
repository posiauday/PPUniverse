import { expect, test } from "../../../src/fixtures.js";

/**
 * BUG-008, part 1 (WCAG 1.3.1 / 2.4.1, landmark regions): with no custom
 * not-found page, an unknown URL rendered the framework default, which has no
 * <main> landmark. The page must keep a real 404 status.
 */
test.describe("BUG-008: the 404 page has a main landmark, a heading and a way home", () => {
  for (const path of [
    "/no-such-page-e2e",
    "/account",
    "/products/zz-e2e-a11y-no-such-product",
    "/categories/zz-e2e-a11y-no-such-category",
  ]) {
    test(`${path} is a 404 with a main landmark, one h1 and a link home`, async ({ page }) => {
      const response = await page.goto(path);
      expect(response?.status(), "the status must stay 404").toBe(404);

      await expect(page.getByRole("main")).toHaveCount(1);
      await expect(page.getByRole("main").getByRole("heading", { level: 1 })).toHaveCount(1);
      await expect(page.getByRole("main").locator('a[href="/"]')).toHaveCount(1);
    });
  }
});
