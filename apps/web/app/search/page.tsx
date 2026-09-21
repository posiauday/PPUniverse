import {
  normalizeQuery,
  parsePage,
  parsePageSize,
  resolveSortOption,
  totalPages as computeTotalPages,
} from "@ppu/domain-catalog";
import { Pagination, ProductCard, SearchForm, SortLinks } from "@ppu/ui";
import { logger } from "@ppu/telemetry";
import type { Metadata } from "next";
import { buildCatalogUrl } from "../../lib/catalog-url";
import { catalogRepository } from "../../lib/catalog";

interface SearchPageProps {
  searchParams: Promise<Record<string, string | undefined>>;
}

// Rendered per-request (see apps/web/app/page.tsx for why). Search results
// are also intentionally noindex: they're a utility view over content
// that's already indexable at its own canonical URL (/categories/[slug],
// /products/[slug]), not a distinct page worth ranking on its own —
// standard practice for internal site search.
export const dynamic = "force-dynamic";

export function generateMetadata(): Metadata {
  return { title: "Search | Power Platform Universe", robots: { index: false, follow: true } };
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const params = await searchParams;
  const query = normalizeQuery(params["q"]);
  const sort = resolveSortOption(params["sort"], Boolean(query));
  const page = parsePage(params["page"]);
  const pageSize = parsePageSize(params["pageSize"]);

  const result = await catalogRepository.searchProducts({ query, sort, page, pageSize });

  logger.info("catalog.search", {
    query,
    sort,
    page,
    resultCount: result.items.length,
    total: result.total,
  });

  const currentParams = { q: query, sort, pageSize: params["pageSize"] };

  return (
    <main className="mx-auto max-w-5xl px-4 py-8">
      <h1 className="text-2xl font-semibold">Search</h1>

      <div className="mt-4">
        <SearchForm action="/search" defaultValue={query} preserveParams={{ sort }} />
      </div>

      {query ? (
        <div className="mt-4 flex items-center justify-between">
          <p className="text-sm text-muted-foreground" aria-live="polite">
            {result.total} result{result.total === 1 ? "" : "s"} for &ldquo;{query}&rdquo;
          </p>
          <a href="/search" className="text-sm text-muted-foreground underline">
            Clear all
          </a>
        </div>
      ) : null}

      <div className="mt-4">
        <SortLinks
          hrefFor={(nextSort) =>
            buildCatalogUrl("/search", currentParams, { sort: nextSort, page: undefined })
          }
          current={sort}
          includeRelevance={Boolean(query)}
        />
      </div>

      {result.items.length === 0 ? (
        <p className="mt-8 text-muted-foreground">
          {query
            ? `No products matched "${query}". Try a different search term.`
            : "Enter a search term to find products."}
        </p>
      ) : (
        <ul className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {result.items.map((product) => (
            <li key={product.id}>
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
