"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useId, useState } from "react";

export interface AdminNavGroup {
  label: string | null;
  links: Array<{
    href: string;
    name: string;
    /** A count beside the link: `alert` (red) means something waits on you, `warm` (amber) work to finish. */
    count?: { value: number; alert?: boolean; warm?: boolean; label: string };
  }>;
}

/** One line icon per area (24 by 24, drawn with the current colour). */
const ICONS: Record<string, string> = {
  "/admin": "M4 11l8-7 8 7v9h-5v-6H9v6H4z",
  "/admin/content": "M5 4h10l4 4v12H5zM15 4v4h4M8 12h8M8 16h6",
  "/admin/updates":
    "M12 3v3M12 18v3M4.2 7.2l2.1 2.1M17.7 14.7l2.1 2.1M3 12h3M18 12h3M12 8a4 4 0 100 8 4 4 0 000-8z",
  "/admin/topics": "M3 8l9-4 9 4-9 4zM7 10v5c0 1.5 2.5 3 5 3s5-1.5 5-3v-5",
  "/admin/components": "M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z",
  "/admin/products": "M3 4h3l2 11h11l2-8H7M10 20h.01M17 20h.01",
  "/admin/comments": "M4 5h16v11H9l-5 4z",
  "/admin/feedback": "M5 21V4h11l-2 4 2 4H5",
  "/admin/users":
    "M8 11a3 3 0 100-6 3 3 0 000 6zM2 20c0-3 3-5 6-5s6 2 6 5M16 5a3 3 0 010 6M18 15c2 .5 4 2 4 5",
  "/admin/deletion-requests": "M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13",
  "/admin/settings":
    "M12 9a3 3 0 100 6 3 3 0 000-6zM4 12h2M18 12h2M12 4v2M12 18v2M6.3 6.3l1.4 1.4M16.3 16.3l1.4 1.4M6.3 17.7l1.4-1.4M16.3 7.7l1.4-1.4",
  "/admin/audit": "M6 4h12v16H6zM9 8h6M9 12h6M9 16h4",
};

function Icon({ href }: { href: string }) {
  const d = ICONS[href];
  if (!d) return null;
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className="size-[1.125rem] shrink-0"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d={d} />
    </svg>
  );
}

/**
 * The admin sidebar (MVP-047; redesigned 2026-10-10, docs/final-decisions.md,
 * "Admin centre: concept A with B's Inbox"): every area, grouped, with an icon
 * and live counts. The current page is marked for screen readers
 * (aria-current) and with the brand-colour pill. Below the lg width it folds
 * into one line, "Admin · <page>", with a Menu button, so a page starts with
 * its own content instead of the whole menu.
 */
export function AdminNav({ groups }: { groups: readonly AdminNavGroup[] }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const listId = useId();
  const isCurrent = (href: string) =>
    href === "/admin"
      ? pathname === "/admin"
      : pathname === href || pathname.startsWith(`${href}/`);
  const current = groups.flatMap((group) => group.links).find((link) => isCurrent(link.href));

  return (
    <nav aria-label="Admin">
      <div className="flex items-center gap-2 lg:hidden">
        <p className="min-w-0 flex-1 truncate font-semibold">
          Admin
          {current ? <span className="text-muted-foreground"> · {current.name}</span> : null}
        </p>
        <button
          type="button"
          aria-expanded={open}
          aria-controls={listId}
          onClick={() => setOpen((value) => !value)}
          className="inline-flex min-h-11 items-center gap-1.5 rounded-full bg-muted px-4 text-sm font-semibold"
        >
          Menu
          <svg
            viewBox="0 0 24 24"
            aria-hidden="true"
            className={`size-4 motion-safe:transition-transform ${open ? "rotate-180" : ""}`}
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
          >
            <path d="M6 9l6 6 6-6" />
          </svg>
        </button>
      </div>
      <div id={listId} className={`${open ? "mt-2 flex" : "hidden"} flex-col gap-1 lg:flex`}>
        <p className="hidden items-center gap-2 px-2 pt-1 pb-1 font-display text-lg font-bold lg:flex">
          <span
            aria-hidden="true"
            className="grid size-7 place-items-center rounded-lg bg-[#7c3aed] text-xs text-white"
          >
            L
          </span>
          Admin
        </p>
        {groups.map((group, index) => (
          <div key={group.label ?? index} className="flex flex-col gap-0.5">
            {group.label ? (
              <p className="mt-3 mb-1 px-3 font-mono text-[0.6875rem] tracking-[0.12em] text-muted-foreground uppercase">
                {group.label}
              </p>
            ) : null}
            <ul className="flex flex-col gap-0.5">
              {group.links.map((link) => {
                const on = isCurrent(link.href);
                const count = link.count;
                return (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      aria-current={on ? "page" : undefined}
                      onClick={() => setOpen(false)}
                      className={`flex min-h-11 items-center gap-2.5 rounded-xl px-3 font-medium no-underline motion-safe:transition-colors ${
                        on
                          ? "bg-[#7c3aed] text-white shadow-[0_8px_18px_-10px_rgba(124,58,237,0.85)]"
                          : "text-foreground hover:bg-muted"
                      }`}
                    >
                      <span className={on ? "" : "text-muted-foreground"}>
                        <Icon href={link.href} />
                      </span>
                      <span className="flex-1">{link.name}</span>
                      {count ? (
                        <span
                          className={`rounded-full px-2 text-xs font-bold ${
                            on
                              ? "bg-white text-[#5b21b6]"
                              : count.alert && count.value > 0
                                ? "bg-[#ffe4e6] text-[#9f1239]"
                                : count.warm && count.value > 0
                                  ? "bg-[#fef3c7] text-[#92400e]"
                                  : "bg-muted"
                          }`}
                        >
                          {count.value}
                          <span className="sr-only"> {count.label}</span>
                        </span>
                      ) : null}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </div>
    </nav>
  );
}
