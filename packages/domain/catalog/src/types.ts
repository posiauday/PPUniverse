export type AssetType =
  | "POWER_APPS_COMPONENT"
  | "POWER_APPS_TEMPLATE"
  | "POWER_AUTOMATE_TEMPLATE"
  | "POWER_BI_TEMPLATE"
  | "ARCHITECTURE_BLUEPRINT"
  | "GOVERNANCE_ASSET";

export type ProductStatus = "DRAFT" | "PUBLISHED";

export interface CategoryRecord {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  assetType: AssetType;
}

export interface ProductRecord {
  id: string;
  slug: string;
  name: string;
  summary: string;
  status: ProductStatus;
  categoryId: string;
}

export interface ProductWithCategory extends ProductRecord {
  category: CategoryRecord;
}

export type SortOption = "relevance" | "recent" | "alphabetical";

export interface SearchOptions {
  query?: string;
  categorySlug?: string;
  sort: SortOption;
  page: number;
  pageSize: number;
}

export interface SearchResult {
  items: ProductWithCategory[];
  total: number;
  page: number;
  pageSize: number;
}

export type PlatformArea =
  | "POWER_APPS"
  | "POWER_AUTOMATE"
  | "POWER_BI"
  | "DATAVERSE"
  | "POWER_PAGES"
  | "COPILOT_STUDIO"
  | "MICROSOFT_FABRIC";

export type CompatibilityEvidenceStatus =
  "TESTED" | "CREATOR_DECLARED" | "NOT_VERIFIED" | "MARKETPLACE_REVIEWED";

export type SupportStatus =
  "CREATOR_SUPPORTED" | "PLATFORM_SUPPORTED" | "COMMUNITY_SUPPORTED" | "UNSUPPORTED";

export interface LicenseDefinitionRecord {
  id: string;
  slug: string;
  name: string;
  description: string;
  sortOrder: number;
}

export interface SupportPolicyRecord {
  status: SupportStatus;
  channel: string | null;
}

/**
 * `lastVerifiedAt` is a calendar date as `YYYY-MM-DD` (a DATE column, so no
 * time-of-day/timezone to get wrong). `reviewedAt` is a full ISO timestamp,
 * null for every status except MARKETPLACE_REVIEWED, set only by the
 * server-side moderation workflow (TD-008; not built yet -- MVP-013).
 */
export interface CompatibilityEntry {
  id: string;
  platformArea: PlatformArea;
  minReleaseYear: number;
  minReleaseWave: number;
  notes: string | null;
  evidenceStatus: CompatibilityEvidenceStatus;
  evidenceSummary: string | null;
  lastVerifiedAt: string | null;
  reviewedAt: string | null;
}

/**
 * Slugs eligible for `sitemap.xml` (MVP-021, FR-017). A category is listed only
 * when it has at least one PUBLISHED product (derived from current inventory,
 * never a manually edited flag); products are PUBLISHED only. `truncated` is
 * true when more entries existed than the caller's `maxEntries` allowed.
 */
export interface SitemapEntries {
  categorySlugs: string[];
  productSlugs: string[];
  truncated: boolean;
}

/** Everything the product detail page shows (MVP-005, FR-003). Empty collections / nulls mean "not provided yet". */
export interface ProductDetail extends ProductWithCategory {
  licenses: LicenseDefinitionRecord[];
  currentVersion: string | null;
  support: SupportPolicyRecord | null;
  compatibility: CompatibilityEntry[];
}

/**
 * Product and release authoring (MVP-012, FR-009). First-party ADMIN-only
 * (docs/final-decisions.md, "First-party-only publishing model" section 6)
 * — no CREATOR/SELLER/EDITOR/PUBLISHER role exists. The caller (the API
 * route) checks the actor is ADMIN before any of this runs, mirroring
 * @ppu/domain-content's ContentRepository/ArticleUpdateInput pattern
 * exactly.
 */

/** Create and update share the same core-field shape: name, slug, summary,
 * categoryId. `categoryId` referencing a real Category is checked by the
 * caller (repository access is needed; this package stays DB-free), not by
 * any pure validator here. */
export interface ProductCoreFields {
  name: string;
  slug: string;
  summary: string;
  categoryId: string;
}

export type ProductCreateInput = ProductCoreFields;

/** Deliberately excludes `status`/`publishedAt` — those change only
 * through CatalogRepository.publishProduct, never a general edit, so a bad
 * or accidental edit can never silently unpublish or republish a Product
 * (mirrors @ppu/domain-content's ArticleUpdateInput exactly). */
export type ProductUpdateInput = ProductCoreFields;

/** Free-text version (docs/open-questions.md item 61: format enforcement
 * deferred). `publishedAt` null means the release itself has not been
 * published — distinct from, and currently unused by, the product's own
 * DRAFT/PUBLISHED status; MVP-012 creates Release rows but does not yet
 * publish them (FR-011/immutability is MVP-014's scope). */
export interface ReleaseRecord {
  id: string;
  productId: string;
  version: string;
  publishedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

/** The mandatory-field snapshot the DRAFT -> PUBLISHED gate needs
 * (docs/open-questions.md item 61's recorded safest-reversible default).
 * `releasesWithCleanFileCount` counts only releases that have at least one
 * attached ReleaseFile whose FileScan is CLEAN -- a release with zero
 * attachments, or attachments that never passed scanning, does not count.
 * `compatibilityCount` counts CompatibilityRecord rows regardless of
 * evidence status, since MVP-012's write path can only ever produce
 * CREATOR_DECLARED rows (see checkProductPublishReadiness's doc comment). */
export interface ProductPublishSnapshot {
  licenseCount: number;
  hasSupportPolicy: boolean;
  compatibilityCount: number;
  releasesWithCleanFileCount: number;
}

/** One entry per missing mandatory field, in the fixed check order used by
 * checkProductPublishReadiness: "license", "supportPolicy", "compatibility",
 * "release". Never invents a reason not in this list (price is correctly
 * excluded -- MVP-007, blocked on open questions 3 and 7). */
export type ProductPublishMissingField = "license" | "supportPolicy" | "compatibility" | "release";

export interface ProductPublishReadiness {
  ready: boolean;
  missingFields: ProductPublishMissingField[];
}

/** Current evidence state for the admin editor (MVP-012): which license
 * tiers are assigned, the support policy if one exists, and every
 * compatibility entry -- so the edit page can pre-fill/pre-check its forms
 * against what is actually persisted, any status, not just PUBLISHED (the
 * ProductDetail read path @ppu/domain-catalog already exposes is
 * PUBLISHED-only and cannot be reused for a DRAFT product's own editor). */
export interface ProductEvidenceForAdmin {
  licenseDefinitionIds: string[];
  support: SupportPolicyRecord | null;
  compatibility: CompatibilityEntry[];
}
