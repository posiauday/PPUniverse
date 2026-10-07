import { technologyBySlug, type TechnologyInfo } from "@ppu/domain-content";
import { JsonLd } from "@ppu/ui";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { cache } from "react";
import { contentRepository } from "../../lib/content";
import { homeUrl, technologySectionUrl } from "../../lib/seo/canonical";
import { buildBreadcrumbJsonLd, buildCollectionPageJsonLd } from "../../lib/seo/json-ld";
import { buildNotFoundMetadata, buildTechnologySectionMetadata } from "../../lib/seo/metadata";
import { SITE_NAME } from "../../lib/seo/site";
import { getSiteUrl } from "../../lib/site-url";
import { HUB_SEO } from "../../lib/technology-hubs";
import { TECHNOLOGY_PALETTE } from "../../lib/technology-palette";
import { SECTION_ARTICLE_LIMIT, sectionPath } from "../../lib/technology-sections";
import { updateRepository } from "../../lib/updates";
import { OtherAreas } from "./OtherAreas";
import { TechnologyHeroVisual } from "./TechnologyHeroVisual";
import { TechnologyHub } from "./TechnologyHub";

interface TechnologyPageProps {
  params: Promise<{ technology: string }>;
}

// Reads the database per request (see apps/web/app/page.tsx).
export const dynamic = "force-dynamic";

// Every unknown top-level path reaches this route now, so its 404 carries
// exactly the title app/not-found.tsx gives every other 404 (BUG-008).
const NOT_FOUND_TITLE = `Page not found | ${SITE_NAME}`;

// MVP-037: each hub's title and description name the product and what it helps with.
const hubTitle = (technology: TechnologyInfo) => HUB_SEO[technology.technology].title;
const hubDescription = (technology: TechnologyInfo) => HUB_SEO[technology.technology].description;

/** How many of the area's updates the hub's "What changed" row shows. */
const HUB_UPDATES = 2;

// generateMetadata and the page share one load per request.
const getHub = cache(async (slug: string) => {
  const technology = technologyBySlug(slug);
  if (!technology) return null;
  const [articles, updates] = await Promise.all([
    contentRepository.listPublishedArticleSummaries({
      limit: SECTION_ARTICLE_LIMIT,
      technology: technology.technology,
    }),
    updateRepository.listPublishedUpdates({
      limit: HUB_UPDATES,
      technology: technology.technology,
    }),
  ]);
  return { technology, articles, updates };
});

export async function generateMetadata({ params }: TechnologyPageProps): Promise<Metadata> {
  const hub = await getHub((await params).technology);
  if (!hub) return buildNotFoundMetadata(NOT_FOUND_TITLE);
  return buildTechnologySectionMetadata({
    site: getSiteUrl(),
    path: sectionPath(hub.technology, "learn"),
    title: hubTitle(hub.technology),
    description: hubDescription(hub.technology),
    hasContent: hub.articles.length > 0,
  });
}

/**
 * A technology's hub (MVP-033 slice C): /power-apps, /power-bi ... Only the
 * six technologies in @ppu/domain-content's TECHNOLOGIES exist here
 * (Governance & admin is /governance); any other top-level path that no
 * other route claims is a 404. The old tab addresses redirect here
 * ([tab]/page.tsx).
 */
export default async function TechnologyPage({ params }: TechnologyPageProps) {
  const hub = await getHub((await params).technology);
  if (!hub) notFound();
  const { technology, articles, updates } = hub;
  const palette = TECHNOLOGY_PALETTE[technology.technology];
  const site = getSiteUrl();
  const url = site.ok ? technologySectionUrl(site.origin, sectionPath(technology, "learn")) : null;
  const breadcrumbJsonLd =
    site.ok && url
      ? buildBreadcrumbJsonLd([
          { name: SITE_NAME, url: homeUrl(site.origin) },
          { name: technology.name, url },
        ])
      : null;
  const collectionJsonLd =
    url && articles.length > 0
      ? buildCollectionPageJsonLd({
          url,
          name: hubTitle(technology),
          description: hubDescription(technology),
        })
      : null;

  return (
    <TechnologyHub
      area={{
        key: technology.technology,
        name: technology.name,
        slug: technology.slug,
        tint: palette.tint,
        ink: palette.ink,
      }}
      articles={articles}
      updates={updates}
      heroVisual={<TechnologyHeroVisual technology={technology.technology} />}
      footer={
        <>
          <OtherAreas currentSlug={technology.slug} />
          {collectionJsonLd ? <JsonLd data={collectionJsonLd} /> : null}
          {breadcrumbJsonLd ? <JsonLd data={breadcrumbJsonLd} /> : null}
        </>
      }
    />
  );
}
