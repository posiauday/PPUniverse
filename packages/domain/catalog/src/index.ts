export type {
  AssetType,
  ProductStatus,
  CategoryRecord,
  ProductRecord,
  ProductWithCategory,
  SortOption,
  SearchOptions,
  SearchResult,
  SitemapEntries,
  PlatformArea,
  CompatibilityEvidenceStatus,
  SupportStatus,
  LicenseDefinitionRecord,
  SupportPolicyRecord,
  CompatibilityEntry,
  ProductDetail,
  ProductCoreFields,
  ProductCreateInput,
  ProductUpdateInput,
  ReleaseRecord,
  ProductPublishSnapshot,
  ProductPublishMissingField,
  ProductPublishReadiness,
  ProductEvidenceForAdmin,
} from "./types.js";
export { isPubliclyVisible } from "./visibility.js";
export {
  isValidProductSlug,
  isValidProductName,
  isValidProductSummary,
  isValidReleaseVersion,
  isValidProductStatusTransition,
  checkProductPublishReadiness,
} from "./product.js";
export type { CatalogRepository } from "./catalog-repository.js";
export {
  DEFAULT_PAGE_SIZE,
  MAX_PAGE_SIZE,
  resolveSortOption,
  normalizeQuery,
  parsePage,
  parsePageSize,
  totalPages,
} from "./search-params.js";
export { normalizeDisplayText } from "./text.js";
export {
  PLATFORM_AREAS,
  PLATFORM_AREA_LABELS,
  EVIDENCE_STATUSES,
  EVIDENCE_STATUS_LABELS,
  EVIDENCE_STATUS_DEFINITIONS,
  MIN_RELEASE_YEAR,
  RELEASE_YEAR_LOOKAHEAD,
  RELEASE_WAVES,
  MAX_COMPATIBILITY_TEXT_LENGTH,
  maxReleaseYear,
  formatReleaseWave,
  formatVerifiedDate,
  validateCompatibilityEntry,
} from "./compatibility.js";
export type {
  CompatibilityErrorCode,
  CompatibilityEntryInput,
  CompatibilityValidationError,
  ValidCompatibilityEntry,
  CompatibilityValidationResult,
} from "./compatibility.js";
export { SUPPORT_STATUS_LABELS, safeSupportChannelHref } from "./support.js";
export { EVIDENCE_LEGEND, EVIDENCE_MESSAGES, presentProductEvidence } from "./present-evidence.js";
export type {
  EvidenceLegendItem,
  CompatibilityRowView,
  ProductEvidenceView,
} from "./present-evidence.js";
