"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export interface AccountNavLink {
  href: string;
  name: string;
}

/**
 * The account menu beside every /account page (2026-10-08): the overview,
 * profile, sessions and privacy, plus Admin for admins. The current page is
 * marked for screen readers (aria-current) and visually, like the admin
 * sidebar. Below the md width it sits above the page as pills that wrap, so
 * the page never scrolls sideways on a phone.
 */
export function AccountNav({
  links,
  adminLink,
}: {
  links: readonly AccountNavLink[];
  adminLink: boolean;
}) {
  const pathname = usePathname();
  const isCurrent = (href: string) =>
    href === "/account" ? pathname === "/account" : pathname.startsWith(href);
  const item = (href: string, name: string) => {
    const current = isCurrent(href);
    return (
      <li key={href}>
        <Link
          href={href}
          aria-current={current ? "page" : undefined}
          className={`flex min-h-11 items-center rounded-xl px-3 font-medium whitespace-nowrap no-underline ${
            current ? "bg-primary text-primary-foreground" : "text-foreground hover:bg-muted"
          }`}
        >
          {name}
        </Link>
      </li>
    );
  };
  return (
    <nav aria-label="Account">
      <ul className="flex flex-wrap gap-1 md:flex-col">
        {links.map((link) => item(link.href, link.name))}
        {adminLink ? item("/admin", "Admin") : null}
      </ul>
    </nav>
  );
}
