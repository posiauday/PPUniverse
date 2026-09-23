import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { PrismaEntitlementRepository } from "./entitlement-repository.js";

/**
 * Runs only when DATABASE_URL points at a real, migrated Postgres database
 * (packages/db/prisma/schema). CI provides one via a Postgres service
 * container (.github/workflows/ci.yml). Locally, run `docker compose up -d`
 * (docker-compose.yml) and export DATABASE_URL before `pnpm test`.
 *
 * Uses the real seeded taxonomy category (packages/db/prisma/migrations/
 * 20260918000001_seed_catalog_categories), matching @ppu/adapter-catalog's
 * own integration tests, since assetType is unique per category and all six
 * are already taken by the permanent seed rows.
 */
const hasDatabase = Boolean(process.env["DATABASE_URL"]);

describe.skipIf(!hasDatabase)("PrismaEntitlementRepository (integration)", () => {
  let db: import("@ppu/db").PrismaClient;
  let repo: PrismaEntitlementRepository;
  let userId: string;
  let productId: string;
  let categoryId: string;

  beforeAll(async () => {
    const { prisma } = await import("@ppu/db");
    db = prisma;
    repo = new PrismaEntitlementRepository(db);

    const category = await db.category.findUniqueOrThrow({
      where: { slug: "power-apps-components" },
    });
    categoryId = category.id;

    const user = await db.user.create({ data: { email: "entitlement-repo@example.test" } });
    userId = user.id;

    const product = await db.product.create({
      data: {
        slug: "entitlement-repo-product",
        name: "Entitlement Repo Test Product",
        summary: "Used only by this test.",
        status: "PUBLISHED",
        categoryId,
        publishedAt: new Date(),
      },
    });
    productId = product.id;
  });

  afterAll(async () => {
    // Deleting the user cascades to its entitlements (onDelete: Cascade),
    // which cascades to their downloads. Deleting the product independently
    // covers the case where a test created its own product/user pairing.
    await db.user.deleteMany({ where: { id: userId } });
    await db.product.deleteMany({ where: { id: productId } });
    await db.$disconnect();
  });

  it("creates a new entitlement on first grant, reused: false", async () => {
    const result = await repo.grantOrReuseEntitlement(userId, productId);

    expect(result.reused).toBe(false);
    expect(result.entitlement.userId).toBe(userId);
    expect(result.entitlement.productId).toBe(productId);
    expect(result.entitlement.source).toBe("FREE_POLICY");
    expect(result.entitlement.revokedAt).toBeNull();
  });

  it("reuses the existing entitlement on a repeat grant, reused: true, same id", async () => {
    const first = await repo.grantOrReuseEntitlement(userId, productId);
    const second = await repo.grantOrReuseEntitlement(userId, productId);

    expect(second.reused).toBe(true);
    expect(second.entitlement.id).toBe(first.entitlement.id);

    const all = await db.entitlement.findMany({ where: { userId, productId } });
    expect(all).toHaveLength(1);
  });

  it("does not create a duplicate entitlement under concurrent grant requests", async () => {
    const concurrentUser = await db.user.create({
      data: { email: "entitlement-repo-concurrent@example.test" },
    });
    try {
      const [a, b] = await Promise.all([
        repo.grantOrReuseEntitlement(concurrentUser.id, productId),
        repo.grantOrReuseEntitlement(concurrentUser.id, productId),
      ]);

      expect(a.entitlement.id).toBe(b.entitlement.id);
      // Exactly one of the two calls created the row; the other reused it.
      expect([a.reused, b.reused].sort()).toEqual([false, true]);

      const all = await db.entitlement.findMany({
        where: { userId: concurrentUser.id, productId },
      });
      expect(all).toHaveLength(1);
    } finally {
      await db.user.deleteMany({ where: { id: concurrentUser.id } });
    }
  });

  it("findEntitlement returns null when none exists, and the record when it does", async () => {
    const otherUser = await db.user.create({
      data: { email: "entitlement-repo-findnone@example.test" },
    });
    try {
      expect(await repo.findEntitlement(otherUser.id, productId)).toBeNull();

      await repo.grantOrReuseEntitlement(otherUser.id, productId);
      const found = await repo.findEntitlement(otherUser.id, productId);
      expect(found).not.toBeNull();
      expect(found?.userId).toBe(otherUser.id);
    } finally {
      await db.user.deleteMany({ where: { id: otherUser.id } });
    }
  });

  it("recordDownload is append-only: two calls for the same entitlement create two rows", async () => {
    const { entitlement } = await repo.grantOrReuseEntitlement(userId, productId);

    const first = await repo.recordDownload(entitlement.id, userId, productId);
    const second = await repo.recordDownload(entitlement.id, userId, productId);

    expect(first.id).not.toBe(second.id);
    const all = await db.download.findMany({ where: { entitlementId: entitlement.id } });
    expect(all.length).toBeGreaterThanOrEqual(2);
  });
});
