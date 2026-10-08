import { COMPONENT_CATEGORIES, propertyCounts } from "@ppu/domain-content";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { componentRepository } from "../../lib/components";
import { componentsEnabled } from "../../lib/feature-flags";
import { buildComponentsIndexMetadata, buildNotFoundMetadata } from "../../lib/seo/metadata";
import { getSiteUrl } from "../../lib/site-url";
import { ComponentArt } from "./ComponentArt";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  if (!componentsEnabled()) return buildNotFoundMetadata("Page not found");
  const components = await componentRepository.listPublic();
  return buildComponentsIndexMetadata({ site: getSiteUrl(), hasComponents: components.length > 0 });
}

/**
 * The Power Apps component library (MVP-049; docs/final-decisions.md,
 * 2026-10-08, "One live view"): every published, visible component, grouped by
 * category, each card with a picture of the component, how many properties of
 * each kind it has, and whether copying needs a (free) account. A 404 while
 * FEATURE_COMPONENTS is off.
 */
export default async function ComponentsPage() {
  if (!componentsEnabled()) notFound();
  const components = await componentRepository.listPublic();
  const groups = COMPONENT_CATEGORIES.map((category) => ({
    ...category,
    items: components.filter((component) => component.category === category.id),
  })).filter((group) => group.items.length > 0);
  const tested = components.filter((component) => component.testedAt).length;

  return (
    <main className="mx-auto max-w-[76rem] px-4 py-10 md:px-6">
      <section className="relative overflow-hidden rounded-[2rem] bg-stage px-6 py-10 md:px-12 md:py-14">
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
          <p className="mt-4 max-w-[44rem] text-lg md:text-xl">
            Modern canvas app components with every kind of custom property. Each page runs the
            component live, exactly as it behaves in Power Apps, then you copy its YAML and paste it
            into Studio. Free, and no premium licence needed.
          </p>
          <ul className="mt-6 flex flex-wrap gap-2 text-sm font-semibold">
            {[
              `${components.length} ${components.length === 1 ? "component" : "components"}`,
              ...(tested > 0 ? [`${tested} tested in Power Apps Studio`] : []),
              "Every kind of custom property",
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

      {groups.length > 1 ? (
        <nav aria-label="Categories" className="mt-8">
          <ul className="flex flex-wrap gap-2">
            {groups.map((group) => (
              <li key={group.id}>
                <a
                  href={`#category_${group.id}`}
                  className="inline-flex min-h-10 items-center rounded-full border border-border bg-card px-4 text-sm font-semibold no-underline hover:border-foreground motion-safe:transition-colors"
                >
                  {group.name}
                </a>
              </li>
            ))}
          </ul>
        </nav>
      ) : null}

      {groups.length === 0 ? (
        <p className="mt-10">The first components are on their way. Check back soon.</p>
      ) : (
        groups.map((group) => (
          <section
            key={group.id}
            aria-labelledby={`category_${group.id}`}
            className="mt-12 scroll-mt-28"
          >
            <h2
              id={`category_${group.id}`}
              className="scroll-mt-28 font-display text-2xl font-bold md:text-3xl"
            >
              {group.name}
            </h2>
            <ul className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {group.items.map((component) => (
                <li
                  key={component.slug}
                  className="group motion-lift relative flex flex-col overflow-hidden rounded-[1.5rem] border border-border bg-card hover:border-foreground"
                >
                  <div className="grid h-44 place-items-center overflow-hidden bg-stage">
                    <span className="motion-safe:transition-transform motion-safe:duration-500 motion-safe:ease-out motion-safe:group-hover:scale-[1.06]">
                      <ComponentArt componentName={component.componentName} />
                    </span>
                  </div>
                  <div className="flex flex-1 flex-col gap-2 p-5">
                    <h3 className="font-display text-xl font-bold">
                      <Link
                        href={`/components/${component.slug}`}
                        className="no-underline after:absolute after:inset-0 after:content-['']"
                      >
                        {component.title}
                      </Link>
                    </h3>
                    <p className="text-[0.9375rem] text-muted-foreground">{component.summary}</p>
                    <p className="mt-auto pt-2 text-sm">{propertyCounts(component.properties)}</p>
                    <p className="flex flex-wrap gap-2 text-xs font-semibold">
                      {component.testedAt ? (
                        <span className="rounded-full bg-tech-dataverse px-2.5 py-1 text-tech-dataverse-ink">
                          ✓ Tested in Studio
                        </span>
                      ) : null}
                      <span className="rounded-full bg-muted px-2.5 py-1">
                        {component.access === "MEMBERS" ? "Free with an account" : "Free to copy"}
                      </span>
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          </section>
        ))
      )}
    </main>
  );
}
