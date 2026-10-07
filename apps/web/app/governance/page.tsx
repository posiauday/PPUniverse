import type { Metadata } from "next";
import { cache } from "react";
import { contentRepository } from "../../lib/content";
import { buildTechnologySectionMetadata } from "../../lib/seo/metadata";
import { getSiteUrl } from "../../lib/site-url";
import { HUB_SEO } from "../../lib/technology-hubs";
import { updateRepository } from "../../lib/updates";
import { OtherAreas, GOVERNANCE_AREA } from "../[technology]/OtherAreas";
import { TechnologyHub } from "../[technology]/TechnologyHub";

const { title: TITLE, description: DESCRIPTION } = HUB_SEO.GOVERNANCE_ADMIN;

// See apps/web/app/page.tsx for why content pages render per-request.
export const dynamic = "force-dynamic";

/** Enough for every Governance & admin guide at launch scale, as on the product hubs. */
const GOVERNANCE_ARTICLE_LIMIT = 200;

// generateMetadata and the page share one load per request.
const getGuides = cache(() =>
  contentRepository.listPublishedArticleSummaries({
    limit: GOVERNANCE_ARTICLE_LIMIT,
    technology: "GOVERNANCE_ADMIN",
  }),
);

export async function generateMetadata(): Promise<Metadata> {
  // noindex until its first guides are published: a page of "Coming" items
  // is thin content.
  return buildTechnologySectionMetadata({
    site: getSiteUrl(),
    path: "/governance",
    title: TITLE,
    description: DESCRIPTION,
    hasContent: (await getGuides()).length > 0,
  });
}

/**
 * Governance & admin, the seventh area (MVP-033; docs/final-decisions.md,
 * 2026-10-02): the same hub as the products, with its published guides
 * (technology GOVERNANCE_ADMIN, slice B) and its planned ones.
 */
export default async function GovernancePage() {
  const [guides, updates] = await Promise.all([
    getGuides(),
    updateRepository.listPublishedUpdates({ limit: 2, technology: "GOVERNANCE_ADMIN" }),
  ]);
  return (
    <TechnologyHub
      area={{
        key: "GOVERNANCE_ADMIN",
        name: GOVERNANCE_AREA.name,
        slug: GOVERNANCE_AREA.slug,
        tint: GOVERNANCE_AREA.tint,
        ink: GOVERNANCE_AREA.ink,
      }}
      articles={guides}
      updates={updates}
      footer={<OtherAreas currentSlug={GOVERNANCE_AREA.slug} />}
    />
  );
}
