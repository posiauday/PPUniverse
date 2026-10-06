/**
 * The LowCodeStacks mark, X2 "Code stack" (MVP-031; docs/final-decisions.md,
 * "Logo: X2"): three soft cards stepped up and to the right -- lime at the
 * back, coral in the middle, violet at the front -- with a white </> on the
 * front card. Each card has a light-to-deep gradient in its own colour.
 *
 * The geometry lives here once so the header and footer mark (BrandMark), the
 * favicon (app/icon.svg) and the share image all draw the same shape. At
 * 20px and below the </> is illegible, so `small` swaps in a simplified
 * drawing of the same mark: a larger front card and a bold < > without the
 * slash.
 */

export type MarkVariant = "full" | "small";

export const MARK_VIEWBOX = "0 0 48 48";

/** The three gradients, by key. Colours are fixed: the mark reads on both themes. */
export const MARK_GRADIENTS = [
  { key: "l", from: "#d9f99d", to: "#65a30d" },
  { key: "c", from: "#ffb199", to: "#e5532d" },
  { key: "v", from: "#9b86ff", to: "#4a2fc4" },
] as const;

type Card = {
  gradient: (typeof MARK_GRADIENTS)[number]["key"];
  x: number;
  y: number;
  width: number;
  height: number;
  rx: number;
};

/** Back to front, so later cards paint over earlier ones. */
const CARDS: Record<MarkVariant, readonly Card[]> = {
  full: [
    { gradient: "l", x: 13, y: 6.5, width: 30, height: 24, rx: 9.5 },
    { gradient: "c", x: 9, y: 12, width: 30, height: 24, rx: 9.5 },
    { gradient: "v", x: 5, y: 17.5, width: 30, height: 24, rx: 9.5 },
  ],
  small: [
    { gradient: "l", x: 14, y: 5, width: 30, height: 25, rx: 9 },
    { gradient: "c", x: 9, y: 11, width: 30, height: 25, rx: 9 },
    { gradient: "v", x: 4, y: 17, width: 30, height: 27, rx: 9 },
  ],
};

const GLYPH: Record<MarkVariant, { d: string; strokeWidth: number }> = {
  full: {
    d: "M15.5 24.5 L10.5 29.5 L15.5 34.5 M24.5 24.5 L29.5 29.5 L24.5 34.5 M21.8 23.5 L18.2 35.5",
    strokeWidth: 3.4,
  },
  small: { d: "M15 24.5 L9.5 30.5 L15 36.5 M23 24.5 L28.5 30.5 L23 36.5", strokeWidth: 4.6 },
};

/** Below this rendered size the full drawing's </> stops being legible. */
export function markVariantFor(size: number): MarkVariant {
  return size <= 20 ? "small" : "full";
}

export function markCards(variant: MarkVariant): readonly Card[] {
  return CARDS[variant];
}

export function markGlyph(variant: MarkVariant): { d: string; strokeWidth: number } {
  return GLYPH[variant];
}

/**
 * The mark as a standalone SVG document, for places that cannot render the
 * React component: the static favicon and the share image (as a data URI).
 * `idPrefix` keeps gradient ids unique if two copies ever share a document.
 */
export function brandMarkSvg(variant: MarkVariant, idPrefix = "lcs"): string {
  const gradients = MARK_GRADIENTS.map(
    (g) =>
      `<linearGradient id="${idPrefix}-${g.key}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${g.from}"/><stop offset="1" stop-color="${g.to}"/></linearGradient>`,
  ).join("");
  const cards = CARDS[variant]
    .map(
      (c) =>
        `<rect x="${c.x}" y="${c.y}" width="${c.width}" height="${c.height}" rx="${c.rx}" fill="url(#${idPrefix}-${c.gradient})"/>`,
    )
    .join("");
  const glyph = GLYPH[variant];
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${MARK_VIEWBOX}">` +
    `<defs>${gradients}</defs>${cards}` +
    `<path d="${glyph.d}" fill="none" stroke="#ffffff" stroke-width="${glyph.strokeWidth}" stroke-linecap="round" stroke-linejoin="round"/>` +
    `</svg>`
  );
}
