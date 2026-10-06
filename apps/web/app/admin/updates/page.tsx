import { UPDATE_KIND_LABEL } from "@ppu/domain-content";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "../../../lib/require-admin";
import { SITE_NAME } from "../../../lib/seo/site";
import { updateRepository } from "../../../lib/updates";
import { UpdatePublishControl } from "./UpdatePublishControl";

export const metadata: Metadata = { title: `Updates | ${SITE_NAME}` };

/**
 * The admin list of platform updates (MVP-033 slice D): the agent's imported
 * drafts and anything written here, each with Edit and, while a draft,
 * Publish. Admins only; anyone else gets the same not-found page.
 */
export default async function AdminUpdatesPage() {
  if (!(await requireAdmin())) notFound();
  const updates = await updateRepository.listUpdates();

  return (
    <main className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="text-2xl font-semibold">Updates</h1>
      <p className="mt-2">
        <Link href="/admin/updates/new">New update</Link>
      </p>
      <p className="mt-2">
        Check each draft against its Microsoft link before publishing. Published updates appear on{" "}
        <Link href="/updates">/updates</Link> and in the header count.
      </p>
      {updates.length === 0 ? (
        <p className="mt-8">No updates yet.</p>
      ) : (
        <ul className="mt-8">
          {updates.map((update) => (
            <li key={update.id}>
              <p>
                <Link href={`/admin/updates/${update.id}/edit`}>{update.title}</Link> —{" "}
                {UPDATE_KIND_LABEL[update.kind]} — {update.status} —{" "}
                <a href={update.sourceUrl} rel="noopener noreferrer" target="_blank">
                  Microsoft source (opens in a new tab)
                </a>
              </p>
              {update.status === "DRAFT" ? <UpdatePublishControl updateId={update.id} /> : null}
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
