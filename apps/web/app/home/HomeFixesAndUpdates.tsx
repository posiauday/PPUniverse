import {
  TECHNOLOGIES,
  UPDATE_KIND_LABEL,
  technologyInfo,
  trackerLabel,
  type ArticleSummary,
  type PublishedUpdate,
} from "@ppu/domain-content";
import Link from "next/link";
import { publishedFixes } from "../../lib/technology-hubs";
import { paletteFor } from "../../lib/technology-palette";

/** How many fixes each technology shows on the home page; its hub has the rest. */
const FIXES_PER_AREA = 3;

/**
 * "Stuck right now?": each product's most-needed fixes (the same list as its
 * hub, lib/technology-hubs.ts), linking straight to the guide that fixes it.
 * Only published guides appear, an area with none is left out, and the whole
 * band is left out until there is at least one.
 */
export function FixFirstBand({ articles }: { articles: readonly ArticleSummary[] }) {
  const areas = TECHNOLOGIES.map((area) => ({
    area,
    palette: paletteFor(area.technology),
    fixes: publishedFixes(area.technology, articles).slice(0, FIXES_PER_AREA),
  })).filter((entry) => entry.fixes.length > 0);
  if (areas.length === 0) return null;
  return (
    <section aria-labelledby="home-fixes" className="mx-auto mt-20 max-w-[77.5rem]">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <h2 id="home-fixes" className="text-4xl font-bold md:text-[3.5rem]">
          Stuck <span className="accent-word text-coral">right now</span>?
        </h2>
        <p className="max-w-sm text-[1.0625rem] leading-relaxed text-muted-foreground">
          The problems people bring most often, each with the guide that fixes it.
        </p>
      </div>
      <ul className="mt-9 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {areas.map(({ area, palette, fixes }) => (
          <li
            key={area.technology}
            className="flex flex-col gap-4 rounded-[1.75rem] border border-border bg-card p-6"
          >
            {/* White cards, the area's colour on its dot and chips: the tinted
                technology panels sit just above, so these must not look the same. */}
            <h3 className="flex items-center gap-2.5 font-display text-xl font-bold">
              <span aria-hidden="true" className={`h-2.5 w-2.5 rounded-full ${palette.dot}`} />
              <Link href={`/${area.slug}`} className="no-underline hover:underline">
                {area.name}
              </Link>
            </h3>
            <ul className="flex flex-wrap gap-2">
              {fixes.map((fix) => (
                <li key={fix.slug}>
                  <Link
                    href={`/learn/${encodeURIComponent(fix.slug)}`}
                    className={`motion-lift inline-flex min-h-11 items-center rounded-full border-[1.5px] border-transparent px-3.5 text-sm font-medium text-foreground no-underline hover:border-foreground ${palette.tint}`}
                  >
                    {fix.label}
                  </Link>
                </li>
              ))}
            </ul>
            <Link
              href={`/${area.slug}`}
              className={`mt-auto inline-flex min-h-11 items-center text-sm font-semibold underline-offset-4 hover:underline ${palette.ink}`}
            >
              Everything in {area.name} →
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

/**
 * The newest platform updates (MVP-033's Updates page), so the home page shows
 * what changed lately. Left out until one is published.
 */
export function LatestUpdates({ updates }: { updates: readonly PublishedUpdate[] }) {
  if (updates.length === 0) return null;
  const now = new Date();
  return (
    <section aria-labelledby="home-updates" className="mx-auto mt-20 max-w-[77.5rem]">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <h2 id="home-updates" className="text-4xl font-bold md:text-[3.5rem]">
          What <span className="accent-word text-accent">changed</span>.
        </h2>
        <Link
          href="/updates"
          className="inline-flex min-h-11 items-center border-b-2 border-foreground font-semibold text-foreground no-underline"
        >
          All updates →
        </Link>
      </div>
      <ul className="mt-9 grid grid-cols-1 gap-4 md:grid-cols-3">
        {updates.map((update) => {
          const palette = paletteFor(update.technology);
          const area = update.technology ? technologyInfo(update.technology) : null;
          return (
            <li key={update.slug}>
              <Link
                href={`/updates#${encodeURIComponent(update.slug)}`}
                className="motion-lift flex h-full flex-col gap-2 rounded-3xl border border-border bg-card p-5.5 text-foreground no-underline"
              >
                <span className="flex flex-wrap items-center gap-2">
                  <span
                    className={`rounded-full px-2.5 py-1 text-xs font-semibold ${palette.tint} ${palette.ink}`}
                  >
                    {area ? area.name : "Power Platform"}
                  </span>
                  <span className="font-mono text-[0.6875rem] tracking-wide text-muted-foreground uppercase">
                    {trackerLabel(update, now) ?? UPDATE_KIND_LABEL[update.kind]}
                  </span>
                </span>
                <span className="font-display text-[1.1875rem] leading-snug font-bold">
                  {update.title}
                </span>
                <span className="line-clamp-3 text-sm text-muted-foreground">{update.summary}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
