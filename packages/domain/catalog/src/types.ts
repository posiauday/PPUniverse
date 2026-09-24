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
