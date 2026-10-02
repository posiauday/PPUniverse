import { useId } from "react";
import {
  MARK_GRADIENTS,
  MARK_VIEWBOX,
  markCards,
  markGlyph,
  markVariantFor,
} from "../lib/brand-mark";

/** The LowCodeStacks logo, X2 "Code stack" (MVP-031; geometry in lib/brand-mark.ts).
 * Decorative -- always paired with the visible name. Fixed colours: they read
 * on both themes. Gradient ids come from useId, so the header and footer
 * copies on one page never collide. */
export function BrandMark({ size = 28 }: { size?: number }) {
  const id = useId();
  const variant = markVariantFor(size);
  const glyph = markGlyph(variant);
  return (
    <svg width={size} height={size} viewBox={MARK_VIEWBOX} aria-hidden="true" focusable="false">
      <defs>
        {MARK_GRADIENTS.map((g) => (
          <linearGradient key={g.key} id={`${id}-${g.key}`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor={g.from} />
            <stop offset="1" stopColor={g.to} />
          </linearGradient>
        ))}
      </defs>
      {markCards(variant).map((c) => (
        <rect
          key={c.gradient}
          x={c.x}
          y={c.y}
          width={c.width}
          height={c.height}
          rx={c.rx}
          fill={`url(#${id}-${c.gradient})`}
        />
      ))}
      <path
        d={glyph.d}
        fill="none"
        stroke="#ffffff"
        strokeWidth={glyph.strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
