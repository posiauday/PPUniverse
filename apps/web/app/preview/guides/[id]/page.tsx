import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { cache } from "react";
import { contentRepository } from "../../../../lib/content";
import { requireAdmin } from "../../../../lib/require-admin";
import { NOINDEX_ROBOTS } from "../../../../lib/seo/metadata";
import { SITE_NAME } from "../../../../lib/seo/site";
import { renderGuidePage } from "../../../guides/guide-page";
import { PreviewBanner } from "../../PreviewBanner";

export const dynamic = "force-dynamic";

/** The draft, for an admin only; null for anyone else, or an unknown id. */
const getDraft = cache(async (id: string) =>
  (await requireAdmin()) ? contentRepository.findArticleById(id) : null,
);

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const article = await getDraft((await params).id);
  return {
    title: article ? `Preview: ${article.title} | ${SITE_NAME}` : `Not found | ${SITE_NAME}`,
    robots: NOINDEX_ROBOTS,
  };
}

/**
 * A draft guide exactly as it will look when published (MVP-050;
 * docs/final-decisions.md, 2026-10-09, "previews for admins only"): the same
 * renderGuidePage the public page uses, under a preview banner. Admins only;
 * anyone else, and an unknown id, gets the ordinary 404, so a draft's
 * existence isn't revealed. Never indexed. A guide that's already published
 * goes to its public page.
 */
export default async function PreviewGuidePage({ params }: { params: Promise<{ id: string }> }) {
  const article = await getDraft((await params).id);
  if (!article) notFound();
  if (article.status === "PUBLISHED") redirect(`/guides/${encodeURIComponent(article.slug)}`);

  return renderGuidePage(
    article,
    <PreviewBanner
      noun="guide"
      scheduledFor={article.scheduledFor}
      editHref={`/admin/content/${article.id}/edit`}
    />,
  );
}
