"use client";

import { useId, useState } from "react";
import { type Theme, themeCookie } from "../lib/theme";

/**
 * The light/dark switch in the site header (MVP-027). A real toggle button:
 * its name stays "Dark theme" and aria-pressed says whether it is on, so
 * screen readers announce the state rather than a label that flips. The
 * theme changes instantly on the page, and the cookie makes the next page
 * load render in the same theme on the server.
 *
 * Just the icon, no round border (docs/final-decisions.md, 2026-10-09, "Top
 * bar"): a sun that turns into a moon, and back. The rays turn and shrink
 * away, the sun grows, and a dark "bite" slides in to make the crescent. All
 * of it is CSS transforms, so it animates in every browser, and it simply
 * switches for anyone who asks for reduced motion. The button keeps a 44px
 * target (WCAG 2.5.8) without a visible circle.
 */
export function ThemeToggle({ initialTheme }: { initialTheme: Theme }) {
  const [theme, setTheme] = useState<Theme>(initialTheme);
  const dark = theme === "dark";
  const maskId = `${useId()}-moon`;

  function toggle() {
    const next: Theme = dark ? "light" : "dark";
    const root = document.documentElement;
    root.dataset["theme"] = next;
    root.style.colorScheme = next;
    document.cookie = themeCookie(next, window.location.protocol === "https:");
    setTheme(next);
  }

  const move =
    "[transform-box:fill-box] [transform-origin:center] motion-safe:transition-transform motion-safe:duration-500 motion-safe:ease-[cubic-bezier(0.5,1.4,0.4,1)]";

  return (
    <button
      type="button"
      onClick={toggle}
      aria-pressed={dark}
      aria-label="Dark theme"
      className="group inline-grid size-11 place-items-center rounded-full text-foreground hover:text-primary"
    >
      <svg
        width="22"
        height="22"
        viewBox="0 0 24 24"
        aria-hidden="true"
        className="overflow-visible"
      >
        <mask id={maskId}>
          <rect width="24" height="24" fill="white" />
          {/* The bite: off to the top right for the sun, over the disc for the moon. */}
          <circle
            cx="17"
            cy="7"
            r="7"
            fill="black"
            className={`${move} ${dark ? "translate-x-0 translate-y-0" : "translate-x-[9px] -translate-y-[9px]"}`}
          />
        </mask>
        <circle
          cx="12"
          cy="12"
          r="9"
          fill="currentColor"
          mask={`url(#${maskId})`}
          className={`${move} ${dark ? "scale-100" : "scale-[0.5]"}`}
        />
        <g
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          className={`${move} motion-safe:transition-[transform,opacity] ${dark ? "-rotate-90 scale-50 opacity-0" : "rotate-0 scale-100 opacity-100"}`}
        >
          <path d="M12 1.5v2.2M12 20.3v2.2M1.5 12h2.2M20.3 12h2.2M4.6 4.6l1.5 1.5M17.9 17.9l1.5 1.5M4.6 19.4l1.5-1.5M17.9 6.1l1.5-1.5" />
        </g>
      </svg>
    </button>
  );
}
