import type {
  ProductPublishMissingField,
  ProductPublishReadiness,
  ProductPublishSnapshot,
  ProductStatus,
} from "./types.js";

/**
 * Pure product/release authoring rules (MVP-012, FR-009). No database, no
 * knowledge of who is calling -- the caller (the API route) checks the
 * actor is ADMIN before any of this runs, mirroring
 * @ppu/domain-content's transitions.ts exactly (see that file's doc
 * comment for the same rationale applied to Article).
 */

/** Same slug shape as @ppu/domain-content's isValidArticleSlug: lowercase,
 * hyphen-separated, ASCII alphanumeric segments, no leading/trailing/
 * doubled hyphens, 1-200 characters. Product.slug has no catalog-specific
 * validator today (grep confirmed -- search-params.ts/text.ts/
 * compatibility.ts/support.ts have none), so this mirrors the one real
 * precedent in the codebase rather than inventing a second slug shape. */
const SLUG_PATTERN = /^[a-z0-9]+(-[a-z0-9]+)*$/;
const MAX_SLUG_LENGTH = 200;

export function isValidProductSlug(slug: string): boolean {
  return slug.length > 0 && slug.length <= MAX_SLUG_LENGTH && SLUG_PATTERN.test(slug);
}

/** No existing product-name length limit was found anywhere in the
 * codebase (grep confirmed); 200 matches @ppu/domain-content's title cap
 * and evidence.prisma's general text-field discipline. */
const MAX_PRODUCT_NAME_LENGTH = 200;

export function isValidProductName(name: string): boolean {
  return name.trim().length > 0 && name.length <= MAX_PRODUCT_NAME_LENGTH;
}

/** Product.summary is a required, non-empty field (catalog.prisma: no `?`).
 * No length cap is specified by FR-009 or the backlog row; 500 matches
 * evidence.prisma's notes/evidence-summary precedent (compatibility.ts's
 * MAX_COMPATIBILITY_TEXT_LENGTH) since a summary is comparable free text. */
const MAX_PRODUCT_SUMMARY_LENGTH = 500;

export function isValidProductSummary(summary: string): boolean {
  return summary.trim().length > 0 && summary.length <= MAX_PRODUCT_SUMMARY_LENGTH;
}

/**
 * Release.version is free text (docs/open-questions.md item 61: format
 * enforcement -- semver etc. -- is explicitly deferred). Only non-empty and
 * a reasonable maximum length are enforced this pass. 50 characters covers
 * any realistic version string (semver, date-based, sequential) with
 * generous headroom.
 */
const MAX_RELEASE_VERSION_LENGTH = 50;

export function isValidReleaseVersion(version: string): boolean {
  return version.trim().length > 0 && version.length <= MAX_RELEASE_VERSION_LENGTH;
}

/**
 * DRAFT -> PUBLISHED is the only allowed transition (mirrors
 * @ppu/domain-content's isValidArticleStatusTransition exactly). There is
 * no unpublish/republish path in this story -- FR-011's immutability rules
 * are MVP-014's scope.
 */
const ALLOWED_TRANSITIONS: Record<ProductStatus, readonly ProductStatus[]> = {
  DRAFT: ["PUBLISHED"],
  PUBLISHED: [],
};

export function isValidProductStatusTransition(from: ProductStatus, to: ProductStatus): boolean {
  return ALLOWED_TRANSITIONS[from].includes(to);
}

/**
 * Whether a release's files/version may still change. A release is mutable
 * (attach/detach/version edits allowed) only while `publishedAt` is null;
 * once set, the release and its file set are immutable — direct product-
 * owner decision, "PR #23 blocker corrections", A2/A3: a published Product
 * is not frozen (new draft releases may follow), but a published *Release*
 * is.
 */
export function isReleaseMutable(release: { publishedAt: Date | null }): boolean {
  return release.publishedAt === null;
}

/** Thrown by CatalogRepository.publishProductWithRelease when the Product
 * row doesn't exist. */
export class ProductNotFoundError extends Error {
  constructor(public readonly productId: string) {
    super(`Product ${productId} not found`);
    this.name = "ProductNotFoundError";
  }
}

/** Thrown when publish is attempted on a Product that isn't DRAFT — mirrors
 * @ppu/domain-content's isValidArticleStatusTransition rejection, but
 * carries structured fields since this is thrown deep inside a transaction,
 * not returned from a pure boolean check the caller evaluates first. */
export class ProductNotDraftError extends Error {
  constructor(
    public readonly productId: string,
    public readonly status: string,
  ) {
    super(`Cannot publish a Product in status ${status}`);
    this.name = "ProductNotDraftError";
  }
}

/** Thrown when the selected release doesn't exist, or exists but belongs to
 * a different product — prevents a request for one product's publish
 * selecting another product's release by id (A8: "route parameters cannot
 * access another product's release"). */
