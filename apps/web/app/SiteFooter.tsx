import { TECHNOLOGIES } from "@ppu/domain-content";
import Link from "next/link";
import { SITE_NAME } from "../lib/seo/site";
import { BrandMark } from "./BrandMark";

/** "Microsoft, Power Apps, Power Automate, ... and Power Pages", from the registry. */
const TRADEMARKS = ["Microsoft", ...TECHNOLOGIES.map((entry) => entry.name)];
const TRADEMARK_LIST = `${TRADEMARKS.slice(0, -1).join(", ")} and ${TRADEMARKS.at(-1)}`;

/**
 * Site-wide footer (MVP-027; Daylight look, MVP-031). Carries the standing
 * non-affiliation line: LowCodeStacks never claims Microsoft endorsement,
 * certification or partnership (CLAUDE.md delivery rules), and saying so
 * plainly on every page is the simplest way to keep that true. The trademark
 * notice names exactly the technologies the site covers (the registry).
 */
export function SiteFooter() {
  return (
    <footer className="mt-20 border-t border-border px-4 md:px-6">
      <div className="mx-auto flex max-w-[77.5rem] flex-col gap-6 py-10 text-sm text-muted-foreground sm:flex-row sm:items-start sm:justify-between">
        <div className="max-w-xl">
          <p className="flex items-center gap-2.5 font-display text-base font-bold text-foreground">
            <BrandMark size={22} />
            {SITE_NAME}
          </p>
          <p className="mt-2">
            Free Power Platform learning, architecture patterns and reusable components.
          </p>
          <p className="mt-2 leading-relaxed">
            Independent site. Not affiliated with, endorsed by or certified by Microsoft.{" "}
            {TRADEMARK_LIST} are trademarks of the Microsoft group of companies.
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
