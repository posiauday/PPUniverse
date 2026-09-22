import type { Page, TestInfo } from "@playwright/test";
import { expectNoBlockingViolations } from "../../src/axe.js";
import { expectNoHorizontalOverflow } from "../../src/browser.js";
import { expect, test } from "../../src/fixtures.js";
import { VIEWPORT_HEIGHT, VIEWPORT_WIDTHS } from "../../src/matrix.js";
import { GATED_ROUTES } from "../../src/page-routes.js";
import { GATED_PAGES, type GatedPage } from "../../src/pages.js";
import type { FixtureSet } from "../../src/seed.js";
import { SITE_NAME } from "../../src/site.js";

/**
 * The page matrix (decisions Q33, Q34, Q35, Q42): every gated page state, at every
 * tested width, in every engine project. For each it checks:
 * - the response status;
 * - axe's blocking rules (WCAG 2 A/AA tags) — best-practice findings are advisory and
 *   only reported;
 * - no horizontal scrolling, including the 320px reflow check;
 * - a descriptive page title (never the bare site name, except on the home page).
 *
 * Coverage statement, kept honest: this exercises accessibility and rendering checks
 * across the browser and breakpoint matrices. It is NOT a cross-browser functional
 * regression suite, and it does not include screen readers.
 */

async function scan(
  page: Page,
  seed: FixtureSet,
  testInfo: TestInfo,
  state: GatedPage,
  width: number,
): Promise<void> {
  await page.setViewportSize({ width, height: VIEWPORT_HEIGHT });
  const response = await page.goto(state.path(seed));
  expect(response?.status(), `${state.id}: response status`).toBe(state.status);
  if (state.prepare) await state.prepare(page, seed);

  const label = `${state.id}@${width}`;
  const title = await page.title();
  expect(title.trim(), `${label}: the page needs a title`).not.toBe("");
  if (state.id !== "home") {
    expect(title, `${label}: the title must describe the page, not just name the site`).not.toBe(
      SITE_NAME,
    );
  }

  await expectNoBlockingViolations(page, testInfo, label);
  await expectNoHorizontalOverflow(page, label);
}

test.describe("page matrix: axe blocking rules, overflow and titles", () => {
  for (const state of GATED_PAGES.filter((candidate) => candidate.auth === "guest")) {
    for (const width of VIEWPORT_WIDTHS) {
      test(`${state.id} @ ${width}px: ${state.description}`, async ({ page, seed }, testInfo) => {
        await scan(page, seed, testInfo, state, width);
      });
    }
  }

  for (const state of GATED_PAGES.filter((candidate) => candidate.auth === "member")) {
    for (const width of VIEWPORT_WIDTHS) {
      test(`${state.id} @ ${width}px: ${state.description}`, async ({
        page,
        seed,
        signedIn,
      }, testInfo) => {
        void signedIn; // requested for its side effect: it adds the session cookie
        await scan(page, seed, testInfo, state, width);
      });
    }
  }
});

test.describe("page inventory", () => {
  test("every gated route is exercised by at least one page state", () => {
    for (const route of GATED_ROUTES) {
      expect(
        GATED_PAGES.some((state) => state.route === route),
        `no page state exercises ${route}`,
      ).toBe(true);
    }
  });

  test("state ids are unique, so reports and the documentation can refer to them", () => {
    const ids = GATED_PAGES.map((state) => state.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  test("page titles are descriptive and distinct across the gated pages", async ({
    page,
    seed,
    signedIn,
  }) => {
    void signedIn;
    // One representative state per distinct page: the first state seen for each route,
    // plus the 404, so a copy-pasted title is caught.
    const representatives = GATED_PAGES.filter(
      (state, index) =>
        state.id === "not-found" ||
        (state.route !== null &&
          GATED_PAGES.findIndex((other) => other.route === state.route) === index),
    );
    const titles = new Map<string, string>();
    for (const state of representatives) {
      await page.goto(state.path(seed));
      titles.set(state.id, await page.title());
    }
    const values = [...titles.values()];
    expect(
      new Set(values).size,
      `every gated page needs its own title, got: ${JSON.stringify(Object.fromEntries(titles))}`,
    ).toBe(values.length);
  });
});
