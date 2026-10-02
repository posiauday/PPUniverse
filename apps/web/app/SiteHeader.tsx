import { TECHNOLOGIES } from "@ppu/domain-content";
import Link from "next/link";
import { TECHNOLOGY_PALETTE } from "../lib/technology-palette";
import type { Theme } from "../lib/theme";
import { SITE_NAME } from "../lib/seo/site";
import { BrandMark } from "./BrandMark";
import { TechnologiesMenu } from "./TechnologiesMenu";
import { ThemeToggle } from "./ThemeToggle";

/** MVP-028: the six technology sections, from the one registry. */
const TECHNOLOGY_LINKS = TECHNOLOGIES.map((entry) => ({
  name: entry.name,
  href: `/${entry.slug}`,
  dot: TECHNOLOGY_PALETTE[entry.technology].dot,
}));

const NAV_LINK =
  "inline-flex min-h-11 items-center rounded-full px-3 text-foreground no-underline hover:bg-muted";

/**
 * Site-wide header (MVP-027; Daylight look, MVP-031): a floating pill with
 * the brand, the main sections, search, sign-in, the theme toggle and the
 * "Start learning" call to action. No headings here, so every page's own h1
 * stays its first heading. Links keep a 44px row height (WCAG 2.5.8 target
 * size) and wrap on narrow screens rather than scrolling sideways (1.4.10).
 *
 * Sticky only from the md breakpoint, where it is one row: a wrapped,
 * multi-row header pinned to a phone screen would cover too much of it.
 * html's scroll-padding-top (globals.css) keeps a focused or linked-to
 * element clear of it (WCAG 2.4.11, focus not obscured).
 */
export function SiteHeader({ theme, signedIn }: { theme: Theme; signedIn: boolean }) {
  return (
    <header className="z-30 bg-background px-3 pt-3 pb-2 md:sticky md:top-0 md:px-6 md:pt-3.5">
      <div className="mx-auto flex max-w-[77.5rem] flex-wrap items-center gap-x-2 gap-y-1 rounded-3xl border border-border bg-card/85 py-1.5 pr-1.5 pl-3 sm:gap-x-4 sm:pl-4 shadow-[0_10px_30px_-18px_rgb(20_20_26/0.3)] backdrop-blur-md md:rounded-full">
        <Link
          href="/"
          className="inline-flex min-h-11 items-center gap-2 text-foreground no-underline md:mr-2 md:gap-2.5"
        >
          <BrandMark size={32} />
          <span className="font-display text-base font-bold tracking-tight sm:text-lg">
            {SITE_NAME}
          </span>
        </Link>
        <nav
          aria-label="Main"
          className="order-last flex w-full flex-wrap items-center gap-x-1 text-[0.9375rem] font-medium md:order-none md:w-auto md:grow"
        >
          <Link href="/learn" className={NAV_LINK}>
            Learn
          </Link>
          <TechnologiesMenu items={TECHNOLOGY_LINKS} />
          <Link href="/search" className={NAV_LINK}>
            Components
          </Link>
        </nav>
        <div className="ml-auto flex items-center gap-1">
          <Link
            href="/search"
            aria-label="Search"
            className="inline-flex h-11 min-w-11 items-center justify-center gap-2 rounded-full border border-border bg-muted px-3 text-sm text-muted-foreground no-underline hover:text-foreground"
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
            <span aria-hidden="true" className="hidden lg:inline">
              Search
            </span>
          </Link>
          {signedIn ? (
            <Link href="/account/sessions" className={`${NAV_LINK} font-semibold`}>
              Account
            </Link>
          ) : (
            <Link href="/signin" className={`${NAV_LINK} font-semibold`}>
              Sign in
            </Link>
          )}
          <ThemeToggle initialTheme={theme} />
          <Link
            href="/learn"
            className="motion-press hidden min-h-11 items-center rounded-full bg-primary px-5 font-semibold text-primary-foreground no-underline sm:inline-flex"
          >
            Start learning
          </Link>
        </div>
      </div>
    </header>
  );
}
