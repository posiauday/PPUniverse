import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import { loadInbox, type InboxGroup, type InboxItem } from "../../lib/admin-inbox";
import { loadAdminCounts } from "../../lib/admin-overview";
import { listRecentAuditLogEntries } from "../../lib/audit";
import { requireAdmin } from "../../lib/require-admin";
import { SITE_NAME } from "../../lib/seo/site";
import { ADMIN_ACTION, AdminPageHeader } from "./AdminPageHeader";
import { ModerateButtons } from "./comments/ModerateButtons";
import { ArticlePublishControl } from "./content/ArticlePublishControl";
import { CloseReportButton } from "./feedback/CloseReportButton";
import { UpdatePublishControl } from "./updates/UpdatePublishControl";

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

/** A short excerpt of a reader's text, on one line. */
function excerpt(text: string, max = 110): string {
  const line = text.replace(/\s+/g, " ").trim();
  return line.length > max ? `${line.slice(0, max - 1).trimEnd()}…` : line;
}

const LOOK: Record<InboxItem["kind"], { chip: string; tint: string; icon: string }> = {
  comment: { chip: "Reported", tint: "bg-[#ffe4e6] text-[#9f1239]", icon: "M4 5h16v11H9l-5 4z" },
  report: {
    chip: "Guide report",
    tint: "bg-[#fef3c7] text-[#92400e]",
    icon: "M5 21V4h11l-2 4 2 4H5",
  },
  "guide-draft": {
    chip: "Draft guide",
    tint: "bg-[#ede9fe] text-[#5b21b6]",
    icon: "M4 20h4L19 9l-4-4L4 16zM14 6l4 4",
  },
  "update-draft": {
    chip: "Draft update",
    tint: "bg-[#ede9fe] text-[#5b21b6]",
    icon: "M4 20h4L19 9l-4-4L4 16zM14 6l4 4",
  },
  test: {
    chip: "Paste-test",
    tint: "bg-[#dbeafe] text-[#1e40af]",
    icon: "M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z",
  },
  scheduled: {
    chip: "Scheduled",
    tint: "bg-[#dcfce7] text-[#166534]",
    icon: "M12 7v5l3 2M12 3a9 9 0 100 18 9 9 0 000-18z",
  },
};

const SMALL_LINK =
  "inline-flex min-h-11 items-center rounded-full border border-border bg-card px-4 text-sm font-semibold no-underline hover:border-foreground";

/** What one inbox row says and the controls it offers: the same as on its own page. */
function describe(item: InboxItem): { title: ReactNode; meta: ReactNode; actions: ReactNode } {
  switch (item.kind) {
    case "comment":
      return {
        title: <>“{excerpt(item.text)}”</>,
        meta: (
          <>
            {item.on.kind === "guide" ? "Comment on " : "Question on "}
            <Link
              href={`/${item.on.kind === "guide" ? "guides" : "components"}/${encodeURIComponent(item.on.slug)}#reader_comments`}
              className="underline underline-offset-2"
            >
              {item.on.title}
            </Link>{" "}
            · {item.reports} {item.reports === 1 ? "report" : "reports"}
          </>
        ),
        actions: (
          <ModerateButtons
            commentId={item.id}
            removed={false}
            accepted={false}
            reported
            kind={item.on.kind}
            compact
          />
        ),
      };
    case "report":
      return {
        title: <>“{excerpt(item.text)}”</>,
        meta: (
          <>
            On{" "}
            <Link
              href={`/guides/${encodeURIComponent(item.guide.slug)}`}
              className="underline underline-offset-2"
            >
              {item.guide.title}
            </Link>
          </>
        ),
        actions: <CloseReportButton reportId={item.id} />,
      };
    case "guide-draft":
      return {
        title: item.title,
        meta: <>Edited {DATE.format(item.at)} UTC</>,
        actions: (
          <>
            <Link href={`/preview/guides/${item.id}`} className={SMALL_LINK}>
              Preview
            </Link>
            <Link href={`/admin/content/${item.id}/edit`} className={SMALL_LINK}>
              Edit
            </Link>
            <ArticlePublishControl articleId={item.id} />
          </>
        ),
      };
    case "update-draft":
      return {
        title: item.title,
        meta: <>Edited {DATE.format(item.at)} UTC</>,
        actions: (
          <>
            <Link href={`/preview/updates/${item.id}`} className={SMALL_LINK}>
              Preview
            </Link>
            <Link href={`/admin/updates/${item.id}/edit`} className={SMALL_LINK}>
              Edit
            </Link>
            <UpdatePublishControl updateId={item.id} />
          </>
        ),
      };
    case "test":
      return {
        title: <>{item.title} is waiting for its paste-test</>,
        meta: <>Component draft · version {item.version}</>,
        actions: (
          <Link href={`/admin/components/${item.id}`} className={SMALL_LINK}>
            Open and test
          </Link>
        ),
      };
    case "scheduled":
      return {
        title: item.title,
        meta: (
          <>
            {item.what === "guide" ? "Guide" : "Update"} goes live {DATE.format(item.at)} UTC
          </>
        ),
        actions: (
          <Link
            href={
              item.what === "guide"
                ? `/admin/content/${item.id}/edit`
                : `/admin/updates/${item.id}/edit`
            }
            className={SMALL_LINK}
          >
            Change time
          </Link>
        ),
      };
  }
}

