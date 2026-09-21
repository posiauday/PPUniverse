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
import { notFound } from "next/navigation";
import { buildCatalogUrl } from "../../../lib/catalog-url";
import { catalogRepository } from "../../../lib/catalog";

interface CategoryPageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<Record<string, string | undefined>>;
}

// See apps/web/app/page.tsx for why these catalog pages render
// per-request rather than being statically generated at build time.
export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: CategoryPageProps): Promise<Metadata> {
  const { slug } = await params;
  const category = await catalogRepository.findCategoryBySlug(slug);
  if (!category) {
    return { title: "Category not found" };
  }
  return {
    title: `${category.name} | Power Platform Universe`,
    description: category.description ?? `Browse ${category.name} on Power Platform Universe.`,
    // Always points to the base, unfiltered/unsorted/page-1 URL regardless
    // of active query params — consolidates SEO signal onto one canonical
    // page per category instead of diluting it across every
    // sort/search/page combination (docs/04-information-architecture.md
    // "SEO-safe URL structure").
    alternates: { canonical: `/categories/${category.slug}` },
  };
}

export default async function CategoryPage({ params, searchParams }: CategoryPageProps) {
  const { slug } = await params;
  const category = await catalogRepository.findCategoryBySlug(slug);
  if (!category) {
    notFound();
  }

  const rawParams = await searchParams;
  const query = normalizeQuery(rawParams["q"]);
  const sort = resolveSortOption(rawParams["sort"], Boolean(query));
  const page = parsePage(rawParams["page"]);
  const pageSize = parsePageSize(rawParams["pageSize"]);

  const result = await catalogRepository.searchProducts({
    query,
    categorySlug: category.slug,
    sort,
    page,
    pageSize,
  });

  logger.info("catalog.category_browse", {
    categorySlug: category.slug,
    query,
    sort,
    page,
    resultCount: result.items.length,
    total: result.total,
  });

  const basePath = `/categories/${category.slug}`;
  const currentParams = { q: query, sort, pageSize: rawParams["pageSize"] };
  const hasActiveFilter = Boolean(query) || sort !== "recent";

  return (
    <main className="mx-auto max-w-5xl px-4 py-8">
      <h1 className="text-2xl font-semibold">{category.name}</h1>
      {category.description ? (
        <p className="mt-2 text-muted-foreground">{category.description}</p>
      ) : null}

      <div className="mt-4">
        <SearchForm
          action={basePath}
          defaultValue={query}
          label={`Search within ${category.name}`}
          preserveParams={{ sort }}
        />
      </div>

      <div className="mt-4 flex items-center justify-between">
        <SortLinks
          hrefFor={(nextSort) =>
            buildCatalogUrl(basePath, currentParams, { sort: nextSort, page: undefined })
          }
          current={sort}
          includeRelevance={Boolean(query)}
        />
        {hasActiveFilter ? (
          <a href={basePath} className="text-sm text-muted-foreground underline">
            Clear all
          </a>
        ) : null}
      </div>

      {result.items.length === 0 ? (
        <p className="mt-8 text-muted-foreground" aria-live="polite">
          {query
            ? `No products in ${category.name} matched "${query}".`
            : "No products have been published in this category yet. Check back soon."}
        </p>
      ) : (
        <ul className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {result.items.map((product) => (
            <li key={product.id}>
              <ProductCard
                href={`/products/${product.slug}`}
                name={product.name}
                summary={product.summary}
                categoryName={category.name}
              />
            </li>
          ))}
        </ul>
      )}

      <Pagination
        page={page}
        totalPages={computeTotalPages(result.total, pageSize)}
        hrefFor={(nextPage) => buildCatalogUrl(basePath, currentParams, { page: String(nextPage) })}
      />
    </main>
  );
}
