import { prisma } from "@ppu/db";
import { getServerSession } from "next-auth/next";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { authOptions } from "../../../lib/auth";
import { listRecentAuditLogEntries } from "../../../lib/audit";
import { SITE_NAME } from "../../../lib/seo/site";

export const metadata: Metadata = { title: `Audit log | ${SITE_NAME}` };

const ENTRY_LIMIT = 100;

const DOMAIN_LABELS: Record<string, string> = {
  product_status: "Product status",
  deletion_request: "Deletion request",
  article_publish: "Content",
};

/**
 * MVP-019's audit-log admin surface (FR-015/NFR-009). Same deny-by-default
 * pattern as /admin/deletion-requests and /admin/products: no session, and
 * a session with role !== ADMIN, both render the identical Next.js
 * not-found page. Read-only -- this page has no form, no mutation, no
 * client component. `listRecentAuditLogEntries` merges the existing
 * per-domain event tables (ProductStatusEvent, DeletionRequestEvent,
 * ArticlePublishEvent) rather than reading from a new unified table
 * (docs/final-decisions.md, "MVP-019 operations console and audit" --
 * question 4).
 */
export default async function AdminAuditPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    notFound();
  }

  const actor = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true },
  });
  if (actor?.role !== "ADMIN") {
    notFound();
  }

  const entries = await listRecentAuditLogEntries(ENTRY_LIMIT);

  const actorIds = [...new Set(entries.map((entry) => entry.actorUserId))];
  const actors = actorIds.length
    ? await prisma.user.findMany({
        where: { id: { in: actorIds } },
        select: { id: true, email: true },
      })
    : [];
  const emailByUserId = new Map(actors.map((user) => [user.id, user.email]));

  const dateLabel = (date: Date) =>
    new Intl.DateTimeFormat("en", { dateStyle: "medium", timeStyle: "short" }).format(date);

  return (
    <main>
      <h1>Audit log</h1>
      <p>The {ENTRY_LIMIT} most recent sensitive admin actions, across every recorded domain.</p>
      {entries.length === 0 ? (
        <p>No audit events recorded yet.</p>
      ) : (
        // Same "labelled, keyboard-focusable, horizontally scrollable
        // region" pattern as packages/ui/src/product-evidence.tsx's
        // compatibility matrix -- a table this wide cannot reflow at
        // 320/375px without losing column meaning, so it scrolls within its
        // own region instead of the page overflowing.
        <div
          role="region"
          aria-label="Audit log, scrollable"
          tabIndex={0}
          className="overflow-x-auto"
        >
          <table className="min-w-[44rem]">
            <thead>
              <tr>
                <th scope="col">When</th>
                <th scope="col">Domain</th>
                <th scope="col">Actor</th>
                <th scope="col">Action</th>
                <th scope="col">Reason</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((entry) => (
                <tr key={`${entry.domain}-${entry.id}`}>
                  <td>{dateLabel(entry.occurredAt)}</td>
                  <td>{DOMAIN_LABELS[entry.domain] ?? entry.domain}</td>
                  <td>{emailByUserId.get(entry.actorUserId) ?? entry.actorUserId}</td>
                  <td>{entry.summary}</td>
                  <td>{entry.reason ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}
