import {
  parsePageSize,
  resolveSortOption,
  type SearchResult,
  type SortOption,
} from "@ppu/domain-catalog";
import { cache } from "react";
import { catalogRepository } from "./catalog";
import {
  isCategoryVariant,
  resolveCategoryIndexing,
  type CategoryIndexingDecision,
  type RawSearchParams,
} from "./seo/category-indexing";

/**
 * Request-scoped data access for the category page. `generateMetadata` and the
 * page render in the same request and need the same rows; React's `cache()`
 * shares one query between them. The arguments are primitives so equal calls
 * hit the cache.
 */
export const getCategory = cache((slug: string) => catalogRepository.findCategoryBySlug(slug));

export const getCategoryListing = cache(
  (
    slug: string,
    query: string | undefined,
    sort: SortOption,
    page: number,
    pageSize: number,
  ): Promise<SearchResult> =>
    catalogRepository.searchProducts({ query, categorySlug: slug, sort, page, pageSize }),
);

/**
 * The indexing/canonical decision for a category URL (see lib/seo/category-indexing.ts).
 *
 * "Empty" is decided from the category's PUBLISHED total, read from the
 * unfiltered first-page listing — which for the base URL is exactly the query
 * the page itself runs, so it costs nothing extra. A variant URL (search, sort,
 * filter, or any extra parameter) is never indexable, so no query is made for it.
 */
export async function resolveCategorySeo(
  slug: string,
  searchParams: RawSearchParams,
): Promise<CategoryIndexingDecision> {
  if (isCategoryVariant(searchParams)) {
    return resolveCategoryIndexing({ searchParams, total: 0 });
  }
  const firstPage = await getCategoryListing(
    slug,
    undefined,
    resolveSortOption(undefined, false),
    1,
    parsePageSize(undefined),
  );
  return resolveCategoryIndexing({ searchParams, total: firstPage.total });
}
