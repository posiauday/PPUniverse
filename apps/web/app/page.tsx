import { CategoryCard, JsonLd } from "@ppu/ui";
import type { Metadata } from "next";
import Link from "next/link";
import { formatBuildLabel } from "../lib/build-info";
import { catalogRepository } from "../lib/catalog";
import { contentRepository } from "../lib/content";
import { buildWebSiteJsonLd } from "../lib/seo/json-ld";
import { buildHomeMetadata } from "../lib/seo/metadata";
import { SITE_NAME } from "../lib/seo/site";
import { getSiteUrl } from "../lib/site-url";
import { ArticleList } from "./learn/ArticleList";

/** Newest articles shown on the home page (SEO story). */
const HOME_ARTICLE_LIMIT = 6;

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

export default async function HomePage() {
  const categories = await catalogRepository.listCategories();
  const articles = await contentRepository.listPublishedArticleSummaries({
    limit: HOME_ARTICLE_LIMIT,
  });
  const site = getSiteUrl();

  return (
    <main className="mx-auto max-w-5xl px-4 py-8">
      <h1 className="text-2xl font-semibold">{SITE_NAME}</h1>
      <p className="mt-2 text-muted-foreground">
        A trusted Power Platform ecosystem for reusable assets and technical learning.
      </p>
      <p className="mt-4">
        <Link href="/learn">Learn</Link> &middot; <Link href="/search">Search products</Link>{" "}
        &middot; <Link href="/signin">Sign in</Link>
      </p>

      <h2 className="mt-8 text-lg font-semibold">Browse by category</h2>
      <ul className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
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

      {/* SEO story: the newest articles, one click from the home page, and
          a link to the full /learn hub. Omitted until one is published. */}
      {articles.length > 0 ? (
        <section aria-labelledby="home-learn" className="mt-8">
          <h2 id="home-learn" className="text-lg font-semibold">
            Latest from Learn
          </h2>
          <ArticleList articles={articles} headingLevel={3} />
          <p className="mt-4">
            <Link href="/learn" className="inline-block py-1">
              All tutorials, patterns and comparisons
            </Link>
          </p>
        </section>
      ) : null}

      <p data-testid="build-label" className="sr-only">
        {formatBuildLabel("power-platform-universe", "0.0.0")}
      </p>

      {site.ok ? <JsonLd data={buildWebSiteJsonLd(site.origin)} /> : null}
    </main>
  );
}
