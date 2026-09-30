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
import {
  homeUrl,
  learnIndexUrl,
  learnUrl,
  technologySectionUrl,
} from "../../../lib/seo/canonical";
import { buildArticleJsonLd, buildBreadcrumbJsonLd } from "../../../lib/seo/json-ld";
import { buildLearnMetadata, buildNotFoundMetadata } from "../../../lib/seo/metadata";
import { SITE_NAME } from "../../../lib/seo/site";
import { getSiteUrl } from "../../../lib/site-url";
import { ArticleBody } from "../ArticleBody";
import { ArticleToc } from "../ArticleToc";
import { Breadcrumbs } from "../Breadcrumbs";

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

  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      <Breadcrumbs
        items={[
          { name: SITE_NAME, href: "/" },
          { name: parent.name, href: parent.path },
          { name: article.title },
        ]}
      />
      <header className="mt-6 max-w-3xl">
        <p className="flex flex-wrap items-center gap-x-2 text-sm text-muted-foreground">
          <span className="font-mono font-medium text-primary">
            {ARTICLE_TYPE_LABEL[article.type].toLowerCase()}
          </span>
          <span aria-hidden="true">·</span>
          <span>{minutes} min read</span>
          <span aria-hidden="true">·</span>
          <span>
            Updated{" "}
            <time dateTime={article.updatedAt.toISOString()}>
              {DATE_FORMAT.format(article.updatedAt)}
            </time>
          </span>
        </p>
        <h1 className="mt-3 text-4xl leading-tight font-semibold tracking-tight">
          {article.title}
        </h1>
        {article.excerpt ? (
          <p className="mt-4 text-lg leading-relaxed text-muted-foreground">{article.excerpt}</p>
        ) : null}
      </header>

      <div className="mt-8 grid gap-8 lg:grid-cols-[13rem_minmax(0,1fr)] xl:grid-cols-[13rem_minmax(0,1fr)_15rem]">
        <div className="lg:row-span-2 xl:row-span-1">
          <ArticleToc items={outline} />
        </div>
        <div className="max-w-3xl min-w-0">
          <ArticleBody markdown={article.body} />
        </div>
        {related.length > 0 ? (
          <aside aria-labelledby="related_heading" className="self-start xl:sticky xl:top-6">
            <div className="rounded-xl border border-border bg-card p-4">
              <h2
                id="related_heading"
                className="font-mono text-xs font-medium tracking-wide text-muted-foreground uppercase"
              >
                Keep learning
              </h2>
              <ul className="mt-2 space-y-1">
                {related.map((item) => (
                  <li key={item.slug}>
                    <Link
                      href={`/learn/${encodeURIComponent(item.slug)}`}
                      className="inline-flex min-h-8 flex-col py-1 font-semibold text-primary no-underline hover:underline"
                    >
                      {item.title}
                      <span className="text-xs font-normal text-muted-foreground">
                        {ARTICLE_TYPE_LABEL[item.type]}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
              <Link
                href="/learn"
                className="mt-3 inline-flex min-h-8 items-center text-sm font-semibold"
              >
                All learning content
              </Link>
            </div>
          </aside>
        ) : null}
      </div>

      {jsonLd ? <JsonLd data={jsonLd} /> : null}
      {breadcrumbJsonLd ? <JsonLd data={breadcrumbJsonLd} /> : null}
    </main>
  );
}
