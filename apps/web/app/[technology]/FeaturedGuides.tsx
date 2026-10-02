import type { ArticleSummary, TechnologyInfo } from "@ppu/domain-content";
import Link from "next/link";
import type { ReactNode } from "react";
import { ARTICLE_TYPE_LABEL } from "../../lib/article-types";
import { paletteFor, TECHNOLOGY_PALETTE } from "../../lib/technology-palette";
import { sectionPath, type SectionCounts } from "../../lib/technology-sections";
import { ARTICLE_COVERS } from "../home/HomeSections";

/**
 * Large covers for guides featured at the top of a section's Learn tab, as the
 * canvas draws them (fixed illustrations, decorative). Any other guide falls
 * back to its home-page cover, then to its type's initial.
 */
const FEATURED_COVERS: Readonly<Record<string, { className: string; cover: ReactNode }>> = {
  "power-apps-delegation-500-rows": {
    className: "bg-[#14141a]",
    cover: (
      <span className="flex w-full max-w-[26rem] flex-col gap-3 px-6 font-mono text-[13px]">
        <span className="rounded-xl bg-[#2a2a33] px-3.5 py-3 text-[#ff9b8a] line-through">
          Search(Tasks, txtSearch.Value, Title)
        </span>
        <span className="rounded-xl border-2 border-[#a3e635] bg-[#1e1e26] px-3.5 py-3 text-white shadow-[0_0_40px_-12px_rgb(163_230_53/0.6)]">
          <span className="text-[#d9f99d]">Filter</span>(Tasks,{" "}
          <span className="text-[#d9f99d]">StartsWith</span>(Title, txtSearch.Value))
        </span>
        <span className="text-[11px] text-[#d9f99d]">500 rows searched → every row searched</span>
      </span>
    ),
  },
  "canvas-vs-model-driven-apps": {
    className: "bg-[#fef3c7]",
    cover: (
      <span className="flex items-center gap-5">
        <span className="flex h-[136px] w-[110px] -rotate-6 flex-col gap-2 rounded-[18px] border-2 border-[#14141a] bg-white p-3 shadow-[6px_6px_0_#14141a]">
          <span className="font-display text-xs font-bold text-[#14141a]">Canvas</span>
          <span className="h-5 rounded-md bg-[#ede4ff]" />
          <span className="h-5 rounded-md bg-[#fde68a]" />
          <span className="h-5 rounded-md bg-[#dbeafe]" />
        </span>
        <span className="accent-word text-4xl text-[#92400e]">or</span>
        <span className="flex h-[136px] w-[110px] rotate-6 flex-col gap-1.5 rounded-[18px] border-2 border-[#14141a] bg-white p-3 shadow-[6px_6px_0_#14141a]">
          <span className="font-display text-xs font-bold text-[#14141a]">Model-driven</span>
          {[0, 1, 2, 3, 4].map((line) => (
            <span key={line} className="h-2.5 rounded bg-[#e4e4e7]" />
          ))}
        </span>
      </span>
    ),
  },
};

/**
 * The Learn tab's order: guides with a drawn featured cover first, then those
 * with a home-page cover, then the rest, each group newest first (the sort is
 * stable). So the illustrated launch guides stay on top as newer ones arrive.
 */
export function featuredFirst(articles: readonly ArticleSummary[]): ArticleSummary[] {
  const rank = (article: ArticleSummary) =>
    FEATURED_COVERS[article.slug] ? 0 : ARTICLE_COVERS[article.slug] ? 1 : 2;
  return [...articles].sort((a, b) => rank(a) - rank(b));
}

function Cover({ article }: { article: ArticleSummary }) {
  const featured = FEATURED_COVERS[article.slug];
  const palette = paletteFor(article.technology);
  return (
    <div
      aria-hidden="true"
      className={`grid h-[210px] place-items-center overflow-hidden ${featured?.className ?? palette.tint}`}
    >
      {featured?.cover ?? ARTICLE_COVERS[article.slug] ?? (
        <span className={`font-display text-8xl font-extrabold ${palette.ink}`}>
          {ARTICLE_TYPE_LABEL[article.type].charAt(0)}
        </span>
      )}
    </div>
  );
}

