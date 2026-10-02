import { technologyBySlug } from "@ppu/domain-content";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { cache } from "react";
import { catalogRepository } from "../../lib/catalog";
import { contentRepository } from "../../lib/content";
import { buildNotFoundMetadata, buildTechnologySectionMetadata } from "../../lib/seo/metadata";
import { SITE_NAME } from "../../lib/seo/site";
import { getSiteUrl } from "../../lib/site-url";
import {
  loadSection,
  loadSectionCounts,
  sectionHasContent,
  sectionPath,
  tabDescription,
  tabTitle,
} from "../../lib/technology-sections";
import { TechnologySection } from "./TechnologySection";

interface TechnologyPageProps {
  params: Promise<{ technology: string }>;
}

// Reads the database per request (see apps/web/app/page.tsx).
export const dynamic = "force-dynamic";

// Every unknown top-level path reaches this route now, so its 404 carries
// exactly the title app/not-found.tsx gives every other 404 (BUG-008).
const NOT_FOUND_TITLE = `Page not found | ${SITE_NAME}`;

// generateMetadata and the page both need the tab's content; cache() shares
// one load between them for the duration of a request.
const getLearnTab = cache(async (slug: string) => {
  const technology = technologyBySlug(slug);
  if (!technology) return null;
  const deps = { content: contentRepository, catalog: catalogRepository };
  const [content, counts] = await Promise.all([
    loadSection(deps, technology, "learn"),
    loadSectionCounts(deps, technology),
  ]);
  return { technology, content, counts };
});

export async function generateMetadata({ params }: TechnologyPageProps): Promise<Metadata> {
  const section = await getLearnTab((await params).technology);
  if (!section) return buildNotFoundMetadata(NOT_FOUND_TITLE);
  return buildTechnologySectionMetadata({
    site: getSiteUrl(),
    path: sectionPath(section.technology, "learn"),
    title: tabTitle(section.technology, "learn"),
    description: tabDescription(section.technology, "learn"),
    hasContent: sectionHasContent(section.content),
  });
}

/**
 * A technology section's Learn tab (MVP-028): /power-apps, /power-bi ...
 * Only the six sections in @ppu/domain-content's TECHNOLOGIES exist; any
 * other top-level path that no other route claims is a 404 here.
 */
export default async function TechnologyPage({ params }: TechnologyPageProps) {
  const section = await getLearnTab((await params).technology);
  if (!section) notFound();
  return (
    <TechnologySection
      technology={section.technology}
      tab="learn"
      content={section.content}
      counts={section.counts}
    />
  );
}
