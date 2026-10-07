import {
  Bricolage_Grotesque,
  Geist,
  Geist_Mono,
  Google_Sans,
  Instrument_Serif,
} from "next/font/google";

/**
 * The Daylight typefaces (MVP-031; docs/final-decisions.md, "Visual
 * redesign: Daylight"): Bricolage Grotesque for display headings, an
 * Instrument Serif italic for one accent word per heading, Geist for body
 * text, Geist Mono for code and labels. All four are SIL Open Font License.
 *
 * next/font downloads them at build time and serves them from this site, so
 * a visitor's browser never contacts Google (privacy), and the fallback
 * font is size-adjusted so swapping in the web font does not shift the
 * layout (Core Web Vitals, CLS). Each is exposed as a CSS variable that
 * globals.css maps onto the --font-* theme tokens.
 */
// Variable weight plus the optical-size axis, as the design canvas loads it:
// browsers pick the optical size from the font size, so large headings get
// Bricolage's tighter display cut instead of its wider text cut.
export const displayFont = Bricolage_Grotesque({
  subsets: ["latin"],
  axes: ["opsz"],
  display: "swap",
  variable: "--font-bricolage",
});

export const serifFont = Instrument_Serif({
  subsets: ["latin"],
  weight: "400",
  style: "italic",
  display: "swap",
  variable: "--font-instrument-serif",
});

export const bodyFont = Geist({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-geist",
});

export const monoFont = Geist_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  display: "swap",
  variable: "--font-geist-mono",
});

export const fontVariables = `${displayFont.variable} ${serifFont.variable} ${bodyFont.variable} ${monoFont.variable}`;

/**
 * Google Sans Medium, only for the "Continue with Google" button: Google's
 * branding guidelines require it (14/20). SIL Open Font License, served from
 * this site like the others. Not in fontVariables: only the sign-in page's
 * GoogleButton uses it, so other pages don't load it.
 */
export const googleButtonFont = Google_Sans({
  subsets: ["latin"],
  weight: "500",
  display: "swap",
  preload: false,
  // next/font has no size-matched fallback for Google Sans; these are close.
  adjustFontFallback: false,
  fallback: ["Roboto", "Arial", "sans-serif"],
});
