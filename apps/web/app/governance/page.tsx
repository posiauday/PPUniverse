import type { Metadata } from "next";
import { buildTechnologySectionMetadata } from "../../lib/seo/metadata";
import { getSiteUrl } from "../../lib/site-url";
import { OtherAreas, GOVERNANCE_AREA } from "../[technology]/OtherAreas";
import { TechnologyHub } from "../[technology]/TechnologyHub";

const TITLE = "Power Platform governance & admin";
const DESCRIPTION =
  "Environments, data policies (DLP), security, the CoE, ALM, licensing and AI governance for Power Platform admins.";

export function generateMetadata(): Metadata {
  // noindex until its first guides are published: a page of "Coming" items
  // is thin content (hasContent: false).
  return buildTechnologySectionMetadata({
    site: getSiteUrl(),
    path: "/governance",
    title: TITLE,
    description: DESCRIPTION,
    hasContent: false,
  });
}

/**
 * Governance & admin, the seventh area (MVP-033; docs/final-decisions.md,
 * 2026-10-02). Its guides are not a Technology in the content model yet
 * (slice B adds the area), so the hub shows its sections and planned guides.
 */
export default function GovernancePage() {
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
      articles={[]}
      footer={<OtherAreas currentSlug={GOVERNANCE_AREA.slug} />}
    />
  );
}
