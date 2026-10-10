import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "../../../../../lib/require-admin";
import { SITE_NAME } from "../../../../../lib/seo/site";
import { updateRepository } from "../../../../../lib/updates";
import { StatusPill } from "../../../AdminList";
import { AdminPageHeader } from "../../../AdminPageHeader";
import { LocalTime } from "../../../LocalTime";
import { SchedulePanel } from "../../../SchedulePanel";
import { UpdateForm } from "../../UpdateForm";

export const metadata: Metadata = { title: `Edit update | ${SITE_NAME}` };

/** Admins only (MVP-033 slice D); an unknown id is the same not-found page.
 * MVP-052 phase 4: the form, with publishing beside it on wide screens. */
export default async function EditUpdatePage({ params }: { params: Promise<{ id: string }> }) {
  if (!(await requireAdmin())) notFound();
  const update = await updateRepository.findUpdateById((await params).id);
  if (!update) notFound();

  return (
    <main className="flex flex-col gap-6 pb-10">
      <AdminPageHeader
        back={{ href: "/admin/updates", label: "Updates" }}
        title="Edit update"
        actions={
          <StatusPill
            status={
              update.status === "PUBLISHED"
                ? "Published"
                : update.scheduledFor
                  ? "Scheduled"
                  : "Draft"
            }
          />
        }
      />
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_22rem] xl:items-start">
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
        {update.status === "DRAFT" ? (
          <SchedulePanel
            endpoint={`/api/admin/updates/${update.id}/schedule`}
            previewHref={`/preview/updates/${update.id}`}
            noun="update"
            scheduledFor={update.scheduledFor?.toISOString() ?? null}
          />
        ) : update.publishedAt ? (
          <section className="rounded-[1.5rem] border border-border bg-card p-5">
            <p>
              Published <LocalTime iso={update.publishedAt.toISOString()} />.{" "}
              <Link href={`/updates#${update.slug}`} className="font-semibold underline">
                View it on the site
              </Link>
            </p>
          </section>
        ) : null}
      </div>
    </main>
  );
}
