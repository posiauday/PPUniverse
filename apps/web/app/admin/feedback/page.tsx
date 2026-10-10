import { ACCEPTED_MIN_VOTES, ACCEPTED_SHARE, isAcceptedFix } from "@ppu/domain-content";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { feedbackRepository } from "../../../lib/feedback";
import { requireAdmin } from "../../../lib/require-admin";
import { SITE_NAME } from "../../../lib/seo/site";
import { AdminPageHeader } from "../AdminPageHeader";
import { CloseReportButton } from "./CloseReportButton";

export const metadata: Metadata = { title: `Feedback | ${SITE_NAME}` };

// Reads the database per request.
export const dynamic = "force-dynamic";

/** The oldest reports first; the page shows this many at a time. */
const REPORT_LIMIT = 100;

const DATE = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "UTC",
});

/**
 * Reader feedback (MVP-039, MVP-038; docs/final-decisions.md, 2026-10-07,
 * "Votes and reports"; redesigned in MVP-052 phase 3): open "Something here
 * changed?" reports as cards to read and close, and each guide's "Did this
 * fix it?" counts, which only the admin sees, with a bar for the share of
 * yes. Anyone who isn't an admin gets the site's 404.
 */
export default async function AdminFeedbackPage() {
  if (!(await requireAdmin())) notFound();
  const [reports, votes] = await Promise.all([
    feedbackRepository.listOpenReports(REPORT_LIMIT),
    feedbackRepository.listVoteSummaries(),
  ]);
  return (
    <main className="flex flex-col gap-8 pb-10">
      <AdminPageHeader
        title="Feedback"
        description={
          <>
            Reports from &ldquo;Something here changed?&rdquo; on any guide, and how readers
            answered &ldquo;Did this fix it?&rdquo;. A guide shows <strong>Accepted fix</strong>{" "}
            once {ACCEPTED_MIN_VOTES} or more readers voted and at least{" "}
            {Math.round(ACCEPTED_SHARE * 100)}% said yes.
          </>
        }
      />

      <section aria-labelledby="reports_heading" className="flex flex-col gap-3">
        <h2 id="reports_heading" className="font-display text-xl font-bold">
          Open reports ({reports.length})
        </h2>
        {reports.length === 0 ? (
          <p className="rounded-[1.25rem] border border-dashed border-border bg-card p-6 text-center text-muted-foreground">
            No open reports. Every guide is up to date, as far as readers know.
          </p>
        ) : (
          <ul className="flex flex-col gap-3">
            {reports.map((report) => (
              <li
                key={report.id}
                className="flex flex-col gap-3 rounded-[1.25rem] border border-border bg-card p-5"
              >
                <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
                  <Link
                    href={`/guides/${encodeURIComponent(report.articleSlug)}`}
                    className="text-base font-semibold text-foreground"
                  >
                    {report.articleTitle}
                  </Link>
                  <time dateTime={report.createdAt.toISOString()}>
                    {DATE.format(report.createdAt)} UTC
                  </time>
                </p>
                {/* Shown as text only: React escapes it, and it is never rendered as Markdown. */}
                <blockquote className="border-l-4 border-[#fcd34d] pl-4 whitespace-pre-line [overflow-wrap:anywhere]">
                  {report.message}
                </blockquote>
                <CloseReportButton reportId={report.id} />
              </li>
            ))}
          </ul>
        )}
      </section>

      <section aria-labelledby="votes_heading" className="flex flex-col gap-3">
        <h2 id="votes_heading" className="font-display text-xl font-bold">
          Did this fix it?
        </h2>
        {votes.length === 0 ? (
          <p className="rounded-[1.25rem] border border-dashed border-border bg-card p-6 text-center text-muted-foreground">
            No votes yet.
          </p>
        ) : (
          <div
            role="region"
            aria-label="Votes per guide, scrollable"
            tabIndex={0}
            className="overflow-x-auto rounded-[1.25rem] border border-border bg-card"
          >
            <table className="w-full min-w-[36rem] text-left text-sm">
              <caption className="sr-only">Votes per guide, most votes first</caption>
              <thead className="bg-muted/60 text-xs tracking-wide text-muted-foreground uppercase">
                <tr>
                  <th scope="col" className="px-5 py-3 font-semibold">
                    Guide
                  </th>
                  <th scope="col" className="px-3 py-3 font-semibold">
                    Yes
                  </th>
                  <th scope="col" className="px-3 py-3 font-semibold">
                    Not yet
                  </th>
                  <th scope="col" className="px-3 py-3 font-semibold">
                    Share of yes
                  </th>
                  <th scope="col" className="px-5 py-3 font-semibold">
                    Accepted fix
                  </th>
                </tr>
              </thead>
              <tbody>
                {votes.map((row) => {
                  const total = row.yes + row.no;
                  const share = total > 0 ? Math.round((row.yes / total) * 100) : 0;
                  const accepted = isAcceptedFix(row);
                  return (
                    <tr key={row.articleId} className="border-t border-border">
                      <td className="px-5 py-3 [overflow-wrap:anywhere]">
                        <Link
                          href={`/guides/${encodeURIComponent(row.slug)}`}
                          className="font-semibold"
                        >
                          {row.title}
                        </Link>
                      </td>
                      <td className="px-3 py-3">{row.yes}</td>
                      <td className="px-3 py-3">{row.no}</td>
                      <td className="px-3 py-3">
                        <span className="flex items-center gap-2">
                          <span
                            aria-hidden="true"
                            className="h-2 w-20 overflow-hidden rounded-full bg-muted"
                          >
                            <span
                              className="block h-full rounded-full bg-[#7c3aed]"
                              style={{ width: `${share}%` }}
                            />
                          </span>
                          {share}%
                        </span>
                      </td>
                      <td className="px-5 py-3">
                        {accepted ? (
                          <span className="rounded-full bg-[#dcfce7] px-2 py-px text-xs font-semibold text-[#166534]">
                            Yes
                          </span>
                        ) : (
                          "Not yet"
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  );
}
