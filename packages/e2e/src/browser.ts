import { expect, type Locator, type Page } from "@playwright/test";
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

export interface TabStop {
  index: number;
  indicator: FocusIndicator;
}

export interface TabTraversal {
  stops: TabStop[];
  /** Visible, natively focusable elements that Tab never reached: unreachable by keyboard. */
  unreached: string[];
}

/**
 * Walks the page with REAL Tab key presses (synthetic key events do not trigger
 * every browser default) and records the focus indicator at every stop.
 *
 * Two failure signals: focus that neither leaves the document nor wraps within
 * `max` presses (an unbounded tab order), and `unreached`, the visible focusable
 * elements Tab never landed on, which is what a keyboard trap or an unreachable
 * control looks like. A control that is deliberately not tabbable (tabindex -1)
 * is not expected to be reached and is not counted.
 */
export async function traverseTabOrder(page: Page, max = 80): Promise<TabTraversal> {
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

  const unreached = await page.evaluate(() => {
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

  if (!ended) {
    throw new Error(
      `Focus neither left the document nor wrapped after ${max} Tab presses: possible unbounded tab order or keyboard trap.`,
    );
  }
  return { stops, unreached };
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
