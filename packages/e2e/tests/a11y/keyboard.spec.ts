import type { Page, TestInfo } from "@playwright/test";
import { allStops, traverseTabOrder } from "../../src/browser.js";
import { describeFocusProblem } from "../../src/focus.js";
import { expect, test } from "../../src/fixtures.js";
import { REFLOW_WIDTH, VIEWPORT_HEIGHT, type ViewportWidth } from "../../src/matrix.js";
import { GATED_PAGES, type GatedPage } from "../../src/pages.js";
import type { FixtureSet } from "../../src/seed.js";

/**
 * Keyboard traversal for every gated page state, with REAL Tab key presses (decision
 * Q35: no keyboard trap, no invisible focus indicator, no unreachable control).
 * Checked at the desktop width and at the 320px reflow width, where the layout differs.
 *
 * Stated limit: this drives a keyboard in three browser engines. It is not a
 * screen-reader test, and in WebKit the Tab key does not visit links (the engine's
 * default), so there link focus indicators are measured by moving focus to each link
 * and link reachability by keyboard is not verified.
 */

const KEYBOARD_WIDTHS: readonly ViewportWidth[] = [REFLOW_WIDTH, 1280];

async function traverse(
  page: Page,
  seed: FixtureSet,
  testInfo: TestInfo,
  state: GatedPage,
  width: number,
): Promise<void> {
  await page.setViewportSize({ width, height: VIEWPORT_HEIGHT });
  await page.goto(state.path(seed));
  if (state.prepare) await state.prepare(page, seed);

  const label = `${state.id}@${width}`;
  const traversal = await traverseTabOrder(page);
  if (!traversal.tabsToLinks) {
    testInfo.annotations.push({
      type: "keyboard-limitation",
      description:
        "Tab does not visit links in this engine: link focus indicators measured by moving focus; link reachability by keyboard not verified",
    });
  }

  const stops = allStops(traversal);
  expect(stops.length, `${label}: the page has no keyboard stops`).toBeGreaterThan(0);
  expect(traversal.unreached, `${label}: controls no keyboard route reached`).toEqual([]);

  const problems = stops
    .map((stop) => describeFocusProblem(stop.indicator))
    .filter((problem): problem is string => problem !== null);
  expect(problems, `${label}: focus indicator problems`).toEqual([]);
}

test.describe("keyboard traversal: reachable controls with a visible focus indicator", () => {
  for (const state of GATED_PAGES.filter((candidate) => candidate.auth === "guest")) {
    for (const width of KEYBOARD_WIDTHS) {
      test(`${state.id} @ ${width}px`, async ({ page, seed }, testInfo) => {
        await traverse(page, seed, testInfo, state, width);
      });
    }
  }

  for (const state of GATED_PAGES.filter((candidate) => candidate.auth === "member")) {
    for (const width of KEYBOARD_WIDTHS) {
      test(`${state.id} @ ${width}px`, async ({ page, seed, signedIn }, testInfo) => {
        void signedIn; // requested for its side effect: it adds the session cookie
        await traverse(page, seed, testInfo, state, width);
      });
    }
  }

  for (const state of GATED_PAGES.filter((candidate) => candidate.auth === "admin")) {
    for (const width of KEYBOARD_WIDTHS) {
      test(`${state.id} @ ${width}px`, async ({ page, seed, signedInAsAdmin }, testInfo) => {
        void signedInAsAdmin; // requested for its side effect: it adds the session cookie
        await traverse(page, seed, testInfo, state, width);
      });
    }
  }
});