const TABS: { key: "all" | InboxGroup; label: string }[] = [
  { key: "all", label: "All" },
  { key: "community", label: "Community" },
  { key: "content", label: "Content" },
];

function Glyph({ d }: { d: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className="size-5"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d={d} />
    </svg>
  );
}

/**
 * The admin overview as an Inbox (docs/final-decisions.md, 2026-10-10, "Admin
 * centre: concept A with B's Inbox"; first MVP-047): everything waiting for
 * the admin in one list, community first, each with the controls its own page
 * offers. Beside it: this week's numbers, quick create and recent activity.
 * Admins only; anyone else gets the site's 404.
 */
export default async function AdminHomePage({
  searchParams,
}: {
  searchParams: Promise<{ show?: string | string[] }>;
}) {
  if (!(await requireAdmin())) notFound();
  const showParam = (await searchParams).show;
  const show = showParam === "community" || showParam === "content" ? showParam : "all";
  const [counts, inbox, activity] = await Promise.all([
    loadAdminCounts(),
    loadInbox(),
    listRecentAuditLogEntries(5).catch(() => []),
  ]);
  const count = (key: "all" | InboxGroup) =>
    key === "all" ? inbox.length : inbox.filter((item) => item.group === key).length;
  const shown = show === "all" ? inbox : inbox.filter((item) => item.group === show);
  const votes = counts.votesThisWeek;
  const yesShare = votes.total > 0 ? Math.round((votes.yes / votes.total) * 100) : null;

  return (
    <main className="flex flex-col gap-6 pb-10">
      <AdminPageHeader
        title="Inbox"
        description={
          inbox.length === 0
            ? "Nothing waits for you right now."
            : `${inbox.length} ${inbox.length === 1 ? "thing waits" : "things wait"} for you, community first.`
        }
        actions={
          <>
            <Link
              href="/admin/updates/new"
              className={`${ADMIN_ACTION} border border-border bg-card text-foreground`}
            >
              New update
            </Link>
            <Link
              href="/admin/content/new"
              className={`${ADMIN_ACTION} bg-primary text-primary-foreground`}
            >
              New guide
            </Link>
          </>
        }
      />

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_20rem]">
        <section aria-labelledby="inbox_heading">
          <h2 id="inbox_heading" className="sr-only">
            What waits for you
          </h2>
          <nav
            aria-label="Show"
            className="flex w-fit flex-wrap rounded-full bg-muted p-1 text-sm font-semibold"
          >
            {TABS.map((tab) => (
              <Link
                key={tab.key}
                href={tab.key === "all" ? "/admin" : `/admin?show=${tab.key}`}
                aria-current={show === tab.key ? "page" : undefined}
                className={`inline-flex min-h-10 items-center gap-1.5 rounded-full px-4 no-underline ${
                  show === tab.key
                    ? "bg-card text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {tab.label}
                <span className="text-xs font-normal">{count(tab.key)}</span>
              </Link>
            ))}
          </nav>

          {shown.length === 0 ? (
            <div className="mt-4 rounded-[1.5rem] border border-dashed border-border bg-card p-10 text-center">
              <p className="font-display text-2xl font-bold">All clear</p>
              <p className="mt-1 text-muted-foreground">
                Nothing here waits for you. New reports and drafts show up as they come in.
              </p>
            </div>
          ) : (
            <ul className="mt-4 flex flex-col gap-3">
              {shown.map((item) => {
                const look = LOOK[item.kind];
                const text = describe(item);
                return (
                  <li
                    key={`${item.kind}-${item.id}`}
                    className="flex flex-col gap-3 rounded-[1.25rem] border border-border bg-card p-4 sm:flex-row sm:items-center"
                  >
                    <span
                      aria-hidden="true"
                      className={`hidden size-11 shrink-0 place-items-center rounded-xl sm:grid ${look.tint}`}
                    >
                      <Glyph d={look.icon} />
                    </span>
                    <div className="min-w-0 flex-1 [overflow-wrap:anywhere]">
                      <p>
                        <span
                          className={`mr-2 rounded-full px-2 py-px text-xs font-semibold ${look.tint}`}
                        >
                          {look.chip}
                        </span>
                        <span className="font-semibold">{text.title}</span>
                      </p>
                      <p className="mt-0.5 text-sm text-muted-foreground">{text.meta}</p>
                    </div>
                    <div className="flex shrink-0 flex-wrap items-center gap-2">{text.actions}</div>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        <aside className="flex flex-col gap-4" aria-label="At a glance">
          <section
            aria-labelledby="week_heading"
            className="rounded-[1.5rem] bg-gradient-to-br from-[#6d28d9] to-[#be185d] p-5 text-white"
          >
            <h2 id="week_heading" className="text-sm font-semibold">
              This week
            </h2>
            <p className="mt-1 font-display text-4xl font-bold">
              {counts.commentsThisWeek ?? 0}{" "}
              {counts.commentsThisWeek === 1 ? "comment" : "comments"}
            </p>
            <p className="mt-1 text-sm">
              {yesShare === null ? "No fix votes yet" : `${yesShare}% said a fix worked`} ·{" "}
              {counts.guidesPublished} guides live
            </p>
          </section>

          <section
            aria-labelledby="create_heading"
            className="rounded-[1.5rem] border border-border bg-card p-5"
          >
            <h2 id="create_heading" className="font-semibold">
              Quick create
            </h2>
            <div className="mt-3 grid grid-cols-2 gap-2 text-sm font-semibold">
              {[
                ["Guide", "/admin/content/new"],
                ["Update", "/admin/updates/new"],
                ["Topic", "/admin/topics/new"],
                ["Product", "/admin/products/new"],
              ].map(([label, href]) => (
                <Link
                  key={href}
                  href={href!}
                  className="flex min-h-11 items-center gap-1.5 rounded-xl bg-muted px-3 text-foreground no-underline hover:bg-[#ede9fe]"
                >
                  <span aria-hidden="true">+</span>
                  {label}
                </Link>
              ))}
            </div>
          </section>

          <section
            aria-labelledby="activity_heading"
            className="rounded-[1.5rem] border border-border bg-card p-5"
          >
            <h2 id="activity_heading" className="font-semibold">
              Recent activity
            </h2>
            {activity.length === 0 ? (
              <p className="mt-2 text-sm text-muted-foreground">Nothing yet.</p>
            ) : (
              <ol className="mt-3 flex flex-col gap-3 border-l-2 border-border pl-4">
                {activity.map((entry) => (
                  <li
                    key={`${entry.domain}-${entry.id}`}
                    className="relative text-sm [overflow-wrap:anywhere]"
                  >
                    <span
                      aria-hidden="true"
                      className="absolute top-1.5 -left-[1.3rem] size-2.5 rounded-full bg-[#8b5cf6] ring-4 ring-card"
                    />
                    {entry.summary}
                    <time
                      dateTime={entry.occurredAt.toISOString()}
                      className="block text-muted-foreground"
                    >
                      {DATE.format(entry.occurredAt)} UTC
                    </time>
                  </li>
                ))}
              </ol>
            )}
            <p className="mt-4 text-sm">
              <Link href="/admin/audit" className="font-semibold underline underline-offset-4">
                The full audit log
              </Link>
            </p>
          </section>
        </aside>
      </div>
    </main>
  );
}
