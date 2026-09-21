import { expect, test } from "../../src/fixtures.js";

/**
 * Harness smoke checks: the server is up, the temporary database fixtures render,
 * and the seeded session signs a browser in through the real server-enforced path.
 * If any of these fail, every other accessibility result is meaningless.
 */
test.describe("harness smoke: server, database fixtures and sign-in", () => {
  test("serves the fixture product page", async ({ page, seed }) => {
    const response = await page.goto(`/products/${seed.fullProduct.slug}`);
    expect(response?.status()).toBe(200);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(seed.fullProduct.name);
  });

  test("a populated category lists fixture products and an empty category lists none", async ({
    page,
    seed,
  }) => {
    await page.goto(`/categories/${seed.populatedCategory.slug}`);
    await expect(
      page.getByRole("link", { name: new RegExp(seed.fullProduct.name.slice(0, 20)) }).first(),
    ).toBeVisible();

    await page.goto(`/categories/${seed.emptyCategory.slug}`);
    await expect(page.locator('a[href^="/products/"]')).toHaveCount(0);
  });

  test("the seeded session signs the browser in", async ({ page, seed, signedIn }) => {
    void signedIn; // requested for its side effect: it adds the session cookie
    await page.goto("/account/sessions");
    await expect(page.getByText(`Signed in as ${seed.user.email}`)).toBeVisible();
  });

  test("a guest is redirected to sign-in: authorization stays server-enforced", async ({
    page,
  }) => {
    await page.goto("/account/sessions");
    await expect(page).toHaveURL(/\/signin$/);
  });

  test("records the engine build under test", async ({ browser, browserName }, testInfo) => {
    // Pinned, bundled builds: the version is a fact of the Playwright release, recorded so the
    // run summary and the documentation state exactly what was exercised.
    testInfo.annotations.push({
      type: "engine-version",
      description: `${browserName} ${browser.version()}`,
    });
    expect(browser.version()).not.toBe("");
  });

  test("an unknown URL is a real 404", async ({ page }) => {
    const response = await page.goto("/no-such-page-e2e");
    expect(response?.status()).toBe(404);
  });
});
