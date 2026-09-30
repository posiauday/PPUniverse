import type { TechnologyInfo } from "@ppu/domain-content";
import { JsonLd, ProductCard } from "@ppu/ui";
import Link from "next/link";
import { homeUrl, technologySectionUrl } from "../../lib/seo/canonical";
import { buildBreadcrumbJsonLd, buildCollectionPageJsonLd } from "../../lib/seo/json-ld";
import { SITE_NAME } from "../../lib/seo/site";
import { getSiteUrl } from "../../lib/site-url";
import {
  SECTION_TABS,
  TECHNOLOGY_BLURB,
  sectionHasContent,
  sectionPath,
  tabDescription,
  tabInfo,
  tabTitle,
  type SectionContent,
  type SectionTab,
} from "../../lib/technology-sections";
import { ArticleList } from "../learn/ArticleList";
import { Breadcrumbs } from "../learn/Breadcrumbs";

/**
 * One technology section tab (MVP-028): the section's title and summary, its
 * four tabs as links (each a real page, so a plain navigation list with
 * aria-current, not an ARIA tab widget), then the tab's content or an empty
 * state. Structured data only when the tab has content, matching its
 * robots rule (lib/seo/metadata.ts, buildTechnologySectionMetadata).
 */
export function TechnologySection({
  technology,
  tab,
  content,
}: {
  technology: TechnologyInfo;
  tab: SectionTab;
  content: SectionContent;
}) {
  const site = getSiteUrl();
  const hasContent = sectionHasContent(content);
  const path = sectionPath(technology, tab);
  const current = tabInfo(tab);

  const crumbs = [
    { name: SITE_NAME, href: "/" },
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
    <main className="mx-auto max-w-6xl px-4 py-8">
      <Breadcrumbs items={crumbs} />
      <header className="mt-6 max-w-3xl">
        <p className="font-mono text-sm font-medium text-primary">
          {technology.name.toLowerCase()}
        </p>
        <h1 className="mt-2 text-4xl leading-tight font-semibold tracking-tight">
          {tab === "learn" ? technology.name : tabTitle(technology, tab)}
        </h1>
        <p className="mt-3 text-lg leading-relaxed text-muted-foreground">
          {TECHNOLOGY_BLURB[technology.technology]}
        </p>
      </header>

      <nav aria-label={`${technology.name} sections`} className="mt-8 border-b border-border">
        <ul className="-mb-px flex flex-wrap gap-x-1">
          {SECTION_TABS.map((entry) => {
            const selected = entry.tab === tab;
            return (
              <li key={entry.tab}>
                <Link
                  href={sectionPath(technology, entry.tab)}
                  aria-current={selected ? "page" : undefined}
                  className={`inline-flex min-h-11 items-center border-b-2 px-4 font-semibold no-underline ${
                    selected
                      ? "border-primary text-foreground"
                      : "border-transparent text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {entry.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <section aria-labelledby="section_content" className="mt-8">
        <h2 id="section_content" className="text-2xl font-semibold">
          {tab === "learn" ? tabTitle(technology, tab) : current.label}
        </h2>
        <p className="mt-2 text-muted-foreground">{tabDescription(technology, tab)}</p>

        {!hasContent ? (
          <div className="mt-6 rounded-xl border border-dashed border-muted-foreground p-6">
            <p className="font-semibold">Coming soon.</p>
            <p className="mt-1 text-muted-foreground">
              Nothing is published here yet. Meanwhile, browse{" "}
              <Link href="/learn" className="underline">
                all learning content
              </Link>{" "}
              or{" "}
              <Link href="/search" className="underline">
                every component
              </Link>
              .
            </p>
          </div>
        ) : content.kind === "articles" ? (
          <ArticleList articles={content.articles} headingLevel={3} />
        ) : (
          content.groups.map((group) => (
            <section
              key={group.category.id}
              aria-labelledby={`group_${group.category.slug}`}
              className="mt-8"
            >
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <h3 id={`group_${group.category.slug}`} className="text-lg font-semibold">
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

      {collectionJsonLd ? <JsonLd data={collectionJsonLd} /> : null}
      {breadcrumbJsonLd ? <JsonLd data={breadcrumbJsonLd} /> : null}
    </main>
  );
}
