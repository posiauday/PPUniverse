import { TECHNOLOGIES } from "@ppu/domain-content";
import Link from "next/link";
import { TECHNOLOGY_PALETTE } from "../lib/technology-palette";

/**
 * Chips linking to the six technology sections (MVP-028; Daylight look,
 * MVP-031), each marked with its technology's colour. The crawlable,
 * script-free route into every section from /learn; the header's
 * Technologies menu is a shortcut on top, and the home page has its own
 * large panels (home/TechnologyPanels).
 */
export function TechnologyTiles() {
  return (
    <ul className="flex flex-wrap gap-2.5">
      {TECHNOLOGIES.map((entry) => (
        <li key={entry.slug}>
          <Link
            href={`/${entry.slug}`}
            className="inline-flex min-h-11 items-center gap-2 rounded-full border-[1.5px] border-transparent bg-card px-4 font-semibold text-foreground no-underline hover:border-foreground"
          >
            <span
              aria-hidden="true"
              className={`h-2.5 w-2.5 rounded-full ${TECHNOLOGY_PALETTE[entry.technology].dot}`}
            />
            {entry.name}
          </Link>
        </li>
      ))}
    </ul>
  );
}
