import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requireAdmin } from "../../../../../lib/require-admin";
import { SITE_NAME } from "../../../../../lib/seo/site";
import { updateRepository } from "../../../../../lib/updates";
import { UpdateForm } from "../../UpdateForm";

export const metadata: Metadata = { title: `Edit update | ${SITE_NAME}` };

/** Admins only (MVP-033 slice D). An unknown id is the same not-found page. */
export default async function EditUpdatePage({ params }: { params: Promise<{ id: string }> }) {
  if (!(await requireAdmin())) notFound();
  const update = await updateRepository.findUpdateById((await params).id);
  if (!update) notFound();

  return (
    <main className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="text-2xl font-semibold">Edit update</h1>
      <UpdateForm
        mode="edit"
        updateId={update.id}
        initialValues={{
          slug: update.slug,
          title: update.title,
          summary: update.summary,
          technology: update.technology ?? "",
          kind: update.kind,
          action: update.action ?? "",
          sourceUrl: update.sourceUrl,
          effectiveDate: update.effectiveDate
            ? update.effectiveDate.toISOString().slice(0, 10)
            : "",
          replacement: update.replacement ?? "",
        }}
      />
    </main>
  );
}
