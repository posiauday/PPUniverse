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
import { TechnologyTiles } from "./TechnologyTiles";
import { ArticleList } from "./learn/ArticleList";

/** Newest articles shown on the home page (SEO story). */
const HOME_ARTICLE_LIMIT = 6;
/** Newest published products shown under the hero (MVP-027 slice 2). */
const HOME_PRODUCT_LIMIT = 4;

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
 * The home page, Premium 3 layout (MVP-027 slice 2; docs/final-decisions.md,
 * "Home page design: Premium 3"): the hero, then the newest components, the
 * newest learning content and every category. Each section is left out when
 * it has nothing to show, rather than rendering an empty heading. The site
 * header already carries Learn, Components and Sign in, so the page no
 * longer repeats them.
 */
export default async function HomePage() {
  const [categories, articles, products] = await Promise.all([
    catalogRepository.listCategories(),
    contentRepository.listPublishedArticleSummaries({ limit: HOME_ARTICLE_LIMIT }),
    catalogRepository.searchProducts({ sort: "recent", page: 1, pageSize: HOME_PRODUCT_LIMIT }),
  ]);
  const site = getSiteUrl();

  return (
    <main className="mx-auto max-w-6xl px-4 py-10 lg:py-14">
      <HomeHero />

      {/* MVP-028: the six technology sections. */}
      <section aria-labelledby="home-technologies" className="mt-14">
        <h2 id="home-technologies" className="text-2xl font-semibold">
          Explore by technology
        </h2>
        <TechnologyTiles variant="tiles" />
      </section>

      {products.items.length > 0 ? (
        <section aria-labelledby="home-components" className="mt-14">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h2 id="home-components" className="text-2xl font-semibold">
              New components and templates
            </h2>
            <Link href="/search" className="inline-flex min-h-11 items-center font-semibold">
              See all
            </Link>
          </div>
          <ul className="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
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

      {/* SEO story: the newest articles, one click from the home page, and
          a link to the full /learn hub. Omitted until one is published. */}
      {articles.length > 0 ? (
        <section aria-labelledby="home-learn" className="mt-14">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h2 id="home-learn" className="text-2xl font-semibold">
              Latest from Learn
            </h2>
            <Link href="/learn" className="inline-flex min-h-11 items-center font-semibold">
              All tutorials, patterns and comparisons
            </Link>
          </div>
          <ArticleList articles={articles} headingLevel={3} />
        </section>
      ) : null}

      {categories.length > 0 ? (
        <section aria-labelledby="home-categories" className="mt-14">
          <h2 id="home-categories" className="text-2xl font-semibold">
            Browse by category
          </h2>
          <ul className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
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

      <p data-testid="build-label" className="sr-only">
        {formatBuildLabel("power-platform-universe", "0.0.0")}
      </p>

      {site.ok ? <JsonLd data={buildWebSiteJsonLd(site.origin)} /> : null}
    </main>
  );
}
