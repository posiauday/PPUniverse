import { expectWellFormedHeadings } from "../../../src/browser.js";
import { expect, test } from "../../../src/fixtures.js";
import { SEARCH_TERM } from "../../../src/seed.js";

/**
 * BUG-007 (WCAG 1.3.1 Info and Relationships): product card titles are h3, and the
 * category and search pages went straight from the h1 to those h3s, skipping a
 * heading level.
 */
test.describe("BUG-007: results lists do not skip a heading level", () => {
  test("search results follow the h1 with an h2 before the card titles", async ({ page, seed }) => {
    await page.goto(`/search?q=${SEARCH_TERM}`);
    await expect(page.locator('a[href^="/products/"]').first()).toBeVisible();
    await expectWellFormedHeadings(page, `/search?q=${SEARCH_TERM}`);
    void seed;
  });

  test("a category listing follows the h1 with an h2 before the card titles", async ({
    page,
    seed,
  }) => {
    await page.goto(`/categories/${seed.populatedCategory.slug}`);
    await expect(page.locator('a[href^="/products/"]').first()).toBeVisible();
    await expectWellFormedHeadings(page, `/categories/${seed.populatedCategory.slug}`);
  });
});
