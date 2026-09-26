import type {
  CategoryRecord,
  CompatibilityEntry,
  LicenseDefinitionRecord,
  ProductCreateInput,
  ProductDetail,
  ProductEvidenceForAdmin,
  ProductPublishResult,
  ProductPublishSnapshot,
  ProductRecord,
  ProductStatus,
  ProductStatusChangeResult,
  ProductStatusEventRecord,
  ProductUpdateInput,
  ProductWithCategory,
  ReleaseRecord,
  SearchOptions,
  SearchResult,
  SitemapEntries,
  SupportPolicyRecord,
  SupportStatus,
} from "./types.js";
import type { ValidCompatibilityEntry } from "./compatibility.js";

export interface CatalogRepository {
  listCategories(): Promise<CategoryRecord[]>;
  findCategoryBySlug(slug: string): Promise<CategoryRecord | null>;
  listPublishedProductsByCategory(categoryId: string): Promise<ProductRecord[]>;
  findPublishedProductBySlug(slug: string): Promise<ProductWithCategory | null>;
  /** Published-only, with license/version/support/compatibility evidence (MVP-005). Empty evidence means "not provided yet", never an error. */
  findPublishedProductDetailBySlug(slug: string): Promise<ProductDetail | null>;
  searchProducts(options: SearchOptions): Promise<SearchResult>;
  /**
   * Sitemap eligibility (MVP-021): PUBLISHED products, and categories that
   * have at least one PUBLISHED product. `maxEntries` bounds categories plus
   * products combined; `maxEntries` must be a non-negative integer.
   */
  listSitemapEntries(maxEntries: number): Promise<SitemapEntries>;

  // --- Admin authoring surface (MVP-012, FR-009) -----------------------

