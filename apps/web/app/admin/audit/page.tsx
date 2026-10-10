import { prisma } from "@ppu/db";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { listRecentAuditLogEntries, type AuditLogDomain } from "../../../lib/audit";
import { requireAdmin } from "../../../lib/require-admin";
import { SITE_NAME } from "../../../lib/seo/site";
import { listHref } from "../AdminList";
import { AdminPageHeader } from "../AdminPageHeader";

export const metadata: Metadata = { title: `Audit log | ${SITE_NAME}` };

// Reads the database per request.
export const dynamic = "force-dynamic";

const ENTRY_LIMIT = 100;

const DOMAIN_LABELS: Record<AuditLogDomain, string> = {
  product_status: "Product status",
  release_publish: "Release",
  deletion_request: "Deletion request",
  article_publish: "Content",
  learn_publish: "Learn",
  component: "Component library",
  role_change: "Roles",
  site_switch: "Switches",
  update_publish: "Updates",
  content_schedule: "Schedule",
};

/** Each area's chip colours (dark ink on a light tint, 4.5:1 or better). */
const DOMAIN_TINT: Record<AuditLogDomain, string> = {
  product_status: "bg-[#fee2e2] text-[#991b1b]",
  release_publish: "bg-[#e0e7ff] text-[#3730a3]",
  deletion_request: "bg-[#ffe4e6] text-[#9f1239]",
  article_publish: "bg-[#dcfce7] text-[#166534]",
  learn_publish: "bg-[#fef3c7] text-[#92400e]",
  component: "bg-[#dbeafe] text-[#1e40af]",
  role_change: "bg-[#ede9fe] text-[#5b21b6]",
  site_switch: "bg-[#e2e8f0] text-[#334155]",
  update_publish: "bg-[#ccfbf1] text-[#115e59]",
  content_schedule: "bg-[#fae8ff] text-[#86198f]",
};

const DATE = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "UTC",
});

/**
 * MVP-019's audit-log admin surface (FR-015/NFR-009; redesigned in MVP-052
 * phase 3): the most recent sensitive admin actions across every recorded
 * area, each with its area, what happened, who did it, when and why, and tabs
 * to show one area. Read-only. Anyone who isn't an admin gets the site's 404
 * (the role is read from the database). `listRecentAuditLogEntries` merges the
 * per-area event tables rather than reading a unified table
 * (docs/final-decisions.md, "MVP-019 operations console and audit", question 4).
 */
export default async function AdminAuditPage({
  searchParams,
}: {
  searchParams: Promise<{ area?: string | string[] }>;
}) {
  if (!(await requireAdmin())) notFound();
  const areaParam = (await searchParams).area;
  const entries = await listRecentAuditLogEntries(ENTRY_LIMIT);
  const area =
    typeof areaParam === "string" && areaParam in DOMAIN_LABELS
      ? (areaParam as AuditLogDomain)
      : null;
  const shown = area ? entries.filter((entry) => entry.domain === area) : entries;
  const present = (Object.keys(DOMAIN_LABELS) as AuditLogDomain[]).filter((domain) =>
    entries.some((entry) => entry.domain === domain),
  );

  const actorIds = [...new Set(shown.map((entry) => entry.actorUserId))];
  const actors = actorIds.length
    ? await prisma.user.findMany({
        where: { id: { in: actorIds } },
        select: { id: true, email: true, displayName: true },
      })
    : [];
  const actorName = new Map(actors.map((user) => [user.id, user.displayName ?? user.email]));

  return (
    <main className="flex flex-col gap-6 pb-10">
      <AdminPageHeader
        title="Audit log"
        description={`The ${ENTRY_LIMIT} most recent sensitive admin actions, across every recorded area.`}
      />
      {present.length > 1 ? (
        <nav
          aria-label="Area"
          className="flex max-w-full flex-wrap gap-1 rounded-2xl bg-muted p-1 text-sm font-semibold"
        >
          {[null, ...present].map((domain) => (
            <Link
              key={domain ?? "all"}
              href={listHref("/admin/audit", {}, { area: domain ?? undefined })}
              aria-current={area === domain ? "page" : undefined}
              className={`inline-flex min-h-10 items-center gap-1.5 rounded-full px-4 no-underline ${
                area === domain
                  ? "bg-card text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {domain ? DOMAIN_LABELS[domain] : "All"}
              <span className="text-xs font-normal">
                {domain
                  ? entries.filter((entry) => entry.domain === domain).length
                  : entries.length}
              </span>
            </Link>
          ))}
        </nav>
      ) : null}
      {shown.length === 0 ? (
        <p className="rounded-[1.25rem] border border-dashed border-border bg-card p-6 text-center text-muted-foreground">
          No audit events recorded yet.
        </p>
      ) : (
        <ol className="overflow-hidden rounded-[1.5rem] border border-border bg-card">
          {shown.map((entry) => (
            <li
              key={`${entry.domain}-${entry.id}`}
              className="flex flex-col gap-1.5 border-b border-border px-5 py-4 last:border-0 sm:flex-row sm:items-start sm:gap-4"
            >
              <span
                className={`w-fit shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold sm:mt-0.5 sm:w-36 sm:text-center ${DOMAIN_TINT[entry.domain]}`}
              >
                {DOMAIN_LABELS[entry.domain]}
              </span>
              <div className="min-w-0 flex-1 [overflow-wrap:anywhere]">
                <p>{entry.summary}</p>
                <p className="mt-0.5 text-sm text-muted-foreground">
                  {actorName.get(entry.actorUserId) ?? entry.actorUserId} ·{" "}
                  <time dateTime={entry.occurredAt.toISOString()}>
                    {DATE.format(entry.occurredAt)} UTC
                  </time>
                  {entry.reason ? <> · Reason: {entry.reason}</> : null}
                </p>
              </div>
            </li>
          ))}
        </ol>
      )}
    </main>
  );
}
