import { DEFAULT_PAGE_SIZE, totalPages } from "@ppu/domain-catalog";

/**
 * Category indexing and canonical policy (MVP-021, FR-017), as approved by the
 * product owner on 2026-09-21 (docs/final-decisions.md, Q29 and Q30, closing open
 * questions 29 and 30). This is an intentional corrective SEO change owned by
 * MVP-021 — MVP-004 previously canonicalized every variant to the base URL. It
 * changes metadata only: MVP-004's search and filtering behavior is untouched.
 *
 *   base                     index, follow — self-canonical to the base URL
 *   ?page=1                  index, follow — canonical normalized to the base URL
 *   ?page=N (valid, N >= 2)  index, follow — self-canonical to that exact URL
 *   empty category           noindex, follow — canonical to the base URL, not a 404
 *   invalid / zero / negative / non-numeric / out-of-range page
 *                            noindex, follow — canonical to the base URL
 *   ?q=, ?sort=, filters, any other parameter, or page combined with any of them
 *                            noindex, follow — canonical to the base URL
 *
 * Interpretations within that policy (reversible, recorded in final-decisions):
 * ANY query parameter other than a single valid `page` marks the URL as a
 * variant — including `pageSize`, unrecognized or tracking parameters, repeated
 * parameters, and a `sort` of any value.
 *
 * "Empty" means zero PUBLISHED products; the caller passes the category's
 * PUBLISHED total, so DRAFT and any other status can never make it non-empty.
 * Indexability is derived from that number on every request — there is no
 * manually edited flag.
 */

export type RawSearchParams = Record<string, string | string[] | undefined>;

export type CategoryIndexingReason =
  | "BASE"
  | "PAGE_ONE"
  | "PAGINATED"
  | "EMPTY_CATEGORY"
  | "VARIANT_PARAMS"
  | "INVALID_PAGE"
  | "OUT_OF_RANGE_PAGE";

export interface CategoryIndexingDecision {
  index: boolean;
  /** `null` canonicalizes to the clean base category URL; N >= 2 to that exact paginated URL. */
  canonicalPage: number | null;
  reason: CategoryIndexingReason;
}

/** Digits only, no leading zero, at most nine digits — anything else is not a valid page number. */
const STRICT_PAGE_NUMBER = /^[1-9][0-9]{0,8}$/;

function presentKeys(searchParams: RawSearchParams): string[] {
  return Object.keys(searchParams).filter((key) => searchParams[key] !== undefined);
}

/** True when the URL carries any query parameter other than `page`; such URLs are never indexable. */
export function isCategoryVariant(searchParams: RawSearchParams): boolean {
  return presentKeys(searchParams).some((key) => key !== "page");
}

const noindex = (reason: CategoryIndexingReason): CategoryIndexingDecision => ({
  index: false,
  canonicalPage: null,
  reason,
});

export function resolveCategoryIndexing(input: {
  searchParams: RawSearchParams;
  /** Number of PUBLISHED products in the whole category (not of a filtered listing). Ignored for variant URLs. */
  total: number;
}): CategoryIndexingDecision {
  const { searchParams, total } = input;

  if (isCategoryVariant(searchParams)) return noindex("VARIANT_PARAMS");

  const isEmpty = !(total > 0);

  if (!presentKeys(searchParams).includes("page")) {
    return isEmpty
      ? noindex("EMPTY_CATEGORY")
      : { index: true, canonicalPage: null, reason: "BASE" };
  }

  const rawPage = searchParams["page"];
  if (typeof rawPage !== "string" || !STRICT_PAGE_NUMBER.test(rawPage)) {
    return noindex("INVALID_PAGE");
  }
  if (isEmpty) return noindex("EMPTY_CATEGORY");

  const page = Number(rawPage);
  if (page > totalPages(total, DEFAULT_PAGE_SIZE)) return noindex("OUT_OF_RANGE_PAGE");

  return page === 1
    ? { index: true, canonicalPage: null, reason: "PAGE_ONE" }
    : { index: true, canonicalPage: page, reason: "PAGINATED" };
}
