import { COMPONENT_CATEGORIES, PROPERTY_KINDS, PROPERTY_KIND_LABEL } from "@ppu/domain-content";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { componentRepository } from "../../lib/components";
import { componentsEnabled } from "../../lib/feature-flags";
import { buildComponentsIndexMetadata, buildNotFoundMetadata } from "../../lib/seo/metadata";
import { getSiteUrl } from "../../lib/site-url";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  if (!componentsEnabled()) return buildNotFoundMetadata("Page not found");
  const components = await componentRepository.listPublic();
  return buildComponentsIndexMetadata({ site: getSiteUrl(), hasComponents: components.length > 0 });
}

/**
 * The Power Apps component library (MVP-049): every published, visible
 * component, grouped by category. Each card says what kinds of property it
 * has and whether copying needs a (free) account. A 404 while
 * FEATURE_COMPONENTS is off.
 */
export default async function ComponentsPage() {
  if (!componentsEnabled()) notFound();
  const components = await componentRepository.listPublic();
  const groups = COMPONENT_CATEGORIES.map((category) => ({
    ...category,
    items: components.filter((component) => component.category === category.id),
  })).filter((group) => group.items.length > 0);

  return (
    <main className="mx-auto max-w-[72rem] px-4 py-10 md:px-6">
      <div className="rounded-[2rem] bg-stage p-6 md:p-10">
        <p className="font-mono text-xs font-medium tracking-widest text-muted-foreground uppercase">
          Power Apps component library
        </p>
        <h1 className="mt-2 font-display text-4xl font-bold md:text-5xl">
          Components you can try, then <span className="font-serif font-normal italic">paste</span>
        </h1>
        <p className="mt-3 max-w-[44rem] text-lg">
          Modern canvas app components with every kind of custom property. Try each one live on its
          page, then copy its YAML and paste it into Power Apps Studio. Free, and no premium licence
          needed.
        </p>
      </div>

      {groups.length === 0 ? (
        <p className="mt-10">The first components are on their way. Check back soon.</p>
      ) : (
        groups.map((group) => (
          <section key={group.id} aria-labelledby={`category_${group.id}`} className="mt-10">
            <h2 id={`category_${group.id}`} className="font-display text-2xl font-bold">
              {group.name}
            </h2>
            <ul className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {group.items.map((component) => {
                const kinds = PROPERTY_KINDS.map((kind) => ({
                  kind,
                  count: component.properties.filter((property) => property.kind === kind).length,
                })).filter((entry) => entry.count > 0);
                return (
                  <li
                    key={component.slug}
                    className="relative flex flex-col gap-2 rounded-[1.5rem] border border-border bg-card p-5 hover:border-foreground motion-safe:transition-colors"
                  >
                    <h3 className="font-display text-xl font-bold">
                      <Link
                        href={`/components/${component.slug}`}
                        className="no-underline after:absolute after:inset-0 after:content-['']"
                      >
                        {component.title}
                      </Link>
                    </h3>
                    <p className="text-[0.9375rem] text-muted-foreground">{component.summary}</p>
                    <p className="mt-auto pt-2 text-sm">
                      {kinds
                        .map(
                          (entry) =>
                            `${entry.count} ${PROPERTY_KIND_LABEL[entry.kind].toLowerCase()}`,
                        )
                        .join(" · ")}
                    </p>
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
                  </li>
                );
              })}
            </ul>
          </section>
        ))
      )}
    </main>
  );
}
