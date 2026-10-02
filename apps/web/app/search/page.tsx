import {
  firstParam,
  normalizeQuery,
  parsePage,
  parsePageSize,
  resolveSortOption,
  totalPages as computeTotalPages,
} from "@ppu/domain-catalog";
import { Pagination, ProductCard, SearchForm, SortLinks } from "@ppu/ui";
import { logger } from "@ppu/telemetry";
import type { Metadata } from "next";
import Link from "next/link";
import { buildCatalogUrl } from "../../lib/catalog-url";
import { catalogRepository } from "../../lib/catalog";
import { SITE_NAME } from "../../lib/seo/site";

interface SearchPageProps {
  // A repeated parameter arrives as an array (BUG-002); every value is read
  // through firstParam/normalizeQuery.
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

// Rendered per-request (see apps/web/app/page.tsx for why). Search results
// are also intentionally noindex: they're a utility view over content
// that's already indexable at its own canonical URL (/categories/[slug],
// /products/[slug]), not a distinct page worth ranking on its own —
// standard practice for internal site search.
export const dynamic = "force-dynamic";

export function generateMetadata(): Metadata {
  return { title: `Search | ${SITE_NAME}`, robots: { index: false, follow: true } };
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const params = await searchParams;
  const query = normalizeQuery(params["q"]);
  const sort = resolveSortOption(firstParam(params["sort"]), Boolean(query));
  const page = parsePage(firstParam(params["page"]));
  const pageSize = parsePageSize(firstParam(params["pageSize"]));

  const result = await catalogRepository.searchProducts({ query, sort, page, pageSize });

  logger.info("catalog.search", {
    query,
    sort,
    page,
    resultCount: result.items.length,
    total: result.total,
  });

  const currentParams = { q: query, sort, pageSize: firstParam(params["pageSize"]) };

  return (
    <main className="mx-auto max-w-[56.25rem] px-4 pt-6 pb-6 md:px-6 md:pt-10">
      {/* Daylight (MVP-031). Search covers the product catalog only; whether
          it should also cover guides is open question 63. */}
      <h1 className="text-5xl leading-none font-extrabold md:text-[4rem]">
        Search <span className="accent-word text-accent">components</span>
      </h1>

      <div className="mt-6">
        <SearchForm action="/search" defaultValue={query} preserveParams={{ sort }} />
      </div>

      <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
        {query ? (
          <p
            className="flex flex-wrap items-center gap-x-3 text-base text-muted-foreground"
            aria-live="polite"
          >
            <span>
              <b className="text-foreground">
                {result.total} result{result.total === 1 ? "" : "s"}
              </b>{" "}
              for &ldquo;{query}&rdquo;
            </span>
            <Link
              href="/search"
              className="inline-flex min-h-11 items-center underline underline-offset-4"
            >
              Clear all
            </Link>
          </p>
        ) : (
          <span />
        )}
        <SortLinks
          hrefFor={(nextSort) =>
            buildCatalogUrl("/search", currentParams, { sort: nextSort, page: undefined })
          }
          current={sort}
          includeRelevance={Boolean(query)}
        />
      </div>

      {/* Card titles are h3, so the list needs an h2 above it or the outline jumps from h1 to h3 (BUG-007, WCAG 1.3.1). */}
      {result.items.length > 0 ? <h2 className="sr-only">Search results</h2> : null}
      {result.items.length === 0 ? (
        <div className="relative mt-8 flex flex-col items-center gap-4 overflow-hidden rounded-[2rem] border-2 border-dashed border-muted-foreground px-6 py-12 text-center">
          <span aria-hidden="true" className="shape-sphere motion-bob h-20 w-20" />
          <p className="font-display text-2xl font-bold">
            {query
              ? `No products matched "${query}". Try a different search term.`
              : "Enter a search term to find products."}
          </p>
          <p className="max-w-md text-muted-foreground">
            Looking for a guide instead? Browse{" "}
            <Link
              href="/learn"
              className="font-semibold text-foreground underline underline-offset-4"
            >
              every guide on Learn
            </Link>
            .
          </p>
        </div>
      ) : (
        <ul className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {result.items.map((product) => (
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
      )}

      <Pagination
        page={page}
        totalPages={computeTotalPages(result.total, pageSize)}
        hrefFor={(nextPage) =>
          buildCatalogUrl("/search", currentParams, { page: String(nextPage) })
        }
      />
    </main>
  );
}
