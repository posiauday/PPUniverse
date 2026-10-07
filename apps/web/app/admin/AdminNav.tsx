"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export interface AdminNavGroup {
  label: string | null;
  links: Array<{
    href: string;
    name: string;
    /** A count beside the link; `alert` makes it stand out (something waits). */
    count?: { value: number; alert?: boolean; label: string };
  }>;
}

/**
 * The admin sidebar (MVP-047, concept A "Command centre"): every area,
 * grouped, with live counts. The current page is marked for screen readers
 * (aria-current) and visually. Below the lg width it sits above the page.
 */
export function AdminNav({ groups }: { groups: readonly AdminNavGroup[] }) {
  const pathname = usePathname();
  const isCurrent = (href: string) =>
    href === "/admin"
      ? pathname === "/admin"
      : pathname === href || pathname.startsWith(`${href}/`);
  return (
    <nav aria-label="Admin" className="flex flex-col gap-1">
      {groups.map((group, index) => (
        <div key={group.label ?? index} className="flex flex-col gap-0.5">
          {group.label ? (
            <p className="mt-4 mb-1 px-3 font-mono text-[0.6875rem] tracking-[0.12em] text-muted-foreground uppercase">
              {group.label}
            </p>
          ) : null}
          <ul className="flex flex-col gap-0.5">
            {group.links.map((link) => {
              const current = isCurrent(link.href);
              return (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    aria-current={current ? "page" : undefined}
                    className={`flex min-h-11 items-center gap-2 rounded-xl px-3 font-medium no-underline ${
                      current
                        ? "bg-primary text-primary-foreground"
                        : "text-foreground hover:bg-muted"
                    }`}
                  >
                    {link.name}
                    {link.count ? (
                      <span
                        className={`ml-auto rounded-full px-2 text-xs font-bold ${
                          link.count.alert && link.count.value > 0
                            ? "bg-[#ffe4e6] text-[#9f1239]"
                            : current
                              ? "bg-white/20"
                              : "bg-muted"
                        }`}
                      >
                        {link.count.value}
                        <span className="sr-only"> {link.count.label}</span>
                      </span>
                    ) : null}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );
}
