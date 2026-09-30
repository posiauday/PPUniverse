import { Prisma, type PrismaClient } from "@ppu/db";
import type {
  DownloadRecord,
  EntitlementRecord,
  EntitlementRepository,
  GrantResult,
} from "@ppu/domain-entitlements";

export class PrismaEntitlementRepository implements EntitlementRepository {
  constructor(private readonly db: PrismaClient) {}

  /**
   * Idempotent: "always create an entitlement... record" (FR-005) means
   * "ensure one exists," not "always insert a new one" — a repeat request
   * for a product the user already has reuses the existing row.
   *
   * Race-safe by construction, not by a check-then-insert (which a
   * concurrent request could still beat): this always attempts create()
   * first and lets the database's own `@@unique([userId, productId])`
   * constraint (packages/db/prisma/schema/entitlements.prisma) be the
   * single source of truth for "does one already exist." A concurrent
   * duplicate request gets a genuine P2002 constraint-violation error from
   * Postgres, not an application-level race window, and the catch reads
   * back whichever row actually won.
   */
  async grantOrReuseEntitlement(userId: string, productId: string): Promise<GrantResult> {
    try {
      const created = await this.db.entitlement.create({
        data: { userId, productId, source: "FREE_POLICY" },
      });
      return { entitlement: toEntitlementRecord(created), reused: false };
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
        const existing = await this.db.entitlement.findUniqueOrThrow({
          where: { userId_productId: { userId, productId } },
        });
        return { entitlement: toEntitlementRecord(existing), reused: true };
      }
      throw error;
    }
  }

  async findEntitlement(userId: string, productId: string): Promise<EntitlementRecord | null> {
    const row = await this.db.entitlement.findUnique({
      where: { userId_productId: { userId, productId } },
    });
    return row ? toEntitlementRecord(row) : null;
  }

  /** Append-only: every call inserts a new row, even for the same entitlement. */
  async recordDownload(
    entitlementId: string,
    userId: string,
    productId: string,
  ): Promise<DownloadRecord> {
    const row = await this.db.download.create({
      data: { entitlementId, userId, productId },
    });
    return toDownloadRecord(row);
  }
}

function toEntitlementRecord(row: {
  id: string;
  userId: string;
  productId: string;
  source: string;
  grantedAt: Date;
  revokedAt: Date | null;
}): EntitlementRecord {
  return {
    id: row.id,
    userId: row.userId,
    productId: row.productId,
    source: row.source as EntitlementRecord["source"],
    grantedAt: row.grantedAt,
    revokedAt: row.revokedAt,
  };
}

function toDownloadRecord(row: {
  id: string;
  entitlementId: string;
  userId: string;
  productId: string;
  requestedAt: Date;
}): DownloadRecord {
  return {
    id: row.id,
    entitlementId: row.entitlementId,
    userId: row.userId,
    productId: row.productId,
    requestedAt: row.requestedAt,
  };
}
