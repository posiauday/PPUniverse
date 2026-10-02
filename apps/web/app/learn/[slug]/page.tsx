import { JsonLd } from "@ppu/ui";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { cache } from "react";
import { contentRepository } from "../../../lib/content";
import { outlineOf, readingMinutes } from "../../../lib/article-outline";
import { ARTICLE_TYPE_LABEL } from "../../../lib/article-types";
import { findRelatedArticles } from "../../../lib/related-articles";
import { technologyInfo } from "@ppu/domain-content";
import { homeUrl, learnIndexUrl, learnUrl, technologySectionUrl } from "../../../lib/seo/canonical";
import { buildArticleJsonLd, buildBreadcrumbJsonLd } from "../../../lib/seo/json-ld";
import { buildLearnMetadata, buildNotFoundMetadata } from "../../../lib/seo/metadata";
import { SITE_NAME } from "../../../lib/seo/site";
import { getSiteUrl } from "../../../lib/site-url";
import { paletteFor } from "../../../lib/technology-palette";
import { ARTICLE_COVERS } from "../../home/HomeSections";
import { ArticleBody } from "../ArticleBody";
import { ArticleList } from "../ArticleList";
import { ArticleToc } from "../ArticleToc";
import { Breadcrumbs } from "../Breadcrumbs";
import { ReadingProgress } from "../ReadingProgress";

interface LearnPageProps {
  params: Promise<{ slug: string }>;
}

// See apps/web/app/page.tsx for why these content pages render per-request
// rather than being statically generated at build time.
export const dynamic = "force-dynamic";

const DATE_FORMAT = new Intl.DateTimeFormat("en-US", {
  year: "numeric",
  month: "long",
  day: "numeric",
  timeZone: "UTC",
});

// generateMetadata and the page both need the article; cache() shares one
// query between them for the duration of a request.
const getArticle = cache((slug: string) => contentRepository.findPublishedArticleBySlug(slug));

export async function generateMetadata({ params }: LearnPageProps): Promise<Metadata> {
  const { slug } = await params;
  const article = await getArticle(slug);
  if (!article) {
    return buildNotFoundMetadata("Content not found");
  }
  return buildLearnMetadata({ site: getSiteUrl(), article });
}

/**
 * Published content: tutorials, patterns and comparison pages (MVP-017,
 * FR-014). An unknown slug, or one that exists but is not PUBLISHED, is a
 * 404 — never a distinguishable response, matching the same
 * publicly-visible-only rule the product/category pages already enforce.
 *
 * `body` is Markdown source, stored untrusted (an ADMIN authors it today,
 * but this is public-facing, so it is treated as though anyone could). It is
 * rendered by ArticleBody as real structure -- headings, links, lists,
 * tables, code -- without ever rendering raw HTML (TD-017, resolved by the
 * SEO story). The first pass showed it as escaped plain text; see
 * ArticleBody for why the structured rendering is equally safe.
 *
 * Internal links (SEO story): a breadcrumb back to the /learn hub and a
 * "Keep learning" list of related articles, so readers and crawlers can
 * move through the library instead of hitting a dead end.
 *
 * Layout (MVP-027 slice 3, the "A + B -- Article page" mockup): the title
 * block, then "On this page" | the article | "Keep learning" as three
 * columns on wide screens and one column, in that order, on narrow ones.
 * Each part is in the page once. The page's own ids contain an underscore,
 * which heading slugs never do, so an article heading cannot collide.
 */
