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
    // Deleting a product cascades to its licenses, releases (and each
    // release's ReleaseFile join rows), support policy and compatibility
    // records. The seeded license tiers and categories are permanent
    // reference data and are never deleted here — only the throwaway tier
    // this file creates itself. Every product slug this file creates shares
    // the reserved "catalog-repo-" prefix (matches the reserved
    // non-production prefix convention, docs/final-decisions.md, "MVP-023"
    // Q36), so a prefix match replaces what used to be a hand-maintained
    // exact slug list — every test below only ever needs to add its own
    // "catalog-repo-..." slug, never touch this cleanup block.
    // ProductStatusEvent (MVP-019) has a Restrict FK on productId -- must be
    // cleared before the product deleteMany below, same lesson as
    // ReleasePublishEvent's Restrict FK in MVP-014.
    await db.productStatusEvent.deleteMany({
      where: { product: { slug: { startsWith: "catalog-repo-" } } },
    });
    await db.product.deleteMany({ where: { slug: { startsWith: "catalog-repo-" } } });
    await db.licenseDefinition.deleteMany({ where: { slug: "catalog-repo-test-tier" } });
    // FileScan rows the admin-authoring-surface tests below create for
    // ReleaseFile attachment (their ReleaseFile join rows are already gone
    // via the product/release cascade above; FileScan itself has no FK to a
    // product, so it needs its own cleanup, scoped to the admin test user
    // this file creates).
    await db.fileScan.deleteMany({ where: { storageKey: { startsWith: "catalog-repo-" } } });
    await db.user.deleteMany({ where: { email: { startsWith: "catalog-repo-" } } });
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

  describe("Admin authoring surface (MVP-012)", () => {
    let adminUserId: string;
    let personalTierId: string;
    let enterpriseTierId: string;

    beforeAll(async () => {
      const user = await db.user.create({
        data: { email: "catalog-repo-admin@example.test", role: "ADMIN" },
      });
      adminUserId = user.id;
      const personal = await db.licenseDefinition.findUniqueOrThrow({
        where: { slug: "personal" },
      });
      const enterprise = await db.licenseDefinition.findUniqueOrThrow({
        where: { slug: "enterprise" },
      });
      personalTierId = personal.id;
      enterpriseTierId = enterprise.id;
    });

    it("createProductDraft always starts DRAFT", async () => {
      const product = await repo.createProductDraft({
        name: "Admin Draft Product",
        slug: "catalog-repo-admin-draft",
        summary: "A draft created via the admin authoring surface.",
        categoryId,
      });
      expect(product.status).toBe("DRAFT");
      expect(product.name).toBe("Admin Draft Product");
    });

    it("updateProductDraft changes core fields but never status", async () => {
      const created = await repo.createProductDraft({
        name: "Original name",
        slug: "catalog-repo-admin-update",
        summary: "Original summary.",
        categoryId,
      });
      const updated = await repo.updateProductDraft(created.id, {
        name: "Updated name",
        slug: "catalog-repo-admin-update",
        summary: "Updated summary.",
        categoryId,
      });
      expect(updated.name).toBe("Updated name");
      expect(updated.summary).toBe("Updated summary.");
      expect(updated.status).toBe("DRAFT");
    });

    it("findProductByIdForAdmin finds a DRAFT product; findPublishedProductBySlug does not", async () => {
      const created = await repo.createProductDraft({
        name: "Admin Lookup",
        slug: "catalog-repo-admin-lookup",
        summary: "Summary.",
        categoryId,
      });
      const found = await repo.findProductByIdForAdmin(created.id);
      expect(found?.id).toBe(created.id);
      expect(found?.category.slug).toBe(categorySlug);
      expect(await repo.findPublishedProductBySlug("catalog-repo-admin-lookup")).toBeNull();
    });

    it("findProductByIdForAdmin returns null for an unknown id", async () => {
      expect(await repo.findProductByIdForAdmin("does-not-exist")).toBeNull();
    });

    it("listProductsForAdmin lists every status", async () => {
      const created = await repo.createProductDraft({
        name: "Admin List",
        slug: "catalog-repo-admin-list",
        summary: "Summary.",
        categoryId,
      });
      const all = await repo.listProductsForAdmin();
      expect(all.map((p) => p.id)).toContain(created.id);
    });

    describe("publishProductWithRelease and the readiness gate", () => {
      it("getProductPublishSnapshot reports zero counts for a bare draft", async () => {
        const created = await repo.createProductDraft({
          name: "Readiness Check",
          slug: "catalog-repo-readiness",
          summary: "Summary.",
          categoryId,
        });
        const snapshot = await repo.getProductPublishSnapshot(created.id);
        expect(snapshot).toEqual({
          licenseCount: 0,
          hasSupportPolicy: false,
          compatibilityCount: 0,
          releasesWithCleanFileCount: 0,
        });
      });

      /** Builds a product with every mandatory field satisfied and one
       * eligible draft release, for the publish-path tests below. */
      async function createFullyReadyProduct(slugSuffix: string) {
        const created = await repo.createProductDraft({
          name: "Fully Ready",
          slug: `catalog-repo-fully-ready-${slugSuffix}`,
          summary: "Summary.",
          categoryId,
        });
        await repo.setProductLicenses(created.id, [personalTierId]);
        await repo.upsertSupportPolicy(created.id, { status: "UNSUPPORTED", channel: null });
        await repo.upsertCompatibilityEntry(created.id, {
          platformArea: "POWER_APPS",
          minReleaseYear: 2025,
          minReleaseWave: 1,
          notes: null,
          evidenceStatus: "CREATOR_DECLARED",
          evidenceSummary: null,
          lastVerifiedAt: null,
        });
        const release = await repo.createRelease(created.id, "1.0.0");
        const fileScan = await db.fileScan.create({
          data: {
            storageKey: `catalog-repo-release-file-${release.id}`,
            originalFilename: "package.zip",
            declaredMimeType: "application/zip",
            sizeBytes: 1024,
            status: "CLEAN",
            uploadedByUserId: adminUserId,
          },
        });
        await repo.attachReleaseFile(created.id, release.id, fileScan.id);
        return { product: created, release, fileScan };
      }

      it("publishes the Product and the selected Release atomically, and rejects double-publish", async () => {
        const { product, release } = await createFullyReadyProduct("double");
        const result = await repo.publishProductWithRelease(product.id, release.id);
        expect(result.product.status).toBe("PUBLISHED");
        expect(result.release.publishedAt).not.toBeNull();

        const productRow = await db.product.findUniqueOrThrow({ where: { id: product.id } });
        const releaseRow = await db.release.findUniqueOrThrow({ where: { id: release.id } });
        expect(productRow.publishedAt).not.toBeNull();
        expect(releaseRow.publishedAt).not.toBeNull();
        expect(productRow.publishedAt?.getTime()).toBe(releaseRow.publishedAt?.getTime());

        // Re-publishing the same product: it's no longer DRAFT.
        const anotherRelease = await repo.createRelease(product.id, "2.0.0");
        await expect(repo.publishProductWithRelease(product.id, anotherRelease.id)).rejects.toThrow(
          /not found|status|DRAFT/i,
        );
      });

      it("rejects publication with no release selected against an unready product, naming every missing field", async () => {
        const created = await repo.createProductDraft({
          name: "Not Ready",
          slug: "catalog-repo-not-ready",
          summary: "Summary.",
          categoryId,
        });
        const release = await repo.createRelease(created.id, "1.0.0");
        await expect(repo.publishProductWithRelease(created.id, release.id)).rejects.toThrow();
        const row = await db.product.findUniqueOrThrow({ where: { id: created.id } });
        expect(row.status).toBe("DRAFT");
        expect(row.publishedAt).toBeNull();
      });

      it("rejects a release id that belongs to a different product (cross-product access)", async () => {
        const { product: productA } = await createFullyReadyProduct("cross-a");
        const { release: releaseB } = await createFullyReadyProduct("cross-b");
        await expect(repo.publishProductWithRelease(productA.id, releaseB.id)).rejects.toThrow();
        const rowA = await db.product.findUniqueOrThrow({ where: { id: productA.id } });
        expect(rowA.status).toBe("DRAFT");
      });

      it("rejects a release with no attached CLEAN file even when the product is otherwise ready", async () => {
        const created = await repo.createProductDraft({
          name: "Release Not Ready",
          slug: "catalog-repo-release-not-ready",
          summary: "Summary.",
          categoryId,
        });
        await repo.setProductLicenses(created.id, [personalTierId]);
        await repo.upsertSupportPolicy(created.id, { status: "UNSUPPORTED", channel: null });
        await repo.upsertCompatibilityEntry(created.id, {
          platformArea: "POWER_BI",
          minReleaseYear: 2025,
          minReleaseWave: 1,
          notes: null,
          evidenceStatus: "CREATOR_DECLARED",
          evidenceSummary: null,
          lastVerifiedAt: null,
        });
        const release = await repo.createRelease(created.id, "1.0.0");
        await expect(repo.publishProductWithRelease(created.id, release.id)).rejects.toThrow();
        const row = await db.product.findUniqueOrThrow({ where: { id: created.id } });
        expect(row.status).toBe("DRAFT");
        const releaseRow = await db.release.findUniqueOrThrow({ where: { id: release.id } });
        expect(releaseRow.publishedAt).toBeNull();
      });

      it("rejects publishing an already-published release again, leaving the product untouched", async () => {
        const { product, release } = await createFullyReadyProduct("already-published");
        await repo.publishProductWithRelease(product.id, release.id);
        // A second draft release exists; attempting to publish the *original*
        // (already-published) release id again must fail, distinct from the
        // "product is no longer DRAFT" case covered above.
        await expect(repo.publishProductWithRelease(product.id, release.id)).rejects.toThrow();
      });

      it("a fully-evidenced product's snapshot reports ready, and publishing sets both timestamps", async () => {
        const { product, release } = await createFullyReadyProduct("snapshot");
        const snapshot = await repo.getProductPublishSnapshot(product.id);
        expect(snapshot).toEqual({
          licenseCount: 1,
          hasSupportPolicy: true,
          compatibilityCount: 1,
          releasesWithCleanFileCount: 1,
        });

        const result = await repo.publishProductWithRelease(product.id, release.id);
        expect(result.product.status).toBe("PUBLISHED");
        expect(result.release.publishedAt).not.toBeNull();

        // Once published, the release no longer counts toward the readiness
        // snapshot (it's not a candidate to select again).
        const afterSnapshot = await repo.getProductPublishSnapshot(product.id);
        expect(afterSnapshot.releasesWithCleanFileCount).toBe(0);
      });

      it("a release with only a non-CLEAN attachment does not count toward readiness", async () => {
        const created = await repo.createProductDraft({
          name: "Dirty Release Only",
          slug: "catalog-repo-dirty-release-only",
          summary: "Summary.",
          categoryId,
        });
        const release = await repo.createRelease(created.id, "1.0.0");
        await db.fileScan.create({
          data: {
            storageKey: `catalog-repo-quarantined-${release.id}`,
            originalFilename: "package.zip",
            declaredMimeType: "application/zip",
            sizeBytes: 1024,
            status: "QUARANTINED",
            uploadedByUserId: adminUserId,
          },
        });
        const snapshot = await repo.getProductPublishSnapshot(created.id);
        expect(snapshot.releasesWithCleanFileCount).toBe(0);
      });

      it("a published product can still receive a new draft release, which does not appear as the public current version", async () => {
        const { product, release } = await createFullyReadyProduct("post-publish-draft");
        await repo.publishProductWithRelease(product.id, release.id);

        const nextRelease = await repo.createRelease(product.id, "1.1.0");
        expect(nextRelease.publishedAt).toBeNull();

        const detail = await repo.findPublishedProductDetailBySlug(product.slug);
        expect(detail?.currentVersion).toBe("1.0.0");

        const releases = await repo.listReleasesForAdmin(product.id);
        const found = releases.find((entry) => entry.id === nextRelease.id);
        expect(found?.publishedAt).toBeNull();
      });
    });

    describe("getProductEvidenceForAdmin", () => {
      it("returns empty evidence for a bare draft, and the real evidence once set", async () => {
        const created = await repo.createProductDraft({
          name: "Admin Evidence",
          slug: "catalog-repo-admin-evidence",
          summary: "Summary.",
          categoryId,
        });

        const empty = await repo.getProductEvidenceForAdmin(created.id);
        expect(empty).toEqual({ licenseDefinitionIds: [], support: null, compatibility: [] });

        await repo.setProductLicenses(created.id, [personalTierId]);
        await repo.upsertSupportPolicy(created.id, {
          status: "PLATFORM_SUPPORTED",
          channel: "https://example.test/support",
        });
        await repo.upsertCompatibilityEntry(created.id, {
          platformArea: "POWER_AUTOMATE",
          minReleaseYear: 2025,
          minReleaseWave: 2,
          notes: null,
          evidenceStatus: "CREATOR_DECLARED",
          evidenceSummary: null,
          lastVerifiedAt: null,
        });

        const filled = await repo.getProductEvidenceForAdmin(created.id);
        expect(filled.licenseDefinitionIds).toEqual([personalTierId]);
        expect(filled.support).toEqual({
          status: "PLATFORM_SUPPORTED",
          channel: "https://example.test/support",
        });
        expect(filled.compatibility).toHaveLength(1);
        expect(filled.compatibility[0]?.platformArea).toBe("POWER_AUTOMATE");
      });
    });

    describe("setProductLicenses", () => {
      it("replaces the full assigned set rather than adding incrementally", async () => {
        const created = await repo.createProductDraft({
          name: "License Replace",
          slug: "catalog-repo-license-replace",
          summary: "Summary.",
          categoryId,
        });
        await repo.setProductLicenses(created.id, [personalTierId, enterpriseTierId]);
        expect(await db.productLicense.count({ where: { productId: created.id } })).toBe(2);

        await repo.setProductLicenses(created.id, [personalTierId]);
        const remaining = await db.productLicense.findMany({ where: { productId: created.id } });
        expect(remaining.map((l) => l.licenseDefinitionId)).toEqual([personalTierId]);

        await repo.setProductLicenses(created.id, []);
        expect(await db.productLicense.count({ where: { productId: created.id } })).toBe(0);
      });
    });

    describe("listLicenseDefinitions", () => {
      it("lists the seeded license tiers in sortOrder, including Personal and Enterprise", async () => {
        const definitions = await repo.listLicenseDefinitions();
        const sorted = [...definitions].sort((a, b) => a.sortOrder - b.sortOrder);
        expect(definitions).toEqual(sorted);
        expect(definitions.map((d) => d.slug)).toContain("personal");
        expect(definitions.map((d) => d.slug)).toContain("enterprise");
      });
    });

    describe("upsertSupportPolicy", () => {
      it("creates then updates the same policy (upsert, not insert-only)", async () => {
        const created = await repo.createProductDraft({
          name: "Support Upsert",
          slug: "catalog-repo-support-upsert",
          summary: "Summary.",
          categoryId,
        });
        const first = await repo.upsertSupportPolicy(created.id, {
          status: "COMMUNITY_SUPPORTED",
          channel: "https://example.test/support",
        });
        expect(first.status).toBe("COMMUNITY_SUPPORTED");

        const second = await repo.upsertSupportPolicy(created.id, {
          status: "UNSUPPORTED",
          channel: null,
        });
        expect(second.status).toBe("UNSUPPORTED");
        expect(second.channel).toBeNull();
        expect(await db.supportPolicy.count({ where: { productId: created.id } })).toBe(1);
      });
    });

    describe("upsertCompatibilityEntry", () => {
      it("upserts keyed on (productId, platformArea)", async () => {
        const created = await repo.createProductDraft({
          name: "Compatibility Upsert",
          slug: "catalog-repo-compat-upsert",
          summary: "Summary.",
          categoryId,
        });
        const first = await repo.upsertCompatibilityEntry(created.id, {
          platformArea: "POWER_BI",
          minReleaseYear: 2025,
          minReleaseWave: 1,
          notes: "Initial notes.",
          evidenceStatus: "CREATOR_DECLARED",
          evidenceSummary: null,
          lastVerifiedAt: null,
        });
        expect(first.notes).toBe("Initial notes.");

        const second = await repo.upsertCompatibilityEntry(created.id, {
          platformArea: "POWER_BI",
          minReleaseYear: 2025,
          minReleaseWave: 2,
          notes: "Updated notes.",
          evidenceStatus: "CREATOR_DECLARED",
          evidenceSummary: null,
          lastVerifiedAt: null,
        });
        expect(second.id).toBe(first.id);
        expect(second.minReleaseWave).toBe(2);
        expect(second.notes).toBe("Updated notes.");
        expect(
          await db.compatibilityRecord.count({
            where: { productId: created.id, platformArea: "POWER_BI" },
          }),
        ).toBe(1);
      });

      it("refuses to persist MARKETPLACE_REVIEWED even though the type allows it (defense in depth, TD-008 section 9)", async () => {
        const created = await repo.createProductDraft({
          name: "Compatibility Reject",
          slug: "catalog-repo-compat-reject",
          summary: "Summary.",
          categoryId,
        });
        await expect(
          repo.upsertCompatibilityEntry(created.id, {
            platformArea: "DATAVERSE",
            minReleaseYear: 2025,
            minReleaseWave: 1,
            notes: null,
            evidenceStatus: "MARKETPLACE_REVIEWED",
            evidenceSummary: null,
            lastVerifiedAt: null,
          }),
        ).rejects.toThrow();
        expect(
          await db.compatibilityRecord.count({
            where: { productId: created.id, platformArea: "DATAVERSE" },
          }),
        ).toBe(0);
      });
    });

    describe("createRelease, attachReleaseFile, detachReleaseFile and listReleasesForAdmin", () => {
      it("attachReleaseFile rejects a file that is not CLEAN, and never creates the join row", async () => {
        const created = await repo.createProductDraft({
          name: "Attach Reject",
          slug: "catalog-repo-attach-reject",
          summary: "Summary.",
          categoryId,
        });
        const release = await repo.createRelease(created.id, "1.0.0");
        const dirty = await db.fileScan.create({
          data: {
            storageKey: `catalog-repo-dirty-${release.id}`,
            originalFilename: "malware.zip",
            declaredMimeType: "application/zip",
            sizeBytes: 10,
            status: "QUARANTINED",
            uploadedByUserId: adminUserId,
          },
        });

        await expect(repo.attachReleaseFile(created.id, release.id, dirty.id)).rejects.toThrow();
        expect(await db.releaseFile.count({ where: { releaseId: release.id } })).toBe(0);
      });

      it("attachReleaseFile rejects an unknown release or file scan id", async () => {
        const created = await repo.createProductDraft({
          name: "Attach Unknown",
          slug: "catalog-repo-attach-unknown",
          summary: "Summary.",
          categoryId,
        });
        const release = await repo.createRelease(created.id, "1.0.0");
        const clean = await db.fileScan.create({
          data: {
            storageKey: `catalog-repo-clean-unknown-release-${release.id}`,
            originalFilename: "package.zip",
            declaredMimeType: "application/zip",
            sizeBytes: 10,
            status: "CLEAN",
            uploadedByUserId: adminUserId,
          },
        });

        await expect(
          repo.attachReleaseFile(created.id, "does-not-exist", clean.id),
        ).rejects.toThrow();
        await expect(
          repo.attachReleaseFile(created.id, release.id, "does-not-exist"),
        ).rejects.toThrow();
      });

      it("attachReleaseFile rejects a release id that belongs to a different product", async () => {
        const productA = await repo.createProductDraft({
          name: "Attach Cross A",
          slug: "catalog-repo-attach-cross-a",
          summary: "Summary.",
          categoryId,
        });
        const productB = await repo.createProductDraft({
          name: "Attach Cross B",
          slug: "catalog-repo-attach-cross-b",
          summary: "Summary.",
          categoryId,
        });
        const releaseB = await repo.createRelease(productB.id, "1.0.0");
        const clean = await db.fileScan.create({
          data: {
            storageKey: `catalog-repo-clean-cross-${releaseB.id}`,
            originalFilename: "package.zip",
            declaredMimeType: "application/zip",
            sizeBytes: 10,
            status: "CLEAN",
            uploadedByUserId: adminUserId,
          },
        });

        // productA's id supplied with productB's release id: rejected, not
        // silently attached against the wrong product.
        await expect(repo.attachReleaseFile(productA.id, releaseB.id, clean.id)).rejects.toThrow();
        expect(await db.releaseFile.count({ where: { releaseId: releaseB.id } })).toBe(0);
      });

      it("attachReleaseFile accepts a CLEAN file and listReleasesForAdmin reports it; attaching twice is a no-op", async () => {
        const created = await repo.createProductDraft({
          name: "Attach Accept",
          slug: "catalog-repo-attach-accept",
          summary: "Summary.",
          categoryId,
        });
        const release = await repo.createRelease(created.id, "1.0.0");
        const clean = await db.fileScan.create({
          data: {
            storageKey: `catalog-repo-clean-${release.id}`,
            originalFilename: "package.zip",
            declaredMimeType: "application/zip",
            sizeBytes: 2048,
            status: "CLEAN",
            uploadedByUserId: adminUserId,
          },
        });

        await repo.attachReleaseFile(created.id, release.id, clean.id);
        await repo.attachReleaseFile(created.id, release.id, clean.id);
        expect(await db.releaseFile.count({ where: { releaseId: release.id } })).toBe(1);

        const releases = await repo.listReleasesForAdmin(created.id);
        expect(releases).toHaveLength(1);
        expect(releases[0]?.files).toEqual([{ fileScanId: clean.id, status: "CLEAN" }]);
      });

      it("attachReleaseFile rejects attaching to an already-published release", async () => {
        const created = await repo.createProductDraft({
          name: "Attach Published Reject",
          slug: "catalog-repo-attach-published-reject",
          summary: "Summary.",
          categoryId,
        });
        await repo.setProductLicenses(created.id, [personalTierId]);
        await repo.upsertSupportPolicy(created.id, { status: "UNSUPPORTED", channel: null });
        await repo.upsertCompatibilityEntry(created.id, {
          platformArea: "POWER_PAGES",
          minReleaseYear: 2025,
          minReleaseWave: 1,
          notes: null,
          evidenceStatus: "CREATOR_DECLARED",
          evidenceSummary: null,
          lastVerifiedAt: null,
        });
        const release = await repo.createRelease(created.id, "1.0.0");
        const clean = await db.fileScan.create({
          data: {
            storageKey: `catalog-repo-clean-published-${release.id}`,
            originalFilename: "package.zip",
            declaredMimeType: "application/zip",
            sizeBytes: 2048,
            status: "CLEAN",
            uploadedByUserId: adminUserId,
          },
        });
        await repo.attachReleaseFile(created.id, release.id, clean.id);
        await repo.publishProductWithRelease(created.id, release.id);

        const secondFile = await db.fileScan.create({
          data: {
            storageKey: `catalog-repo-clean-published-2-${release.id}`,
            originalFilename: "package-2.zip",
            declaredMimeType: "application/zip",
            sizeBytes: 2048,
            status: "CLEAN",
            uploadedByUserId: adminUserId,
          },
        });
        await expect(
          repo.attachReleaseFile(created.id, release.id, secondFile.id),
        ).rejects.toThrow();
        expect(await db.releaseFile.count({ where: { releaseId: release.id } })).toBe(1);
      });

      it("detachReleaseFile removes only the join row, never the underlying FileScan, and is idempotent", async () => {
        const created = await repo.createProductDraft({
          name: "Detach Draft",
          slug: "catalog-repo-detach-draft",
          summary: "Summary.",
          categoryId,
        });
        const release = await repo.createRelease(created.id, "1.0.0");
        const clean = await db.fileScan.create({
          data: {
            storageKey: `catalog-repo-clean-detach-${release.id}`,
            originalFilename: "package.zip",
            declaredMimeType: "application/zip",
            sizeBytes: 2048,
            status: "CLEAN",
            uploadedByUserId: adminUserId,
          },
        });
        await repo.attachReleaseFile(created.id, release.id, clean.id);
        expect(await db.releaseFile.count({ where: { releaseId: release.id } })).toBe(1);

        await repo.detachReleaseFile(created.id, release.id, clean.id);
        expect(await db.releaseFile.count({ where: { releaseId: release.id } })).toBe(0);
        // The underlying FileScan itself must still exist, untouched.
        const stillThere = await db.fileScan.findUnique({ where: { id: clean.id } });
        expect(stillThere).not.toBeNull();
        expect(stillThere?.status).toBe("CLEAN");

        // Detaching again (already detached) is a no-op, not an error.
        await expect(
          repo.detachReleaseFile(created.id, release.id, clean.id),
        ).resolves.toBeUndefined();
      });

      it("detachReleaseFile rejects an already-published release", async () => {
        const created = await repo.createProductDraft({
          name: "Detach Published Reject",
          slug: "catalog-repo-detach-published-reject",
          summary: "Summary.",
          categoryId,
        });
        await repo.setProductLicenses(created.id, [enterpriseTierId]);
        await repo.upsertSupportPolicy(created.id, { status: "UNSUPPORTED", channel: null });
        await repo.upsertCompatibilityEntry(created.id, {
          platformArea: "MICROSOFT_FABRIC",
          minReleaseYear: 2025,
          minReleaseWave: 1,
          notes: null,
          evidenceStatus: "CREATOR_DECLARED",
          evidenceSummary: null,
          lastVerifiedAt: null,
        });
        const release = await repo.createRelease(created.id, "1.0.0");
        const clean = await db.fileScan.create({
          data: {
            storageKey: `catalog-repo-clean-detach-published-${release.id}`,
            originalFilename: "package.zip",
            declaredMimeType: "application/zip",
            sizeBytes: 2048,
            status: "CLEAN",
            uploadedByUserId: adminUserId,
          },
        });
        await repo.attachReleaseFile(created.id, release.id, clean.id);
        await repo.publishProductWithRelease(created.id, release.id);

        await expect(repo.detachReleaseFile(created.id, release.id, clean.id)).rejects.toThrow();
        expect(await db.releaseFile.count({ where: { releaseId: release.id } })).toBe(1);
      });

      it("detachReleaseFile rejects a release id that belongs to a different product", async () => {
        const productA = await repo.createProductDraft({
          name: "Detach Cross A",
          slug: "catalog-repo-detach-cross-a",
          summary: "Summary.",
          categoryId,
        });
        const productB = await repo.createProductDraft({
          name: "Detach Cross B",
          slug: "catalog-repo-detach-cross-b",
          summary: "Summary.",
          categoryId,
        });
        const releaseB = await repo.createRelease(productB.id, "1.0.0");
        const clean = await db.fileScan.create({
          data: {
            storageKey: `catalog-repo-clean-detach-cross-${releaseB.id}`,
            originalFilename: "package.zip",
            declaredMimeType: "application/zip",
            sizeBytes: 10,
            status: "CLEAN",
            uploadedByUserId: adminUserId,
          },
        });
        await repo.attachReleaseFile(productB.id, releaseB.id, clean.id);

        await expect(repo.detachReleaseFile(productA.id, releaseB.id, clean.id)).rejects.toThrow();
        expect(await db.releaseFile.count({ where: { releaseId: releaseB.id } })).toBe(1);
      });

      it("rejects a duplicate release version for the same product (unique constraint)", async () => {
        const created = await repo.createProductDraft({
          name: "Duplicate Version",
          slug: "catalog-repo-dup-version",
          summary: "Summary.",
          categoryId,
        });
        await repo.createRelease(created.id, "1.0.0");
        await expect(repo.createRelease(created.id, "1.0.0")).rejects.toThrow();
      });

      it("listReleasesForAdmin returns newest first with an empty files array when nothing is attached", async () => {
        const created = await repo.createProductDraft({
          name: "Release List Order",
          slug: "catalog-repo-release-order",
          summary: "Summary.",
          categoryId,
        });
        await repo.createRelease(created.id, "1.0.0");
        await new Promise((resolve) => setTimeout(resolve, 5));
        await repo.createRelease(created.id, "2.0.0");

        const releases = await repo.listReleasesForAdmin(created.id);
        expect(releases.map((r) => r.version)).toEqual(["2.0.0", "1.0.0"]);
        expect(releases[0]?.files).toEqual([]);
      });
    });

    describe("changeProductStatus and listRecentProductStatusEvents (MVP-019)", () => {
      /** Builds and publishes a fully-ready product, returning its id --
       * the starting point every suspend/archive/reinstate test needs. */
      async function createPublishedProduct(slugSuffix: string) {
        const created = await repo.createProductDraft({
          name: "Status Change Target",
          slug: `catalog-repo-status-${slugSuffix}`,
          summary: "Summary.",
          categoryId,
        });
        await repo.setProductLicenses(created.id, [personalTierId]);
        await repo.upsertSupportPolicy(created.id, { status: "UNSUPPORTED", channel: null });
        await repo.upsertCompatibilityEntry(created.id, {
          platformArea: "POWER_APPS",
          minReleaseYear: 2025,
          minReleaseWave: 1,
          notes: null,
          evidenceStatus: "CREATOR_DECLARED",
          evidenceSummary: null,
          lastVerifiedAt: null,
        });
        const release = await repo.createRelease(created.id, "1.0.0");
        const fileScan = await db.fileScan.create({
          data: {
            storageKey: `catalog-repo-status-file-${release.id}`,
            originalFilename: "package.zip",
            declaredMimeType: "application/zip",
            sizeBytes: 1024,
            status: "CLEAN",
            uploadedByUserId: adminUserId,
          },
        });
        await repo.attachReleaseFile(created.id, release.id, fileScan.id);
        await repo.publishProductWithRelease(created.id, release.id);
        return created.id;
      }

      it("suspends a PUBLISHED product, writing a ProductStatusEvent with the reason", async () => {
        const productId = await createPublishedProduct("suspend");
        const result = await repo.changeProductStatus(
          productId,
          "SUSPENDED",
          adminUserId,
          "Temporary pause for maintenance.",
        );
        expect(result.product.status).toBe("SUSPENDED");
        expect(result.statusEvent.fromStatus).toBe("PUBLISHED");
        expect(result.statusEvent.toStatus).toBe("SUSPENDED");
        expect(result.statusEvent.reason).toBe("Temporary pause for maintenance.");

        const row = await db.product.findUniqueOrThrow({ where: { id: productId } });
        expect(row.status).toBe("SUSPENDED");
      });

      it("reinstates a SUSPENDED product back to PUBLISHED", async () => {
        const productId = await createPublishedProduct("reinstate");
        await repo.changeProductStatus(productId, "SUSPENDED", adminUserId, "Pausing sales.");
        const result = await repo.changeProductStatus(
          productId,
          "PUBLISHED",
          adminUserId,
          "Resuming sales.",
        );
        expect(result.product.status).toBe("PUBLISHED");
        expect(result.statusEvent.fromStatus).toBe("SUSPENDED");
        expect(result.statusEvent.toStatus).toBe("PUBLISHED");
      });

      it("archives a PUBLISHED product directly, and rejects any further transition -- ARCHIVED is terminal", async () => {
        const productId = await createPublishedProduct("archive-terminal");
        await repo.changeProductStatus(
          productId,
          "ARCHIVED",
          adminUserId,
          "Retiring this product.",
        );

        const row = await db.product.findUniqueOrThrow({ where: { id: productId } });
        expect(row.status).toBe("ARCHIVED");

        await expect(
          repo.changeProductStatus(productId, "PUBLISHED", adminUserId, "Trying to reinstate."),
        ).rejects.toThrow();
        await expect(
          repo.changeProductStatus(productId, "SUSPENDED", adminUserId, "Trying to suspend."),
        ).rejects.toThrow();
      });

      it("archives a SUSPENDED product", async () => {
        const productId = await createPublishedProduct("suspend-then-archive");
        await repo.changeProductStatus(productId, "SUSPENDED", adminUserId, "Pausing.");
        const result = await repo.changeProductStatus(
          productId,
          "ARCHIVED",
          adminUserId,
          "Retiring after pause.",
        );
        expect(result.product.status).toBe("ARCHIVED");
        expect(result.statusEvent.fromStatus).toBe("SUSPENDED");
      });

      it("rejects suspending or archiving a DRAFT product", async () => {
        const created = await repo.createProductDraft({
          name: "Draft Status Target",
          slug: "catalog-repo-status-draft-reject",
          summary: "Summary.",
          categoryId,
        });
        await expect(
          repo.changeProductStatus(created.id, "SUSPENDED", adminUserId, "Reason."),
        ).rejects.toThrow();
        await expect(
          repo.changeProductStatus(created.id, "ARCHIVED", adminUserId, "Reason."),
        ).rejects.toThrow();
      });

      it("rejects an empty or blank reason without writing any event", async () => {
        const productId = await createPublishedProduct("blank-reason");
        await expect(
          repo.changeProductStatus(productId, "SUSPENDED", adminUserId, ""),
        ).rejects.toThrow();
        await expect(
          repo.changeProductStatus(productId, "SUSPENDED", adminUserId, "   "),
        ).rejects.toThrow();
        expect(await db.productStatusEvent.count({ where: { productId } })).toBe(0);
        const row = await db.product.findUniqueOrThrow({ where: { id: productId } });
        expect(row.status).toBe("PUBLISHED");
      });

      it("rejects an unknown product id", async () => {
        await expect(
          repo.changeProductStatus("does-not-exist", "SUSPENDED", adminUserId, "Reason."),
        ).rejects.toThrow();
      });

      it("two concurrent requests for the same target status: exactly one succeeds", async () => {
        // Regression test for the duplicate-request outcome (one fulfilled,
        // one rejected, one event). It does not force the two calls to
        // overlap inside the database -- the repeated-race test below is
        // the one that hunts for genuine interleavings.
        const productId = await createPublishedProduct("race-same-target");
        const [first, second] = await Promise.allSettled([
          repo.changeProductStatus(productId, "SUSPENDED", adminUserId, "First attempt."),
          repo.changeProductStatus(productId, "SUSPENDED", adminUserId, "Second attempt."),
        ]);
        const outcomes = [first, second];
        expect(outcomes.filter((o) => o.status === "fulfilled")).toHaveLength(1);
        expect(outcomes.filter((o) => o.status === "rejected")).toHaveLength(1);

        const row = await db.product.findUniqueOrThrow({ where: { id: productId } });
        expect(row.status).toBe("SUSPENDED");
        expect(await db.productStatusEvent.count({ where: { productId } })).toBe(1);
      });

      it("racing SUSPENDED against ARCHIVED, repeated: the audit trail is always a continuous chain from PUBLISHED to the final status", async () => {
        // The compare-and-swap claim means the outcome depends on when each
        // request reads relative to the other's commit: if both read
        // PUBLISHED, exactly one wins and the other is rejected; if the
        // second reads after the first committed, both can succeed
        // (PUBLISHED -> SUSPENDED -> ARCHIVED). So the final status may be
        // SUSPENDED or ARCHIVED and the fulfilled count 1 or 2 -- none of
        // that is asserted as fixed. What must hold in every interleaving
        // (a false fromStatus, e.g. PUBLISHED -> SUSPENDED then PUBLISHED ->
        // ARCHIVED, was a real defect in an earlier claim predicate): the
        // events, followed from PUBLISHED via fromStatus === previous
        // toStatus, consume every event and end at the product's final
        // status; and events equal fulfilled requests. Repeated to raise the
        // odds of hitting a genuinely overlapping read/claim window.
        for (let i = 0; i < 8; i++) {
          const productId = await createPublishedProduct(`race-chain-${i}`);
          const outcomes = await Promise.allSettled([
            repo.changeProductStatus(productId, "SUSPENDED", adminUserId, "First attempt."),
            repo.changeProductStatus(productId, "ARCHIVED", adminUserId, "Second attempt."),
          ]);
          const fulfilledCount = outcomes.filter((o) => o.status === "fulfilled").length;
          expect(fulfilledCount === 1 || fulfilledCount === 2).toBe(true);
          for (const outcome of outcomes) {
            if (outcome.status === "rejected") expect(outcome.reason).toBeInstanceOf(Error);
          }

          const row = await db.product.findUniqueOrThrow({ where: { id: productId } });
          const events = await db.productStatusEvent.findMany({ where: { productId } });
          expect(events).toHaveLength(fulfilledCount);

          let current: string = "PUBLISHED";
          const remaining = [...events];
          while (remaining.length > 0) {
            const nextIndex = remaining.findIndex((e) => e.fromStatus === current);
            expect(
              nextIndex,
              `no event continues the chain from ${current}`,
            ).toBeGreaterThanOrEqual(0);
            current = remaining.splice(nextIndex, 1)[0]!.toStatus;
          }
          expect(current).toBe(row.status);
        }
      });

      it("listRecentProductStatusEvents returns newest first, across products, with product name/slug attached", async () => {
        const productId = await createPublishedProduct("recent-list");
        await repo.changeProductStatus(productId, "SUSPENDED", adminUserId, "For listing test.");

        const events = await repo.listRecentProductStatusEvents(500);
        const match = events.find((e) => e.productId === productId);
        expect(match).toBeDefined();
        expect(match?.toStatus).toBe("SUSPENDED");
        expect(match?.productSlug).toBe(`catalog-repo-status-recent-list`);
        expect(match?.productName).toBe("Status Change Target");
      });
    });
  });
});
