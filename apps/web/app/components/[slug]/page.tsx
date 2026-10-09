import { categoryName, propertyCounts } from "@ppu/domain-content";
import type { Metadata } from "next";
import { getServerSession } from "next-auth/next";
import { notFound } from "next/navigation";
import { cache } from "react";
import { outlineOf, type OutlineItem } from "../../../lib/article-outline";
import { authOptions } from "../../../lib/auth";
import { componentRepository } from "../../../lib/components";
import { componentsLibraryOn } from "../../../lib/site-switches";
import {
  buildComponentMetadata,
  buildNotFoundMetadata,
  NOINDEX_ROBOTS,
} from "../../../lib/seo/metadata";
import { SITE_NAME } from "../../../lib/seo/site";
import { getSiteUrl } from "../../../lib/site-url";
import { ArticleBody } from "../../learn/ArticleBody";
import { ArticleToc, StickyColumn } from "../../learn/ArticleToc";
import { Breadcrumbs } from "../../learn/Breadcrumbs";
import { ComingSoonComponent } from "../ComingSoonComponent";
import { ComponentWorkbench } from "../ComponentWorkbench";
import { LibraryNav } from "../LibraryNav";
import { PropertyTable } from "../PropertyTable";

interface ComponentPageProps {
  params: Promise<{ slug: string }>;
}

export const dynamic = "force-dynamic";

const getComponent = cache((slug: string) => componentRepository.findPublicBySlug(slug));
const getTeaser = cache((slug: string) => componentRepository.findComingSoonBySlug(slug));

export async function generateMetadata({ params }: ComponentPageProps): Promise<Metadata> {
  if (!(await componentsLibraryOn())) return buildNotFoundMetadata("Page not found");
  const { slug } = await params;
  const component = await getComponent(slug);
  if (!component) {
    // A Coming soon page is a teaser: shown, but kept out of search until it's published.
    const teaser = await getTeaser(slug);
    if (!teaser) return buildNotFoundMetadata("Component not found");
    return {
      title: `${teaser.title}: coming soon | ${SITE_NAME}`,
      description: teaser.summary,
      robots: NOINDEX_ROBOTS,
    };
  }
  return buildComponentMetadata({ site: getSiteUrl(), component });
}

const DATE = new Intl.DateTimeFormat("en-CA", { dateStyle: "long", timeZone: "UTC" });

/**
 * A component page (MVP-049; docs/final-decisions.md, 2026-10-08, design
 * "A · Docs" and "One live view"): the library on the left; in the middle the
 * component's live preview (its variations, the screen it sits on, and the
 * formulas that screen uses) and its YAML, then what it needs, its properties
 * (read from its YAML), how to add it, and its guide; "On this page" on the
 * right. Only published, visible components
 * show; a draft marked Coming soon shows its teaser page instead
 * (docs/final-decisions.md, 2026-10-09); anything else is a 404, as is the
 * whole library while it's switched off in /admin/settings. A members-only component's YAML is never sent
 * to a signed-out reader: they get "Sign in to copy" instead.
 */
