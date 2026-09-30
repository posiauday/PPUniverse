import { Fraunces, IBM_Plex_Mono, Source_Sans_3 } from "next/font/google";

/**
 * The design system's three typefaces (MVP-027; docs/final-decisions.md,
 * "Design direction: A + B combined"): Fraunces for display headings, Source
 * Sans 3 for body text, IBM Plex Mono for code and labels.
 *
 * next/font downloads them at build time and serves them from this site, so
 * a visitor's browser never contacts Google (privacy), and the fallback
 * font is size-adjusted so swapping in the web font does not shift the
 * layout (Core Web Vitals, CLS). Each is exposed as a CSS variable that
 * globals.css maps onto the --font-* theme tokens.
 */
export const displayFont = Fraunces({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-fraunces",
});

export const bodyFont = Source_Sans_3({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-source-sans",
});

export const monoFont = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  display: "swap",
  variable: "--font-plex-mono",
});

export const fontVariables = `${displayFont.variable} ${bodyFont.variable} ${monoFont.variable}`;
