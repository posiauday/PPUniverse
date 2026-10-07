import localFont from "next/font/local";

/**
 * The Daylight typefaces (MVP-031; docs/final-decisions.md, "Visual
 * redesign: Daylight"): Bricolage Grotesque for display headings, an
 * Instrument Serif italic for one accent word per heading, Geist for body
 * text, Geist Mono for code and labels. All SIL Open Font License; each
 * font's licence sits beside it in assets/fonts.
 *
 * TD-031: the files are kept in the repository (the Latin subsets Google
 * Fonts serves, as WOFF2) instead of being downloaded at build time, so a
 * Google Fonts hiccup can no longer fail a build or a deploy. They are
 * served from this site, so a visitor's browser never contacts Google
 * (privacy), and the fallback font is size-adjusted so swapping in the web
 * font does not shift the layout (Core Web Vitals, CLS). Each is exposed as
 * a CSS variable that globals.css maps onto the --font-* theme tokens.
 */

// Variable weight plus the optical-size axis: browsers pick the optical
// size from the font size, so large headings get Bricolage's tighter display
// cut instead of its wider text cut.
export const displayFont = localFont({
  src: "../assets/fonts/bricolage-grotesque-latin.woff2",
  weight: "200 800",
  display: "swap",
  variable: "--font-bricolage",
});

export const serifFont = localFont({
  src: "../assets/fonts/instrument-serif-italic-latin.woff2",
  weight: "400",
  style: "italic",
  display: "swap",
  // MVP-042 speed budget: one accent word per heading, so not preloaded; it
  // swaps in without shifting the layout (size-adjusted fallback).
  preload: false,
  variable: "--font-instrument-serif",
});

export const bodyFont = localFont({
  src: "../assets/fonts/geist-latin.woff2",
  weight: "100 900",
  display: "swap",
  variable: "--font-geist",
});

export const monoFont = localFont({
  src: "../assets/fonts/geist-mono-latin.woff2",
  weight: "400 500",
  display: "swap",
  // MVP-042 speed budget: code and labels only, so not preloaded.
  preload: false,
  variable: "--font-geist-mono",
});

export const fontVariables = `${displayFont.variable} ${serifFont.variable} ${bodyFont.variable} ${monoFont.variable}`;

/**
 * Google Sans Medium, only for the "Continue with Google" button: Google's
 * branding guidelines require it (14/20). Not in fontVariables: only the
 * sign-in page's GoogleButton uses it, so other pages don't load it.
 */
export const googleButtonFont = localFont({
  src: "../assets/fonts/google-sans-500-latin.woff2",
  weight: "500",
  display: "swap",
  preload: false,
  // No size-matched fallback for Google Sans; these are close.
  adjustFontFallback: false,
  fallback: ["Roboto", "Arial", "sans-serif"],
});
