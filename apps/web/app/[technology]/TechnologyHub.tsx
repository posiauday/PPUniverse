import {
  UPDATE_KIND_LABEL,
  trackerLabel,
  type ArticleSummary,
  type PublishedUpdate,
} from "@ppu/domain-content";
import Link from "next/link";
import { ARTICLE_KIND } from "../../lib/article-types";
import type { ReactNode } from "react";
import {
  HUB_HEADLINES,
  HUB_JOURNEYS,
  groupIntoSections,
  lookItUp,
  publishedFixes,
  splitTitle,
  type HubKey,
  type HubSection,
} from "../../lib/technology-hubs";
import { Breadcrumbs } from "../guides/Breadcrumbs";

export interface HubArea {
  key: HubKey;
  name: string;
  /** The area's address: /power-automate, /governance. The hub search sends it as ?tech=. */
  slug: string;
  /** Tailwind classes for the area's tint and ink. */
  tint: string;
  ink: string;
}

// The kind badges are shared with the guide page (lib/article-types.ts).
const KIND = ARTICLE_KIND;

const guideHref = (slug: string) => `/guides/${encodeURIComponent(slug)}`;

/**
 * A technology hub, built to the chosen "Fix first" concept (H1; MVP-037,
 * docs/final-decisions.md, 2026-10-06, "Guide page and hub designs chosen"):
 * - the hero: the area's headline, a search, and its most-needed fixes, each
 *   linking straight to the guide that fixes it;
 * - "Look it up": the area's quick-reference guides, the pages people keep open;
 * - every section of the area with its guides, each marked Fix, Choose,
 *   Design, Measure or Look it up. Power BI draws its sections as the journey
 *   a report takes (H2), the one hub that does;
 * - "What changed": the area's latest updates.
 * Sections are this area's own (lib/technology-hubs.ts), not one template.
 */
