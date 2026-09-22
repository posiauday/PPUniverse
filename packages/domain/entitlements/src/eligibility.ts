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
 * Only PUBLISHED is eligible. A DRAFT product isn't publicly visible yet;
 * there is no SUSPENDED/ARCHIVED/REJECTED status in the current schema
 * (packages/db/prisma/schema/catalog.prisma only has DRAFT and PUBLISHED),
 * so "draft, suspended, archived or rejected" from the decision collapses
 * to "anything that isn't PUBLISHED" against today's actual enum — this
 * function does not invent statuses the schema doesn't have.
 */
export function isProductEligibleForFreeEntitlement(product: EntitlementEligibilityInput): boolean {
  return product.status === "PUBLISHED";
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
