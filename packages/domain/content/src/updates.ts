import { isValidArticleSlug } from "./transitions.js";
import type { ArticleStatus, Technology } from "./types.js";

/**
 * Platform updates (MVP-033 slice D; docs/final-decisions.md, "Governance &
 * admin area and the Updates badge"): short notes, in our own words, on what
 * Microsoft changed in Power Platform and whether a reader needs to act, each
 * linked to Microsoft's own announcement. The agent drafts them from official
 * sources; the product owner reviews and publishes. There is no detail page:
 * the source link is the detail.
 */

/** What kind of change an update describes. */
export type UpdateKind = "FEATURE" | "LICENSING" | "DEPRECATION" | "RETIREMENT";

export const UPDATE_KINDS: readonly UpdateKind[] = [
  "FEATURE",
  "LICENSING",
  "DEPRECATION",
  "RETIREMENT",
];

/** The short label shown on each update, as the Updates board draws it. */
export const UPDATE_KIND_LABEL: Readonly<Record<UpdateKind, string>> = {
  FEATURE: "Feature update",
  LICENSING: "Licensing",
  DEPRECATION: "Deprecated",
  RETIREMENT: "Retired",
};

/** Kinds that also appear in the deprecation tracker. */
export const TRACKED_KINDS: readonly UpdateKind[] = ["DEPRECATION", "RETIREMENT"];

/** Same lifecycle as articles: DRAFT until the product owner publishes it. */
export type UpdateStatus = ArticleStatus;

export interface UpdateRecord {
  id: string;
  /** Unique, URL-safe: the item's anchor on /updates and the importer's key. */
  slug: string;
  title: string;
  /** One or two sentences in our words. Plain text. */
  summary: string;
  /** The area it concerns; null for platform-wide changes. */
  technology: Technology | null;
  kind: UpdateKind;
  /** A few words on what to do ("No action", "Check your approvers"); null for none. */
  action: string | null;
  /** Microsoft's announcement. Always https on a Microsoft domain (isValidUpdateSourceUrl). */
  sourceUrl: string;
  /** When the change takes (or took) effect, if Microsoft gives a date. Drives the tracker. */
  effectiveDate: Date | null;
  /** What to switch to, for the tracker; null when Microsoft names none. */
  replacement: string | null;
  status: UpdateStatus;
  /** Null until published. Set once, never rewritten. Drives "new since your last visit". */
  publishedAt: Date | null;
  /** MVP-050: a DRAFT's planned publish time; null when none. Cleared on publish. */
  scheduledFor: Date | null;
  authorUserId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface UpdateInput {
  slug: string;
  title: string;
  summary: string;
  technology: Technology | null;
  kind: UpdateKind;
  action: string | null;
  sourceUrl: string;
  effectiveDate: Date | null;
  replacement: string | null;
}

export interface UpdateCreateInput extends UpdateInput {
  authorUserId: string;
}

/** A PUBLISHED update as the public page and header badge need it. */
export type PublishedUpdate = Omit<
  UpdateRecord,
  "status" | "authorUserId" | "createdAt" | "updatedAt" | "publishedAt" | "scheduledFor"
> & { publishedAt: Date };

export interface UpdateRepository {
  createUpdate(input: UpdateCreateInput): Promise<UpdateRecord>;
  /** Content-only edit: never changes status or publishedAt. */
  updateUpdate(id: string, input: UpdateInput): Promise<UpdateRecord>;
  /** DRAFT -> PUBLISHED, stamps publishedAt and appends a PUBLISHED event, atomically.
   * Rejects (throws) if it is already PUBLISHED. */
  publishUpdate(id: string, actorUserId: string): Promise<UpdateRecord>;
  /** MVP-050: as ContentRepository.scheduleArticle. */
  scheduleUpdate(id: string, at: Date, actorUserId: string): Promise<UpdateRecord>;
  /** MVP-050: as ContentRepository.cancelArticleSchedule. */
  cancelUpdateSchedule(id: string, actorUserId: string): Promise<UpdateRecord>;
  /** MVP-050: as ContentRepository.publishDueArticles. */
  publishDueUpdates(now: Date): Promise<UpdateRecord[]>;
  findUpdateById(id: string): Promise<UpdateRecord | null>;
  findUpdateBySlug(slug: string): Promise<UpdateRecord | null>;
  /** Every update, every status, newest first: the admin list. */
  listUpdates(): Promise<UpdateRecord[]>;
  /** PUBLISHED updates, newest published first, at most `limit`. */
  listPublishedUpdates(options: { limit: number; technology?: Technology }): Promise<PublishedUpdate[]>;
  /** The publishedAt of the newest PUBLISHED updates: all the header badge needs. */
  listPublishedUpdateTimes(limit: number): Promise<Date[]>;
}

export const UPDATE_TITLE_MAX = 160;
export const UPDATE_SUMMARY_MAX = 500;
export const UPDATE_ACTION_MAX = 40;
export const UPDATE_REPLACEMENT_MAX = 160;

const trimmedLength = (value: string) => value.trim().length;

export function isValidUpdateKind(value: string): value is UpdateKind {
  return (UPDATE_KINDS as readonly string[]).includes(value);
}

export function isValidUpdateTitle(value: string): boolean {
  return trimmedLength(value) > 0 && value.length <= UPDATE_TITLE_MAX;
}

export function isValidUpdateSummary(value: string): boolean {
  return trimmedLength(value) > 0 && value.length <= UPDATE_SUMMARY_MAX;
}

/** Optional short text (action, replacement): null, or non-blank and at most `max`. */
export function isValidOptionalText(value: string | null, max: number): boolean {
  return value === null || (trimmedLength(value) > 0 && value.length <= max);
}

export const isValidUpdateSlug = isValidArticleSlug;

/**
 * The source must be Microsoft's own announcement: https on microsoft.com or
 * one of its subdomains (learn.microsoft.com, techcommunity.microsoft.com,
 * www.microsoft.com ...). Anything else, including look-alike hosts such as
 * "microsoft.com.example.org", is refused, so an update can never send a
 * reader to an arbitrary site.
 */
export function isValidUpdateSourceUrl(value: string): boolean {
  if (value.length > 2000) return false;
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    return false;
  }
  if (url.protocol !== "https:" || url.username !== "" || url.password !== "") return false;
  const host = url.hostname.toLowerCase();
  return host === "microsoft.com" || host.endsWith(".microsoft.com");
}

/**
 * The tracker's status label for a deprecation or retirement: "Removed Aug
 * 2026" once a retirement date has passed, "Retires ..." before it,
 * "Deprecated ..." for a deprecation. Month and year only: Microsoft gives
 * some dates to the day and others only to the month ("Effective March
 * 2026"), so the label never claims more precision than the source; the
 * summary carries the exact day when there is one. Shown in UTC, so every
 * reader sees the same month.
 */
export function trackerLabel(
  update: Pick<UpdateRecord, "kind" | "effectiveDate">,
  now: Date,
): string | null {
  if (!update.effectiveDate) return null;
  const date = update.effectiveDate.toLocaleDateString("en-US", {
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });
  if (update.kind === "RETIREMENT") {
    return update.effectiveDate.getTime() <= now.getTime() ? `Removed ${date}` : `Retires ${date}`;
  }
  return `Deprecated ${date}`;
}
