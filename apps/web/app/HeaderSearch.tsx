"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

const INPUT_ID = "header-search-q";

/**
 * The header's search box (MVP-031, "Board fidelity pass"): a plain GET form
 * to /search, so it works without JavaScript and every search is a real,
 * shareable URL. From 2xl it is a pill with a text box; below 2xl there is no
 * room beside Azure (Soon), so it is a link to /search instead
 * (docs/final-decisions.md, 2026-10-09, "Top bar: Azure, coming soon").
 *
 * Ctrl K (⌘K on Apple devices) jumps to it: it focuses the box where the box
 * is shown, and opens /search where it is not. A modifier shortcut, so it
 * cannot fire while someone is just typing (WCAG 2.1.4 covers single-key
 * shortcuts only). The hint shows "Ctrl K" until the client knows it is on
 * an Apple device, so the server and first client render agree.
 */
export function HeaderSearch() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isApple, setIsApple] = useState(false);

  useEffect(() => {
    setIsApple(/Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent));
    function onKey(event: KeyboardEvent) {
      if (event.key.toLowerCase() !== "k" || !(event.ctrlKey || event.metaKey)) return;
      if (event.altKey || event.shiftKey) return;
      event.preventDefault();
      const input = inputRef.current;
      // offsetParent is null while the box is display:none (below 2xl).
      if (input && input.offsetParent !== null) {
        input.focus();
        input.select();
      } else {
        window.location.assign("/search");
      }
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  return (
    <>
      <form action="/search" method="GET" role="search" className="relative hidden 2xl:block">
        <label htmlFor={INPUT_ID} className="sr-only">
          Search guides and components
        </label>
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.2"
          aria-hidden="true"
          className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-muted-foreground"
        >
          <circle cx="11" cy="11" r="7" />
          <path d="m20 20-3.5-3.5" />
        </svg>
        <input
          ref={inputRef}
          id={INPUT_ID}
          type="search"
          name="q"
          placeholder="Search an error or topic"
          aria-keyshortcuts="Control+K Meta+K"
          // A text box's edge needs 3:1 against the page (WCAG 1.4.11, as BUG-004).
          className="h-11 w-[16rem] rounded-full border border-muted-foreground bg-muted pr-14 pl-10 text-[0.8125rem] text-foreground placeholder:text-muted-foreground"
        />
        <kbd
          aria-hidden="true"
          className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 rounded-md border border-border bg-card px-1.5 py-0.5 font-mono text-[0.6875rem] text-muted-foreground"
        >
          {isApple ? "⌘K" : "Ctrl K"}
        </kbd>
      </form>
      <Link
        href="/search"
        aria-label="Search"
        className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-border bg-muted text-muted-foreground no-underline hover:text-foreground 2xl:hidden"
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.2"
          aria-hidden="true"
        >
          <circle cx="11" cy="11" r="7" />
          <path d="m20 20-3.5-3.5" />
        </svg>
      </Link>
    </>
  );
}
