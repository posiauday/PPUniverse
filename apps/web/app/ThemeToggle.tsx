"use client";

import { useState } from "react";
import { type Theme, themeCookie } from "../lib/theme";

/**
 * The light/dark switch in the site header (MVP-027). A real toggle button:
 * its name stays "Dark theme" and aria-pressed says whether it is on, so
 * screen readers announce the state rather than a label that flips. The
 * theme changes instantly on the page, and the cookie makes the next page
 * load render in the same theme on the server.
 */
export function ThemeToggle({ initialTheme }: { initialTheme: Theme }) {
  const [theme, setTheme] = useState<Theme>(initialTheme);
  const dark = theme === "dark";

  function toggle() {
    const next: Theme = dark ? "light" : "dark";
    const root = document.documentElement;
    root.dataset["theme"] = next;
    root.style.colorScheme = next;
    document.cookie = themeCookie(next, window.location.protocol === "https:");
    setTheme(next);
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-pressed={dark}
      aria-label="Dark theme"
      className="inline-flex h-11 w-11 items-center justify-center rounded-lg border border-border bg-card text-foreground hover:bg-muted"
    >
      {dark ? (
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          aria-hidden="true"
        >
          <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" />
        </svg>
      ) : (
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          aria-hidden="true"
        >
          <circle cx="12" cy="12" r="4" />
          <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
        </svg>
      )}
    </button>
  );
}
