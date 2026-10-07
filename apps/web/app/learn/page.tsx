import { areaBySlug } from "@ppu/domain-content";
import { JsonLd } from "@ppu/ui";
import type { Metadata } from "next";
import Link from "next/link";
import { cache } from "react";
import { ARTICLE_TYPE_SECTIONS, SECTION_ANCHOR } from "../../lib/article-types";
import { contentRepository } from "../../lib/content";
import { withGuidesFeed } from "../../lib/guides-feed";
import { homeUrl, learnIndexUrl } from "../../lib/seo/canonical";
import { buildBreadcrumbJsonLd, buildCollectionPageJsonLd } from "../../lib/seo/json-ld";
import { buildLearnIndexMetadata } from "../../lib/seo/metadata";
import { LEARN_INDEX_DESCRIPTION, SITE_NAME } from "../../lib/seo/site";
import { getSiteUrl } from "../../lib/site-url";
import { ALL_AREAS } from "../[technology]/OtherAreas";
import { ArticleList } from "./ArticleList";

// See apps/web/app/page.tsx for why content pages render per-request.
export const dynamic = "force-dynamic";

/** How many articles the hub lists. Pagination arrives when the library
 * outgrows it (TD-023). */
const LEARN_INDEX_LIMIT = 500;

/** The line under each goal heading, as the approved "Guides hub by goal"
 * board words it (MVP-033; TD-026). */
const SECTION_LINE: Readonly<Record<string, string>> = {
  TUTORIAL: "The error or symptom in front of you, and the fix.",
  COMPARISON: "Decide before you build.",
  PATTERN: "Structures that hold up as things grow.",
  KPI_GUIDE: "Know whether it's working.",
  REFERENCE: "Error codes, limits and cheat sheets to keep open.",
};

/** Each goal's marker colour on the board: coral, violet, teal, amber. Written
 * out in full so Tailwind finds the classes. */
const GOAL_DOT: Readonly<Record<string, string>> = {
  TUTORIAL: "bg-coral",
  COMPARISON: "bg-accent",
  PATTERN: "bg-tech-copilot-ink",
  KPI_GUIDE: "bg-tech-bi-ink",
  REFERENCE: "bg-tech-automate-ink",
};

/** The technology filter's value, from `?technology=<slug>`: a technology,
 * Governance & admin (any area), or null (every guide) for anything else. */
function filterFrom(value: string | string[] | undefined) {
  const slug = typeof value === "string" ? value : undefined;
  if (!slug) return null;
  const entry = areaBySlug(slug);
  return entry ? { slug, name: entry.name, technology: entry.technology } : null;
}

const CHIP = "inline-flex min-h-11 items-center rounded-full px-4 font-semibold no-underline";

const getArticles = cache(() =>
  contentRepository.listPublishedArticleSummaries({ limit: LEARN_INDEX_LIMIT }),
);

export async function generateMetadata(): Promise<Metadata> {
  const articles = await getArticles();
  const site = getSiteUrl();
  return withGuidesFeed(buildLearnIndexMetadata({ site, hasArticles: articles.length > 0 }), site);
}

/**
 * The /learn hub (SEO story; Daylight look, MVP-031): every published
 * tutorial, pattern, comparison and KPI guide in one crawlable place, grouped
 * by type under a lime header with links straight to each technology. It is
 * the page every article links back to, so no article is ever more than two
 * clicks from the home page. Empty sections are left out; with no articles at
 * all it shows an empty state and stays noindex.
 */
