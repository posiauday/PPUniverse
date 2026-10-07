import { expect, test } from "../../src/fixtures.js";
import type { FixtureSet } from "../../src/seed.js";
import {
  SPEED_BUDGET,
  measure,
  medianVitals,
  overBudget,
  type Vitals,
} from "../../src/web-vitals.js";

/**
 * The page-speed budget (MVP-042): the pages most people land on stay within
 * Google's Core Web Vitals "good" thresholds on a mid-range phone, so new
 * visuals and motion can't quietly slow them down. Chromium only (throttling
 * uses the DevTools protocol); the median of 3 loads per page.
 */
const PAGES: ReadonlyArray<{ name: string; path: (seed: FixtureSet) => string }> = [
  { name: "home", path: () => "/" },
  { name: "guides index", path: () => "/learn" },
  { name: "a guide", path: (seed) => `/learn/${seed.publishedArticle.slug}` },
  { name: "a technology hub", path: () => "/power-apps" },
];

const RUNS = 3;

test.use({ reducedMotion: "no-preference" });

for (const target of PAGES) {
  test(`${target.name} is within the speed budget`, async ({
    browser,
    browserName,
    baseURL,
    seed,
  }, testInfo) => {
    test.skip(browserName !== "chromium", "Throttling needs Chromium's DevTools protocol");
    test.setTimeout(120_000);
    const runs: Vitals[] = [];
    for (let run = 0; run < RUNS; run += 1) {
      // A fresh context each time: a cold cache, like a first visit.
      const context = await browser.newContext({ ...(baseURL ? { baseURL } : {}) });
      const page = await context.newPage();
      runs.push(await measure(page, target.path(seed)));
      await context.close();
    }
    const vitals = medianVitals(runs);
    testInfo.annotations.push({
      type: "vitals",
      description: `LCP ${Math.round(vitals.lcpMs)} ms · CLS ${vitals.cls.toFixed(3)} · TBT ${Math.round(vitals.tbtMs)} ms`,
    });
    console.log(
      `[speed] ${target.name}: LCP ${Math.round(vitals.lcpMs)} ms, CLS ${vitals.cls.toFixed(3)}, TBT ${Math.round(vitals.tbtMs)} ms (budget ${SPEED_BUDGET.lcpMs} ms / ${SPEED_BUDGET.cls} / ${SPEED_BUDGET.tbtMs} ms)`,
    );
    expect(overBudget(vitals), `${target.name} is over the speed budget`).toEqual([]);
  });
}
