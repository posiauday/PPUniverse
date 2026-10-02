import type { Technology } from "@ppu/domain-content";
import { CategoryCard, JsonLd, ProductCard } from "@ppu/ui";
import type { Metadata } from "next";
import Link from "next/link";
import { formatBuildLabel } from "../lib/build-info";
import { catalogRepository } from "../lib/catalog";
import { contentRepository } from "../lib/content";
import { buildWebSiteJsonLd } from "../lib/seo/json-ld";
import { buildHomeMetadata } from "../lib/seo/metadata";
import { getSiteUrl } from "../lib/site-url";
import { HomeHero } from "./HomeHero";
import { BrokenFirst, ClosingBand, StartHereCards, TopicRibbon } from "./home/HomeSections";
import { TechnologyPanels } from "./home/TechnologyPanels";
import { ArticleList } from "./learn/ArticleList";

/** Newest articles shown under "Latest from Learn" (SEO story). */
const HOME_ARTICLE_LIMIT = 6;
/** Newest published products shown on the home page (MVP-027 slice 2). */
const HOME_PRODUCT_LIMIT = 4;
/** Every published summary, for the guide counts; the same ceiling as /learn. */
const HOME_SUMMARY_LIMIT = 500;
/** Titles in the decorative topic ribbon. */
const RIBBON_LIMIT = 8;
/**
 * The three launch guides "Start with the big three" names (docs/final-
 * decisions.md, "Visual redesign: Daylight", implementation decision 3).
 * Each appears only while it is published.
 */
const START_HERE_SLUGS = [
  "power-apps-delegation-500-rows",
  "why-are-my-totals-wrong",
  "approvals-that-dont-stall",
] as const;

// Rendered per-request, not statically at build time: the category list
// changes as the catalog grows, and a build-time snapshot would also
// require a reachable database during `next build` itself (fine in CI,
// where the Postgres service container is available for the whole job,
// but not a dependency a local/CD build should need just to produce
// static assets).
export const dynamic = "force-dynamic";

export function generateMetadata(): Metadata {
  return buildHomeMetadata(getSiteUrl());
}

/**
 * The home page, Daylight layout (MVP-031; docs/final-decisions.md, "Visual
 * redesign: Daylight"): the hero and its animated stage, a ribbon of guide
 * titles, the six technology panels, "the broken version first", the three
 * starter guides, the newest guides, then any components and categories, and
 * a closing call to action. Every count is real, and each data-driven section
 * is left out when it has nothing to show.
 */
export default async function HomePage() {
  const [categories, summaries, products] = await Promise.all([
    catalogRepository.listCategories(),
    contentRepository.listPublishedArticleSummaries({ limit: HOME_SUMMARY_LIMIT }),
    catalogRepository.searchProducts({ sort: "recent", page: 1, pageSize: HOME_PRODUCT_LIMIT }),
  ]);
  const site = getSiteUrl();

  const counts: Partial<Record<Technology, number>> = {};
  for (const summary of summaries) {
    if (summary.technology) counts[summary.technology] = (counts[summary.technology] ?? 0) + 1;
  }
  const startHere = START_HERE_SLUGS.flatMap((slug) =>
    summaries.filter((item) => item.slug === slug),
  );
  const latest = summaries.slice(0, HOME_ARTICLE_LIMIT);

  return (
    <main className="px-4 pb-6 md:px-6">
      <HomeHero guideCount={summaries.length} />

      {summaries.length > 0 ? (
        <TopicRibbon titles={summaries.slice(0, RIBBON_LIMIT).map((item) => item.title)} />
      ) : null}

      {/* MVP-028: the six technology sections. */}
      <section
        id="technologies"
        aria-labelledby="home-technologies"
        className="mx-auto mt-20 max-w-[77.5rem] scroll-mt-28"
      >
        <div className="mb-10 flex flex-wrap items-end justify-between gap-6">
          <h2 id="home-technologies" className="text-5xl leading-none font-bold md:text-[4.25rem]">
            Six technologies.
            <br />
            <span className="accent-word text-accent">One</span> place to get them right.
          </h2>
          <p className="max-w-sm text-[1.0625rem] leading-relaxed text-muted-foreground">
            Each one gets tutorials, architecture patterns and KPI guides, with reusable components
            to follow.
          </p>
        </div>
        <TechnologyPanels counts={counts} />
      </section>

      <BrokenFirst />

      {startHere.length > 0 ? (
        <section aria-labelledby="home-start" className="mx-auto mt-20 max-w-[77.5rem]">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <h2 id="home-start" className="text-4xl font-bold md:text-[3.5rem]">
              {startHere.length === START_HERE_SLUGS.length ? (
                <>
                  Start with the <span className="accent-word text-coral">big</span> three.
                </>
              ) : (
                <>
                  Start <span className="accent-word text-coral">here</span>.
                </>
              )}
            </h2>
            <Link
              href="/learn"
              className="inline-flex min-h-11 items-center border-b-2 border-foreground font-semibold text-foreground no-underline"
            >
              All {summaries.length} guides →
            </Link>
          </div>
          <StartHereCards articles={startHere} />
        </section>
      ) : null}

      {/* SEO story: the newest articles, one click from the home page, and
          a link to the full /learn hub. Omitted until one is published. */}
      {latest.length > 0 ? (
        <section aria-labelledby="home-learn" className="mx-auto mt-20 max-w-[77.5rem]">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <h2 id="home-learn" className="text-4xl font-bold md:text-[3.5rem]">
              Fresh from <span className="accent-word text-accent">Learn</span>.
            </h2>
            <Link
              href="/learn"
              className="inline-flex min-h-11 items-center border-b-2 border-foreground font-semibold text-foreground no-underline"
            >
              All guides →
            </Link>
          </div>
          <ArticleList articles={latest} headingLevel={3} />
        </section>
      ) : null}

      {products.items.length > 0 ? (
        <section aria-labelledby="home-components" className="mx-auto mt-20 max-w-[77.5rem]">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <h2 id="home-components" className="text-4xl font-bold md:text-[3.5rem]">
              New <span className="accent-word text-accent">components</span> and templates.
            </h2>
            <Link
              href="/search"
              className="inline-flex min-h-11 items-center border-b-2 border-foreground font-semibold text-foreground no-underline"
            >
              See all
            </Link>
          </div>
          <ul className="mt-9 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {products.items.map((product) => (
              <li key={product.id} className="motion-lift rounded-card">
                <ProductCard
                  href={`/products/${product.slug}`}
                  name={product.name}
                  summary={product.summary}
                  categoryName={product.category.name}
                />
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {categories.length > 0 ? (
        <section aria-labelledby="home-categories" className="mx-auto mt-20 max-w-[77.5rem]">
          <h2 id="home-categories" className="text-4xl font-bold md:text-[3.5rem]">
            Browse by <span className="accent-word text-coral">category</span>.
          </h2>
          <ul className="mt-9 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {categories.map((category) => (
              <li key={category.id}>
                <CategoryCard
                  href={`/categories/${category.slug}`}
                  name={category.name}
                  description={category.description ?? undefined}
                />
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <ClosingBand />

      <p data-testid="build-label" className="sr-only">
        {formatBuildLabel("power-platform-universe", "0.0.0")}
      </p>

      {site.ok ? <JsonLd data={buildWebSiteJsonLd(site.origin)} /> : null}
    </main>
  );
}
