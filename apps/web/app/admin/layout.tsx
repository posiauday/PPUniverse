import type { ReactNode } from "react";
import { loadAdminCounts } from "../../lib/admin-overview";
import { commentsEnabled } from "../../lib/feature-flags";
import { requireAdmin } from "../../lib/require-admin";
import { AdminNav, type AdminNavGroup } from "./AdminNav";

/**
 * Every admin page sits beside the admin sidebar (MVP-047, concept A
 * "Command centre"; docs/final-decisions.md, 2026-10-07). Only an admin sees
 * it: for anyone else the layout adds nothing, and each page still answers
 * with the site's ordinary 404, so the admin area isn't revealed.
 */
export default async function AdminLayout({ children }: { children: ReactNode }) {
  if (!(await requireAdmin())) return children;
  // If the counts can't be read, the sidebar still shows, without numbers.
  const counts = await loadAdminCounts().catch(() => null);

  const groups: AdminNavGroup[] = [
    { label: null, links: [{ href: "/admin", name: "Overview" }] },
    {
      label: "Content",
      links: [
        {
          href: "/admin/content",
          name: "Guides",
          ...(counts ? { count: { value: counts.guidesPublished, label: "published" } } : {}),
        },
        {
          href: "/admin/updates",
          name: "Updates",
          ...(counts ? { count: { value: counts.updatesPublished, label: "published" } } : {}),
        },
        { href: "/admin/topics", name: "Learn topics" },
        { href: "/admin/components", name: "Component library" },
        { href: "/admin/products", name: "Marketplace products" },
      ],
    },
    {
      label: "Community",
      links: [
        ...(commentsEnabled()
          ? [
              {
                href: "/admin/comments",
                name: "Comments",
                ...(counts?.reportedComments != null
                  ? { count: { value: counts.reportedComments, alert: true, label: "reported" } }
                  : {}),
              },
            ]
          : []),
        {
          href: "/admin/feedback",
          name: "Feedback",
          ...(counts
            ? { count: { value: counts.guideReports, alert: true, label: "open reports" } }
            : {}),
        },
      ],
    },
    {
      label: "People",
      links: [
        { href: "/admin/users", name: "Users and roles" },
        { href: "/admin/deletion-requests", name: "Deletion requests" },
      ],
    },
    {
      label: "Site",
      links: [
        { href: "/admin/settings", name: "Settings and indexing" },
        { href: "/admin/audit", name: "Audit log" },
      ],
    },
  ];

  return (
    <div className="mx-auto grid max-w-[90rem] gap-6 px-4 py-6 lg:grid-cols-[15rem_minmax(0,1fr)] lg:gap-8 lg:px-6">
      <aside className="rounded-[1.5rem] border border-border bg-card p-3 lg:sticky lg:top-24 lg:self-start">
        <p className="px-3 pt-1 font-display text-lg font-bold">Admin</p>
        <AdminNav groups={groups} />
      </aside>
      <div className="min-w-0">{children}</div>
    </div>
  );
}
