import { expect, test } from "../../../src/fixtures.js";
import { SITE_NAME, titleFor } from "../../../src/site.js";

/**
 * BUG-006, page title (WCAG 2.4.2 Page Titled): the account sessions page's title
 * was the bare site name.
 */
test("the account sessions page has its own descriptive title (BUG-006)", async ({
  page,
  signedIn,
}) => {
  void signedIn;
  await page.goto("/account/sessions");
  await expect(page).toHaveTitle(titleFor("Active sessions"));
  expect(await page.title()).not.toBe(SITE_NAME);
});
