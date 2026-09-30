import type { SortOption } from "./types.js";

const VALID_SORTS: readonly SortOption[] = ["relevance", "recent", "alphabetical"];
export const DEFAULT_PAGE_SIZE = 12;
export const MAX_PAGE_SIZE = 48;

/**
 * Pure parsing/validation for URL query parameters (?q=&sort=&page=&
 * pageSize=&category=) — kept framework-agnostic so it's testable without
 * Next.js and reusable by both the search page and the category page.
 * Never throws on bad input: an invalid/missing value silently falls back
 * to a safe default rather than erroring the page, matching "zero-results
 * guidance" over a broken experience for a malformed shared URL.
 */

/** Falls back to "recent" if the query has no search term, since "relevance" is meaningless without one. */
export function resolveSortOption(raw: string | undefined, hasQuery: boolean): SortOption {
  const candidate =
    raw && VALID_SORTS.includes(raw as SortOption) ? (raw as SortOption) : undefined;
  if (candidate === "relevance" && !hasQuery) {
    return "recent";
  }
  return candidate ?? (hasQuery ? "relevance" : "recent");
}

/** One query-string value: the first of a repeated parameter (BUG-002). */
export function firstParam(raw: string | readonly string[] | undefined): string | undefined {
  return typeof raw === "string" ? raw : raw?.[0];
}

/**
 * A repeated parameter (`?q=a&q=b`) arrives from Next.js as an array; the
 * first value is used, the same way a browser form would read it. Before the
 * SEO story this threw and the page returned HTTP 500 (BUG-002), which
 * crawlers following malformed links would record as a server error.
 */
export function normalizeQuery(raw: string | readonly string[] | undefined): string | undefined {
  const trimmed = firstParam(raw)?.trim();
  return trimmed ? trimmed : undefined;
}

export function parsePage(raw: string | undefined): number {
  const parsed = Number(raw);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : 1;
}

export function parsePageSize(raw: string | undefined): number {
  const parsed = Number(raw);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    return DEFAULT_PAGE_SIZE;
  }
  return Math.min(parsed, MAX_PAGE_SIZE);
}

export function totalPages(total: number, pageSize: number): number {
  return Math.max(1, Math.ceil(total / pageSize));
}
