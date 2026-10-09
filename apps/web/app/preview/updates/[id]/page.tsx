import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { cache } from "react";
import { requireAdmin } from "../../../../lib/require-admin";
import { NOINDEX_ROBOTS } from "../../../../lib/seo/metadata";
import { SITE_NAME } from "../../../../lib/seo/site";
import { updateRepository } from "../../../../lib/updates";
import { UpdateCard } from "../../../updates/UpdateCard";
import { PreviewBanner } from "../../PreviewBanner";

export const dynamic = "force-dynamic";

/** The draft, for an admin only; null for anyone else, or an unknown id. */
const getDraft = cache(async (id: string) =>
  (await requireAdmin()) ? updateRepository.findUpdateById(id) : null,
);

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const update = await getDraft((await params).id);
  return {
    title: update ? `Preview: ${update.title} | ${SITE_NAME}` : `Not found | ${SITE_NAME}`,
    robots: NOINDEX_ROBOTS,
  };
}

/**
 * A draft platform update as it will appear on /updates (MVP-050): the same
 * card, dated with its scheduled time (or today, if it isn't scheduled).
 * Admins only, like the guide preview; never indexed.
 */
export default async function PreviewUpdatePage({ params }: { params: Promise<{ id: string }> }) {
  const update = await getDraft((await params).id);
  if (!update) notFound();
  if (update.status === "PUBLISHED") redirect(`/updates#${encodeURIComponent(update.slug)}`);

  return (
    <main className="px-4 pb-10 md:px-6">
      <PreviewBanner
        noun="update"
        scheduledFor={update.scheduledFor}
        editHref={`/admin/updates/${update.id}/edit`}
      />
      <div className="mx-auto mt-8 max-w-[77.5rem]">
        <h1 className="text-4xl font-bold">Preview of an update</h1>
        <section aria-labelledby="preview-card" className="mt-6 max-w-3xl">
          <h2 id="preview-card" className="mb-3.5 text-2xl font-bold">
            As it will appear on Updates
          </h2>
          <ul className="flex flex-col gap-3">
            <UpdateCard update={{ ...update, publishedAt: update.scheduledFor ?? new Date() }} />
          </ul>
        </section>
      </div>
    </main>
  );
}
