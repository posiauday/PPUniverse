import type { EntitlementEligibilityInput, EntitlementRecord } from "./types.js";

/**
 * Whether a product may currently be granted as a free entitlement. Pure —
 * takes the product's own re-derived state, never a client-supplied flag
 * (docs/final-decisions.md, "MVP-010 open questions 44 and 45": "never trust
 * a client-supplied price, free flag, or product state"). The caller is
 * responsible for reading the product from the database immediately before
 * calling this, not reusing a value read earlier in the request or accepted
 * as input.
 *
 * Eligible only when the product is PUBLISHED (SUSPENDED, ARCHIVED and DRAFT
 * are all ineligible) AND has no price. A priced product is never free, so
 * this route can never be used to take a paid item without paying
 * (docs/final-decisions.md, "Business model: free learning first; one price
 * per product; work order", decision 3). The caller must read the price
 * fresh from the database, not accept it as input.
 */
export function isProductEligibleForFreeEntitlement(product: EntitlementEligibilityInput): boolean {
  return product.status === "PUBLISHED" && !product.hasPrice;
}

/**
 * Whether a download may proceed for an existing entitlement. Enforced at
 * read time per the Q45 amendment (docs/final-decisions.md, 2026-09-22): a
 * download is denied whenever revokedAt is non-null, even though nothing in
 * this story ever sets it. This function is the one place that check lives,
 * so a future revocation write path only has to set the column — the read
 * side is already correct.
 */
export function isDownloadAllowed(entitlement: Pick<EntitlementRecord, "revokedAt">): boolean {
  return entitlement.revokedAt === null;
}