export default async function ComponentPage({ params }: ComponentPageProps) {
  if (!(await componentsLibraryOn())) notFound();
  const { slug } = await params;
  const component = await getComponent(slug);
  if (!component) {
    const teaser = await getTeaser(slug);
    if (!teaser) notFound();
    return <ComingSoonComponent teaser={teaser} />;
  }

  const [session, library] = await Promise.all([
    getServerSession(authOptions),
    componentRepository.listPublic(),
  ]);
  const canCopy = component.access === "OPEN" || Boolean(session?.user?.id);
  const signInHref = `/signin?callbackUrl=${encodeURIComponent(`/components/${component.slug}`)}`;

  const guideOutline = outlineOf(component.guide);
  const outline: OutlineItem[] = [
    { level: 2, text: "Try it", id: "component_try" },
    { level: 2, text: "What it needs", id: "component_needs" },
    { level: 2, text: "Properties", id: "component_properties" },
    { level: 2, text: "Add it to your app", id: "component_add" },
    ...guideOutline,
  ];

  const needs = [
    "No premium licence: standard controls, no connectors",
    ...(component.needsModernControls ? ["Modern controls and themes: on"] : []),
    "Enhanced component properties: on",
    ...(component.testedAt
      ? [
          `Tested in Power Apps Studio ${component.testedStudioVersion ?? ""} on ${DATE.format(component.testedAt)}`,
        ]
      : []),
    `Version ${component.version}`,
  ];

  return (
    <main className="mx-auto max-w-[90rem] px-4 py-8 md:px-6">
      <Breadcrumbs
        items={[{ name: "Components", href: "/components" }, { name: component.title }]}
      />
      <header className="relative mt-4 overflow-hidden rounded-[2rem] bg-stage px-5 py-8 md:px-10 md:py-10">
        <span
          aria-hidden="true"
          className="motion-drift pointer-events-none absolute -top-24 -right-16 size-72 rounded-full bg-tech-apps opacity-70 blur-3xl"
        />
        <span
          aria-hidden="true"
          className="motion-drift-alt pointer-events-none absolute -bottom-28 left-1/3 size-72 rounded-full bg-tech-dataverse opacity-60 blur-3xl"
        />
        <div className="relative max-w-[52rem]">
          <p className="flex flex-wrap gap-2 text-sm font-semibold">
            <span className="rounded-full bg-card px-3 py-1">Power Apps · canvas component</span>
            <span className="rounded-full bg-card px-3 py-1">
              {categoryName(component.category)}
            </span>
            {component.testedAt ? (
              <span className="rounded-full bg-tech-dataverse px-3 py-1 text-tech-dataverse-ink">
                ✓ Tested in Studio
              </span>
            ) : null}
            {component.access === "MEMBERS" ? (
              <span className="rounded-full bg-card px-3 py-1">Free with an account</span>
            ) : (
              <span className="rounded-full bg-card px-3 py-1">Free to copy</span>
            )}
          </p>
          <h1 className="motion-rise mt-4 font-display text-4xl font-bold md:text-6xl">
            {component.title}
          </h1>
          <p className="mt-3 text-lg md:text-xl">{component.summary}</p>
          <dl className="mt-6 flex flex-wrap gap-x-8 gap-y-3 text-sm">
            <div>
              <dt className="text-muted-foreground">Name in Studio</dt>
              <dd className="font-mono font-semibold">{component.componentName}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Version</dt>
              <dd className="font-semibold">{component.version}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Properties</dt>
              <dd className="font-semibold">{propertyCounts(component.properties)}</dd>
            </div>
          </dl>
        </div>
      </header>

      {/* One copy of each part: the library and the contents move between
          columns with the width (library hidden below lg; contents above the
          content below xl, on the right from xl). */}
      <div className="mt-8 grid gap-8 lg:grid-cols-[13rem_minmax(0,1fr)] xl:grid-cols-[13rem_minmax(0,1fr)_13rem]">
        <div className="hidden lg:row-span-2 lg:block xl:row-span-1">
          <StickyColumn>
            <LibraryNav components={library} currentSlug={component.slug} />
          </StickyColumn>
        </div>

        <div className="lg:col-start-2 xl:col-start-3 xl:row-start-1">
          <div className="xl:sticky xl:top-28 xl:max-h-[calc(100vh-8rem)] xl:self-start xl:overflow-y-auto">
            <ArticleToc items={outline} />
          </div>
        </div>

        <div className="min-w-0 lg:col-start-2 xl:row-start-1">
          <section id="component_try" aria-label="Try it" className="mt-6 scroll-mt-28">
            <ComponentWorkbench
              componentName={component.componentName}
              title={component.title}
              yaml={canCopy ? component.yaml : null}
              signInHref={signInHref}
              variations={component.variations}
            />
          </section>

          <section aria-labelledby="component_needs" className="mt-10">
            <h2 id="component_needs" className="scroll-mt-28 font-display text-2xl font-bold">
              What it needs
            </h2>
            <ul className="mt-3 flex flex-wrap gap-2">
              {needs.map((need) => (
                <li
                  key={need}
                  className="rounded-full border border-border bg-card px-3 py-1 text-sm"
                >
                  {need}
                </li>
              ))}
            </ul>
          </section>

          <section aria-labelledby="component_properties" className="mt-10">
            <h2 id="component_properties" className="scroll-mt-28 font-display text-2xl font-bold">
              Properties
            </h2>
            <p className="mt-1 text-muted-foreground">
              Read from the component&apos;s own YAML, so they always match what you paste.
            </p>
            <div className="mt-4">
              <PropertyTable properties={component.properties} />
            </div>
          </section>

          <section aria-labelledby="component_add" className="mt-10">
            <h2 id="component_add" className="scroll-mt-28 font-display text-2xl font-bold">
              Add it to your app
            </h2>
            <ol className="mt-3 list-decimal space-y-2 pl-6 text-[1.0625rem]">
              <li>
                In Power Apps Studio, open <strong>Settings</strong> &gt; <strong>Updates</strong>{" "}
                and check that{" "}
                {component.needsModernControls ? (
                  <>
                    <strong>Modern controls and themes</strong> and{" "}
                  </>
                ) : null}
                <strong>Enhanced component properties</strong> are on.
              </li>
              <li>
                Open the <strong>Components</strong> tab in the tree view and select{" "}
                <strong>New component</strong>.
              </li>
              <li>Select an empty part of Studio, so the new component isn&apos;t selected.</li>
              <li>
                Copy the YAML on this page and press <strong>Ctrl+V</strong>.{" "}
                <code>{component.componentName}</code> appears with all its properties.
              </li>
              <li>
                On a screen, insert it from <strong>Insert</strong> &gt; <strong>Custom</strong>{" "}
                &gt; <code>{component.componentName}</code>.
              </li>
            </ol>
          </section>

          <div className="mt-10 [&_h2]:scroll-mt-28">
            <ArticleBody markdown={component.guide} />
          </div>
        </div>
      </div>
    </main>
  );
}
