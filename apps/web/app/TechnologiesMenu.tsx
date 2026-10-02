"use client";

import Link from "next/link";
import { useEffect, useId, useRef, useState } from "react";

/**
 * The header's "Technologies" menu (MVP-028): a disclosure button that shows
 * and hides a plain list of links to the six sections -- the WAI-ARIA
 * disclosure navigation pattern, not an ARIA menu (these are ordinary links,
 * so Tab moves through them). Escape closes it and returns focus to the
 * button; so does a click outside it. Closed, the links are hidden (not
 * focusable); the same links are always reachable from the home page and
 * /learn, so crawlers and anyone without scripts still find the sections.
 */
export function TechnologiesMenu({
  items,
}: {
  /** `dot`: an optional colour class for the item's marker (the technology's ink). */
  items: ReadonlyArray<{ name: string; href: string; dot?: string }>;
}) {
  const [open, setOpen] = useState(false);
  const listId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
        buttonRef.current?.focus();
      }
    }
    function onPointer(event: PointerEvent) {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    }
    document.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onPointer);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("pointerdown", onPointer);
    };
  }, [open]);

  return (
    // Below md the wrapper is `display: contents`, so the open list becomes its
    // own full-width row at the end of the header's wrapping nav and pushes the
    // page down instead of floating over the header's other links (a floating
    // panel there part-covers them, failing WCAG 2.5.8 target size). From md
    // up the nav is one line with room below it, so the list is a dropdown.
    <div ref={rootRef} className="max-md:contents md:relative">
      <button
        ref={buttonRef}
        type="button"
        aria-expanded={open}
        aria-controls={listId}
        onClick={() => setOpen((value) => !value)}
        className="inline-flex min-h-11 items-center gap-1 rounded-full px-3 text-foreground hover:bg-muted"
      >
        Technologies
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          aria-hidden="true"
          className={open ? "rotate-180" : undefined}
        >
          <path d="m6 9 6 6 6-6" />
        </svg>
      </button>
      <ul
        id={listId}
        hidden={!open}
        className="z-40 rounded-3xl border border-border bg-card p-2 max-md:order-last max-md:my-1 max-md:grid max-md:w-full sm:max-md:grid-cols-2 md:absolute md:left-0 md:mt-2 md:w-64 md:shadow-[0_24px_50px_-24px_rgb(20_20_26/0.45)]"
      >
        {items.map((item) => (
          <li key={item.href}>
            <Link
              href={item.href}
              onClick={() => setOpen(false)}
              className="flex min-h-11 items-center gap-3 rounded-2xl px-3 font-semibold text-foreground no-underline hover:bg-muted"
            >
              <span
                aria-hidden="true"
                className={`h-2.5 w-2.5 rounded-full ${item.dot ?? "bg-foreground"}`}
              />
              {item.name}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
