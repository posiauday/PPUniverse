import { expect, type Browser, type Locator, type Page } from "@playwright/test";
import { compositeOver, contrastRatio, flattenLayers, type Rgb, type Rgba } from "./contrast.js";
import { evaluateFocus, type FocusFacts, type FocusIndicator } from "./focus.js";
import { headingOrderProblems, type HeadingInfo } from "./headings.js";
import { installInPageHelpers } from "./in-page.js";

/** Makes the in-page colour helpers available (idempotent; survives until navigation). */
async function ensureHelpers(page: Page): Promise<void> {
  await page.evaluate(installInPageHelpers);
}

// ---------------------------------------------------------------------------
// Focus
// ---------------------------------------------------------------------------

/**
 * Measures the focus indicator of whatever element is focused right now, using
 * the browser's own computed style and the real background layers behind it.
 * Returns null when nothing (or only the body) has focus.
 */
export async function measureFocusIndicator(page: Page): Promise<FocusIndicator | null> {
  await ensureHelpers(page);
  const facts = await page.evaluate((): FocusFacts | null => {
    const helpers = window.__e2e;
    if (!helpers) throw new Error("in-page helpers are not installed");
    const element = document.activeElement;
    if (!element || element === document.body || element === document.documentElement) return null;

    const style = getComputedStyle(element);
    const offset = Number.parseFloat(style.outlineOffset) || 0;
    // An outline is drawn outside the border box (unless the offset is negative), so
    // the colour it sits on is the parent's backdrop, not the element's own background.
    const anchor = offset < 0 ? element : (element.parentElement ?? element);
    const backdrop = helpers.backdrop(anchor);
    const name = (
      element.getAttribute("aria-label") ??
      (element as HTMLElement).innerText ??
      element.getAttribute("name") ??
      ""
    )
      .trim()
      .replace(/\s+/g, " ")
      .slice(0, 40);

    return {
      element: `${element.tagName.toLowerCase()}${name ? ` "${name}"` : ""}`,
      outlineStyle: style.outlineStyle,
      outlineWidthPx: Number.parseFloat(style.outlineWidth) || 0,
      outlineOffsetPx: offset,
      outlineColor: helpers.toRgba(style.outlineColor),
      boxShadow: style.boxShadow,
      backdropLayers: backdrop.layers,
      backdropUncertain: backdrop.hasImage,
    };
  });
  return facts ? evaluateFocus(facts) : null;
}

/**
 * Presses Tab (a real key press) from the top of the page until `target` has
 * focus; fails if it is never reached. Used instead of `locator.focus()` so the
 * :focus-visible heuristics apply exactly as they do for a keyboard user.
 */
export async function tabUntilFocused(page: Page, target: Locator, max = 40): Promise<void> {
  await page.evaluate(() => {
    (document.activeElement as HTMLElement | null)?.blur?.();
    window.scrollTo(0, 0);
  });
  for (let press = 0; press < max; press++) {
    await page.keyboard.press("Tab");
    const focused = await target
      .evaluate((element) => element === document.activeElement)
      .catch(() => false);
    if (focused) return;
  }
  throw new Error(`Tab did not reach the target within ${max} key presses`);
}

export interface TabStop {
  index: number;
  indicator: FocusIndicator;
}

export interface TabTraversal {
  /** Stops reached with real Tab key presses, in order. */
  stops: TabStop[];
  /**
   * Links whose focus indicator was measured by moving focus to them directly, because
   * this engine's Tab key does not visit links (see `engineTabsToLinks`). Empty when it does.
   */
  linkStops: TabStop[];
  /** Whether Tab moves focus to links in this engine. */
  tabsToLinks: boolean;
  /** Visible, natively focusable elements that no keyboard route reached: unreachable by keyboard. */
  unreached: string[];
}

/** Every focus stop whose indicator was measured, whichever way focus got there. */
export function allStops(traversal: TabTraversal): TabStop[] {
  return [...traversal.stops, ...traversal.linkStops];
}

const tabsToLinksByBrowser = new WeakMap<Browser, boolean>();

/**
 * Whether pressing Tab moves focus to links in this engine. Chromium and Firefox
 * do; WebKit's default, like Safari's, is that Tab visits form controls only and
 * links need a browser setting or Option+Tab. Probed on a throwaway page rather
 * than assumed from the engine name, so the answer is a fact about this build and
 * a real regression on the page under test (links made unreachable) is still caught
 * in the engines that do Tab to links.
 */