export default async function LearnIndexPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
} = {}) {
  const articles = await getArticles();
  const site = getSiteUrl();
  const filter = filterFrom((await searchParams)?.["technology"]);
  const shown = filter
    ? articles.filter((article) => article.technology === filter.technology)
    : articles;
  const sections = ARTICLE_TYPE_SECTIONS.map((section) => ({
    ...section,
    articles: shown.filter((article) => article.type === section.type),
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
          <span className="shape-pill-coral motion-bob-alt absolute top-[250px] right-48 hidden h-[54px] w-[150px] xl:block" />
        </div>
        <div className="relative flex max-w-3xl flex-col gap-4">
          {/* The canvas draws no visible breadcrumb here: /learn is one level
              down, and the BreadcrumbList JSON-LD below still describes it. */}
          <p className="font-mono text-xs tracking-widest uppercase">
            Guides{articles.length > 0 ? ` · ${articles.length}` : ""}
          </p>
          <h1 className="text-5xl leading-[0.98] font-extrabold md:text-[5.25rem]">
            What are you <span className="accent-word">trying to do?</span>
          </h1>
          {/* MVP-033 (TD-026): problem first. Searches every guide. */}
          <form
            action="/search"
            method="GET"
            role="search"
            className="mt-3 flex max-w-[47.5rem] items-center rounded-full border-2 border-foreground bg-card p-1.5 pl-6 shadow-[0_5px_0_var(--color-foreground)]"
          >
            <label htmlFor="learn-search" className="sr-only">
              Search guides
            </label>
            <input
              id="learn-search"
              type="search"
              name="q"
              placeholder="Paste an error, or describe the problem…"
              className="min-w-0 flex-1 bg-transparent text-lg text-foreground placeholder:text-muted-foreground"
            />
            <button
              type="submit"
              className="min-h-11 rounded-full bg-primary px-6 font-semibold text-primary-foreground"
            >
              Search
            </button>
          </form>
        </div>
        {sections.length > 0 ? (
          <nav aria-label="Goals" className="relative mt-6">
            <ul className="flex flex-wrap gap-2.5 text-[0.9375rem]">
              {sections.map((section) => (
                <li key={section.type}>
                  <Link
                    href={`#${SECTION_ANCHOR[section.type]}`}
                    className={`${CHIP} gap-2 bg-card text-foreground hover:bg-muted`}
                  >
                    <span
                      aria-hidden="true"
                      className={`h-2.5 w-2.5 rounded-full ${GOAL_DOT[section.type]}`}
                    />
                    {section.heading}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        ) : null}
        {/* MVP-033 (TD-026): narrow the guides to one area. Plain links, so it
            works without scripts; each filtered view keeps /learn as its canonical. */}
        <nav aria-label="Filter by technology" className="relative mt-3.5">
          <ul className="flex flex-wrap gap-2 text-sm">
            {[{ name: "All technologies", slug: null as string | null }, ...ALL_AREAS].map(
              (area) => {
                const current = (filter?.slug ?? null) === area.slug;
                return (
                  <li key={area.slug ?? "all"}>
                    <Link
                      href={area.slug ? `/learn?technology=${area.slug}` : "/learn"}
                      aria-current={current ? "page" : undefined}
                      className={`${CHIP} min-h-11 font-medium ${
                        current
                          ? "bg-primary text-primary-foreground"
                          : "bg-card/75 text-foreground hover:bg-card"
                      }`}
                    >
                      {area.name}
                    </Link>
                  </li>
                );
              },
            )}
          </ul>
        </nav>
      </header>

      {sections.length === 0 ? (
        filter ? (
          <p className="mx-auto mt-10 max-w-[77.5rem] text-lg">
            No {filter.name} guides are published yet.{" "}
            <Link href={`/${filter.slug}`} className="inline-block py-1 font-semibold underline">
              See what&apos;s coming in {filter.name}
            </Link>
          </p>
        ) : (
          <p className="mx-auto mt-10 max-w-[77.5rem] text-lg">
            No articles are published yet.{" "}
            <Link href="/" className="inline-block py-1 font-semibold underline">
              Browse products by category
            </Link>
          </p>
        )
      ) : (
        sections.map((section) => (
          <section
            key={section.type}
            id={SECTION_ANCHOR[section.type]}
            aria-labelledby={`learn-${section.type}`}
            className="mx-auto mt-16 max-w-[77.5rem] scroll-mt-28"
          >
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
              <span
                aria-hidden="true"
                className={`h-3.5 w-3.5 rounded-full ${GOAL_DOT[section.type]}`}
              />
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
