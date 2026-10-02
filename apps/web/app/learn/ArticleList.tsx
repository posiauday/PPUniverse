import { technologyInfo, type ArticleSummary } from "@ppu/domain-content";
import Link from "next/link";
import { ARTICLE_TYPE_LABEL } from "../../lib/article-types";
import { paletteFor } from "../../lib/technology-palette";

const DATE_FORMAT = new Intl.DateTimeFormat("en-US", {
  year: "numeric",
  month: "long",
  day: "numeric",
  timeZone: "UTC",
});

const GRID = {
  2: "sm:grid-cols-2",
  3: "sm:grid-cols-2 lg:grid-cols-3",
  4: "sm:grid-cols-2 lg:grid-cols-4",
} as const;

/**
 * A grid of article cards (SEO story; Daylight look, MVP-031), used by the
 * /learn hub, the home page and the technology sections. Each card carries
 * its technology's colour strip and tag, its type, title, excerpt and publish
 * date. The whole card is the link's hit area, but the link itself is only
 * the title, so a screen reader hears one clean name per card.
 * `headingLevel` keeps each page's heading outline valid: the title of each
 * item sits one level below the section heading it appears under.
 */
export function ArticleList({
  articles,
  headingLevel,
  columns = 3,
  showType = true,
  showDate = true,
}: {
  articles: readonly ArticleSummary[];
  headingLevel: 3 | 4;
  columns?: 2 | 3 | 4;
  /** Off where the section heading already names the type (the /learn groups). */
  showType?: boolean;
  /** Off in the /learn library, as the canvas draws it; the article page shows the date. */
  showDate?: boolean;
}) {
  const Heading = headingLevel === 3 ? "h3" : "h4";
  return (
    <ul className={`mt-5 grid grid-cols-1 gap-4 lg:gap-[18px] ${GRID[columns]}`}>
      {articles.map((article) => {
        const palette = paletteFor(article.technology);
        const technology = article.technology ? technologyInfo(article.technology) : null;
        return (
          <li
            key={article.slug}
            className="motion-lift relative flex flex-col overflow-hidden rounded-card border border-border bg-card"
          >
            <span aria-hidden="true" className={`h-2.5 shrink-0 ${palette.tint}`} />
            <div className="flex flex-1 flex-col gap-2.5 p-[22px]">
              {technology || showType ? (
                <p className="flex flex-wrap items-center gap-2 text-[0.8125rem] font-semibold">
                  {technology ? (
                    <span className={`rounded-full px-2.5 py-1 ${palette.tint} ${palette.ink}`}>
                      {technology.name}
                    </span>
                  ) : null}
                  {showType ? (
                    <span className="text-muted-foreground">
                      {ARTICLE_TYPE_LABEL[article.type]}
                    </span>
                  ) : null}
                </p>
              ) : null}
              <Heading className="font-display text-[1.3125rem] leading-tight font-bold tracking-[-0.01em]">
                {/* The stretched ::after makes the whole card clickable while
                    the link's name stays the title alone. */}
                <Link
                  href={`/learn/${encodeURIComponent(article.slug)}`}
                  className="text-foreground no-underline after:absolute after:inset-0 after:rounded-card after:content-[''] hover:underline"
                >
                  {article.title}
                </Link>
              </Heading>
              {article.excerpt ? (
                <p className="line-clamp-2 text-sm leading-relaxed text-muted-foreground">
                  {article.excerpt}
                </p>
              ) : null}
              {showDate ? (
                <p className="mt-auto pt-1 text-[0.8125rem] text-muted-foreground">
                  <time dateTime={article.publishedAt.toISOString()}>
                    {DATE_FORMAT.format(article.publishedAt)}
                  </time>
                </p>
              ) : null}
            </div>
          </li>
        );
      })}
    </ul>
  );
}