export async function engineTabsToLinks(page: Page): Promise<boolean> {
  const browser = page.context().browser();
  const cached = browser ? tabsToLinksByBrowser.get(browser) : undefined;
  if (cached !== undefined) return cached;

  const probe = await page.context().newPage();
  try {
    await probe.setContent('<!doctype html><title>probe</title><a href="#probe">probe link</a>');
    await probe.keyboard.press("Tab");
    const reached = await probe.evaluate(() => document.activeElement?.tagName === "A");
    if (browser) tabsToLinksByBrowser.set(browser, reached);
    return reached;
  } finally {
    await probe.close();
  }
}

/**
 * Walks the page with REAL Tab key presses (synthetic key events do not trigger
 * every browser default) and records the focus indicator at every stop.
 *
 * Two failure signals: focus that neither leaves the document nor wraps within
 * `max` presses (an unbounded tab order), and `unreached`, the visible focusable
 * elements no keyboard route landed on, which is what a keyboard trap or an
 * unreachable control looks like. A control that is deliberately not tabbable
 * (tabindex -1) is not expected to be reached and is not counted.
 *
 * Where the engine's Tab key skips links (WebKit), links cannot be reached by
 * Tab in this automation, so each unreached link gets focus moved to it directly
 * and its indicator is measured (`linkStops`); their keyboard REACHABILITY is then
 * not verified in that engine and is documented as a limitation.
 */
export async function traverseTabOrder(page: Page, max = 80): Promise<TabTraversal> {
  const tabsToLinks = await engineTabsToLinks(page);
  await ensureHelpers(page);
  await page.evaluate(() => {
    (document.activeElement as HTMLElement | null)?.blur?.();
    window.scrollTo(0, 0);
    const focusable =
      "a[href], button:not([disabled]), input:not([disabled]):not([type='hidden']), select:not([disabled]), " +
      "textarea:not([disabled]), summary, [tabindex]:not([tabindex='-1'])";
    for (const element of document.querySelectorAll(focusable)) {
      // tabindex="-1" is a deliberate opt-out of the tab order, so it is not expected to be reached.
      if (element.getAttribute("tabindex") === "-1") continue;
      if (element.checkVisibility()) element.setAttribute("data-e2e-expected", "1");
    }
  });

  const stops: TabStop[] = [];
  let ended = false;
  for (let press = 0; press < max; press++) {
    await page.keyboard.press("Tab");
    const state = await page.evaluate(() => {
      const element = document.activeElement;
      if (!element || element === document.body || element === document.documentElement) {
        return "left" as const;
      }
      if (element.hasAttribute("data-e2e-tab-seen")) return "wrapped" as const;
      element.setAttribute("data-e2e-tab-seen", "1");
      return "new" as const;
    });
    if (state !== "new") {
      ended = true;
      break;
    }
    const indicator = await measureFocusIndicator(page);
    if (indicator) stops.push({ index: stops.length + 1, indicator });
  }
  if (!ended) {
    await clearTraversalMarkers(page);
    throw new Error(
      `Focus neither left the document nor wrapped after ${max} Tab presses: possible unbounded tab order or keyboard trap.`,
    );
  }

  const linkStops: TabStop[] = [];
  if (!tabsToLinks) {
    // Move focus to each unvisited link in turn and measure its indicator.
    for (let guard = 0; guard < max; guard++) {
      const focused = await page.evaluate(() => {
        const link = document.querySelector("a[data-e2e-expected]:not([data-e2e-tab-seen])");
        if (!link) return false;
        link.setAttribute("data-e2e-tab-seen", "1");
        (link as HTMLElement).focus();
        return true;
      });
      if (!focused) break;
      const indicator = await measureFocusIndicator(page);
      if (indicator) linkStops.push({ index: linkStops.length + 1, indicator });
    }
  }

  const unreached = await clearTraversalMarkers(page);
  return { stops, linkStops, tabsToLinks, unreached };
}

/** Lists expected-but-unvisited elements, then removes the harness's marker attributes. */
async function clearTraversalMarkers(page: Page): Promise<string[]> {
  return page.evaluate(() => {
    const missed: string[] = [];
    for (const element of document.querySelectorAll("[data-e2e-expected]")) {
      if (!element.hasAttribute("data-e2e-tab-seen")) {
        const label = (element.getAttribute("aria-label") ?? element.textContent ?? "")
          .trim()
          .replace(/\s+/g, " ")
          .slice(0, 40);
        missed.push(`${element.tagName.toLowerCase()}${label ? ` "${label}"` : ""}`);
      }
    }
    for (const element of document.querySelectorAll("[data-e2e-expected], [data-e2e-tab-seen]")) {
      element.removeAttribute("data-e2e-expected");
      element.removeAttribute("data-e2e-tab-seen");
    }
    return missed;
  });
}

