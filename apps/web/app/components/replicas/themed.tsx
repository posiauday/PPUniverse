import type { CSSProperties } from "react";
import { SEGOE } from "./replica";

/**
 * Wave 2's own buttons, fixed the way the Navigation shell was (docs/final-decisions.md,
 * 2026-10-09, "Navigation shell: a Premium look, and hover in dark mode"): a modern Text
 * under a transparent classic button whose hover and pressed shades follow the component's
 * Theme: 8% and 14% white on dark, 5% and 9% black on light, over whatever the label shows.
 * A modern button took them from the app's light theme instead.
 */

/** Hover and pressed for a button with no fill of its own (Subtle and Outline). */
export function themedHover(dark: boolean): string {
  return dark
    ? "hover:bg-white/[0.08] active:bg-white/[0.14]"
    : "hover:bg-black/[0.05] active:bg-black/[0.09]";
}

/** The same shades laid over a filled label (Primary, Secondary), whose fill is --fill. */
export function themedHoverOverFill(dark: boolean): string {
  return dark
    ? "hover:bg-[color-mix(in_srgb,var(--fill)_92%,white)] active:bg-[color-mix(in_srgb,var(--fill)_86%,white)]"
    : "hover:bg-[color-mix(in_srgb,var(--fill)_95%,black)] active:bg-[color-mix(in_srgb,var(--fill)_91%,black)]";
}

/** A disabled label's text: the YAML's RGBA(110, 110, 110) on dark, RGBA(170, 170, 170) on light. */
export function themedDimText(dark: boolean): string {
  return dark ? "text-[#6e6e6e]" : "text-[#aaaaaa]";
}

export type ThemedStyle = "Primary" | "Secondary" | "Outline" | "Subtle";

/** One of the component's own buttons, as Studio draws it after the 2026-10-10 change. */
export function ThemedButton({
  label,
  appearance,
  dark,
  onClick,
  fill = "var(--accent)",
  disabled = false,
  size = "h-9 min-w-24 px-4",
  ariaLabel,
  borderClass,
}: {
  label: string;
  appearance: ThemedStyle;
  dark: boolean;
  onClick?: () => void;
  /** A Primary label's fill: the accent colour, or red for a Danger button. */
  fill?: string;
  disabled?: boolean;
  size?: string;
  ariaLabel?: string;
  /** The component's own border colour, when it sets one (the Toast's action). */
  borderClass?: string;
}) {
  const ink = appearance === "Primary" ? "text-white" : dark ? "text-white" : "text-[#242424]";
  const border = borderClass ?? (dark ? "border-[#525252]" : "border-[#d1d5db]");
  const dimBorder = dark ? "border-[#424242]" : "border-[#e5e7eb]";
  const secondaryFill = dark ? "#292929" : "#ffffff";
  const look = {
    Primary: disabled
      ? `border-transparent ${dark ? "bg-[#383838]" : "bg-[#f0f0f0]"}`
      : `border-transparent bg-[var(--fill)] ${themedHoverOverFill(dark)}`,
    Secondary: `bg-[var(--fill)] ${disabled ? dimBorder : `${border} ${themedHoverOverFill(dark)}`}`,
    Outline: `bg-transparent ${disabled ? dimBorder : `${border} ${themedHover(dark)}`}`,
    Subtle: `border-transparent bg-transparent ${disabled ? "" : themedHover(dark)}`,
  }[appearance];
  const style = {
    "--fill": appearance === "Secondary" ? secondaryFill : fill,
  } as CSSProperties;
  return (
    <button
      type="button"
      style={style}
      aria-label={ariaLabel}
      aria-disabled={disabled || undefined}
      onClick={disabled ? undefined : onClick}
      className={`inline-flex max-w-full shrink-0 items-center justify-center rounded border text-sm font-semibold ${SEGOE} motion-safe:transition-colors motion-safe:duration-100 ${size} ${look} ${
        disabled ? `${themedDimText(dark)} cursor-not-allowed` : ink
      }`}
    >
      <span className="truncate">{label}</span>
    </button>
  );
}
