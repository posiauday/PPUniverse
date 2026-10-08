import { ACCEPTED_MIN_VOTES, ACCEPTED_SHARE, isAcceptedFix } from "@ppu/domain-content";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { feedbackRepository } from "../../../lib/feedback";
import { requireAdmin } from "../../../lib/require-admin";
import { SITE_NAME } from "../../../lib/seo/site";
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
 * "Votes and reports"): open "Something here changed?" reports to read and
 * close, and each guide's "Did this fix it?" counts, which only the admin
 * sees. Anyone who isn't an admin gets the site's 404.
 */
export default async function AdminFeedbackPage() {
  if (!(await requireAdmin())) notFound();
  const [reports, votes] = await Promise.all([
    feedbackRepository.listOpenReports(REPORT_LIMIT),
    feedbackRepository.listVoteSummaries(),
  ]);

  return (
    <main>
      <h1>Feedback</h1>
      <p>
        Reports from &ldquo;Something here changed?&rdquo; on any guide, and how readers answered
        &ldquo;Did this fix it?&rdquo;. A guide shows <strong>Accepted fix</strong> once{" "}
        {ACCEPTED_MIN_VOTES} or more readers voted and at least {Math.round(ACCEPTED_SHARE * 100)}%
        said yes.
      </p>

      <h2>Open reports ({reports.length})</h2>
      {reports.length === 0 ? (
        <p>No open reports.</p>
      ) : (
        <ul>
          {reports.map((report) => (
            <li key={report.id}>
              <p>
                <Link href={`/learn/${encodeURIComponent(report.articleSlug)}`}>
                  {report.articleTitle}
                </Link>{" "}
                ·{" "}
                <time dateTime={report.createdAt.toISOString()}>
                  {DATE.format(report.createdAt)} UTC
                </time>
              </p>
              {/* Shown as text only: React escapes it, and it is never rendered as Markdown. */}
              <p className="whitespace-pre-line">{report.message}</p>
              <CloseReportButton reportId={report.id} />
            </li>
          ))}
        </ul>
      )}

      <h2>Did this fix it?</h2>
      {votes.length === 0 ? (
        <p>No votes yet.</p>
      ) : (
        <div
          role="region"
          aria-label="Votes per guide, scrollable"
          tabIndex={0}
          className="overflow-x-auto"
        >
          <table>
            <caption className="sr-only">Votes per guide, most votes first</caption>
            <thead>
              <tr>
                <th scope="col">Guide</th>
                <th scope="col">Yes</th>
                <th scope="col">Not yet</th>
                <th scope="col">Accepted fix</th>
              </tr>
            </thead>
            <tbody>
              {votes.map((row) => (
                <tr key={row.articleId}>
                  <td>
                    <Link href={`/learn/${encodeURIComponent(row.slug)}`}>{row.title}</Link>
                  </td>
                  <td>{row.yes}</td>
                  <td>{row.no}</td>
                  <td>{isAcceptedFix(row) ? "Yes" : "Not yet"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}