// ---------------------------------------------------------------------------
// Structure
// ---------------------------------------------------------------------------

export async function collectHeadings(page: Page): Promise<HeadingInfo[]> {
  return page.evaluate(() => {
    const elements = document.querySelectorAll("h1, h2, h3, h4, h5, h6, [role='heading']");
    const headings: { level: number; text: string }[] = [];
    for (const element of elements) {
      if (!element.checkVisibility()) continue;
      const native = /^H([1-6])$/.exec(element.tagName);
      const level = native ? Number(native[1]) : Number(element.getAttribute("aria-level") ?? "2");
      headings.push({
        level,
        text: (element.textContent ?? "").trim().replace(/\s+/g, " ").slice(0, 80),
      });
    }
    return headings;
  });
}

export async function expectWellFormedHeadings(page: Page, label: string): Promise<void> {
  const problems = headingOrderProblems(await collectHeadings(page));
  expect(problems, `${label}: heading outline problems`).toEqual([]);
}

export async function expectNoHorizontalOverflow(page: Page, label: string): Promise<void> {
  const { scrollWidth, clientWidth } = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    clientWidth: document.documentElement.clientWidth,
  }));
  expect(
    scrollWidth,
    `${label}: the page is ${scrollWidth}px wide in a ${clientWidth}px viewport (horizontal scrolling at this width)`,
  ).toBeLessThanOrEqual(clientWidth + 1);
}

// ---------------------------------------------------------------------------
// Contrast of specific rendered elements
// ---------------------------------------------------------------------------

export interface BoundaryContrast {
  element: string;
  borderStyle: string;
  borderWidthPx: number;
  borderColor: Rgb;
  /** Contrast of the border against the colour outside the control; null when it has no border. */
  ratioOutside: number | null;
  /** Contrast of the border against the colour inside the control; null when it has no border. */
  ratioInside: number | null;
}

/**
 * Non-text contrast of a control's visible boundary (WCAG 1.4.11): its border
 * colour against the real, composited backgrounds on both sides of it.
 */
export async function measureBorderContrast(control: Locator): Promise<BoundaryContrast> {
  const page = control.page();
  await ensureHelpers(page);
  const raw = await control.evaluate((element) => {
    const helpers = window.__e2e;
    if (!helpers) throw new Error("in-page helpers are not installed");
    const style = getComputedStyle(element);
    return {
      element: `${element.tagName.toLowerCase()}${element.id ? `#${element.id}` : ""}`,
      borderStyle: style.borderTopStyle,
      borderWidthPx: Number.parseFloat(style.borderTopWidth) || 0,
      borderColor: helpers.toRgba(style.borderTopColor),
      inside: helpers.backdrop(element).layers,
      outside: helpers.backdrop(element.parentElement ?? element).layers,
    };
  });

  const inside = flattenLayers(raw.inside);
  const outside = flattenLayers(raw.outside);
  const hasBorder =
    raw.borderStyle !== "none" && raw.borderStyle !== "hidden" && raw.borderWidthPx > 0;
  const border: Rgb = hasBorder ? compositeOver(raw.borderColor as Rgba, inside) : inside;
  return {
    element: raw.element,
    borderStyle: raw.borderStyle,
    borderWidthPx: raw.borderWidthPx,
    borderColor: border,
    ratioOutside: hasBorder ? contrastRatio(border, outside) : null,
    ratioInside: hasBorder ? contrastRatio(border, inside) : null,
  };
}

export interface PlaceholderContrast {
  element: string;
  placeholder: string;
  color: Rgb;
  backdrop: Rgb;
  ratio: number;
}

/** Text contrast (WCAG 1.4.3) of an input's placeholder against the input's real background. */
export async function measurePlaceholderContrast(input: Locator): Promise<PlaceholderContrast> {
  const page = input.page();
  await ensureHelpers(page);
  const raw = await input.evaluate((element) => {
    const helpers = window.__e2e;
    if (!helpers) throw new Error("in-page helpers are not installed");
    const color = getComputedStyle(element, "::placeholder").color;
    if (!color) throw new Error("this engine returned no computed ::placeholder colour");
    return {
      element: `${element.tagName.toLowerCase()}${element.id ? `#${element.id}` : ""}`,
      placeholder: element.getAttribute("placeholder") ?? "",
      color: helpers.toRgba(color),
      layers: helpers.backdrop(element).layers,
    };
  });
  const backdrop = flattenLayers(raw.layers);
  const color = compositeOver(raw.color as Rgba, backdrop);
  return {
    element: raw.element,
    placeholder: raw.placeholder,
    color,
    backdrop,
    ratio: contrastRatio(color, backdrop),
  };
}
