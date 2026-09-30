import type { Rgba } from "./contrast.js";

/**
 * Helpers that run INSIDE the page. They resolve any CSS colour to sRGB by
 * painting it to a 1x1 canvas, so each engine's own colour handling (oklch,
 * color-mix, currentColor and so on) is what gets measured rather than a token
 * value read in isolation, and they collect the background layers behind an
 * element.
 *
 * `installInPageHelpers` is serialised and run by Playwright (`page.evaluate`),
 * so it must stay self-contained: no imports, no references to outer bindings.
 */

export interface BackdropInfo {
  /** Background colours from the element itself upwards; fully transparent layers are skipped. */
  layers: Rgba[];
  /** True when any of those elements paints a background image (a gradient, say). */
  hasImage: boolean;
}

export interface InPageHelpers {
  toRgba(css: string): Rgba;
  backdrop(element: Element): BackdropInfo;
}

declare global {
  interface Window {
    __e2e?: InPageHelpers;
  }
}

export function installInPageHelpers(): void {
  if (window.__e2e) return;

  const canvas = document.createElement("canvas");
  canvas.width = 1;
  canvas.height = 1;
  const context = canvas.getContext("2d", { willReadFrequently: true });
  if (!context) throw new Error("A 2D canvas is unavailable, so colours cannot be resolved");

  // Assigning an unparseable colour leaves fillStyle unchanged, so start from a
  // sentinel and treat "still the sentinel" as a parse failure.
  const SENTINEL = "#fe01fd";

  const toRgba = (css: string): Rgba => {
    context.fillStyle = SENTINEL;
    context.fillStyle = css;
    if (context.fillStyle === SENTINEL) throw new Error(`Unparseable CSS colour: "${css}"`);
    context.clearRect(0, 0, 1, 1);
    context.fillRect(0, 0, 1, 1);
    const data = context.getImageData(0, 0, 1, 1).data;
    return [data[0] ?? 0, data[1] ?? 0, data[2] ?? 0, (data[3] ?? 0) / 255];
  };

  const backdrop = (element: Element): BackdropInfo => {
    const layers: Rgba[] = [];
    let hasImage = false;
    for (let node: Element | null = element; node; node = node.parentElement) {
      const style = getComputedStyle(node);
      if (style.backgroundImage !== "none") hasImage = true;
      const layer = toRgba(style.backgroundColor);
      if (layer[3] > 0) layers.push(layer);
      if (layer[3] === 1) break;
    }
    return { layers, hasImage };
  };

  window.__e2e = { toRgba, backdrop };
}