export default async function LearnPage({ params }: LearnPageProps) {
  const { slug } = await params;
  const article = await getArticle(slug);
  if (!article) {
    notFound();
  }

  const related = await findRelatedArticles(contentRepository, article);
  const site = getSiteUrl();
  const jsonLd = site.ok
    ? buildArticleJsonLd({
        origin: site.origin,
        url: learnUrl(site.origin, article.slug),
        title: article.title,
        excerpt: article.excerpt,
        publishedAt: article.publishedAt,
        updatedAt: article.updatedAt,
      })
    : null;
  // MVP-029: an article in a technology section sits under that section in
  // the trail (LowCodeStacks / Power Apps / title); others under Learn.
  const section = article.technology ? technologyInfo(article.technology) : null;
  const parent = section
    ? { name: section.name, path: `/${section.slug}` }
    : { name: "Learn", path: "/learn" };
  const breadcrumbJsonLd = site.ok
    ? buildBreadcrumbJsonLd([
        { name: SITE_NAME, url: homeUrl(site.origin) },
        {
          name: parent.name,
          url: section
            ? technologySectionUrl(site.origin, parent.path)
            : learnIndexUrl(site.origin),
        },
        { name: article.title, url: learnUrl(site.origin, article.slug) },
      ])
    : null;

  const outline = outlineOf(article.body);
  const minutes = readingMinutes(article.body);
  const palette = paletteFor(article.technology);
  // "Delegation in Power Apps: why your gallery stops at 500 rows" -- the part
  // after the first colon is set in the serif accent (Daylight type rule).
  const colon = article.title.indexOf(": ");
  const [lead, accent] =
    colon > 0
      ? [article.title.slice(0, colon + 1), article.title.slice(colon + 2)]
      : [article.title, ""];
  // The badge is shown only when the article really links to Microsoft
  // Learn, so it can never claim a check that is not in the text.
  const citesLearn = /https:\/\/learn\.microsoft\.com\//.test(article.body);
  const cover = ARTICLE_COVERS[article.slug];

  return (
    <main className="px-4 pb-6 md:px-6">
      <ReadingProgress />
      <header
        className={`motion-rise relative mx-auto mt-4 grid max-w-[77.5rem] items-center gap-8 overflow-hidden rounded-[2.5rem] px-6 py-10 md:px-[72px] md:py-16 ${palette.tint} ${cover ? "lg:grid-cols-[minmax(0,1fr)_300px]" : ""}`}
      >
        <div className="relative flex flex-col gap-5">
          <Breadcrumbs
            items={[
              { name: SITE_NAME, href: "/" },
              { name: parent.name, href: parent.path },
              { name: article.title },
            ]}
          />
          <h1 className="text-4xl leading-[1.04] font-bold md:text-[3.75rem]">
            {lead}
            {accent ? (
              <>
                {" "}
                <span className={`accent-word text-[1.08em] ${palette.ink}`}>{accent}</span>
              </>
            ) : null}
          </h1>
          {article.excerpt ? (
            <p className="max-w-3xl text-lg leading-relaxed md:text-xl">{article.excerpt}</p>
          ) : null}
          <p className="flex flex-wrap items-center gap-2 text-sm font-medium">
            {section ? (
              <span className="rounded-full bg-primary px-3.5 py-1.5 text-primary-foreground">
                {section.name}
              </span>
            ) : null}
            <span className="rounded-full bg-card/75 px-3.5 py-1.5">
              {ARTICLE_TYPE_LABEL[article.type]}
            </span>
            {citesLearn ? (
              <span className="rounded-full bg-highlight px-3.5 py-1.5 text-highlight-foreground">
                <span aria-hidden="true">✓ </span>Cites Microsoft Learn
              </span>
            ) : null}
            <span className="font-normal">
              {minutes} min read · Updated{" "}
              <time dateTime={article.updatedAt.toISOString()}>
                {DATE_FORMAT.format(article.updatedAt)}
              </time>
            </span>
          </p>
        </div>
        {cover ? (
          <div aria-hidden="true" className="relative hidden h-[240px] place-items-center lg:grid">
            {cover}
            <span className="shape-sphere motion-bob absolute top-0 right-0 h-[70px] w-[70px]" />
          </div>
        ) : null}
      </header>

      {/* Daylight (MVP-031): contents | article, then "Keep learning" below
          as a row of cards -- the approved article design has no third
          column, and a narrow one squeezed the titles. */}
      <div className="mx-auto mt-12 grid max-w-[77.5rem] gap-10 lg:grid-cols-[15rem_minmax(0,46rem)] lg:gap-16">
        <div>
          <ArticleToc items={outline} />
        </div>
        <div className="min-w-0">
          <ArticleBody markdown={article.body} />
        </div>
      </div>

      {related.length > 0 ? (
        <aside aria-labelledby="related_heading" className="mx-auto mt-20 max-w-[77.5rem]">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <h2 id="related_heading" className="text-3xl font-bold md:text-[2.5rem]">
              Keep <span className="accent-word text-accent">learning</span>
            </h2>
            <Link
              href="/learn"
              className="inline-flex min-h-11 items-center border-b-2 border-foreground font-semibold text-foreground no-underline"
            >
              All learning content →
            </Link>
          </div>
          <ArticleList articles={related} headingLevel={3} columns={4} />
        </aside>
      ) : null}

      {jsonLd ? <JsonLd data={jsonLd} /> : null}
      {breadcrumbJsonLd ? <JsonLd data={breadcrumbJsonLd} /> : null}
    </main>
  );
}