  /** Always created DRAFT (the Prisma column default) -- publishing is a
   * separate, deliberate action (publishProduct), never implicit. */
  createProductDraft(input: ProductCreateInput): Promise<ProductRecord>;
  /** Core fields only -- never touches status/publishedAt (see
   * ProductUpdateInput's doc comment in @ppu/domain-catalog). */
  updateProductDraft(id: string, input: ProductUpdateInput): Promise<ProductRecord>;
  /** Any status -- the admin editor's own lookup, distinct from the
   * PUBLISHED-only findPublishedProductBySlug/findPublishedProductDetailBySlug. */
  findProductByIdForAdmin(id: string): Promise<ProductWithCategory | null>;
  /** Every Product, every status, newest first -- the admin list. */
  listProductsForAdmin(): Promise<ProductRecord[]>;
  /** Loads everything checkProductPublishReadiness (@ppu/domain-catalog)
   * needs: license count, whether a support policy exists, compatibility
   * entry count, and the count of releases with at least one attached
   * CLEAN file. */
  getProductPublishSnapshot(id: string): Promise<ProductPublishSnapshot>;
  /** Current assigned license ids, support policy, and every compatibility
   * entry, any status -- the admin editor's own pre-fill/pre-check read,
   * distinct from the PUBLISHED-only findPublishedProductDetailBySlug. */
  getProductEvidenceForAdmin(id: string): Promise<ProductEvidenceForAdmin>;
  /**
   * Initial product publication (direct product-owner decision, "PR #23
   * blocker corrections" A2/A4): the caller explicitly selects which draft
   * release becomes the product's initial published release. One
   * transaction, re-reading and re-validating every fact fresh from the
   * database (never trusting an earlier snapshot or a client-supplied
   * claim) before writing anything:
   *   - the Product exists and is still DRAFT (else ProductNotFoundError /
   *     ProductNotDraftError);
   *   - the Release exists and belongs to this Product (else
   *     ReleaseNotFoundForProductError — a release id from another product
   *     is rejected, not silently accepted);
   *   - the Release is not already published (else
   *     ReleaseAlreadyPublishedError);
   *   - the Release has at least one attached CLEAN file, re-verified fresh
   *     (else ReleaseNotReadyError);
   *   - every Product-level mandatory field is present — license, support
   *     policy, compatibility — re-verified fresh (else ProductNotReadyError,
   *     carrying every missing field, not just the first).
   * If every check passes, Product.status/publishedAt and the selected
   * Release's publishedAt are set together, atomically, using the same
   * timestamp. If any check fails, the whole transaction rolls back and
   * neither row changes — no half-published state is possible. Callers
   * should still run checkProductPublishReadiness first for a friendly
   * pre-flight UI hint, but must not rely on it as the actual gate (this
   * method is the authoritative one).
   */
  publishProductWithRelease(productId: string, releaseId: string): Promise<ProductPublishResult>;
  /** Replaces the full assigned license set for a product (simplest correct
   * semantics for a checkbox-style picker) -- not an incremental add/remove. */
  setProductLicenses(productId: string, licenseDefinitionIds: string[]): Promise<void>;
  /** Reference data for the license picker UI. */
  listLicenseDefinitions(): Promise<LicenseDefinitionRecord[]>;
  upsertSupportPolicy(
    productId: string,
    input: { status: SupportStatus; channel: string | null },
  ): Promise<SupportPolicyRecord>;
  /**
   * Upsert keyed on the existing (productId, platformArea) unique
   * constraint. Defense in depth: refuses to persist any evidenceStatus
   * other than CREATOR_DECLARED even though `ValidCompatibilityEntry`'s
   * type allows MARKETPLACE_REVIEWED -- the caller (the API route) must
   * already reject it, but this is the last line before the database
   * (TD-008 section 9; MVP-012's own hard gate).
   */
  upsertCompatibilityEntry(
    productId: string,
    input: ValidCompatibilityEntry,
  ): Promise<CompatibilityEntry>;
  /** Product may be DRAFT or PUBLISHED — a new draft release on an
   * already-published product is how future versions are authored (A2/A3);
   * it never changes the public current version by itself. Always created
   * with publishedAt null. */
  createRelease(productId: string, version: string): Promise<ReleaseRecord>;
  /**
   * Re-verifies, fresh from the database, that the release belongs to
   * `productId` (else ReleaseNotFoundError — prevents a request scoped to
   * one product from attaching a file to another product's release),
   * that the release is not already published (else
   * ReleaseAlreadyPublishedError — a published release's file set is
   * immutable, A3), and that FileScan.status === "CLEAN" (else
   * FileScanNotFoundError / FileScanNotCleanError — never trusts a
   * client-supplied "this file is clean" claim).
   */
  attachReleaseFile(productId: string, releaseId: string, fileScanId: string): Promise<void>;
  /**
   * Removes one ReleaseFile association from a draft release, correcting an
   * accidental attachment (A3). Same release/product/published-state checks
   * as attachReleaseFile. Deletes only the join row — never the underlying
   * FileScan or its stored file. Idempotent: detaching a file that was never
   * attached is a no-op, not an error.
   */
  detachReleaseFile(productId: string, releaseId: string, fileScanId: string): Promise<void>;
  /** Every release for a product, newest first, with its attached
   * (fileScanId, status) pairs -- the admin editor's release list. */
  listReleasesForAdmin(
    productId: string,
  ): Promise<Array<ReleaseRecord & { files: Array<{ fileScanId: string; status: string }> }>>;
  /**
   * Suspend, archive, or reinstate a Product (MVP-019, FR-015/NFR-009).
   * Entirely separate from publishProductWithRelease -- deliberately does
   * not touch Product.publishedAt, does not select or touch any Release,
   * and never revokes any Entitlement (docs/final-decisions.md, "MVP-019
   * operations console and audit" -- question 2).
   *
   * Re-reads and re-validates fresh, inside one transaction:
   *   - the Product exists (else ProductNotFoundError);
   *   - `fromStatus -> toStatus` is a transition
   *     isValidProductStatusChangeTransition allows (else
   *     ProductStatusTransitionNotAllowedError, carrying the Product's
   *     actual current status);
   *   - `reason` is non-empty (else ProductStatusChangeReasonRequiredError
   *     -- NFR-009 requires a reason for all four transitions this method
   *     performs).
   * The status change itself is a compare-and-swap: an atomic conditional
   * update whose WHERE clause requires the exact status just validated
   * (`status: product.status`) and exactly one affected row -- the same
   * concurrency-safe family as MVP-014's Release.publishedAt claim. That
   * exactness guarantees the ProductStatusEvent written in the same
   * transaction records the status actually replaced, so the audit chain
   * stays continuous; a request that lost a race fails with
   * ProductStatusTransitionNotAllowedError (carrying the fresh status) and
   * may be retried.
   */
  changeProductStatus(
    productId: string,
    toStatus: ProductStatus,
    actorUserId: string,
    reason: string,
  ): Promise<ProductStatusChangeResult>;
  /** The most recent ProductStatusEvent rows across every product, newest
   * first, up to `limit` -- one of the audit-log view's three source
   * queries (MVP-019, question 4: read/merge over existing tables, not a
   * new unified AuditEvent table). Includes the product's current slug/name
   * so the admin view can render a link without a second round trip. */
  listRecentProductStatusEvents(
    limit: number,
  ): Promise<Array<ProductStatusEventRecord & { productSlug: string; productName: string }>>;
}
