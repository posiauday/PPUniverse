import { technologyBySlug } from "@ppu/domain-content";
import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";
import { buildNotFoundMetadata } from "../../../lib/seo/metadata";
import { SITE_NAME } from "../../../lib/seo/site";
import { tabBySegment } from "../../../lib/technology-sections";

interface TechnologyTabPageProps {
  params: Promise<{ technology: string; tab: string }>;
}

// Every unknown two-segment path reaches this route, so its 404 carries
// exactly the title app/not-found.tsx gives every other 404 (BUG-008).
const NOT_FOUND_TITLE = `Page not found | ${SITE_NAME}`;

export async function generateMetadata(): Promise<Metadata> {
  return buildNotFoundMetadata(NOT_FOUND_TITLE);
}

/**
 * The old technology tabs (/power-apps/kpis, /power-bi/architecture ...;
 * MVP-028) folded into one hub per technology (MVP-033 slice C). A known tab
 * address redirects permanently (308) to its hub, so old links and search
 * results keep working; anything else is a 404.
 */
export default async function TechnologyTabPage({ params }: TechnologyTabPageProps) {
  const { technology: slug, tab: segment } = await params;
  const technology = technologyBySlug(slug);
  if (!technology || !tabBySegment(segment)) notFound();
  permanentRedirect(`/${technology.slug}`);
}
