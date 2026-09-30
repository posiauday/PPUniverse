import { TECHNOLOGIES } from "@ppu/domain-content";
import Link from "next/link";
import { TECHNOLOGY_BLURB } from "../lib/technology-sections";

/**
 * Links to the six technology sections (MVP-028), always in the page: "tiles"
 * with a one-line summary on the home page, compact "chips" on /learn. These
 * are the crawlable, script-free route into every section; the header's
 * Technologies menu is a shortcut on top.
 */
export function TechnologyTiles({ variant }: { variant: "tiles" | "chips" }) {
  if (variant === "chips") {
    return (
      <ul className="mt-4 flex flex-wrap gap-2">
        {TECHNOLOGIES.map((entry) => (
          <li key={entry.slug}>
            <Link
              href={`/${entry.slug}`}
              className="inline-flex min-h-11 items-center rounded-full border border-muted-foreground px-4 font-semibold text-foreground no-underline hover:bg-muted"
            >
              {entry.name}
            </Link>
          </li>
        ))}
      </ul>
    );
  }
  return (
    <ul className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {TECHNOLOGIES.map((entry) => (
        <li key={entry.slug}>
          <Link
            href={`/${entry.slug}`}
            className="motion-lift flex h-full flex-col gap-1 rounded-card border border-border bg-card p-5 text-foreground no-underline hover:border-primary"
          >
            <span className="font-display text-lg font-semibold">{entry.name}</span>
            <span className="text-sm text-muted-foreground">
              {TECHNOLOGY_BLURB[entry.technology]}
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
