import { COMPONENT_CATEGORIES } from "@ppu/domain-content";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { componentRepository } from "../../lib/components";
import { componentsLibraryOn } from "../../lib/site-switches";
import { buildComponentsIndexMetadata, buildNotFoundMetadata } from "../../lib/seo/metadata";
import { getSiteUrl } from "../../lib/site-url";
import { ComingSoonBadge, TeaserArt } from "./ComingSoonComponent";
import { ComponentArt } from "./ComponentArt";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  if (!(await componentsLibraryOn())) return buildNotFoundMetadata("Page not found");
  const components = await componentRepository.listPublic();
  return buildComponentsIndexMetadata({ site: getSiteUrl(), hasComponents: components.length > 0 });
}

/** The first sentence of a summary: the card's one-line tagline (the page has the rest). */
function tagline(summary: string): string {
  const match = summary.match(/^.+?[.!?](?=\s|$)/);
  return match ? match[0] : summary;
}

/**
 * The Power Apps component library (MVP-049; docs/final-decisions.md,
 * 2026-10-08, "One live view"; redesigned 2026-10-09, "Component library page:
 * one grid"): every published, visible component in one grid, filtered by
 * category with ?category=, each card with a picture of the component, its
 * category, its name, one line about it and whether copying needs a (free)
 * account; then any marked Coming soon, with a blurred picture
 * (docs/final-decisions.md, 2026-10-09). The property counts are on each
 * component's page. A 404 while the component library is switched off
 * (/admin/settings).
 */
