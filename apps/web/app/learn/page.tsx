import { JsonLd } from "@ppu/ui";
import type { Metadata } from "next";
import Link from "next/link";
import { cache } from "react";
import { ARTICLE_TYPE_SECTIONS } from "../../lib/article-types";
import { contentRepository } from "../../lib/content";
import { homeUrl, learnIndexUrl } from "../../lib/seo/canonical";
import { buildBreadcrumbJsonLd, buildCollectionPageJsonLd } from "../../lib/seo/json-ld";
import { buildLearnIndexMetadata } from "../../lib/seo/metadata";
import { LEARN_INDEX_DESCRIPTION, SITE_NAME } from "../../lib/seo/site";
import { getSiteUrl } from "../../lib/site-url";
import { ArticleList } from "./ArticleList";
import { Breadcrumbs } from "./Breadcrumbs";

// See apps/web/app/page.tsx for why content pages render per-request.
export const dynamic = "force-dynamic";

/** How many articles the hub lists. Pagination arrives when the library
 * outgrows it (TD-023). */
const LEARN_INDEX_LIMIT = 500;

const getArticles = cache(() =>
  contentRepository.listPublishedArticleSummaries({ limit: LEARN_INDEX_LIMIT }),
);

export async function generateMetadata(): Promise<Metadata> {
  const articles = await getArticles();
  return buildLearnIndexMetadata({ site: getSiteUrl(), hasArticles: articles.length > 0 });
}

/**
 * The /learn hub (SEO story): every published tutorial, pattern and
 * comparison in one crawlable place, grouped by type. It is the page every
 * article links back to, so no article is ever more than two clicks from the
 * home page. Empty sections are left out; with no articles at all it shows
 * an empty state and stays noindex.
 */
export default async function LearnIndexPage() {
  const articles = await getArticles();
  const site = getSiteUrl();
  const sections = ARTICLE_TYPE_SECTIONS.map((section) => ({
    ...section,
    articles: articles.filter((article) => article.type === section.type),
  })).filter((section) => section.articles.length > 0);

  const collectionJsonLd =
    site.ok && articles.length > 0
      ? buildCollectionPageJsonLd({
          url: learnIndexUrl(site.origin),
          name: "Learn Power Platform",
          description: LEARN_INDEX_DESCRIPTION,
        })
      : null;
  const breadcrumbJsonLd = site.ok
    ? buildBreadcrumbJsonLd([
        { name: SITE_NAME, url: homeUrl(site.origin) },
        { name: "Learn", url: learnIndexUrl(site.origin) },
      ])
    : null;

  return (
    <main className="mx-auto max-w-5xl px-4 py-8">
      <Breadcrumbs items={[{ name: SITE_NAME, href: "/" }, { name: "Learn" }]} />
      <h1 className="mt-2 text-2xl font-semibold">Learn Power Platform</h1>
      <p className="mt-2 text-muted-foreground">{LEARN_INDEX_DESCRIPTION}</p>

      {sections.length === 0 ? (
        <p className="mt-8">
          No articles are published yet.{" "}
          <Link href="/" className="inline-block py-1 underline">
            Browse products by category
          </Link>
        </p>
      ) : (
        sections.map((section) => (
          <section key={section.type} aria-labelledby={`learn-${section.type}`} className="mt-8">
            <h2 id={`learn-${section.type}`} className="text-lg font-semibold">
              {section.heading}
            </h2>
            <ArticleList articles={section.articles} headingLevel={3} />
          </section>
        ))
      )}

      {collectionJsonLd ? <JsonLd data={collectionJsonLd} /> : null}
      {breadcrumbJsonLd ? <JsonLd data={breadcrumbJsonLd} /> : null}
    </main>
  );
}
