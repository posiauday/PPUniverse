import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";
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
    // Deleting a product cascades to its licenses, releases, support policy
    // and compatibility records. The seeded license tiers and categories are
    // permanent reference data and are never deleted here — only the
    // throwaway tier this file creates itself.
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
            "catalog-repo-detail-full",
            "catalog-repo-detail-legacy",
            "catalog-repo-detail-draft",
            "catalog-repo-detail-unreleased",
            "catalog-repo-evidence-constraints",
            "catalog-repo-sitemap-a",
            "catalog-repo-sitemap-b",
            "catalog-repo-sitemap-draft",
            "catalog-repo-sitemap-draft-only",
          ],
        },
      },
    });
    await db.licenseDefinition.deleteMany({ where: { slug: "catalog-repo-test-tier" } });
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

  describe("findPublishedProductDetailBySlug (MVP-005 evidence model)", () => {
    beforeAll(async () => {
      // Created out of display order on purpose (Enterprise before Personal,
      // Fabric before Power Apps, newest-created release unpublished) so the
      // ordering assertions below prove the query orders rather than that
      // insertion order happens to be right.
      await db.product.create({
        data: {
          slug: "catalog-repo-detail-full",
          name: "Fully Described Product",
          summary: "Has every evidence section.",
          status: "PUBLISHED",
          categoryId,
          publishedAt: new Date(),
          licenses: {
            create: [
              { licenseDefinition: { connect: { slug: "enterprise" } } },
              { licenseDefinition: { connect: { slug: "personal" } } },
            ],
          },
          releases: {
            create: [
              { version: "1.0.0", publishedAt: new Date("2026-01-10T00:00:00Z") },
              { version: "1.1.0", publishedAt: new Date("2026-03-10T00:00:00Z") },
              { version: "2.0.0-draft", publishedAt: null },
            ],
          },
          supportPolicy: {
            create: { status: "CREATOR_SUPPORTED", channel: "https://example.test/support" },
          },
          compatibility: {
            create: [
              {
                platformArea: "MICROSOFT_FABRIC",
                minReleaseYear: 2026,
                minReleaseWave: 1,
                evidenceStatus: "NOT_VERIFIED",
              },
              {
                platformArea: "POWER_APPS",
                minReleaseYear: 2025,
                minReleaseWave: 2,
                notes: "Requires Dataverse and premium connectors.",
                evidenceStatus: "TESTED",
                evidenceSummary: "Repeatable regression pass.",
                lastVerifiedAt: new Date("2026-03-12"),
              },
            ],
          },
        },
      });

      await db.product.create({
        data: {
          slug: "catalog-repo-detail-legacy",
          name: "Legacy Product Without Evidence",
          summary: "Created before the evidence model existed.",
          status: "PUBLISHED",
          categoryId,
          publishedAt: new Date(),
        },
      });

      await db.product.create({
        data: {
          slug: "catalog-repo-detail-draft",
          name: "Draft With Evidence",
          summary: "Must not be reachable.",
          status: "DRAFT",
          categoryId,
          supportPolicy: { create: { status: "UNSUPPORTED" } },
          compatibility: {
            create: [
              {
                platformArea: "POWER_BI",
                minReleaseYear: 2025,
                minReleaseWave: 1,
                evidenceStatus: "CREATOR_DECLARED",
              },
            ],
          },
        },
      });

      await db.product.create({
        data: {
          slug: "catalog-repo-detail-unreleased",
          name: "Only A Draft Release",
          summary: "Nothing published yet.",
          status: "PUBLISHED",
          categoryId,
          publishedAt: new Date(),
          releases: { create: [{ version: "0.1.0", publishedAt: null }] },
        },
      });
    });

    it("returns license tiers in tier order, the newest published version, support, and compatibility", async () => {
      const detail = await repo.findPublishedProductDetailBySlug("catalog-repo-detail-full");

      expect(detail?.name).toBe("Fully Described Product");
      expect(detail?.category.slug).toBe(categorySlug);
      expect(detail?.licenses.map((license) => license.slug)).toEqual(["personal", "enterprise"]);
      expect(detail?.currentVersion).toBe("1.1.0");
      expect(detail?.support).toEqual({
        status: "CREATOR_SUPPORTED",
        channel: "https://example.test/support",
      });
    });

    it("returns compatibility entries in platform-area order with structured release wave and a calendar date", async () => {
      const detail = await repo.findPublishedProductDetailBySlug("catalog-repo-detail-full");

      expect(detail?.compatibility).toEqual([
        expect.objectContaining({
          platformArea: "POWER_APPS",
          minReleaseYear: 2025,
          minReleaseWave: 2,
          notes: "Requires Dataverse and premium connectors.",
          evidenceStatus: "TESTED",
          evidenceSummary: "Repeatable regression pass.",
          lastVerifiedAt: "2026-03-12",
        }),
        expect.objectContaining({
          platformArea: "MICROSOFT_FABRIC",
          minReleaseYear: 2026,
          minReleaseWave: 1,
          notes: null,
          evidenceStatus: "NOT_VERIFIED",
          evidenceSummary: null,
          lastVerifiedAt: null,
        }),
      ]);
    });

    it("returns empty evidence — not an error — for a product created before the evidence model", async () => {
      const detail = await repo.findPublishedProductDetailBySlug("catalog-repo-detail-legacy");

      expect(detail?.name).toBe("Legacy Product Without Evidence");
      expect(detail?.licenses).toEqual([]);
      expect(detail?.currentVersion).toBeNull();
      expect(detail?.support).toBeNull();
      expect(detail?.compatibility).toEqual([]);
    });

    it("never treats an unpublished release as the current version", async () => {
      const detail = await repo.findPublishedProductDetailBySlug("catalog-repo-detail-unreleased");
      expect(detail?.name).toBe("Only A Draft Release");
      expect(detail?.currentVersion).toBeNull();
    });

    it("does not expose a DRAFT product's evidence", async () => {
      expect(await repo.findPublishedProductDetailBySlug("catalog-repo-detail-draft")).toBeNull();
    });

    it("returns null for an unknown slug", async () => {
      expect(await repo.findPublishedProductDetailBySlug("catalog-repo-detail-nope")).toBeNull();
    });
  });

  // The domain validator (compatibility.ts) is the first line of defence; these
  // prove the database refuses the same bad data if a future code path skips it.
  describe("evidence database constraints", () => {
    let productId: string;

    beforeAll(async () => {
      const product = await db.product.create({
        data: {
          slug: "catalog-repo-evidence-constraints",
          name: "Constraint Fixture",
          summary: "Used to probe evidence constraints.",
          status: "PUBLISHED",
          categoryId,
          publishedAt: new Date(),
        },
      });
      productId = product.id;
    });

    type CompatibilityInput = import("@ppu/db").Prisma.CompatibilityRecordUncheckedCreateInput;

    // POWER_AUTOMATE is taken by the positive control below; every rejection
    // case targets POWER_BI, and afterEach clears that slot so a missing
    // constraint can't make a later case "pass" by tripping the unique index.
    const record = (overrides: Partial<CompatibilityInput> = {}): CompatibilityInput => ({
      productId,
      platformArea: "POWER_AUTOMATE",
      minReleaseYear: 2025,
      minReleaseWave: 1,
      evidenceStatus: "CREATOR_DECLARED",
      ...overrides,
    });

    afterEach(async () => {
      await db.compatibilityRecord.deleteMany({ where: { productId, platformArea: "POWER_BI" } });
    });

    it("accepts a valid Creator Declared record (positive control for the rejections below)", async () => {
      await expect(db.compatibilityRecord.create({ data: record() })).resolves.toBeDefined();
    });

    it("allows only one compatibility entry per product and platform area", async () => {
      await expect(db.compatibilityRecord.create({ data: record() })).rejects.toThrow();
    });

    const rejectedRecords: Array<[string, Partial<CompatibilityInput>]> = [
      ["a release wave other than 1 or 2", { platformArea: "POWER_BI", minReleaseWave: 3 }],
      ["a release year before 2019", { platformArea: "POWER_BI", minReleaseYear: 2018 }],
      ["a release year after 2100", { platformArea: "POWER_BI", minReleaseYear: 2101 }],
      ["blank notes", { platformArea: "POWER_BI", notes: "   " }],
      ["notes longer than 500 characters", { platformArea: "POWER_BI", notes: "x".repeat(501) }],
      [
        "Tested status without an evidence summary or verified date",
        { platformArea: "POWER_BI", evidenceStatus: "TESTED" },
      ],
      [
        "Tested status with a summary but no verified date",
        { platformArea: "POWER_BI", evidenceStatus: "TESTED", evidenceSummary: "Repeatable pass." },
      ],
      [
        // TD-008: the reviewedAt <-> status CHECK, direction 1 -- Marketplace
        // Reviewed without a reviewedAt.
        "Marketplace Reviewed status without a reviewedAt",
        { platformArea: "POWER_BI", evidenceStatus: "MARKETPLACE_REVIEWED" },
      ],
      [
        // TD-008: direction 2 -- a reviewedAt on a status that isn't
        // Marketplace Reviewed. The two must never drift apart either way.
        "a reviewedAt set on a Creator Declared record",
        {
          platformArea: "POWER_BI",
          evidenceStatus: "CREATOR_DECLARED",
          reviewedAt: new Date("2026-09-24T00:00:00Z"),
        },
      ],
    ];

    it.each(rejectedRecords)("rejects %s", async (_label, overrides) => {
      await expect(db.compatibilityRecord.create({ data: record(overrides) })).rejects.toThrow();
      expect(
        await db.compatibilityRecord.count({ where: { productId, platformArea: "POWER_BI" } }),
      ).toBe(0);
    });

    it("accepts a Marketplace Reviewed record with a reviewedAt set (TD-008)", async () => {
      await expect(
        db.compatibilityRecord.create({
          data: record({
            platformArea: "POWER_BI",
            evidenceStatus: "MARKETPLACE_REVIEWED",
            reviewedAt: new Date("2026-09-24T00:00:00Z"),
          }),
        }),
      ).resolves.toBeDefined();
    });

    it("rejects a duplicate release version for the same product, and a blank version", async () => {
      await db.release.create({ data: { productId, version: "1.0.0" } });
      await expect(db.release.create({ data: { productId, version: "1.0.0" } })).rejects.toThrow();
      await expect(db.release.create({ data: { productId, version: "  " } })).rejects.toThrow();
    });

    it("requires a support channel unless the product is declared Unsupported", async () => {
      await expect(
        db.supportPolicy.create({ data: { productId, status: "COMMUNITY_SUPPORTED" } }),
      ).rejects.toThrow();
      expect(await db.supportPolicy.count({ where: { productId } })).toBe(0);
    });

    it("does not let a license tier that is in use be deleted", async () => {
      // A throwaway tier, so a missing RESTRICT can never delete real seed data.
      const tier = await db.licenseDefinition.create({
        data: {
          slug: "catalog-repo-test-tier",
          name: "Test Tier",
          description: "Created by the integration test only.",
          sortOrder: 999,
        },
      });
      await db.productLicense.create({ data: { productId, licenseDefinitionId: tier.id } });

      await expect(db.licenseDefinition.delete({ where: { id: tier.id } })).rejects.toThrow();
    });
  });

  describe("listSitemapEntries (MVP-021)", () => {
    // A DRAFT-only product in a different seeded category, to prove that a
    // category with no PUBLISHED product is left out. Only these rows are
    // created here and only these rows are deleted; the seeded categories
    // themselves are never touched.
    const draftOnlyCategorySlug = "governance-assets";

    beforeAll(async () => {
      const draftOnlyCategory = await db.category.findUniqueOrThrow({
        where: { slug: draftOnlyCategorySlug },
      });
      await db.product.createMany({
        data: [
          {
            slug: "catalog-repo-sitemap-a",
            name: "Sitemap Product A",
            summary: "Published.",
            status: "PUBLISHED",
            categoryId,
            publishedAt: new Date(),
          },
          {
            slug: "catalog-repo-sitemap-b",
            name: "Sitemap Product B",
            summary: "Published.",
            status: "PUBLISHED",
            categoryId,
            publishedAt: new Date(),
          },
          {
            slug: "catalog-repo-sitemap-draft",
            name: "Sitemap Draft",
            summary: "Never listed.",
            status: "DRAFT",
            categoryId,
          },
          {
            slug: "catalog-repo-sitemap-draft-only",
            name: "Sitemap Draft Only",
            summary: "Never listed.",
            status: "DRAFT",
            categoryId: draftOnlyCategory.id,
          },
        ],
      });
    });

    it("lists PUBLISHED products and never a DRAFT one", async () => {
      const entries = await repo.listSitemapEntries(50_000);

      expect(entries.productSlugs).toContain("catalog-repo-sitemap-a");
      expect(entries.productSlugs).toContain("catalog-repo-sitemap-b");
      expect(entries.productSlugs).not.toContain("catalog-repo-sitemap-draft");
      expect(entries.productSlugs).not.toContain("catalog-repo-sitemap-draft-only");
      expect(entries.truncated).toBe(false);
    });

    it("lists a category if and only if it currently has a PUBLISHED product", async () => {
      const entries = await repo.listSitemapEntries(50_000);
      const categories = await db.category.findMany();

      for (const category of categories) {
        const published = await db.product.count({
          where: { categoryId: category.id, status: "PUBLISHED" },
        });
        expect(entries.categorySlugs.includes(category.slug), category.slug).toBe(published > 0);
      }
      // This test's own published products make the primary category eligible.
      expect(entries.categorySlugs).toContain(categorySlug);
    });

    it("does not count a DRAFT product toward making its category eligible", async () => {
      const published = await db.product.count({
        where: { category: { slug: draftOnlyCategorySlug }, status: "PUBLISHED" },
      });
      const entries = await repo.listSitemapEntries(50_000);
      expect(entries.categorySlugs.includes(draftOnlyCategorySlug)).toBe(published > 0);
    });

    it("returns the same order on every call", async () => {
      const first = await repo.listSitemapEntries(50_000);
      const second = await repo.listSitemapEntries(50_000);
      expect(second.productSlugs).toEqual(first.productSlugs);
      expect(second.categorySlugs).toEqual(first.categorySlugs);
    });

    it("bounds categories plus products by maxEntries and reports truncation", async () => {
      const entries = await repo.listSitemapEntries(2);
      expect(entries.categorySlugs.length + entries.productSlugs.length).toBeLessThanOrEqual(2);
      expect(entries.truncated).toBe(true);
    });

    it("returns nothing but reports truncation when maxEntries is zero", async () => {
      const entries = await repo.listSitemapEntries(0);
      expect(entries.categorySlugs).toEqual([]);
      expect(entries.productSlugs).toEqual([]);
      expect(entries.truncated).toBe(true);
    });

    it.each([-1, 1.5, Number.NaN, Number.POSITIVE_INFINITY])(
      "rejects an invalid maxEntries of %s",
      async (invalid) => {
        await expect(repo.listSitemapEntries(invalid)).rejects.toThrow(RangeError);
      },
    );
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
