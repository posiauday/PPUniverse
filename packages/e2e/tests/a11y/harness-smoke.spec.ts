import { expect, test } from "../../src/fixtures.js";
import {
  installClickEventTracer,
  snapshotButtonNode,
  type ClickEventLogEntry,
  type RootContainerInfo,
} from "../../src/signin-click-diagnostics.js";

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

  /**
   * Self-check for the BUG-014 evidence mechanism itself (decision, 2026-09-22, "Run 10
   * disposition"): the node-identity comparison and event capture that any future
   * TEST DEFECT / PRODUCT DEFECT classification would rely on must be proven against a
   * REAL browser, not a simulation, and UNCONDITIONALLY — not only when a sign-in test
   * happens to fail. `failure-evidence.ts`'s `attachOnFailure` returns immediately on a
   * passing test (see its own comment: "a green run pays nothing extra"), so on any run
   * where every sign-in state passes, no click-diagnostics evidence is ever extracted
   * from the browser at all — there is nothing to inspect. This test closes that gap by
   * asserting the mechanism directly, every run, independent of the sign-in flow, so its
   * result (not a jsdom simulation, not silence) is what section 2 of that decision can
   * be answered from.
   */
  test("the click-diagnostics instrument proves itself in a real browser: identity persists for an untouched element, differs for a different one, and document-level capture works", async ({
    page,
    seed,
  }) => {
    await page.goto(`/products/${seed.fullProduct.slug}`);
    await page.evaluate(installClickEventTracer);

    const rootContainer = await page.evaluate(
      () =>
        (window as unknown as { __e2eRootInfo?: RootContainerInfo }).__e2eRootInfo ?? {
          found: false,
          description: null,
        },
    );
    expect(
      rootContainer.found,
      "React's root container must be found on a real hydrated page",
    ).toBe(true);

    const heading = page.getByRole("heading", { level: 1 });
    const link = page.locator('a[href^="/categories/"]').first();

    // (b) Positive control: the SAME untouched element, snapshotted via TWO SEPARATE
    // evaluate() calls (crossing Playwright's serialization boundary twice, exactly as
    // atResolution/atDispatch do), must report the same identity token. This is not
    // provable by reading the source: if the WeakMap were constructed fresh inside the
    // function body instead of read from a persistent `window` global, this would fail
    // every time, which is also the proof for (a) — where the store lives.
    const headingFirst = await heading.evaluate(snapshotButtonNode);
    const headingSecond = await heading.evaluate(snapshotButtonNode);
    expect(
      headingFirst.isKnownNode,
      "first snapshot of a never-seen element must not read as known",
    ).toBe(false);
    expect(
      headingSecond.isKnownNode,
      "second snapshot of the SAME untouched element must read as known",
    ).toBe(true);
    expect(
      headingSecond.nodeId,
      "the SAME untouched element must report the SAME identity token across two separate evaluate() calls",
    ).toBe(headingFirst.nodeId);

    // (c) Negative control: a genuinely different element must report a different token,
    // not the same one reused or a coincidental collision.
    const linkSnapshot = await link.evaluate(snapshotButtonNode);
    expect(
      linkSnapshot.isKnownNode,
      "a genuinely different, never-seen element must not read as known",
    ).toBe(false);
    expect(
      linkSnapshot.nodeId,
      "a genuinely different element must report a DIFFERENT identity token",
    ).not.toBe(headingFirst.nodeId);

    // (d) The capture listener must be attached at document (and React's own root,
    // confirmed found above) — not at the clicked element itself — so a real,
    // physical click anywhere is visible at both levels. The heading is not a link or
    // button, so clicking it has no navigational side effect to interfere with reading
    // window state afterward.
    await heading.click();
    const events = await page.evaluate(() => ({
      document:
        (window as unknown as { __e2eClickEvents?: ClickEventLogEntry[] }).__e2eClickEvents ?? [],
      root:
        (window as unknown as { __e2eRootClickEvents?: ClickEventLogEntry[] })
          .__e2eRootClickEvents ?? [],
    }));
    expect(
      events.document.length,
      "a real click anywhere in the document must be captured by the document-level listener",
    ).toBeGreaterThan(0);
    expect(
      events.root.length,
      "the same real click must also be captured by React's own root-container listener",
    ).toBeGreaterThan(0);
  });
});
