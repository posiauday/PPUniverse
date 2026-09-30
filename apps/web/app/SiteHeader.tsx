import Link from "next/link";
import type { Theme } from "../lib/theme";
import { SITE_NAME } from "../lib/seo/site";
import { BrandMark } from "./BrandMark";
import { ThemeToggle } from "./ThemeToggle";

/**
 * Site-wide header (MVP-027): the brand, the main sections, and the theme
 * toggle. No headings here, so every page's own h1 stays its first heading.
 * Links keep a 44px row height (WCAG 2.5.8 target size, with room to spare)
 * and wrap on narrow screens rather than scrolling sideways (1.4.10 reflow).
 */
export function SiteHeader({ theme, signedIn }: { theme: Theme; signedIn: boolean }) {
  return (
    <header className="border-b border-border bg-card">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-6 gap-y-2 px-4 py-3">
        <Link
          href="/"
          className="inline-flex min-h-11 items-center gap-2 text-foreground no-underline"
        >
          <BrandMark />
          <span className="font-display text-xl font-semibold">{SITE_NAME}</span>
        </Link>
        <nav
          aria-label="Main"
          className="flex flex-wrap items-center gap-x-5 text-base font-semibold"
        >
          <Link
            href="/learn"
            className="inline-flex min-h-11 items-center text-foreground no-underline hover:underline"
          >
            Learn
          </Link>
          <Link
            href="/search"
            className="inline-flex min-h-11 items-center text-foreground no-underline hover:underline"
          >
            Components
          </Link>
        </nav>
        <div className="ml-auto flex items-center gap-3">
          {signedIn ? (
            <Link
              href="/account/sessions"
              className="inline-flex min-h-11 items-center font-semibold text-foreground no-underline hover:underline"
            >
              Account
            </Link>
          ) : (
            <Link
              href="/signin"
              className="inline-flex min-h-11 items-center font-semibold text-foreground no-underline hover:underline"
            >
              Sign in
            </Link>
          )}
          <ThemeToggle initialTheme={theme} />
        </div>
      </div>
    </header>
  );
}
