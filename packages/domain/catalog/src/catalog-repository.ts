import type {
  CategoryRecord,
  CompatibilityEntry,
  LicenseDefinitionRecord,
  ProductCreateInput,
  ProductDetail,
  ProductEvidenceForAdmin,
  ProductPublishSnapshot,
  ProductRecord,
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
  /** Transitions DRAFT -> PUBLISHED and sets publishedAt. Rejects (throws)
   * if the transition is invalid -- the caller must check
   * isValidProductStatusTransition / checkProductPublishReadiness first for
   * a friendly error, same contract as ContentRepository.publishArticle. */
  publishProduct(id: string): Promise<ProductRecord>;
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
  createRelease(productId: string, version: string): Promise<ReleaseRecord>;
  /** Must re-verify FileScan.status === "CLEAN" server-side before creating
   * the ReleaseFile row -- never trusts a client-supplied "this file is
   * clean" claim. Throws if the release doesn't exist or the file isn't
   * CLEAN. */
  attachReleaseFile(releaseId: string, fileScanId: string): Promise<void>;
  /** Every release for a product, newest first, with its attached
   * (fileScanId, status) pairs -- the admin editor's release list. */
  listReleasesForAdmin(
    productId: string,
  ): Promise<Array<ReleaseRecord & { files: Array<{ fileScanId: string; status: string }> }>>;
}
