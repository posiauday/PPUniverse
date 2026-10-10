import type { AdminComment } from "@ppu/domain-content";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { commentRepository } from "../../../lib/comments";
import { commentsEnabled } from "../../../lib/feature-flags";
import { requireAdmin } from "../../../lib/require-admin";
import { SITE_NAME } from "../../../lib/seo/site";
import { Avatar } from "../../Avatar";
import { AdminPageHeader } from "../AdminPageHeader";
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

const CHIP = "rounded-full px-2 py-px text-xs font-semibold";

/** One comment as a card: who, where, when, its state, the text, and the moderation buttons. */
function CommentCard({ comment }: { comment: AdminComment }) {
  const where = comment.on.kind === "guide" ? "guides" : "components";
  return (
    <li className="flex flex-col gap-3 rounded-[1.25rem] border border-border bg-card p-5">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
        <Avatar seed={comment.avatarSeed} name={comment.displayName} size={36} />
        <span className="font-semibold">{comment.displayName}</span>
        <time dateTime={comment.createdAt.toISOString()} className="text-sm text-muted-foreground">
          {DATE.format(comment.createdAt)} UTC
        </time>
        {comment.reportCount > 0 ? (
          <span className={`${CHIP} bg-[#ffe4e6] text-[#9f1239]`}>
            {comment.reportCount} {comment.reportCount === 1 ? "report" : "reports"}
          </span>
        ) : null}
        {comment.removed ? (
          <span className={`${CHIP} bg-[#e2e8f0] text-[#334155]`}>Removed</span>
        ) : null}
        {comment.accepted ? (
          <span className={`${CHIP} bg-[#dcfce7] text-[#166534]`}>
            {comment.on.kind === "guide" ? "Accepted fix" : "Accepted answer"}
          </span>
        ) : null}
      </div>
      <p className="text-sm text-muted-foreground">
        {comment.on.kind === "guide" ? "Comment on " : "Question on "}
        <Link
          href={`/${where}/${encodeURIComponent(comment.on.slug)}#reader_comments`}
          className="font-semibold text-foreground"
        >
          {comment.on.title}
        </Link>
      </p>
      {/* Shown as text only: React escapes it. */}
      <blockquote className="border-l-4 border-[#c4b5fd] pl-4 whitespace-pre-line [overflow-wrap:anywhere]">
        {comment.body}
      </blockquote>
      <ModerateButtons
        commentId={comment.id}
        removed={comment.removed}
        accepted={comment.accepted}
        reported={comment.reportCount > 0}
        kind={comment.on.kind}
      />
    </li>
  );
}

/**
 * Comment moderation (MVP-040, MVP-051; redesigned in MVP-052 phase 3):
 * comments show at once, so this page lists the reported ones first, then the
 * latest, as cards. An admin removes a comment (hidden from its page, kept
 * here), restores it, keeps a reported one, or marks a guide's accepted fix or
 * a component's accepted answer. Anyone who isn't an admin, or with comments
 * off, gets the 404.
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
      empty: "No reported comments. Nothing to check.",
    },
    { id: "latest", title: "Latest", rows: latest, empty: "No comments yet." },
  ];
  return (
    <main className="flex flex-col gap-8 pb-10">
      <AdminPageHeader
        title="Comments"
        description={
          <>
            Comments on guides and questions on components show as soon as they&rsquo;re posted.
            Remove anything that breaks the <Link href="/terms">Terms of use</Link>; a removed
            comment stays here, so you can restore it.
          </>
        }
      />
      {sections.map((section) => (
        <section
          key={section.id}
          aria-labelledby={`${section.id}-heading`}
          className="flex flex-col gap-3"
        >
          <h2 id={`${section.id}-heading`} className="font-display text-xl font-bold">
            {section.title}
          </h2>
          {section.rows.length === 0 ? (
            <p className="rounded-[1.25rem] border border-dashed border-border bg-card p-6 text-center text-muted-foreground">
              {section.empty}
            </p>
          ) : (
            <ul className="flex flex-col gap-3">
              {section.rows.map((comment) => (
                <CommentCard key={`${section.id}-${comment.id}`} comment={comment} />
              ))}
            </ul>
          )}
        </section>
      ))}
    </main>
  );
}
