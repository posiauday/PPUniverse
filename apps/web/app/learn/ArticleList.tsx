import type { ArticleSummary } from "@ppu/domain-content";
import Link from "next/link";

const DATE_FORMAT = new Intl.DateTimeFormat("en-US", {
  year: "numeric",
  month: "long",
  day: "numeric",
  timeZone: "UTC",
});

/**
 * A list of article links with excerpt and publish date, used by the /learn
 * hub, the home page and an article's "Keep learning" section (SEO story).
 * `headingLevel` keeps each page's heading outline valid: the title of each
 * item sits one level below the section heading it appears under.
 */
export function ArticleList({
  articles,
  headingLevel,
}: {
  articles: readonly ArticleSummary[];
  headingLevel: 3 | 4;
}) {
  const Heading = headingLevel === 3 ? "h3" : "h4";
  return (
    <ul className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
      {articles.map((article) => (
        <li key={article.slug} className="rounded-card border border-border p-4">
          <Heading className="font-semibold">
            {/* inline-block + vertical padding keeps the target at or above
                the WCAG 2.5.8 24px minimum. */}
            <Link href={`/learn/${encodeURIComponent(article.slug)}`} className="inline-block py-1">
              {article.title}
            </Link>
          </Heading>
          {article.excerpt ? (
            <p className="mt-1 text-sm text-muted-foreground">{article.excerpt}</p>
          ) : null}
          <p className="mt-2 text-sm text-muted-foreground">
            <time dateTime={article.publishedAt.toISOString()}>
              {DATE_FORMAT.format(article.publishedAt)}
            </time>
          </p>
        </li>
      ))}
    </ul>
  );
}
