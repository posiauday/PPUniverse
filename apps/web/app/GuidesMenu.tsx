"use client";

import Link from "next/link";
import { useEffect, useId, useRef, useState } from "react";
import {
  ARTICLE_KIND,
  ARTICLE_TYPE_BLURB,
  ARTICLE_TYPE_SECTIONS,
  SECTION_ANCHOR,
} from "../lib/article-types";

/**
 * The header's "Guides" menu (docs/final-decisions.md, 2026-10-09, "Top bar:
 * a Guides menu, Learn coming soon, one name per kind of guide"): the five
 * kinds of guide, each by its one name with a few words on what it's for, and
 * every guide. Each opens its section of /guides.
 *
 * The same pattern as the Power Platform menu: a disclosure button that shows
 * a panel of plain links (WAI-ARIA disclosure navigation, not an ARIA menu, so
 * Tab moves through them). Escape closes it and returns focus to the button;
 * so does a click outside. Shown from lg; below lg the phone menu lists them.
 */
export function GuidesMenu() {
  const [open, setOpen] = useState(false);
  const panelId = useId();
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

  const close = () => setOpen(false);

  return (
    <div ref={rootRef} className="relative">
      <button
        ref={buttonRef}
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((value) => !value)}
        className={`inline-flex min-h-11 items-center gap-1 rounded-full px-2.5 ${
          open ? "bg-primary text-primary-foreground" : "text-foreground hover:bg-muted"
        }`}
      >
        Guides
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
      <div
        id={panelId}
        hidden={!open}
        className="absolute top-full left-0 z-40 mt-3 w-[23rem] rounded-[1.5rem] border border-border bg-card p-3 shadow-[0_40px_80px_-40px_rgb(20_20_26/0.45)]"
      >
        <ul className="flex flex-col">
          {ARTICLE_TYPE_SECTIONS.map(({ type, heading }) => (
            <li key={type}>
              <Link
                href={`/guides#${SECTION_ANCHOR[type]}`}
                onClick={close}
                className="flex min-h-11 items-center gap-3 rounded-2xl px-3 py-2 text-foreground no-underline hover:bg-muted"
              >
                <span
                  aria-hidden="true"
                  className={`w-[4.5rem] shrink-0 rounded-full px-2 py-0.5 text-center font-mono text-[0.6875rem] font-semibold uppercase ${ARTICLE_KIND[type].className}`}
                >
                  {ARTICLE_KIND[type].label}
                </span>
                <span className="flex flex-col leading-tight">
                  <span className="font-semibold">{heading}</span>
                  <span className="text-[0.8125rem] text-muted-foreground">
                    {ARTICLE_TYPE_BLURB[type]}
                  </span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
        <Link
          href="/guides"
          onClick={close}
          className="mt-2 flex min-h-11 items-center justify-between rounded-2xl border-t border-border px-3 pt-2 font-semibold text-foreground no-underline hover:underline"
        >
          All guides
          <span aria-hidden="true">→</span>
        </Link>
      </div>
    </div>
  );
}
