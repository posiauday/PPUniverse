import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { PrismaCatalogRepository } from "./catalog-repository.js";

/**
 * Runs only when DATABASE_URL points at a real, migrated Postgres database
 * (packages/db/prisma/schema). CI provides one via a Postgres service
 * container (.github/workflows/ci.yml). Locally, run `docker compose up -d`
 * (docker-compose.yml) and export DATABASE_URL before `pnpm test`.
 *
 * Uses the real seeded taxonomy category (packages/db/prisma/migrations/
 * 20260918000001_seed_catalog_categories) rather than creating a throwaway
 * one — `assetType` is unique per category, and all 6 enum values are
 * already taken by the permanent seed rows, so a test-created category
 * would collide with real data (this is exactly what happened the first
 * time this test ran against a genuinely migrated database in CI).
 */
const hasDatabase = Boolean(process.env["DATABASE_URL"]);

describe.skipIf(!hasDatabase)("PrismaCatalogRepository (integration)", () => {
  let db: import("@ppu/db").PrismaClient;
  let repo: PrismaCatalogRepository;
  let categoryId: string;
  const categorySlug = "power-apps-components";

  beforeAll(async () => {
    const { prisma } = await import("@ppu/db");
    db = prisma;
    repo = new PrismaCatalogRepository(db);

    const category = await db.category.findUniqueOrThrow({ where: { slug: categorySlug } });
    categoryId = category.id;
  });

  afterAll(async () => {
    await db.product.deleteMany({
      where: {
        slug: { in: ["catalog-repo-published", "catalog-repo-draft", "catalog-repo-draft-lookup"] },
      },
    });
    await db.$disconnect();
  });

  it("finds the real seeded category by slug", async () => {
    const category = await repo.findCategoryBySlug(categorySlug);
    expect(category?.id).toBe(categoryId);
    expect(category?.assetType).toBe("POWER_APPS_COMPONENT");
  });

  it("returns null for an unknown category slug", async () => {
    expect(await repo.findCategoryBySlug("does-not-exist")).toBeNull();
  });

  it("lists only PUBLISHED products for a category, not DRAFT ones", async () => {
    const published = await db.product.create({
      data: {
        slug: "catalog-repo-published",
        name: "Published Product",
        summary: "Visible.",
        status: "PUBLISHED",
        categoryId,
        publishedAt: new Date(),
      },
    });
    await db.product.create({
      data: {
        slug: "catalog-repo-draft",
        name: "Draft Product",
        summary: "Not visible.",
        status: "DRAFT",
        categoryId,
      },
    });

    const result = await repo.listPublishedProductsByCategory(categoryId);

    expect(result.map((p) => p.id)).toContain(published.id);
    expect(result.map((p) => p.name)).not.toContain("Draft Product");
  });

  it("finds a published product by slug with its category, but not a draft one", async () => {
    await db.product.create({
      data: {
        slug: "catalog-repo-draft-lookup",
        name: "Draft Lookup",
        summary: "Not visible.",
        status: "DRAFT",
        categoryId,
      },
    });

    const found = await repo.findPublishedProductBySlug("catalog-repo-published");
    expect(found?.name).toBe("Published Product");
    expect(found?.category.slug).toBe(categorySlug);

    expect(await repo.findPublishedProductBySlug("catalog-repo-draft-lookup")).toBeNull();
  });
});
