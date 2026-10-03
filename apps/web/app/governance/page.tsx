import type { Metadata } from "next";
import { cache } from "react";
import { contentRepository } from "../../lib/content";
import { buildTechnologySectionMetadata } from "../../lib/seo/metadata";
import { getSiteUrl } from "../../lib/site-url";
import { OtherAreas, GOVERNANCE_AREA } from "../[technology]/OtherAreas";
import { TechnologyHub } from "../[technology]/TechnologyHub";

const TITLE = "Power Platform governance & admin";
const DESCRIPTION =
  "Environments, data policies (DLP), security, the CoE, ALM, licensing and AI governance for Power Platform admins.";

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
  const guides = await getGuides();
  return (
    <TechnologyHub
      area={{
        key: "GOVERNANCE_ADMIN",
        name: GOVERNANCE_AREA.name,
        tagline: GOVERNANCE_AREA.tagline,
        blurb:
          "Environments, data policies, security, the CoE, ALM, licensing and AI governance: how admins keep Power Platform safe while makers keep building.",
        tint: GOVERNANCE_AREA.tint,
        ink: GOVERNANCE_AREA.ink,
      }}
      articles={guides}
      footer={<OtherAreas currentSlug={GOVERNANCE_AREA.slug} />}
    />
  );
}
