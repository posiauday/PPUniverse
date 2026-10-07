/**
 * Reader feedback on guides (MVP-039 votes, MVP-038 reports;
 * docs/final-decisions.md, 2026-10-07, "Votes and reports"):
 * - "Did this fix it?": Yes or Not yet, anonymous. A guide earns the
 *   "Accepted fix" badge at ACCEPTED_MIN_VOTES votes with at least
 *   ACCEPTED_SHARE saying Yes. Counts are shown only in the admin.
 * - "Something here changed?": an anonymous note of at most
 *   REPORT_MAX_LENGTH characters, no contact details, kept until the admin
 *   closes it (then deleted).
 */

export const ACCEPTED_MIN_VOTES = 10;
export const ACCEPTED_SHARE = 0.8;

export const REPORT_MIN_LENGTH = 10;
export const REPORT_MAX_LENGTH = 500;

export interface VoteSummary {
  yes: number;
  no: number;
}

/** True when enough readers said the guide fixed their problem. */
export function isAcceptedFix(summary: VoteSummary): boolean {
  const total = summary.yes + summary.no;
  return total >= ACCEPTED_MIN_VOTES && summary.yes / total >= ACCEPTED_SHARE;
}

export type ReportProblem = "too-short" | "too-long";

/**
 * A report's message, trimmed and with its whitespace tidied, or why it was
 * refused. Counted in code points, so an emoji is one character.
 */
export function cleanReportMessage(
  raw: string,
): { ok: true; message: string } | { ok: false; problem: ReportProblem } {
  const message = raw.replace(/\r\n?/g, "\n").replace(/[ \t]+/g, " ").trim();
  const length = [...message].length;
  if (length < REPORT_MIN_LENGTH) return { ok: false, problem: "too-short" };
  if (length > REPORT_MAX_LENGTH) return { ok: false, problem: "too-long" };
  return { ok: true, message };
}

export interface GuideFeedbackRow extends VoteSummary {
  articleId: string;
  slug: string;
  title: string;
}

export interface OpenReport {
  id: string;
  articleSlug: string;
  articleTitle: string;
  message: string;
  createdAt: Date;
}

export interface FeedbackRepository {
  recordVote(articleId: string, helpful: boolean): Promise<void>;
  recordReport(articleId: string, message: string): Promise<void>;
  voteSummary(articleId: string): Promise<VoteSummary>;
  /** Every guide with at least one vote, most votes first. */
  listVoteSummaries(): Promise<GuideFeedbackRow[]>;
  listOpenReports(limit: number): Promise<OpenReport[]>;
  /** Deletes the report; false when it was already gone. */
  closeReport(id: string): Promise<boolean>;
  /**
   * Counts one use of an allowance keyed by `keyHash` (a SHA-256 hex), and
   * says whether it was within `limit` uses per `windowMs`.
   */
  consumeAllowance(keyHash: string, limit: number, windowMs: number, now: Date): Promise<boolean>;
}
