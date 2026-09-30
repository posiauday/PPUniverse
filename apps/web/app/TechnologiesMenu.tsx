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
  items: ReadonlyArray<{ name: string; href: string }>;
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
    <div ref={rootRef} className="relative">
      <button
        ref={buttonRef}
        type="button"
        aria-expanded={open}
        aria-controls={listId}
        onClick={() => setOpen((value) => !value)}
        className="inline-flex min-h-11 items-center gap-1 font-semibold text-foreground hover:underline"
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
        className="absolute left-0 z-40 mt-1 w-60 rounded-xl border border-border bg-card p-2 shadow-lg"
      >
        {items.map((item) => (
          <li key={item.href}>
            <Link
              href={item.href}
              onClick={() => setOpen(false)}
              className="flex min-h-11 items-center rounded-lg px-3 font-semibold text-foreground no-underline hover:bg-muted"
            >
              {item.name}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
