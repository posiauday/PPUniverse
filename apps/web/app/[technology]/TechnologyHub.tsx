import type { ArticleSummary } from "@ppu/domain-content";
import Link from "next/link";
import type { ReactNode } from "react";
import { ARTICLE_TYPE_LABEL } from "../../lib/article-types";
import {
  groupIntoSections,
  HUB_PROBLEMS,
  startHerePath,
  type HubKey,
} from "../../lib/technology-hubs";
import { Breadcrumbs } from "../learn/Breadcrumbs";

export interface HubArea {
  key: HubKey;
  name: string;
  tagline: string;
  blurb: string;
  /** Tailwind classes for the area's tint and ink. */
  tint: string;
  ink: string;
}

/**
 * A technology hub (MVP-033 slice C; docs/final-decisions.md, "Technology
 * pages are hubs"): the whole area at a glance, so a visitor sees everything
 * organised and chooses where to go.
 * - A short hero with a site search and three common problems.
 * - Every section as a card: description, its guides as links, planned guides
 *   marked "Coming".
 * - The ordered "New here?" path at the end, reached from a link in the hero,
 *   so it never blocks someone exploring.
 * Sections are this area's own (lib/technology-hubs.ts), not one template.
 */
export function TechnologyHub({
  area,
  articles,
  heroVisual,
  footer,
}: {
  area: HubArea;
  articles: readonly ArticleSummary[];
  heroVisual?: ReactNode;
  footer?: ReactNode;
}) {
  const sections = groupIntoSections(area.key, articles);
  const path = startHerePath(sections);
  return (
    <main className="px-4 pb-6 md:px-6">
      <header
        className={`motion-rise relative mx-auto mt-2 max-w-[77.5rem] overflow-hidden rounded-[2.5rem] ${area.tint}`}
      >
        <div className="relative flex flex-col gap-4 px-6 py-10 md:px-16 md:py-14 lg:max-w-[50rem]">
          <Breadcrumbs
            items={[{ name: "Technologies", href: "/#technologies" }, { name: area.name }]}
          />
          <h1 className="text-5xl leading-[0.95] font-extrabold md:text-[5.5rem]">{area.name}</h1>
          <p className={`accent-word text-3xl leading-tight md:text-[2.125rem] ${area.ink}`}>
            {area.tagline}.
          </p>
          <p className="max-w-xl text-lg leading-relaxed">{area.blurb}</p>
          <form
            action="/search"
            method="GET"
            role="search"
            className="mt-1 flex max-w-xl items-center rounded-full border-[1.5px] border-muted-foreground bg-card p-1 pl-5"
          >
            <label htmlFor={`hub-search-${area.key}`} className="sr-only">
              Search guides
            </label>
            <input
              id={`hub-search-${area.key}`}
              type="search"
              name="q"
              placeholder="Stuck? Search guides…"
              className="min-w-0 flex-1 bg-transparent text-base text-foreground placeholder:text-muted-foreground"
            />
            <button
              type="submit"
              className="min-h-11 rounded-full bg-primary px-5 font-semibold text-primary-foreground"
            >
              Search
            </button>
          </form>
          <ul className="flex flex-wrap gap-2 text-sm font-semibold" aria-label="Common problems">
            {HUB_PROBLEMS[area.key].map((problem) => (
              <li key={problem.label}>
                <Link
                  href={`/search?q=${encodeURIComponent(problem.query)}`}
                  className="inline-flex min-h-11 items-center rounded-full bg-card/75 px-4 text-foreground no-underline hover:bg-card"
                >
                  {problem.label}
                </Link>
              </li>
            ))}
          </ul>
          <p className="flex flex-wrap items-center gap-3 text-sm">
            <span className="rounded-full bg-primary px-3.5 py-1.5 font-semibold text-primary-foreground">
              {articles.length > 0
                ? `${articles.length} ${articles.length === 1 ? "guide" : "guides"} · ${sections.length} sections`
                : `${sections.length} sections · first guides coming soon`}
            </span>
            {path.length > 0 ? (
              <a
                href="#start-here"
                className="inline-flex min-h-11 items-center font-semibold underline underline-offset-4"
              >
                New here? Start with these {path.length} →
              </a>
            ) : null}
          </p>
        </div>
        {heroVisual ? <div aria-hidden="true">{heroVisual}</div> : null}
      </header>

      <section aria-labelledby="hub-map" className="mx-auto mt-12 max-w-[77.5rem]">
        <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
          <h2 id="hub-map" className="text-3xl font-bold md:text-[2.5rem]">
            Everything in {area.name}
          </h2>
          <span className="text-muted-foreground">Pick an area.</span>
        </div>
        <ul className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {sections.map((section, index) => (
            <li
              key={section.id}
              id={section.id}
              className="flex scroll-mt-28 flex-col gap-3 rounded-3xl border border-border bg-card p-6"
            >
              <div className="flex items-center justify-between gap-3">
                <span className={`font-mono text-xs ${area.ink}`} aria-hidden="true">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <span
                  className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${area.tint} ${area.ink}`}
                >
                  {section.guides.length > 0
                    ? `${section.guides.length} ${section.guides.length === 1 ? "guide" : "guides"}`
                    : "Coming soon"}
                </span>
              </div>
              <h3 className="font-display text-2xl leading-tight font-bold">{section.name}</h3>
              <p className="text-sm leading-relaxed text-muted-foreground">{section.description}</p>
              <ul className="mt-1 flex flex-col gap-2 text-[0.9375rem]">
                {section.guides.map((guide) => (
                  <li key={guide.slug} className="flex gap-2">
                    <span aria-hidden="true" className={area.ink}>
                      →
                    </span>
                    <span>
                      <Link
                        href={`/learn/${encodeURIComponent(guide.slug)}`}
                        className="font-semibold text-foreground underline decoration-border underline-offset-4 hover:decoration-foreground"
                      >
                        {guide.title}
                      </Link>{" "}
                      <span className="text-xs text-muted-foreground">
                        · {ARTICLE_TYPE_LABEL[guide.type]}
                      </span>
                    </span>
                  </li>
                ))}
                {section.planned.map((title) => (
                  <li key={title} className="flex gap-2 text-muted-foreground">
                    <span aria-hidden="true">○</span>
                    <span>Coming: {title}</span>
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ul>
      </section>

      {path.length > 0 ? (
        <section
          id="start-here"
          aria-labelledby="start-here-heading"
          className="mx-auto mt-12 max-w-[77.5rem] scroll-mt-28 rounded-[1.75rem] on-code-surface bg-code p-6 text-code-foreground md:p-8"
        >
          <h2
            id="start-here-heading"
            className="font-mono text-xs font-medium tracking-widest text-[#d9f99d] uppercase"
          >
            New here? Start with these {path.length}, in order
          </h2>
          <ol className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-3">
            {path.map((guide, index) => (
              <li key={guide.slug} className="flex items-start gap-3 rounded-2xl bg-[#22222b] p-4">
                <span
                  aria-hidden="true"
                  className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[#d9f99d] font-display font-extrabold text-[#14141a]"
                >
                  {index + 1}
                </span>
                <Link
                  href={`/learn/${encodeURIComponent(guide.slug)}`}
                  className="font-display text-lg leading-snug font-bold text-white underline-offset-4 hover:underline"
                >
                  {guide.title}
                </Link>
              </li>
            ))}
          </ol>
        </section>
      ) : null}

      {footer}
    </main>
  );
}