export class ReleaseNotFoundForProductError extends Error {
  constructor(
    public readonly releaseId: string,
    public readonly productId: string,
  ) {
    super(`Release ${releaseId} does not belong to product ${productId}`);
    this.name = "ReleaseNotFoundForProductError";
  }
}

/** Thrown by any write that would mutate an already-published release
 * (attach, detach, or publish-selecting it again) — A3's immutability
 * rules, enforced below the UI, not by a disabled button. */
export class ReleaseAlreadyPublishedError extends Error {
  constructor(public readonly releaseId: string) {
    super(`Release ${releaseId} is already published; its files are immutable`);
    this.name = "ReleaseAlreadyPublishedError";
  }
}

/** Thrown when the selected release has no attached CLEAN file at the
 * moment of publication (re-verified fresh inside the transaction, never
 * trusted from an earlier read). */
export class ReleaseNotReadyError extends Error {
  constructor(public readonly releaseId: string) {
    super(`Release ${releaseId} has no attached CLEAN file`);
    this.name = "ReleaseNotReadyError";
  }
}

/** Thrown when a Product-level mandatory field (license/support/
 * compatibility) is missing at the moment of publication, re-verified fresh
 * inside the same transaction as the release checks — carries every missing
 * field, not just the first, matching checkProductPublishReadiness's
 * existing "full list" contract. */
export class ProductNotReadyError extends Error {
  constructor(public readonly missingFields: ProductPublishMissingField[]) {
    super(`Product is not ready to publish: missing ${missingFields.join(", ")}`);
    this.name = "ProductNotReadyError";
  }
}

/** Thrown by attachReleaseFile/detachReleaseFile when the release doesn't
 * exist, or exists but belongs to a different product than the caller
 * supplied. */
export class ReleaseNotFoundError extends Error {
  constructor(public readonly releaseId: string) {
    super(`Release ${releaseId} not found`);
    this.name = "ReleaseNotFoundError";
  }
}

/** Thrown by attachReleaseFile when the referenced FileScan doesn't exist. */
export class FileScanNotFoundError extends Error {
  constructor(public readonly fileScanId: string) {
    super(`FileScan ${fileScanId} not found`);
    this.name = "FileScanNotFoundError";
  }
}

/** Thrown by attachReleaseFile when the referenced FileScan is not CLEAN —
 * never trusts a client-supplied "this file is clean" claim; the status is
 * always re-read fresh from the database at attach time. */
export class FileScanNotCleanError extends Error {
  constructor(
    public readonly fileScanId: string,
    public readonly status: string,
  ) {
    super(`FileScan ${fileScanId} is not CLEAN (status: ${status})`);
    this.name = "FileScanNotCleanError";
  }
}

/** Fixed check order so `missingFields` is deterministic and the UI/tests
 * never have to normalize array order. */
const CHECK_ORDER: readonly ProductPublishMissingField[] = [
  "license",
  "supportPolicy",
  "compatibility",
  "release",
];

/**
 * The DRAFT -> PUBLISHED mandatory-field gate (docs/open-questions.md item
 * 61, directly approved by the product owner, "PR #23 blocker corrections"
 * A11): at least one license, a support policy, at least one compatibility
 * entry, and at least one *unpublished* (draft) release with at least one
 * attached CLEAN file. Core fields (name/slug/summary/categoryId) are not
 * re-checked here -- they are non-nullable on Product and already validated
 * at create/update time, so a persisted row always has them.
 *
 * This is a UI-facing readiness *hint* only (e.g. enabling the publish
 * control and offering a release to select) — it is not the authoritative
 * gate. The authoritative check re-reads this same state fresh, inside the
 * same transaction that publishes, in CatalogRepository.publishProductWithRelease
 * (A2/A4: enforced below the UI, never by a disabled button alone).
 *
 * Price is deliberately never checked (MVP-007, blocked on open questions 3
 * and 7) -- its absence is a correct, expected draft state, not a missing
 * mandatory field.
 *
 * Every compatibility entry this snapshot could possibly count is
 * CREATOR_DECLARED, because MVP-012's own write path
 * (CatalogRepository.upsertCompatibilityEntry) refuses to persist any other
 * evidence status (see that method's doc comment) -- so this check does not
 * need to filter by evidence status itself.
 */
export function checkProductPublishReadiness(
  snapshot: ProductPublishSnapshot,
): ProductPublishReadiness {
  const missing: ProductPublishMissingField[] = [];

  if (snapshot.licenseCount < 1) missing.push("license");
  if (!snapshot.hasSupportPolicy) missing.push("supportPolicy");
  if (snapshot.compatibilityCount < 1) missing.push("compatibility");
  if (snapshot.releasesWithCleanFileCount < 1) missing.push("release");

  // Re-order defensively to CHECK_ORDER in case push order above ever drifts.
  const missingFields = CHECK_ORDER.filter((field) => missing.includes(field));

  return { ready: missingFields.length === 0, missingFields };
}