export default async function ComponentsPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string | string[] }>;
}) {
  if (!(await componentsLibraryOn())) notFound();
  const [components, teasers, params] = await Promise.all([
    componentRepository.listPublic(),
    componentRepository.listComingSoon(),
    searchParams,
  ]);
  const categories = COMPONENT_CATEGORIES.map((category) => ({
    ...category,
    count:
      components.filter((component) => component.category === category.id).length +
      teasers.filter((teaser) => teaser.category === category.id).length,
  })).filter((category) => category.count > 0);
  const requested = typeof params.category === "string" ? params.category : null;
  const active = categories.find((category) => category.id === requested)?.id ?? null;
  const shown = components.filter((component) => !active || component.category === active);
  const shownSoon = teasers.filter((teaser) => !active || teaser.category === active);
  const tested = components.filter((component) => component.testedAt).length;
  const categoryName = (id: string) =>
    COMPONENT_CATEGORIES.find((category) => category.id === id)?.name ?? "";
  const filters = [
    { id: null as string | null, name: "All", count: components.length + teasers.length },
    ...categories,
  ];

  return (
    <main className="mx-auto max-w-[76rem] px-4 py-10 md:px-6">
      <section className="relative overflow-hidden rounded-[2rem] bg-stage px-6 py-10 md:px-12 md:py-12">
        <span
          aria-hidden="true"
          className="motion-drift pointer-events-none absolute -top-28 -right-20 size-80 rounded-full bg-tech-apps opacity-80 blur-3xl"
        />
        <span
          aria-hidden="true"
          className="motion-drift-alt pointer-events-none absolute -bottom-32 left-1/4 size-80 rounded-full bg-tech-dataverse opacity-70 blur-3xl"
        />
        <div className="relative">
          <p className="font-mono text-xs font-medium tracking-widest text-muted-foreground uppercase">
            Power Apps component library
          </p>
          <h1 className="motion-rise mt-3 max-w-[48rem] font-display text-4xl font-bold md:text-6xl">
            Components you can try, then{" "}
            <span className="font-serif font-normal italic">paste</span>
          </h1>
          <p className="mt-4 max-w-[40rem] text-lg">
            Try each one live on its page, exactly as it behaves in Power Apps. Then copy its YAML
            and paste it into Studio.
          </p>
          <ul className="mt-6 flex flex-wrap gap-2 text-sm font-semibold">
            {[
              `${components.length} ${components.length === 1 ? "component" : "components"}`,
              ...(tested > 0 ? [`${tested} tested in Power Apps Studio`] : []),
              ...(teasers.length > 0 ? [`${teasers.length} coming soon`] : []),
              "No premium licence",
            ].map((fact) => (
              <li key={fact} className="flex items-center gap-1.5 rounded-full bg-card px-3 py-1.5">
                <svg
                  viewBox="0 0 24 24"
                  className="size-4 text-tech-dataverse-ink"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="M5 12l5 5L20 7" />
                </svg>
                {fact}
              </li>
            ))}
          </ul>
        </div>
      </section>

      {categories.length > 1 ? (
        <nav aria-label="Filter by category" className="mt-8">
          <ul className="flex flex-wrap gap-2">
            {filters.map((category) => {
              const current = category.id === active;
              return (
                <li key={category.id ?? "all"}>
                  <Link
                    href={category.id ? `/components?category=${category.id}` : "/components"}
                    aria-current={current ? "page" : undefined}
                    scroll={false}
                    className={`inline-flex min-h-11 items-center gap-2 rounded-full border px-4 text-sm font-semibold no-underline motion-safe:transition-colors ${
                      current
                        ? "border-foreground bg-foreground text-background"
                        : "border-border bg-card hover:border-foreground"
                    }`}
                  >
                    {category.name}
                    <span
                      className={`rounded-full px-1.5 text-xs ${current ? "bg-background/20" : "bg-muted"}`}
                    >
                      {category.count}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      ) : null}

      {shown.length + shownSoon.length === 0 ? (
        <p className="mt-10">The first components are on their way. Check back soon.</p>
      ) : (
        <ul className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {shown.map((component) => (
            <li
              key={component.slug}
              className="group motion-lift relative flex flex-col overflow-hidden rounded-[1.5rem] border border-border bg-card hover:border-foreground"
            >
              <div className="relative grid h-48 place-items-center overflow-hidden bg-stage">
                <span className="motion-safe:transition-transform motion-safe:duration-500 motion-safe:ease-out motion-safe:group-hover:scale-[1.05]">
                  <ComponentArt componentName={component.componentName} />
                </span>
                <span className="absolute top-3 left-3 rounded-full bg-card/90 px-2.5 py-1 text-xs font-semibold">
                  {categoryName(component.category)}
                </span>
              </div>
              <div className="flex flex-1 flex-col gap-1.5 p-5">
                <h2 className="font-display text-xl font-bold">
                  <Link
                    href={`/components/${component.slug}`}
                    className="no-underline after:absolute after:inset-0 after:content-['']"
                  >
                    {component.title}
                  </Link>
                </h2>
                <p className="line-clamp-2 text-[0.9375rem] text-muted-foreground">
                  {tagline(component.summary)}
                </p>
                <p className="mt-auto flex flex-wrap items-center gap-2 pt-3 text-xs font-semibold">
                  {component.testedAt ? (
                    <span className="rounded-full bg-tech-dataverse px-2.5 py-1 text-tech-dataverse-ink">
                      ✓ Tested in Studio
                    </span>
                  ) : null}
                  <span className="rounded-full bg-muted px-2.5 py-1">
                    {component.access === "MEMBERS" ? "Sign in to copy" : "Free to copy"}
                  </span>
                  <span
                    aria-hidden="true"
                    className="ml-auto text-sm motion-safe:transition-transform motion-safe:group-hover:translate-x-0.5"
                  >
                    Try it →
                  </span>
                </p>
              </div>
            </li>
          ))}
          {shownSoon.map((teaser) => (
            <li
              key={teaser.slug}
              className="group relative flex flex-col overflow-hidden rounded-[1.5rem] border border-dashed border-border bg-card hover:border-foreground"
            >
              <div className="relative grid h-48 place-items-center overflow-hidden bg-stage">
                <TeaserArt componentName={teaser.componentName} />
                <ComingSoonBadge className="absolute top-3 left-3" />
              </div>
              <div className="flex flex-1 flex-col gap-1.5 p-5">
                <h2 className="font-display text-xl font-bold">
                  <Link
                    href={`/components/${teaser.slug}`}
                    className="no-underline after:absolute after:inset-0 after:content-['']"
                  >
                    {teaser.title}
                    <span className="sr-only"> (coming soon)</span>
                  </Link>
                </h2>
                <p className="line-clamp-2 text-[0.9375rem] text-muted-foreground">
                  {tagline(teaser.summary)}
                </p>
                <p className="mt-auto pt-3 text-xs font-semibold text-muted-foreground">
                  Being tested in Power Apps Studio
                </p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
