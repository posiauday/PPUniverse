import { expect, test } from "../../../src/fixtures.js";
import { SITE_NAME, titleFor } from "../../../src/site.js";

/**
 * BUG-005, page title (WCAG 2.4.2 Page Titled): the sign-in page's title was the
 * bare site name, the same as every other page that does not set its own.
 */
test("the sign-in page has its own descriptive title (BUG-005)", async ({ page }) => {
  await page.goto("/signin");
  await expect(page).toHaveTitle(titleFor("Sign in"));
  expect(await page.title()).not.toBe(SITE_NAME);
});
