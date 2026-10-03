"use client";

import Link from "next/link";
import { useEffect, useId, useRef, useState } from "react";
import type { TechnologyMenuArea } from "../lib/technology-menu";

/**
 * The header's "Technologies" menu (MVP-028; the large menu since MVP-033,
 * matching the approved "Header and Technologies menu" board): every area at
 * once, each with its guide count, a start-here guide and its first sections,
 * and a way into every guide by goal.
 *
 * A disclosure button that shows and hides a panel of plain links -- the
 * WAI-ARIA disclosure navigation pattern, not an ARIA menu (these are
 * ordinary links, so Tab moves through them). Escape closes it and returns
 * focus to the button; so does a click outside it. Closed, the links are
 * hidden (not focusable); the same areas are always reachable from the
 * footer, the home page and /learn, so crawlers and anyone without scripts
 * still find them. Shown from lg only (the header's main nav); below lg the
 * phone menu lists the areas instead.
 *
 * The panel spans the header's full width: it is positioned against the
 * header's bar, which is `relative`.
 */
export function TechnologiesMenu({ areas }: { areas: readonly TechnologyMenuArea[] }) {
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
    <div ref={rootRef}>
      <button
        ref={buttonRef}
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((value) => !value)}
        className={`inline-flex min-h-11 items-center gap-1 rounded-full px-3 ${
          open ? "bg-primary text-primary-foreground" : "text-foreground hover:bg-muted"
        }`}
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
      <div
        id={panelId}
        hidden={!open}
        className="absolute inset-x-0 top-full z-40 mt-2 rounded-[1.75rem] border border-border bg-card p-4 shadow-[0_40px_80px_-40px_rgb(20_20_26/0.45)] xl:p-5"
      >
        <ul className="grid grid-cols-4 gap-2.5 xl:grid-cols-7">
          {areas.map((area) => {
            const { countLabel } = area;
            return (
              <li
                key={area.key}
                className={`flex flex-col gap-2 rounded-[1.25rem] p-4 text-foreground ${area.tint}`}
              >
                <div className="flex flex-wrap items-baseline justify-between gap-x-1.5 gap-y-0.5">
                  <Link
                    href={area.href}
                    onClick={close}
                    className="font-display text-lg leading-tight font-bold text-foreground no-underline hover:underline"
                  >
                    {area.name}
                  </Link>
                  {countLabel ? (
                    <span
                      className={`shrink-0 text-xs font-semibold whitespace-nowrap ${area.ink}`}
                    >
                      {countLabel}
                    </span>
                  ) : null}
                </div>
                {area.startHere ? (
                  <Link
                    href={area.startHere.href}
                    onClick={close}
                    className="text-[0.8125rem] leading-snug font-semibold text-foreground no-underline hover:underline"
                  >
                    <span className={`block text-xs font-normal ${area.ink}`}>Start here →</span>
                    {area.startHere.title}
                  </Link>
                ) : area.count === 0 ? (
                  <p className="text-[0.8125rem] leading-snug font-semibold">
                    First guides coming soon
                  </p>
                ) : null}
                <ul className="mt-1 flex flex-col">
                  {area.sections.map((section) => (
                    <li key={section.href}>
                      <Link
                        href={section.href}
                        onClick={close}
                        className="inline-flex min-h-6 items-center text-[0.8125rem] text-foreground no-underline hover:underline"
                      >
                        {section.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </li>
            );
          })}
        </ul>
        <div className="mt-4 flex items-center justify-between gap-4 border-t border-border px-1.5 pt-3 text-sm">
          <Link
            href="/learn"
            onClick={close}
            className="inline-flex min-h-11 items-center text-muted-foreground no-underline hover:underline"
          >
            <span>
              Not sure where to start? Browse{" "}
              <b className="font-semibold text-foreground">every guide by goal</b> →
            </span>
          </Link>
          <span className="font-mono text-xs text-muted-foreground">
            Esc closes · Tab moves through links
          </span>
        </div>
      </div>
    </div>
  );
}
