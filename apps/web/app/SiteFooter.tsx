import Link from "next/link";
import { SITE_NAME } from "../lib/seo/site";

/**
 * Site-wide footer (MVP-027). Carries the standing non-affiliation line:
 * LowCodeStacks never claims Microsoft endorsement, certification or
 * partnership (CLAUDE.md delivery rules), and saying so plainly on every
 * page is the simplest way to keep that true.
 */
export function SiteFooter() {
  return (
    <footer className="mt-16 border-t border-border bg-card">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-8 text-sm text-muted-foreground sm:flex-row sm:items-start sm:justify-between">
        <div className="max-w-md">
          <p className="font-display text-base font-semibold text-foreground">{SITE_NAME}</p>
          <p className="mt-1">
            Free Power Platform learning, architecture patterns and reusable components.
          </p>
          <p className="mt-2">
            Independent site. Not affiliated with, endorsed by or certified by Microsoft. Microsoft,
            Power Apps, Power Automate, Power BI, SharePoint and Dynamics 365 are trademarks of the
            Microsoft group of companies.
          </p>
        </div>
        <nav aria-label="Footer">
          <ul className="flex flex-wrap gap-x-5">
            <li>
              <Link href="/learn" className="inline-flex min-h-11 items-center underline">
                Learn
              </Link>
            </li>
            <li>
              <Link href="/search" className="inline-flex min-h-11 items-center underline">
                Components
              </Link>
            </li>
          </ul>
        </nav>
      </div>
    </footer>
  );
}
