"use client";

import Link from "next/link";
import { useEffect, useId, useRef, useState, type ReactNode } from "react";

type MenuLink = { name: string; href: string; dot?: string };

/**
 * The header's menu below lg (MVP-031, "Board fidelity pass"): the mobile
 * canvas draws only the logo, a search button and a menu button, so the
 * main links, the six technologies, sign-in and the theme switch move into
 * this panel. A disclosure (WAI-ARIA disclosure navigation pattern): the
 * button says whether it is open, the panel is a plain list of links that
 * opens in the page flow under the header (nothing is covered), and Escape
 * closes it and returns focus to the button. Hidden from lg, where the
 * header shows these links itself.
 */
export function MobileMenu({
  links,
  technologies,
  account,
  themeToggle,
}: {
  links: readonly MenuLink[];
  technologies: readonly MenuLink[];
  account: MenuLink;
  themeToggle: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const panelId = useId();
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
        buttonRef.current?.focus();
      }
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  const close = () => setOpen(false);
  const linkClass =
    "flex min-h-11 items-center gap-2.5 rounded-2xl px-3 font-semibold text-foreground no-underline hover:bg-muted";

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        aria-label="Menu"
        onClick={() => setOpen((value) => !value)}
        className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-primary text-primary-foreground lg:hidden"
      >
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.4"
          strokeLinecap="round"
          aria-hidden="true"
        >
          {open ? <path d="M6 6l12 12M18 6 6 18" /> : <path d="M5 9h14M5 15h14" />}
        </svg>
      </button>
      <div id={panelId} hidden={!open} className="order-last w-full pt-1 pb-2 lg:hidden">
        <nav aria-label="Main">
          <ul className="flex flex-col">
            {links.map((link) => (
              <li key={link.href}>
                <Link href={link.href} onClick={close} className={linkClass}>
                  {link.name}
                </Link>
              </li>
            ))}
          </ul>
          <p
            id={`${panelId}-tech`}
            className="mt-3 px-3 font-mono text-xs tracking-widest text-muted-foreground uppercase"
          >
            Technologies
          </p>
          <ul aria-labelledby={`${panelId}-tech`} className="mt-1 grid grid-cols-2">
            {technologies.map((link) => (
              <li key={link.href}>
                <Link href={link.href} onClick={close} className={linkClass}>
                  <span
                    aria-hidden="true"
                    className={`h-2.5 w-2.5 shrink-0 rounded-full ${link.dot ?? "bg-foreground"}`}
                  />
                  {link.name}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <div className="mt-3 flex items-center gap-2 border-t border-border px-1 pt-3">
          <Link href={account.href} onClick={close} className={linkClass}>
            {account.name}
          </Link>
          <span className="ml-auto">{themeToggle}</span>
          <Link
            href="/learn"
            onClick={close}
            className="motion-press inline-flex min-h-11 items-center rounded-full bg-primary px-5 font-semibold text-primary-foreground no-underline"
          >
            Start learning
          </Link>
        </div>
      </div>
    </>
  );
}
