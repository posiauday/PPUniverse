import {
  compositeOver,
  contrastRatio,
  flattenLayers,
  formatRatio,
  type Rgb,
  type Rgba,
} from "./contrast.js";

/**
 * Raw facts about the focus indicator of the currently focused element, as
 * measured in the browser (see browser.ts). Turning them into a verdict is pure,
 * so it is unit-tested without a browser.
 */
export interface FocusFacts {
  /** A short human label, for example `button "Search"`. */
  element: string;
  outlineStyle: string;
  outlineWidthPx: number;
  outlineOffsetPx: number;
  /** The outline colour resolved to sRGB by the browser. */
  outlineColor: Rgba;
  boxShadow: string;
  /** Background layers behind the outline, nearest element first. */
  backdropLayers: Rgba[];
  /** True when an ancestor paints a background image, so the colour behind cannot be measured. */
  backdropUncertain: boolean;
}

export interface FocusIndicator extends FocusFacts {
  backdrop: Rgb;
  /** Contrast of the outline against the colour it is drawn over; null when there is no outline. */
  ratio: number | null;
}

/** WCAG 2.2 1.4.11 Non-text Contrast: a focus indicator needs 3:1 against adjacent colours. */
export const MIN_FOCUS_CONTRAST = 3;

export function evaluateFocus(facts: FocusFacts): FocusIndicator {
  const backdrop = flattenLayers(facts.backdropLayers);
  const hasOutline = facts.outlineStyle !== "none" && facts.outlineWidthPx > 0;
  const ratio = hasOutline
    ? contrastRatio(compositeOver(facts.outlineColor, backdrop), backdrop)
    : null;
  return { ...facts, backdrop, ratio };
}

/**
 * Returns why a focus indicator fails, or null when it passes. Scope, stated
 * honestly: this checks an outline (the only indicator the site draws). An
 * element that removes its outline and relies on a box-shadow or border change is
 * reported as failing so that a human looks at it, rather than silently passing.
 */
export function describeFocusProblem(
  indicator: FocusIndicator,
  minRatio: number = MIN_FOCUS_CONTRAST,
): string | null {
  if (indicator.ratio === null) {
    const shadow =
      indicator.boxShadow !== "none"
        ? " (it has a box-shadow, which this check does not measure)"
        : "";
    return `${indicator.element}: no visible outline when focused${shadow}`;
  }
  if (indicator.backdropUncertain) {
    return `${indicator.element}: the colour behind the focus outline cannot be measured (background image)`;
  }
  if (indicator.ratio < minRatio) {
    return (
      `${indicator.element}: focus outline contrast ${formatRatio(indicator.ratio)} ` +
      `is below ${minRatio}:1 (outline ${indicator.outlineStyle} ${indicator.outlineWidthPx}px, ` +
      `rgb(${indicator.outlineColor.slice(0, 3).join(", ")}) over rgb(${indicator.backdrop.join(", ")}))`
    );
  }
  return null;
}
