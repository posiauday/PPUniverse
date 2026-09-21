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
        slug: {
          in: [
            "catalog-repo-published",
            "catalog-repo-draft",
            "catalog-repo-draft-lookup",
            "catalog-repo-search-alpha",
            "catalog-repo-search-beta",
            "catalog-repo-search-draft",
          ],
        },
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

  describe("searchProducts", () => {
    beforeAll(async () => {
      await db.product.createMany({
        data: [
          {
            slug: "catalog-repo-search-alpha",
            name: "Zephyrform Approval Widget",
            summary: "A widget for approvals.",
            status: "PUBLISHED",
            categoryId,
            publishedAt: new Date(Date.now() - 1000),
          },
          {
            slug: "catalog-repo-search-beta",
            name: "Another Zephyrform Component",
            summary: "A second matching product.",
            status: "PUBLISHED",
            categoryId,
            publishedAt: new Date(),
          },
          {
            slug: "catalog-repo-search-draft",
            name: "Zephyrform Draft Item",
            summary: "Should never appear in search.",
            status: "DRAFT",
            categoryId,
          },
        ],
      });
    });

    it("finds only PUBLISHED products matching the keyword, never a DRAFT match", async () => {
      const result = await repo.searchProducts({
        query: "Zephyrform",
        sort: "relevance",
        page: 1,
        pageSize: 12,
      });

      expect(result.total).toBe(2);
      expect(result.items.map((p) => p.name)).not.toContain("Zephyrform Draft Item");
    });

    it("returns zero results and total 0 for a term that matches nothing", async () => {
      const result = await repo.searchProducts({
        query: "NoSuchKeywordAnywhere",
        sort: "relevance",
        page: 1,
        pageSize: 12,
      });
      expect(result.total).toBe(0);
      expect(result.items).toEqual([]);
    });

    it("sorts alphabetically by name when requested", async () => {
      const result = await repo.searchProducts({
        query: "Zephyrform",
        sort: "alphabetical",
        page: 1,
        pageSize: 12,
      });
      const names = result.items.map((p) => p.name);
      expect(names).toEqual([...names].sort());
    });

    it("paginates: a pageSize of 1 returns exactly 1 item but the correct total", async () => {
      const result = await repo.searchProducts({
        query: "Zephyrform",
        sort: "relevance",
        page: 1,
        pageSize: 1,
      });
      expect(result.items).toHaveLength(1);
      expect(result.total).toBe(2);
    });

    it("filters by category slug in combination with a search query", async () => {
      const result = await repo.searchProducts({
        query: "Zephyrform",
        categorySlug,
        sort: "relevance",
        page: 1,
        pageSize: 12,
      });
      expect(result.total).toBe(2);
      expect(result.items.every((p) => p.category.slug === categorySlug)).toBe(true);
    });
  });
});
