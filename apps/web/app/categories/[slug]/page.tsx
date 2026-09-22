import {
  normalizeQuery,
  parsePage,
  parsePageSize,
  resolveSortOption,
  totalPages as computeTotalPages,
} from "@ppu/domain-catalog";
import { JsonLd, Pagination, ProductCard, SearchForm, SortLinks } from "@ppu/ui";
import { logger } from "@ppu/telemetry";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { buildCatalogUrl } from "../../../lib/catalog-url";
import { getCategory, getCategoryListing, resolveCategorySeo } from "../../../lib/category-listing";
import { categoryUrl } from "../../../lib/seo/canonical";
import { buildCollectionPageJsonLd } from "../../../lib/seo/json-ld";
import { buildCategoryMetadata, buildNotFoundMetadata } from "../../../lib/seo/metadata";
import { getSiteUrl } from "../../../lib/site-url";

interface CategoryPageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<Record<string, string | undefined>>;
}

// See apps/web/app/page.tsx for why these catalog pages render
// per-request rather than being statically generated at build time.
export const dynamic = "force-dynamic";

/**
 * Indexing and canonical policy (MVP-021, FR-017; docs/final-decisions.md, Q29
 * and Q30). This intentionally replaces MVP-004's earlier "canonical is always
 * the base URL" behavior with the product owner's parameter-specific policy: an
 * intentional corrective SEO change owned by MVP-021, not a reopening of
 * MVP-004 — this page's search, sort, pagination and filtering are unchanged.
 * See lib/seo/category-indexing.ts for the rules.
 */
export async function generateMetadata({
  params,
  searchParams,
}: CategoryPageProps): Promise<Metadata> {
  const { slug } = await params;
  const category = await getCategory(slug);
  if (!category) {
    return buildNotFoundMetadata("Category not found");
  }
  const decision = await resolveCategorySeo(category.slug, await searchParams);
  return buildCategoryMetadata({ site: getSiteUrl(), category, decision });
}

export default async function CategoryPage({ params, searchParams }: CategoryPageProps) {
  const { slug } = await params;
  const category = await getCategory(slug);
  if (!category) {
    notFound();
  }

  const rawParams = await searchParams;
  const query = normalizeQuery(rawParams["q"]);
  const sort = resolveSortOption(rawParams["sort"], Boolean(query));
  const page = parsePage(rawParams["page"]);
  const pageSize = parsePageSize(rawParams["pageSize"]);

  const result = await getCategoryListing(category.slug, query, sort, page, pageSize);

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

  // CollectionPage structured data only on the clean, indexable base URL. When
  // the URL has no parameters this reuses the query the page already ran.
  const site = getSiteUrl();
  const isCleanBaseUrl = Object.keys(rawParams).length === 0;
  const seo = site.ok && isCleanBaseUrl ? await resolveCategorySeo(category.slug, rawParams) : null;
  const jsonLd =
    site.ok && seo?.reason === "BASE"
      ? buildCollectionPageJsonLd({
          url: categoryUrl(site.origin, category.slug),
          name: category.name,
          description: category.description,
        })
      : null;

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

      {/* Card titles are h3, so the list needs an h2 above it or the outline jumps from h1 to h3 (BUG-007, WCAG 1.3.1). */}
      {result.items.length > 0 ? <h2 className="sr-only">Products</h2> : null}
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

      {jsonLd ? <JsonLd data={jsonLd} /> : null}
    </main>
  );
}
