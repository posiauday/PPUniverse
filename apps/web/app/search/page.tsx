import { areaBySlug, technologyInfo, type ArticleSearchHit } from "@ppu/domain-content";
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
import { ARTICLE_TYPE_LABEL } from "../../lib/article-types";
import { buildCatalogUrl } from "../../lib/catalog-url";
import { catalogRepository } from "../../lib/catalog";
import { contentRepository } from "../../lib/content";
import { Highlighted } from "../../lib/search-highlight";
import { SITE_NAME } from "../../lib/seo/site";
import { paletteFor } from "../../lib/technology-palette";

interface SearchPageProps {
  // A repeated parameter arrives as an array (BUG-002); every value is read
  // through firstParam/normalizeQuery.
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

/** The most guides one search lists. The library is small at launch; paging
 * guides arrives with the library outgrowing this. */
const GUIDE_RESULT_LIMIT = 20;

// Rendered per-request (see apps/web/app/page.tsx for why). Search results
// are also intentionally noindex: they're a utility view over content
// that's already indexable at its own canonical URL (/guides/[slug],
// /products/[slug]), not a distinct page worth ranking on its own --
// standard practice for internal site search.
export const dynamic = "force-dynamic";

export function generateMetadata(): Metadata {
  return { title: `Search | ${SITE_NAME}`, robots: { index: false, follow: true } };
}

/**
 * Site search (Daylight look, MVP-031; guides added by the "Board fidelity
 * pass", docs/final-decisions.md, closing open question 63): published
 * guides first, best match first, with the matched words highlighted; then
 * matching components, with their own sort and pages. With no query it lists
 * the components, which is where the header's "Components" link lands.
 */
export default async function SearchPage({ searchParams }: SearchPageProps) {
  const params = await searchParams;
  const query = normalizeQuery(params["q"]);
  const sort = resolveSortOption(firstParam(params["sort"]), Boolean(query));
  const page = parsePage(firstParam(params["page"]));
  const pageSize = parsePageSize(firstParam(params["pageSize"]));
  // A hub's search box sends its area (MVP-037): ?tech=power-automate. An
  // unknown value is ignored, so a bad link still searches everything.
  const area = areaBySlug(firstParam(params["tech"]) ?? "");

  // Guides only on the first page: later pages page through components.
  const [guides, result] = await Promise.all([
    query && page === 1
      ? contentRepository.searchPublishedArticles({
          query,
          limit: GUIDE_RESULT_LIMIT,
          ...(area ? { technology: area.technology } : {}),
        })
      : Promise.resolve([] as ArticleSearchHit[]),
    catalogRepository.searchProducts({ query, sort, page, pageSize }),
  ]);

  logger.info("catalog.search", {
    query,
    sort,
    page,
    area: area?.slug ?? null,
    guideCount: guides.length,
    resultCount: result.items.length,
    total: result.total,
  });

  const currentParams = { q: query, sort, pageSize: firstParam(params["pageSize"]) };
  const nothingFound = Boolean(query) && guides.length === 0 && result.total === 0;

  return (
    <main className="mx-auto max-w-[56.25rem] px-4 pt-6 pb-6 md:px-6 md:pt-10">
      <h1 className="text-5xl leading-none font-extrabold md:text-[4rem]">
        Search <span className="accent-word text-accent">the guides</span>
      </h1>

      <div className="mt-6">
        <SearchForm
          action="/search"
          defaultValue={query}
          label="Search guides and components"
          preserveParams={{ sort, tech: area?.slug }}
        />
      </div>

      {area ? (
        <p className="mt-4 flex flex-wrap items-center gap-x-3 text-sm">
          <span className="rounded-full bg-muted px-3 py-1.5 font-semibold">
            {area.name} guides only
          </span>
          <Link
            href={query ? `/search?q=${encodeURIComponent(query)}` : "/search"}
            className="inline-flex min-h-11 items-center underline underline-offset-4"
          >
            Search all guides
          </Link>
        </p>
      ) : null}

      {query ? (
        <p
          className="mt-6 flex flex-wrap items-center gap-x-3 text-base text-muted-foreground"
          aria-live="polite"
        >
          <span>
            {page === 1 ? (
              <>
                <b className="text-foreground">
                  {guides.length} {guides.length === 1 ? "guide matches" : "guides match"}
                </b>{" "}
                &ldquo;{query}&rdquo;
              </>
            ) : (
              <>Results for &ldquo;{query}&rdquo;</>
            )}
            {result.total > 0 ? (
              <>
                , plus{" "}
                <b className="text-foreground">
                  {result.total} {result.total === 1 ? "component" : "components"}
                </b>
              </>
            ) : null}
          </span>
          <Link
            href="/search"
            className="inline-flex min-h-11 items-center underline underline-offset-4"
          >
            Clear all
          </Link>
        </p>
      ) : null}

      {guides.length > 0 ? (
        <section aria-labelledby="search-guides" className="mt-6">
          <h2 id="search-guides" className="sr-only">
            Guides
          </h2>
          <ul className="overflow-hidden rounded-[1.75rem] border border-border bg-card">
            {guides.map((guide) => (
              <GuideResult key={guide.slug} guide={guide} />
            ))}
          </ul>
        </section>
      ) : null}

      {nothingFound ? (
        <div className="relative mt-8 flex flex-col items-center gap-4 overflow-hidden rounded-[2rem] border-2 border-dashed border-muted-foreground px-6 py-12 text-center">
          <span aria-hidden="true" className="shape-sphere motion-bob h-20 w-20" />
          <p className="font-display text-2xl font-bold">
            Nothing matched &ldquo;{query}&rdquo;. Try a different search term.
          </p>
          <p className="max-w-md text-muted-foreground">
            Or browse{" "}
            <Link
              href="/guides"
              className="font-semibold text-foreground underline underline-offset-4"
            >
              every guide on Learn
            </Link>
            .
          </p>
        </div>
      ) : null}

      {!query && result.items.length === 0 ? (
        <div className="relative mt-8 flex flex-col items-center gap-4 overflow-hidden rounded-[2rem] border-2 border-dashed border-muted-foreground px-6 py-12 text-center">
          <span aria-hidden="true" className="shape-sphere motion-bob h-20 w-20" />
          <p className="font-display text-2xl font-bold">
            Search every guide by topic, formula or error.
          </p>
          <p className="max-w-md text-muted-foreground">
            Or browse{" "}
            <Link
              href="/guides"
              className="font-semibold text-foreground underline underline-offset-4"
            >
              every guide on Learn
            </Link>
            .
          </p>
        </div>
      ) : null}

      {result.items.length > 0 ? (
        <section aria-labelledby="search-components" className="mt-14">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <h2 id="search-components" className="text-3xl font-bold md:text-[2.5rem]">
              {query ? "Components" : "Browse components"}
            </h2>
            <SortLinks
              hrefFor={(nextSort) =>
                buildCatalogUrl("/search", currentParams, { sort: nextSort, page: undefined })
              }
              current={sort}
              includeRelevance={Boolean(query)}
            />
          </div>
          <ul className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
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
          <Pagination
            page={page}
            totalPages={computeTotalPages(result.total, pageSize)}
            hrefFor={(nextPage) =>
              buildCatalogUrl("/search", currentParams, { page: String(nextPage) })
            }
          />
        </section>
      ) : null}
    </main>
  );
}

/** One guide row, as the search board draws it: a tinted tile, the
 * technology and type, the title and a snippet with the matches marked, and
 * an arrow. The whole row is the link's hit area; the link's name is the
 * title alone. */
function GuideResult({ guide }: { guide: ArticleSearchHit }) {
  const palette = paletteFor(guide.technology);
  const technology = guide.technology ? technologyInfo(guide.technology) : null;
  const typeLabel = ARTICLE_TYPE_LABEL[guide.type];
  return (
    <li className="relative flex items-center gap-5 border-b border-border px-5 py-6 last:border-b-0 hover:bg-muted sm:px-7">
      <span
        aria-hidden="true"
        className={`hidden h-16 w-16 shrink-0 place-items-center rounded-[1.125rem] font-display text-2xl font-extrabold sm:grid ${palette.tint} ${palette.ink}`}
      >
        {typeLabel.charAt(0)}
      </span>
      <div className="flex min-w-0 flex-1 flex-col gap-1.5">
        <p className={`text-[0.8125rem] font-semibold ${palette.ink}`}>
          {technology ? `${technology.name} · ` : ""}
          {typeLabel}
        </p>
        <h3 className="font-display text-xl leading-snug font-bold tracking-[-0.01em] md:text-[1.4375rem]">
          <Link
            href={`/guides/${encodeURIComponent(guide.slug)}`}
            className="text-foreground no-underline after:absolute after:inset-0 after:content-[''] hover:underline"
          >
            <Highlighted marked={guide.titleMarked} />
          </Link>
        </h3>
        {guide.snippetMarked ? (
          <p className="text-[0.9375rem] leading-relaxed text-muted-foreground">
            …<Highlighted marked={guide.snippetMarked} />…
          </p>
        ) : null}
      </div>
      <span aria-hidden="true" className="shrink-0 text-xl text-foreground">
        →
      </span>
    </li>
  );
}
