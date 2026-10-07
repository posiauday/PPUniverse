import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { loadAdminCounts, waitingCount, type AdminCounts } from "../../lib/admin-overview";
import { listRecentAuditLogEntries } from "../../lib/audit";
import { requireAdmin } from "../../lib/require-admin";
import { SITE_NAME } from "../../lib/seo/site";

export const metadata: Metadata = { title: `Admin | ${SITE_NAME}` };

// Reads the database per request.
export const dynamic = "force-dynamic";

const DATE = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "UTC",
});

const ACTION =
  "motion-press inline-flex min-h-11 items-center rounded-full border-[1.5px] border-foreground px-5 font-semibold no-underline";

/** What needs the admin now: one tinted card per kind of waiting work. */
function needs(counts: AdminCounts) {
  return [
    ...(counts.reportedComments != null
      ? [
          {
            key: "comments",
            tint: "bg-[#ffe4e6] text-[#9f1239]",
            label: "Reported comments",
            value: counts.reportedComments,
            line: "Keep or remove each one.",
            href: "/admin/comments",
            cta: "Review comments",
          },
        ]
      : []),
    {
      key: "reports",
      tint: "bg-tech-bi text-tech-bi-ink",
      label: "Guide reports",
      value: counts.guideReports,
      line: "Readers think something changed.",
      href: "/admin/feedback",
      cta: "Read reports",
    },
    {
      key: "drafts",
      tint: "bg-tech-apps text-tech-apps-ink",
      label: "Drafts",
      value: counts.guidesDraft + counts.updatesDraft,
      line: `${counts.guidesDraft} ${counts.guidesDraft === 1 ? "guide" : "guides"} and ${counts.updatesDraft} ${counts.updatesDraft === 1 ? "update" : "updates"} to check and publish.`,
      href:
        counts.guidesDraft > 0 || counts.updatesDraft === 0 ? "/admin/content" : "/admin/updates",
      cta: "Open drafts",
    },
  ];
}

/**
 * The admin overview (MVP-047, concept A "Command centre";
 * docs/final-decisions.md, 2026-10-07): what needs the admin now, then the
 * site's health over the last week, then recent activity from the audit log.
 * The sidebar (layout.tsx) reaches every area. Admins only; anyone else gets
 * the site's 404.
 */
export default async function AdminHomePage() {
  if (!(await requireAdmin())) notFound();
  const [counts, activity] = await Promise.all([
    loadAdminCounts(),
    listRecentAuditLogEntries(6).catch(() => []),
  ]);
  const waiting = waitingCount(counts);
  const votes = counts.votesThisWeek;
  const yesShare = votes.total > 0 ? Math.round((votes.yes / votes.total) * 100) : null;
  const health = [
    {
      label: "Guides published",
      value: String(counts.guidesPublished),
      line: `${counts.guidesDraft} ${counts.guidesDraft === 1 ? "draft" : "drafts"} waiting`,
    },
    {
      label: "Did this fix it?",
      value: yesShare === null ? "–" : `${yesShare}%`,
      line: votes.total === 0 ? "No votes this week" : `said yes, from ${votes.total} votes`,
    },
    ...(counts.commentsThisWeek != null
      ? [{ label: "Comments", value: String(counts.commentsThisWeek), line: "posted this week" }]
      : []),
    {
      label: "Updates published",
      value: String(counts.updatesPublished),
      line: `${counts.updatesDraft} ${counts.updatesDraft === 1 ? "draft" : "drafts"} waiting`,
    },
  ];

  return (
    <main className="flex flex-col gap-8 pb-10">
      <div className="flex flex-wrap items-end gap-4">
        <div className="mr-auto">
          <h1 className="font-display text-3xl font-bold md:text-4xl">Admin overview</h1>
          <p className="mt-1 text-lg">
            {waiting === 0
              ? "Nothing needs you right now."
              : `${waiting} ${waiting === 1 ? "thing needs" : "things need"} you.`}
          </p>
        </div>
        <Link href="/admin/updates/new" className={`${ACTION} bg-card text-foreground`}>
          New update
        </Link>
        <Link href="/admin/content/new" className={`${ACTION} bg-primary text-primary-foreground`}>
          New guide
        </Link>
      </div>

      <section aria-labelledby="needs_heading">
        <h2 id="needs_heading" className="sr-only">
          What needs you
        </h2>
        <ul className="grid gap-3.5 md:grid-cols-3">
          {needs(counts).map((card) => (
            <li
              key={card.key}
              className={`flex flex-col gap-1 rounded-[1.375rem] p-5 ${card.tint}`}
            >
              <p className="font-semibold">{card.label}</p>
              <p className="font-display text-4xl font-extrabold">{card.value}</p>
              <p className="text-sm">{card.line}</p>
              <Link
                href={card.href}
                className="mt-2 font-bold text-current underline underline-offset-4"
              >
                {card.cta}
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="health_heading">
        <h2 id="health_heading" className="font-display text-xl font-bold">
          Site health, last 7 days
        </h2>
        <ul className="mt-3 grid gap-3.5 sm:grid-cols-2 xl:grid-cols-4">
          {health.map((item) => (
            <li key={item.label} className="rounded-[1.375rem] border border-border bg-card p-5">
              <p className="text-sm text-muted-foreground">{item.label}</p>
              <p className="mt-1 font-display text-3xl font-extrabold">{item.value}</p>
              <p className="mt-1 text-sm text-muted-foreground">{item.line}</p>
            </li>
          ))}
        </ul>
      </section>

      <section
        aria-labelledby="activity_heading"
        className="rounded-[1.375rem] border border-border bg-card p-5"
      >
        <h2 id="activity_heading" className="font-display text-xl font-bold">
          Recent activity
        </h2>
        {activity.length === 0 ? (
          <p className="mt-2 text-muted-foreground">Nothing yet.</p>
        ) : (
          <ul className="mt-3 flex flex-col gap-2.5">
            {activity.map((entry) => (
              <li
                key={`${entry.domain}-${entry.id}`}
                className="flex flex-wrap gap-x-3 [overflow-wrap:anywhere]"
              >
                <span className="mr-auto">{entry.summary}</span>
                <time
                  dateTime={entry.occurredAt.toISOString()}
                  className="text-sm text-muted-foreground"
                >
                  {DATE.format(entry.occurredAt)} UTC
                </time>
              </li>
            ))}
          </ul>
        )}
        <p className="mt-4">
          <Link href="/admin/audit" className="font-semibold underline underline-offset-4">
            The full audit log
          </Link>
        </p>
      </section>
    </main>
  );
}
