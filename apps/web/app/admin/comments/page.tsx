import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { commentRepository } from "../../../lib/comments";
import { commentsEnabled } from "../../../lib/feature-flags";
import { requireAdmin } from "../../../lib/require-admin";
import { SITE_NAME } from "../../../lib/seo/site";
import { ModerateButtons } from "./ModerateButtons";

export const metadata: Metadata = { title: `Comments | ${SITE_NAME}` };

// Reads the database per request.
export const dynamic = "force-dynamic";

const LIMIT = 100;

const DATE = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "UTC",
});

/**
 * Comment moderation (MVP-040): comments show at once, so this page lists the
 * reported ones first, then the latest. An admin removes a comment (hidden
 * from the guide, kept here), restores it, or marks it as the guide's
 * accepted fix. Anyone who isn't an admin, or with comments off, gets the 404.
 */
export default async function AdminCommentsPage() {
  if (!(await requireAdmin()) || !commentsEnabled()) notFound();
  const [reported, latest] = await Promise.all([
    commentRepository.listForAdmin("reported", LIMIT),
    commentRepository.listForAdmin("latest", LIMIT),
  ]);
  const sections = [
    {
      id: "reported",
      title: `Reported (${reported.length})`,
      rows: reported,
      empty: "No reported comments.",
    },
    { id: "latest", title: "Latest", rows: latest, empty: "No comments yet." },
  ];

  return (
    <main>
      <h1>Comments</h1>
      <p>
        Comments appear on guides as soon as they&rsquo;re posted. Remove anything that breaks the{" "}
        <Link href="/terms">Terms of use</Link>; a removed comment stays here, so you can restore
        it.
      </p>
      {sections.map((section) => (
        <section key={section.id} aria-labelledby={`${section.id}-heading`}>
          <h2 id={`${section.id}-heading`}>{section.title}</h2>
          {section.rows.length === 0 ? (
            <p>{section.empty}</p>
          ) : (
            <ul>
              {section.rows.map((comment) => (
                <li key={`${section.id}-${comment.id}`}>
                  <p>
                    <strong>{comment.displayName}</strong> on{" "}
                    <Link
                      href={`/${comment.on.kind === "guide" ? "guides" : "components"}/${encodeURIComponent(comment.on.slug)}#reader_comments`}
                    >
                      {comment.on.title}
                    </Link>{" "}
                    ·{" "}
                    <time dateTime={comment.createdAt.toISOString()}>
                      {DATE.format(comment.createdAt)} UTC
                    </time>
                    {comment.reportCount > 0
                      ? ` · ${comment.reportCount} ${comment.reportCount === 1 ? "report" : "reports"}`
                      : ""}
                    {comment.removed ? " · Removed" : ""}
                    {comment.accepted ? " · Accepted fix" : ""}
                  </p>
                  {/* Shown as text only: React escapes it. */}
                  <p className="whitespace-pre-line [overflow-wrap:anywhere]">{comment.body}</p>
                  <ModerateButtons
                    commentId={comment.id}
                    removed={comment.removed}
                    accepted={comment.accepted}
                    reported={comment.reportCount > 0}
                  />
                </li>
              ))}
            </ul>
          )}
        </section>
      ))}
    </main>
  );
}