/** The first two guides of a section's Learn tab, as large illustrated cards. */
export function FeaturedGuides({ articles }: { articles: readonly ArticleSummary[] }) {
  return (
    <ul className="mt-6 grid grid-cols-1 gap-5 md:grid-cols-[minmax(0,1.43fr)_minmax(0,1fr)]">
      {articles.map((article, index) => {
        const palette = paletteFor(article.technology);
        return (
          <li
            key={article.slug}
            className="motion-lift relative flex flex-col overflow-hidden rounded-[1.75rem] border border-border bg-card"
          >
            <Cover article={article} />
            <div className="flex flex-col gap-2.5 p-6 md:p-7">
              <p className={`text-[0.8125rem] font-semibold ${palette.ink}`}>
                {ARTICLE_TYPE_LABEL[article.type]}
                {index === 0 && FEATURED_COVERS[article.slug] ? " · Start here" : ""}
              </p>
              <h3 className="font-display text-2xl leading-tight font-bold tracking-[-0.01em] md:text-[1.75rem]">
                <Link
                  href={`/learn/${encodeURIComponent(article.slug)}`}
                  className="text-foreground no-underline after:absolute after:inset-0 after:content-[''] hover:underline"
                >
                  {article.title}
                </Link>
              </h3>
              {article.excerpt ? (
                <p className="line-clamp-3 text-[0.9375rem] leading-relaxed text-muted-foreground">
                  {article.excerpt}
                </p>
              ) : null}
            </div>
          </li>
        );
      })}
    </ul>
  );
}

/**
 * "Also in {technology}" (the canvas's row under the Learn tab): the newest
 * architecture pattern and KPI guide, each a card linking to that guide, and a
 * card for the section's components. Only guides that exist are shown.
 */
export function AlsoInSection({
  technology,
  counts,
}: {
  technology: TechnologyInfo;
  counts: SectionCounts;
}) {
  const cards = [
    { label: "Architecture", article: counts.newestByType.PATTERN, tint: "POWER_AUTOMATE" },
    { label: "KPIs", article: counts.newestByType.KPI_GUIDE, tint: "COPILOT_STUDIO" },
  ] as const;
  return (
    <section aria-labelledby="also_in" className="mx-auto mt-16 max-w-[77.5rem]">
      <h2 id="also_in" className="text-3xl font-bold md:text-[2.5rem]">
        Also in <span className="accent-word text-accent">{technology.name}</span>
      </h2>
      <ul className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-3">
        {cards.map(({ label, article, tint }) =>
          article ? (
            <li
              key={label}
              className={`motion-lift relative flex min-h-36 flex-col gap-2 rounded-[1.5rem] p-6 ${TECHNOLOGY_PALETTE[tint].tint}`}
            >
              <p
                className={`font-mono text-xs tracking-widest uppercase ${TECHNOLOGY_PALETTE[tint].ink}`}
              >
                {label}
              </p>
              <h3 className="font-display text-xl leading-tight font-bold">
                <Link
                  href={`/learn/${encodeURIComponent(article.slug)}`}
                  className="text-foreground no-underline after:absolute after:inset-0 after:rounded-[1.5rem] after:content-[''] hover:underline"
                >
                  {article.title}
                </Link>
              </h3>
            </li>
          ) : null,
        )}
        <li className="motion-lift relative flex min-h-36 flex-col gap-2 rounded-[1.5rem] border-2 border-dashed border-muted-foreground bg-card p-6">
          <p className="font-mono text-xs tracking-widest text-muted-foreground uppercase">
            Components
          </p>
          <h3 className="pr-12 font-display text-xl leading-tight font-bold">
            <Link
              href={sectionPath(technology, "components")}
              className="text-foreground no-underline after:absolute after:inset-0 after:rounded-[1.5rem] after:content-[''] hover:underline"
            >
              Reusable {technology.name} components
            </Link>
          </h3>
          <span
            aria-hidden="true"
            className="shape-cube motion-bob absolute top-5 right-5 h-11 w-11"
          />
        </li>
      </ul>
    </section>
  );
}
