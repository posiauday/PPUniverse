import { technologyBySlug } from "@ppu/domain-content";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { cache } from "react";
import { catalogRepository } from "../../../lib/catalog";
import { contentRepository } from "../../../lib/content";
import { buildNotFoundMetadata, buildTechnologySectionMetadata } from "../../../lib/seo/metadata";
import { SITE_NAME } from "../../../lib/seo/site";
import { getSiteUrl } from "../../../lib/site-url";
import {
  loadSection,
  loadSectionCounts,
  sectionHasContent,
  sectionPath,
  tabBySegment,
  tabDescription,
  tabTitle,
} from "../../../lib/technology-sections";
import { TechnologySection } from "../TechnologySection";

interface TechnologyTabPageProps {
  params: Promise<{ technology: string; tab: string }>;
}

// Reads the database per request (see apps/web/app/page.tsx).
export const dynamic = "force-dynamic";

// Every unknown top-level path reaches this route now, so its 404 carries
// exactly the title app/not-found.tsx gives every other 404 (BUG-008).
const NOT_FOUND_TITLE = `Page not found | ${SITE_NAME}`;

const getTab = cache(async (slug: string, segment: string) => {
  const technology = technologyBySlug(slug);
  const tab = tabBySegment(segment);
  if (!technology || !tab) return null;
  const deps = { content: contentRepository, catalog: catalogRepository };
  const [content, counts] = await Promise.all([
    loadSection(deps, technology, tab.tab),
    loadSectionCounts(deps, technology),
  ]);
  return { technology, tab: tab.tab, content, counts };
});

export async function generateMetadata({ params }: TechnologyTabPageProps): Promise<Metadata> {
  const { technology, tab } = await params;
  const section = await getTab(technology, tab);
  if (!section) return buildNotFoundMetadata(NOT_FOUND_TITLE);
  return buildTechnologySectionMetadata({
    site: getSiteUrl(),
    path: sectionPath(section.technology, section.tab),
    title: tabTitle(section.technology, section.tab),
    description: tabDescription(section.technology, section.tab),
    hasContent: sectionHasContent(section.content),
  });
}

/**
 * A technology section's Architecture, Components or KPIs tab (MVP-028):
 * /power-apps/architecture ... Any other technology or tab is a 404; the
 * Learn tab has no segment (it is /power-apps itself), so /power-apps/learn
 * is a 404 too rather than a duplicate of it.
 */
export default async function TechnologyTabPage({ params }: TechnologyTabPageProps) {
  const { technology, tab } = await params;
  const section = await getTab(technology, tab);
  if (!section) notFound();
  return (
    <TechnologySection
      technology={section.technology}
      tab={section.tab}
      content={section.content}
      counts={section.counts}
    />
  );
}
