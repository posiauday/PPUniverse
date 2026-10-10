import { prisma } from "@ppu/db";
import { commentsEnabled } from "./feature-flags";

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

/** The numbers the admin sidebar and overview show (MVP-047, concept A). */
export interface AdminCounts {
  guidesPublished: number;
  guidesDraft: number;
  updatesPublished: number;
  updatesDraft: number;
  /** Open "Something here changed?" reports. */
  guideReports: number;
  /** Component drafts not yet paste-tested (admin redesign, 2026-10-10). */
  componentsToTest: number;
  /** Shown comments with reports waiting; null while comments are off. */
  reportedComments: number | null;
  /** Comments posted in the last 7 days; null while comments are off. */
  commentsThisWeek: number | null;
  /** "Did this fix it?" votes in the last 7 days, and how many said yes. */
  votesThisWeek: { total: number; yes: number };
}

/**
 * Counts for the admin, from the database in one round of parallel queries.
 * Cheap counts only, so every admin page can show them in its sidebar.
 */
export async function loadAdminCounts(now = new Date()): Promise<AdminCounts> {
  const since = new Date(now.getTime() - WEEK_MS);
  const comments = commentsEnabled();
  const [
    guidesPublished,
    guidesDraft,
    updatesPublished,
    updatesDraft,
    guideReports,
    componentsToTest,
    reportedComments,
    commentsThisWeek,
    votes,
    yes,
  ] = await Promise.all([
    prisma.article.count({ where: { status: "PUBLISHED" } }),
    prisma.article.count({ where: { status: "DRAFT" } }),
    prisma.updateItem.count({ where: { status: "PUBLISHED" } }),
    prisma.updateItem.count({ where: { status: "DRAFT" } }),
    prisma.articleReport.count(),
    prisma.libraryComponent.count({ where: { status: "DRAFT", hidden: false, testedAt: null } }),
    comments
      ? prisma.articleComment.count({ where: { removedAt: null, reports: { some: {} } } })
      : Promise.resolve(null),
    comments
      ? prisma.articleComment.count({ where: { createdAt: { gte: since } } })
      : Promise.resolve(null),
    prisma.articleVote.count({ where: { createdAt: { gte: since } } }),
    prisma.articleVote.count({ where: { createdAt: { gte: since }, helpful: true } }),
  ]);
  return {
    guidesPublished,
    guidesDraft,
    updatesPublished,
    updatesDraft,
    guideReports,
    componentsToTest,
    reportedComments,
    commentsThisWeek,
    votesThisWeek: { total: votes, yes },
  };
}

/** How many things wait on the admin: reports, reported comments, drafts and paste-tests. */
export function waitingCount(counts: AdminCounts): number {
  return (
    counts.guideReports +
    (counts.reportedComments ?? 0) +
    counts.guidesDraft +
    counts.updatesDraft +
    counts.componentsToTest
  );
}
