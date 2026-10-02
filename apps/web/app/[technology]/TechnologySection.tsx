import { TECHNOLOGIES, type TechnologyInfo } from "@ppu/domain-content";
import { JsonLd, ProductCard } from "@ppu/ui";
import Link from "next/link";
import { homeUrl, technologySectionUrl } from "../../lib/seo/canonical";
import { buildBreadcrumbJsonLd, buildCollectionPageJsonLd } from "../../lib/seo/json-ld";
import { SITE_NAME } from "../../lib/seo/site";
import { getSiteUrl } from "../../lib/site-url";
import { TECHNOLOGY_PALETTE } from "../../lib/technology-palette";
import {
  SECTION_TABS,
  TECHNOLOGY_BLURB,
  sectionHasContent,
  sectionPath,
  tabCount,
  tabDescription,
  tabInfo,
  tabTitle,
  type SectionContent,
  type SectionCounts,
  type SectionTab,
} from "../../lib/technology-sections";
import { ArticleList } from "../learn/ArticleList";
import { Breadcrumbs } from "../learn/Breadcrumbs";
import { AlsoInSection, FeaturedGuides, featuredFirst } from "./FeaturedGuides";
import { TechnologyHeroVisual } from "./TechnologyHeroVisual";

const TYPE_CHIPS = [
  ["TUTORIAL", "tutorial", "tutorials"],
  ["COMPARISON", "comparison", "comparisons"],
  ["PATTERN", "pattern", "patterns"],
  ["KPI_GUIDE", "KPI guide", "KPI guides"],
] as const;

/**
 * One technology section tab (MVP-028; Daylight look, MVP-031): a tinted
 * header with the section's name, tagline, summary and real guide counts,
 * and the technology's illustration (decorative); then its four tabs as
 * links (each a real page, so a plain navigation list with aria-current, not
 * an ARIA tab widget), the tab's content or an empty state, and links to the
 * other five sections. Structured data only when the tab has content,
 * matching its robots rule (lib/seo/metadata.ts).
 */
