import { expect, test } from "../../../src/fixtures.js";
import { SITE_NAME, titleFor } from "../../../src/site.js";

/**
 * BUG-008, page title (WCAG 2.4.2 Page Titled): the 404 page's title was the bare
 * site name.
 */
test("the 404 page has its own descriptive title (BUG-008)", async ({ page }) => {
  const response = await page.goto("/no-such-page-e2e");
  expect(response?.status()).toBe(404);
  await expect(page).toHaveTitle(titleFor("Page not found"));
  expect(await page.title()).not.toBe(SITE_NAME);
});
