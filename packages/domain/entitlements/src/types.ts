/**
 * Free entitlement flow (MVP-010, FR-005). Only the free path is modeled —
 * see packages/db/prisma/schema/entitlements.prisma for why paid sources
 * (ORDER_LINE, ADMIN_GRANT, SUBSCRIPTION) aren't here yet.
 */
export type EntitlementSource = "FREE_POLICY";

/**
 * The subset of Product this domain package needs to decide eligibility.
 * Deliberately not importing @ppu/domain-catalog's ProductStatus: this
 * package stays independent of the catalog domain's own type surface, and
 * the two happen to use the same string values by coincidence of both
 * modeling the same underlying Prisma enum, not because one depends on the
 * other.
 */
export type ProductStatus = "DRAFT" | "PUBLISHED";

export interface EntitlementEligibilityInput {
  status: ProductStatus;
}

export interface EntitlementRecord {
  id: string;
  userId: string;
  productId: string;
  source: EntitlementSource;
  grantedAt: Date;
  /** Enforced at read time — see isDownloadAllowed. Nothing in this story sets it. */
  revokedAt: Date | null;
}

export interface DownloadRecord {
  id: string;
  entitlementId: string;
  userId: string;
  productId: string;
  requestedAt: Date;
}

export interface GrantResult {
  entitlement: EntitlementRecord;
  /** True when an existing entitlement was reused rather than a new one created. */
  reused: boolean;
}

/**
 * The persistence contract this domain package needs, implemented by
 * @ppu/adapter-entitlements's PrismaEntitlementRepository. Mirrors
 * @ppu/domain-catalog's CatalogRepository pattern: the domain package
 * defines the interface, the adapter package implements it against Prisma.
 */
export interface EntitlementRepository {
  /** Idempotent: reuses an existing (userId, productId) row rather than duplicating it. */
  grantOrReuseEntitlement(userId: string, productId: string): Promise<GrantResult>;
  findEntitlement(userId: string, productId: string): Promise<EntitlementRecord | null>;
  recordDownload(entitlementId: string, userId: string, productId: string): Promise<DownloadRecord>;
}