export function TechnologySection({
  technology,
  tab,
  content,
  counts,
}: {
  technology: TechnologyInfo;
  tab: SectionTab;
  content: SectionContent;
  counts: SectionCounts;
}) {
  const site = getSiteUrl();
  const hasContent = sectionHasContent(content);
  const path = sectionPath(technology, tab);
  const current = tabInfo(tab);
  const palette = TECHNOLOGY_PALETTE[technology.technology];

  // The visible trail starts at the home page's technologies, as the canvas
  // draws it; the BreadcrumbList JSON-LD below keeps the home page as root.
  const crumbs = [
    { name: "Technologies", href: "/#technologies" },
    ...(tab === "learn"
      ? [{ name: technology.name }]
      : [
          { name: technology.name, href: sectionPath(technology, "learn") },
          { name: current.label },
        ]),
  ];
  const breadcrumbJsonLd = site.ok
    ? buildBreadcrumbJsonLd([
        { name: SITE_NAME, url: homeUrl(site.origin) },
        {
          name: technology.name,
          url: technologySectionUrl(site.origin, sectionPath(technology, "learn")),
        },
        ...(tab === "learn"
          ? []
          : [{ name: current.label, url: technologySectionUrl(site.origin, path) }]),
      ])
    : null;
  const collectionJsonLd =
    site.ok && hasContent
      ? buildCollectionPageJsonLd({
          url: technologySectionUrl(site.origin, path),
          name: tabTitle(technology, tab),
          description: tabDescription(technology, tab),
        })
      : null;

  return (
    <main className="px-4 pb-6 md:px-6">
      <header
        className={`motion-rise relative mx-auto mt-2 max-w-[77.5rem] overflow-hidden rounded-[2.5rem] ${palette.tint}`}
      >
        <div className="relative flex flex-col gap-4 px-6 py-10 md:px-16 md:py-14 lg:min-h-[31.25rem] lg:max-w-[50rem]">
          <Breadcrumbs items={crumbs} />
          <h1
            className={
              tab === "learn"
                ? "text-6xl leading-[0.92] font-extrabold md:text-[6.5rem]"
                : "text-5xl leading-[0.98] font-extrabold md:text-7xl"
            }
          >
            {tab === "learn" ? technology.name : tabTitle(technology, tab)}
          </h1>
          <p className={`accent-word text-3xl leading-tight md:text-[2.125rem] ${palette.ink}`}>
            {palette.tagline}.
          </p>
          <p className="max-w-xl text-lg leading-relaxed">
            {TECHNOLOGY_BLURB[technology.technology]}
          </p>
          {counts.articles > 0 ? (
            <ul
              className="mt-2 flex flex-wrap gap-2 text-sm font-medium lg:mt-auto"
              aria-label="Published guides"
            >
              <li className="rounded-full bg-primary px-3.5 py-1.5 text-primary-foreground">
                {counts.articles} {counts.articles === 1 ? "guide" : "guides"}
              </li>
              {TYPE_CHIPS.map(([type, one, many]) => {
                const count = counts.byType[type] ?? 0;
                return count > 0 ? (
                  <li key={type} className="rounded-full bg-card/70 px-3.5 py-1.5">
                    {count} {count === 1 ? one : many}
                  </li>
                ) : null;
              })}
            </ul>
          ) : null}
        </div>
        <div aria-hidden="true">
          <TechnologyHeroVisual technology={technology.technology} />
        </div>
      </header>

      <div className="mx-auto mt-8 flex max-w-[77.5rem] flex-wrap items-center justify-between gap-x-6 gap-y-2">
        <nav aria-label={`${technology.name} sections`} className="max-w-full overflow-x-auto">
          <ul className="inline-flex gap-1 rounded-full border border-border bg-card p-1.5">
            {SECTION_TABS.map((entry) => {
              const selected = entry.tab === tab;
              const count = tabCount(counts, entry.tab);
              return (
                <li key={entry.tab}>
                  <Link
                    href={sectionPath(technology, entry.tab)}
                    aria-current={selected ? "page" : undefined}
                    className={`inline-flex min-h-11 items-center gap-2 rounded-full px-5 font-semibold whitespace-nowrap no-underline ${
                      selected
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    }`}
                  >
                    {entry.label}
                    {count !== null && count > 0 ? (
                      // Visual only: the link's name stays exactly the tab label.
                      <span
                        aria-hidden="true"
                        className={`rounded-full px-2 text-xs ${selected ? "bg-highlight text-highlight-foreground" : "bg-muted text-foreground"}`}
                      >
                        {count}
                      </span>
                    ) : null}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
        <p className="text-sm text-muted-foreground">{tabDescription(technology, tab)}</p>
      </div>

      <section aria-labelledby="section_content" className="mx-auto mt-6 max-w-[77.5rem]">
        {/* The canvas shows no heading over the tab's content (the selected
            tab says what it is); the outline still needs one. */}
        <h2 id="section_content" className="sr-only">
          {tab === "learn" ? tabTitle(technology, tab) : current.label}
        </h2>

        {!hasContent ? (
          <div className="relative mt-6 overflow-hidden rounded-[1.75rem] border-2 border-dashed border-muted-foreground px-6 py-10 md:px-10">
            <span
              aria-hidden="true"
              className="shape-cube motion-bob absolute top-6 right-6 h-14 w-14 [animation-duration:9s]"
            />
            <p className="font-display text-2xl font-bold">Coming soon.</p>
            <p className="mt-2 max-w-xl text-muted-foreground">
              Nothing is published here yet. Meanwhile, browse{" "}
              <Link href="/learn" className="font-semibold text-foreground underline">
                all learning content
              </Link>{" "}
              or{" "}
              <Link href="/search" className="font-semibold text-foreground underline">
                every component
              </Link>
              .
            </p>
          </div>
        ) : content.kind === "articles" ? (
          <>
            <FeaturedGuides articles={featuredFirst(content.articles).slice(0, 2)} />
            {content.articles.length > 2 ? (
              <ArticleList
                articles={featuredFirst(content.articles).slice(2)}
                headingLevel={3}
                columns={3}
              />
            ) : null}
          </>
        ) : (
          content.groups.map((group) => (
            <section
              key={group.category.id}
              aria-labelledby={`group_${group.category.slug}`}
              className="mt-8"
            >
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <h3 id={`group_${group.category.slug}`} className="font-display text-xl font-bold">
                  {group.category.name}
                </h3>
                {group.total > group.products.length ? (
                  <Link
                    href={`/categories/${encodeURIComponent(group.category.slug)}`}
                    className="inline-flex min-h-11 items-center font-semibold"
                  >
                    All {group.total} in {group.category.name}
                  </Link>
                ) : null}
              </div>
              <ul className="mt-4 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {group.products.map((product) => (
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
          ))
        )}
      </section>

      {tab === "learn" ? <AlsoInSection technology={technology} counts={counts} /> : null}

      <section aria-labelledby="other_sections" className="mx-auto mt-20 max-w-[77.5rem]">
        <h2 id="other_sections" className="text-3xl font-bold md:text-[2.25rem]">
          Other technologies
        </h2>
        <ul className="mt-6 grid grid-cols-2 gap-3.5 md:grid-cols-3 lg:grid-cols-5">
          {TECHNOLOGIES.filter((entry) => entry.slug !== technology.slug).map((entry) => {
            const other = TECHNOLOGY_PALETTE[entry.technology];
            return (
              <li key={entry.slug}>
                <Link
                  href={`/${entry.slug}`}
                  className={`motion-lift flex h-32 flex-col justify-between rounded-[1.375rem] p-5 text-foreground no-underline ${other.tint}`}
                >
                  <span className="font-display text-xl leading-tight font-bold">{entry.name}</span>
                  <span className={`text-[0.8125rem] font-semibold ${other.ink}`}>
                    {other.tagline} →
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </section>

      {collectionJsonLd ? <JsonLd data={collectionJsonLd} /> : null}
      {breadcrumbJsonLd ? <JsonLd data={breadcrumbJsonLd} /> : null}
    </main>
  );
}
