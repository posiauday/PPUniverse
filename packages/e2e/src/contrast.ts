/**
 * WCAG 2.x contrast maths (relative luminance and contrast ratio, WCAG 2.2
 * section 1.4.3 definitions) plus alpha compositing. Pure functions: colours are
 * resolved to sRGB by the browser itself (see in-page.ts), so each engine's own
 * colour parsing — oklch, color-mix and so on — is what gets measured.
 */

export type Rgb = readonly [number, number, number];
/** Channels 0–255, alpha 0–1. */
export type Rgba = readonly [number, number, number, number];

function linearChannel(value: number): number {
  const s = value / 255;
  return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
}

export function relativeLuminance([r, g, b]: Rgb): number {
  return 0.2126 * linearChannel(r) + 0.7152 * linearChannel(g) + 0.0722 * linearChannel(b);
}

export function contrastRatio(a: Rgb, b: Rgb): number {
  const la = relativeLuminance(a);
  const lb = relativeLuminance(b);
  const lighter = Math.max(la, lb);
  const darker = Math.min(la, lb);
  return (lighter + 0.05) / (darker + 0.05);
}

/** Alpha-composites `foreground` over an opaque `background`, rounding to 8-bit as a renderer would. */
export function compositeOver(foreground: Rgba, background: Rgb): Rgb {
  const alpha = foreground[3];
  const mix = (front: number, back: number): number =>
    Math.round(front * alpha + back * (1 - alpha));
  return [
    mix(foreground[0], background[0]),
    mix(foreground[1], background[1]),
    mix(foreground[2], background[2]),
  ];
}

/** The canvas colour behind everything when no ancestor paints an opaque background. */
export const CANVAS_WHITE: Rgb = [255, 255, 255];

/**
 * Flattens background layers (nearest element first, as collected walking up the
 * DOM) onto the canvas: the farthest layer is painted first.
 */
export function flattenLayers(layers: readonly Rgba[], canvas: Rgb = CANVAS_WHITE): Rgb {
  let result = canvas;
  for (let i = layers.length - 1; i >= 0; i--) {
    const layer = layers[i];
    if (layer) result = compositeOver(layer, result);
  }
  return result;
}

export function formatRatio(ratio: number): string {
  return `${ratio.toFixed(2)}:1`;
}
