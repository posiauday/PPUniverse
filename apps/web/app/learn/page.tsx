import { JsonLd } from "@ppu/ui";
import type { Metadata } from "next";
import Link from "next/link";
import { cache } from "react";
import { ARTICLE_TYPE_SECTIONS, SECTION_ANCHOR } from "../../lib/article-types";
import { contentRepository } from "../../lib/content";
import { homeUrl, learnIndexUrl } from "../../lib/seo/canonical";
import { buildBreadcrumbJsonLd, buildCollectionPageJsonLd } from "../../lib/seo/json-ld";
import { buildLearnIndexMetadata } from "../../lib/seo/metadata";
import { LEARN_INDEX_DESCRIPTION, SITE_NAME } from "../../lib/seo/site";
import { getSiteUrl } from "../../lib/site-url";
import { TechnologyTiles } from "../TechnologyTiles";
import { ArticleList } from "./ArticleList";

// See apps/web/app/page.tsx for why content pages render per-request.
export const dynamic = "force-dynamic";

/** How many articles the hub lists. Pagination arrives when the library
 * outgrows it (TD-023). */
const LEARN_INDEX_LIMIT = 500;

/** A line under each goal heading (Daylight, MVP-031). Since the headings
 * became goals (MVP-033), it names the kind of guide underneath. */
const SECTION_LINE: Readonly<Record<string, string>> = {
  TUTORIAL: "Step-by-step tutorials for the problem in front of you.",
  COMPARISON: "Comparisons that help you pick before you build.",
  PATTERN: "Patterns: structures that hold up as things grow.",
  KPI_GUIDE: "KPI guides for checking whether it's working.",
};

const getArticles = cache(() =>
  contentRepository.listPublishedArticleSummaries({ limit: LEARN_INDEX_LIMIT }),
);

export async function generateMetadata(): Promise<Metadata> {
  const articles = await getArticles();
  return buildLearnIndexMetadata({ site: getSiteUrl(), hasArticles: articles.length > 0 });
}

/**
 * The /learn hub (SEO story; Daylight look, MVP-031): every published
 * tutorial, pattern, comparison and KPI guide in one crawlable place, grouped
 * by type under a lime header with links straight to each technology. It is
 * the page every article links back to, so no article is ever more than two
 * clicks from the home page. Empty sections are left out; with no articles at
 * all it shows an empty state and stays noindex.
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
    <main className="px-4 pb-6 md:px-6">
      <header className="motion-rise relative mx-auto mt-2 max-w-[77.5rem] overflow-hidden rounded-[2.5rem] bg-highlight px-6 py-12 text-highlight-foreground md:px-16 md:py-16">
        <div aria-hidden="true">
          <span className="shape-sphere motion-bob absolute top-12 right-24 hidden h-[110px] w-[110px] md:block" />
          <span className="shape-pill-coral motion-bob-alt absolute top-[250px] right-48 hidden h-[54px] w-[150px] lg:block" />
          <span className="shape-cube motion-bob absolute right-16 bottom-14 hidden h-[72px] w-[72px] [animation-duration:9s] md:block" />
        </div>
        <div className="relative flex max-w-3xl flex-col gap-4">
          {/* The canvas draws no visible breadcrumb here: /learn is one level
              down, and the BreadcrumbList JSON-LD below still describes it. */}
          <p className="font-mono text-xs tracking-widest uppercase">
            Learn{articles.length > 0 ? ` · ${articles.length} guides` : ""}
          </p>
          <h1 className="text-5xl leading-[0.98] font-extrabold md:text-[5.25rem]">
            Every guide, <span className="accent-word">in one place.</span>
          </h1>
          <p className="max-w-xl text-lg leading-relaxed">{LEARN_INDEX_DESCRIPTION}</p>
        </div>
        {/* MVP-028: straight to one technology. */}
        <nav aria-label="Technologies" className="relative mt-8">
          <TechnologyTiles />
        </nav>
      </header>

      {sections.length === 0 ? (
        <p className="mx-auto mt-10 max-w-[77.5rem] text-lg">
          No articles are published yet.{" "}
          <Link href="/" className="inline-block py-1 font-semibold underline">
            Browse products by category
          </Link>
        </p>
      ) : (
        sections.map((section) => (
          <section
            key={section.type}
            id={SECTION_ANCHOR[section.type]}
            aria-labelledby={`learn-${section.type}`}
            className="mx-auto mt-16 max-w-[77.5rem] scroll-mt-28"
          >
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
              <h2 id={`learn-${section.type}`} className="text-4xl font-bold md:text-[2.75rem]">
                {section.heading}
              </h2>
              <span className="rounded-full bg-primary px-3 py-0.5 text-sm font-semibold text-primary-foreground">
                {section.articles.length}
              </span>
              <span className="accent-word text-2xl text-muted-foreground">
                {SECTION_LINE[section.type]}
              </span>
            </div>
            <ArticleList
              articles={section.articles}
              headingLevel={3}
              columns={section.articles.length % 4 === 0 || section.articles.length === 7 ? 4 : 3}
              showType={false}
              showDate={false}
            />
          </section>
        ))
      )}

      {collectionJsonLd ? <JsonLd data={collectionJsonLd} /> : null}
      {breadcrumbJsonLd ? <JsonLd data={breadcrumbJsonLd} /> : null}
    </main>
  );
}