export function TechnologyHub({
  area,
  articles,
  updates,
  heroVisual,
  footer,
}: {
  area: HubArea;
  articles: readonly ArticleSummary[];
  updates: readonly PublishedUpdate[];
  heroVisual?: ReactNode;
  footer?: ReactNode;
}) {
  const sections = groupIntoSections(area.key, articles);
  const fixes = publishedFixes(area.key, articles);
  const references = lookItUp(articles);
  const headline = HUB_HEADLINES[area.key];
  const journey = HUB_JOURNEYS[area.key];
  const searchId = `hub-search-${area.key}`;

  return (
    <main className="px-4 pb-6 md:px-6">
      <header
        className={`motion-rise relative mx-auto mt-2 max-w-[77.5rem] overflow-hidden rounded-[2.5rem] ${area.tint}`}
      >
        <div className="relative flex flex-col gap-5 px-6 py-10 md:px-16 md:py-14 lg:max-w-[46rem]">
          <Breadcrumbs
            items={[{ name: "Technologies", href: "/#technologies" }, { name: area.name }]}
          />
          <h1 className="flex flex-col gap-3">
            <span
              className={`font-mono text-xs font-medium tracking-[0.14em] uppercase ${area.ink}`}
            >
              {area.name}
            </span>
            <span className="font-display text-[2.5rem] leading-[1.02] font-bold tracking-[-0.02em] md:text-[3.625rem]">
              {headline.lead} <span className={`accent-word ${area.ink}`}>{headline.accent}</span>
            </span>
          </h1>
          <form
            action="/search"
            method="GET"
            role="search"
            className="flex max-w-[35rem] items-center gap-2 rounded-full border-[1.5px] border-foreground bg-card p-1.5"
          >
            <label htmlFor={searchId} className="sr-only">
              Search {area.name} guides
            </label>
            <input type="hidden" name="tech" value={area.slug} />
            <input
              id={searchId}
              type="search"
              name="q"
              placeholder={`Search ${area.name} guides`}
              className="h-11 min-w-0 flex-1 bg-transparent px-4 text-base text-foreground placeholder:text-muted-foreground"
            />
            <button
              type="submit"
              className="h-11 rounded-full bg-primary px-5 font-semibold text-primary-foreground"
            >
              Search
            </button>
          </form>
          {fixes.length > 0 ? (
            <div className="flex flex-col gap-2.5">
              <h2 id="most-needed" className={`text-sm font-semibold ${area.ink}`}>
                Most-needed fixes
              </h2>
              <ul aria-labelledby="most-needed" className="flex flex-wrap gap-2">
                {fixes.map((fix) => (
                  <li key={fix.slug}>
                    <Link
                      href={guideHref(fix.slug)}
                      className="motion-lift inline-flex min-h-11 items-center rounded-full border-[1.5px] border-transparent bg-card px-3.5 text-sm font-medium text-foreground no-underline hover:border-foreground"
                    >
                      {fix.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>
        {heroVisual ? <div aria-hidden="true">{heroVisual}</div> : null}
      </header>

      {references.length > 0 ? (
        <section aria-labelledby="look-it-up" className="mx-auto mt-9 max-w-[77.5rem]">
          <h2 id="look-it-up" className="font-display text-[1.625rem] font-bold">
            Quick reference{" "}
            <span className="accent-word text-[1.1em] text-muted-foreground">
              · keep these open
            </span>
          </h2>
          <ul className="mt-3.5 grid grid-cols-1 gap-3.5 md:grid-cols-3">
            {references.map((guide) => {
              const { heading, detail } = splitTitle(guide.title);
              return (
                <li key={guide.slug}>
                  <Link
                    href={guideHref(guide.slug)}
                    className="motion-lift on-code-surface flex h-full flex-col gap-2 rounded-[1.625rem] bg-code p-5.5 text-code-foreground no-underline"
                  >
                    <span className="font-mono text-[0.6875rem] tracking-wide text-[#d9f99d] uppercase">
                      Quick reference
                    </span>
                    <span className="font-display text-[1.3125rem] leading-snug font-bold text-white">
                      {heading}
                    </span>
                    {detail ? <span className="text-sm text-[#d4d4dc]">{detail}</span> : null}
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>
      ) : null}

      <section aria-labelledby="every-area" className="mx-auto mt-10 max-w-[77.5rem]">
        <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
          <h2 id="every-area" className="font-display text-[1.625rem] font-bold">
            {journey ? `The way a report gets built` : `Every area of ${area.name}`}
          </h2>
          <span className="text-sm text-muted-foreground">
            {journey ? "Start anywhere · " : ""}
            {articles.length > 0
              ? `${articles.length} ${articles.length === 1 ? "guide" : "guides"}`
              : "First guides coming soon"}
          </span>
        </div>
        {journey ? (
          <Journey sections={sections} stops={journey} />
        ) : (
          <ul className="mt-3.5 grid grid-cols-1 gap-3.5 md:grid-cols-2 lg:grid-cols-3">
            {sections.map((section) => (
              <li
                key={section.id}
                id={section.id}
                className="flex scroll-mt-28 flex-col gap-3 rounded-[1.75rem] border border-border bg-card p-6"
              >
                <h3 className="font-display text-[1.3125rem] leading-tight font-bold">
                  {section.name}
                </h3>
                <SectionGuides section={section} />
              </li>
            ))}
          </ul>
        )}
      </section>

      {updates.length > 0 ? <WhatChanged updates={updates} /> : null}

      {footer}
    </main>
  );
}

/**
 * A guide title as the board draws it in lists: only the part before the
 * colon shows. The link's label is the full title, starting with the visible
 * words (WCAG 2.5.3), so screen readers and voice control get the whole name.
 * (A visually hidden span was tried first: browsers put a space before it.)
 */
const shortTitle = (title: string) => splitTitle(title).heading;

/** A section's guides, each with its kind badge, then its planned ones. */
function SectionGuides({ section }: { section: HubSection }) {
  if (section.guides.length === 0 && section.planned.length === 0) {
    return <p className="text-sm text-muted-foreground">First guides coming soon.</p>;
  }
  return (
    <ul className="flex flex-col gap-0.5 [overflow-wrap:anywhere]">
      {section.guides.map((guide) => (
        <li key={guide.slug}>
          <Link
            href={guideHref(guide.slug)}
            aria-label={`${KIND[guide.type].label} ${guide.title}`}
            className="-mx-2.5 flex items-baseline gap-2.5 rounded-xl px-2.5 py-2 text-[0.9375rem] leading-snug text-foreground no-underline transition-colors hover:bg-muted"
          >
            <span
              className={`shrink-0 rounded-full px-2 py-0.5 font-mono text-[0.6875rem] uppercase ${KIND[guide.type].className}`}
            >
              {KIND[guide.type].label}
            </span>
            <span className="underline decoration-transparent underline-offset-4 hover:decoration-current">
              {shortTitle(guide.title)}
            </span>
          </Link>
        </li>
      ))}
      {section.planned.map((title) => (
        <li key={title} className="flex gap-2.5 py-2 text-[0.9375rem] text-muted-foreground">
          <span aria-hidden="true">○</span>
          <span>Coming: {title}</span>
        </li>
      ))}
    </ul>
  );
}

/** A journey stop's guides as tiles (board H2): narrower than a section card,
 * so no kind badge, and long words such as USERPRINCIPALNAME may wrap. */
function JourneyGuides({ section }: { section: HubSection }) {
  if (section.guides.length === 0 && section.planned.length === 0) {
    return <p className="text-sm text-muted-foreground">First guides coming soon.</p>;
  }
  return (
    <ul className="flex flex-col gap-2 [overflow-wrap:anywhere]">
      {section.guides.map((guide) => (
        <li key={guide.slug}>
          <Link
            href={guideHref(guide.slug)}
            aria-label={guide.title}
            className="block w-full rounded-[0.875rem] bg-muted px-3 py-2.5 text-[0.9375rem] leading-snug text-foreground no-underline transition-transform hover:translate-x-[3px]"
          >
            {shortTitle(guide.title)}
          </Link>
        </li>
      ))}
      {section.planned.map((title) => (
        <li key={title} className="px-3 text-sm text-muted-foreground">
          Coming: {title}
        </li>
      ))}
    </ul>
  );
}

/** Stop colours for the journey (board H2), light tints with dark numbers in both themes. */
const STOP_TINTS = ["#fff0c2", "#ffe4d6", "#ede4ff", "#dcebff", "#d9f7e3"] as const;

/** Power BI's sections as numbered stops, in the order a report is built (board H2). */
function Journey({
  sections,
  stops,
}: {
  sections: readonly HubSection[];
  stops: Readonly<Record<string, string>>;
}) {
  return (
    <div className="mt-4 flex flex-col gap-4">
      <div
        aria-hidden="true"
        className="relative mx-[8%] hidden h-1.5 overflow-hidden rounded-full bg-border lg:block"
      >
        <span className="motion-draw absolute inset-0 rounded-full bg-[linear-gradient(90deg,#f59e0b,#ff7a59,#7c3aed,#1d4ed8,#16a34a)]" />
      </div>
      <ol className="grid grid-cols-1 gap-3.5 md:grid-cols-2 lg:grid-cols-5">
        {sections.map((section, index) => (
          <li
            key={section.id}
            id={section.id}
            className="flex scroll-mt-28 flex-col gap-3 rounded-[1.75rem] border border-border bg-card p-5.5"
          >
            <span
              aria-hidden="true"
              className="grid h-11 w-11 place-items-center rounded-[0.875rem] font-display text-xl font-extrabold text-[#14141a]"
              style={{ background: STOP_TINTS[index % STOP_TINTS.length] }}
            >
              {index + 1}
            </span>
            <h3 className="font-display text-xl leading-tight font-bold">
              {stops[section.id] ?? section.name}
              <span className="sr-only">: {section.name}</span>
            </h3>
            <JourneyGuides section={section} />
          </li>
        ))}
      </ol>
    </div>
  );
}

/** The area's latest updates (board H1, "What changed"), linking to each on /updates. */
function WhatChanged({ updates }: { updates: readonly PublishedUpdate[] }) {
  const now = new Date();
  return (
    <section
      aria-labelledby="what-changed"
      className="mx-auto mt-10 grid max-w-[77.5rem] grid-cols-1 gap-3.5 md:grid-cols-[13.75rem_repeat(2,minmax(0,1fr))]"
    >
      <div className="flex flex-col justify-center gap-2">
        <h2 id="what-changed" className="font-display text-2xl font-bold">
          What changed
        </h2>
        <Link href="/updates" className="text-sm underline underline-offset-[3px]">
          All updates
        </Link>
      </div>
      {updates.slice(0, 2).map((update) => (
        <Link
          key={update.slug}
          href={`/updates#${encodeURIComponent(update.slug)}`}
          className="motion-lift flex flex-col gap-1.5 rounded-3xl border border-border bg-card p-5 text-foreground no-underline"
        >
          <span className="font-mono text-[0.6875rem] tracking-wide text-muted-foreground uppercase">
            {trackerLabel(update, now) ?? UPDATE_KIND_LABEL[update.kind]}
          </span>
          <span className="font-display text-[1.1875rem] leading-snug font-bold">
            {update.title}
          </span>
          <span className="line-clamp-2 text-sm text-muted-foreground">{update.summary}</span>
        </Link>
      ))}
    </section>
  );
}
