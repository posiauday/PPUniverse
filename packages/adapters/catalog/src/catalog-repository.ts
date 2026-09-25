import { Prisma, type PrismaClient } from "@ppu/db";
import {
  isValidProductStatusTransition,
  type AssetType,
  type CategoryRecord,
  type CatalogRepository,
  type CompatibilityEntry,
  type CompatibilityEvidenceStatus,
  type LicenseDefinitionRecord,
  type PlatformArea,
  type ProductCreateInput,
  type ProductDetail,
  type ProductEvidenceForAdmin,
  type ProductPublishSnapshot,
  type ProductRecord,
  type ProductStatus,
  type ProductUpdateInput,
  type ProductWithCategory,
  type ReleaseRecord,
  type SearchOptions,
  type SearchResult,
  type SitemapEntries,
  type SupportPolicyRecord,
  type SupportStatus,
  type ValidCompatibilityEntry,
} from "@ppu/domain-catalog";

export class PrismaCatalogRepository implements CatalogRepository {
  constructor(private readonly db: PrismaClient) {}

  async listCategories(): Promise<CategoryRecord[]> {
    const rows = await this.db.category.findMany({ orderBy: { name: "asc" } });
    return rows.map(toCategoryRecord);
  }

  async findCategoryBySlug(slug: string): Promise<CategoryRecord | null> {
    const row = await this.db.category.findUnique({ where: { slug } });
    return row ? toCategoryRecord(row) : null;
  }

  async listPublishedProductsByCategory(categoryId: string): Promise<ProductRecord[]> {
    const rows = await this.db.product.findMany({
      where: { categoryId, status: "PUBLISHED" },
      orderBy: { publishedAt: "desc" },
    });
    return rows.map(toProductRecord);
  }

  async findPublishedProductBySlug(slug: string): Promise<ProductWithCategory | null> {
    const row = await this.db.product.findFirst({
      where: { slug, status: "PUBLISHED" },
      include: { category: true },
    });
    if (!row) return null;
    return { ...toProductRecord(row), category: toCategoryRecord(row.category) };
  }

  /**
   * Product detail evidence (MVP-005, FR-003). Same PUBLISHED-only rule as
   * findPublishedProductBySlug, enforced in the query itself. Every evidence
   * relation is optional: a product created before MVP-005 has none of them
   * and comes back with empty arrays / nulls, which the page renders as
   * "not provided yet" — nothing is ever invented on read.
   *
   * - licenses: ordered by the tier's sortOrder (Personal, Team, Enterprise).
   * - currentVersion: the newest release that has actually been published.
   *   Unpublished (draft) releases are never surfaced.
   * - compatibility: ordered by platformArea; a Postgres enum sorts in
   *   declaration order, which matches the approved platform-area list.
   *   (product, platformArea) is unique, so this order is total.
   */
  async findPublishedProductDetailBySlug(slug: string): Promise<ProductDetail | null> {
    const row = await this.db.product.findFirst({
      where: { slug, status: "PUBLISHED" },
      include: {
        category: true,
        licenses: {
          include: { licenseDefinition: true },
          orderBy: { licenseDefinition: { sortOrder: "asc" } },
        },
        releases: {
          where: { publishedAt: { not: null } },
          orderBy: [{ publishedAt: "desc" }, { createdAt: "desc" }],
          take: 1,
        },
        supportPolicy: true,
        compatibility: { orderBy: { platformArea: "asc" } },
      },
    });
    if (!row) return null;

    return {
      ...toProductRecord(row),
      category: toCategoryRecord(row.category),
      licenses: row.licenses.map((link) => toLicenseDefinitionRecord(link.licenseDefinition)),
      currentVersion: row.releases[0]?.version ?? null,
      support: row.supportPolicy
        ? { status: row.supportPolicy.status, channel: row.supportPolicy.channel }
        : null,
      compatibility: row.compatibility.map(toCompatibilityEntry),
    };
  }

  /**
   * Sitemap eligibility (MVP-021, FR-017). PUBLISHED is an allow-list, so any
   * future status (suspended, archived, rejected) is excluded by default. A
   * category is listed only when it currently has at least one PUBLISHED
   * product — derived from inventory on every call, never a stored flag.
   * Both queries are ordered by slug for deterministic output and use the
   * existing indexes (products.status, categories.slug). `maxEntries` bounds
   * categories plus products combined; one extra product is fetched purely to
   * learn whether the list was truncated.
   */
  async listSitemapEntries(maxEntries: number): Promise<SitemapEntries> {
    if (!Number.isInteger(maxEntries) || maxEntries < 0) {
      throw new RangeError("maxEntries must be a non-negative integer");
    }

    const categories = await this.db.category.findMany({
      where: { products: { some: { status: "PUBLISHED" } } },
      select: { slug: true },
      orderBy: { slug: "asc" },
      take: maxEntries,
    });
    const productBudget = maxEntries - categories.length;
    const products = await this.db.product.findMany({
      where: { status: "PUBLISHED" },
      select: { slug: true },
      orderBy: { slug: "asc" },
      take: productBudget + 1,
    });

    return {
      categorySlugs: categories.map((category) => category.slug),
      productSlugs: products.slice(0, productBudget).map((product) => product.slug),
      truncated: products.length > productBudget,
    };
  }

  /**
   * Real PostgreSQL full-text search (CLAUDE.md's architecture baseline:
   * "PostgreSQL full-text for MVP"), computed on the fly rather than via a
   * persisted tsvector column — no migration needed, and fine at MVP scale
   * without a GIN index. Composed with Prisma.sql/Prisma.join for safe
   * parameter binding (never raw string interpolation). COUNT(*) OVER()
   * returns the total matching row count on every row without a second
   * round trip; LIMIT/OFFSET is applied after that window computation, so
   * the total is correct even though only one page of rows comes back.
   */
  async searchProducts(options: SearchOptions): Promise<SearchResult> {
    const offset = (options.page - 1) * options.pageSize;

    const whereClauses: Prisma.Sql[] = [Prisma.sql`p."status" = 'PUBLISHED'`];
    if (options.categorySlug) {
      whereClauses.push(Prisma.sql`c."slug" = ${options.categorySlug}`);
    }
    if (options.query) {
      whereClauses.push(
        Prisma.sql`to_tsvector('english', p."name" || ' ' || p."summary") @@ plainto_tsquery('english', ${options.query})`,
      );
    }
    const whereSql = Prisma.join(whereClauses, " AND ");

    const orderBySql =
      options.sort === "alphabetical"
        ? Prisma.sql`p."name" ASC`
        : options.sort === "relevance" && options.query
          ? Prisma.sql`ts_rank(to_tsvector('english', p."name" || ' ' || p."summary"), plainto_tsquery('english', ${options.query})) DESC`
          : Prisma.sql`p."publishedAt" DESC`;

    const rows = await this.db.$queryRaw<RawSearchRow[]>`
      SELECT
        p."id", p."slug", p."name", p."summary", p."status", p."categoryId",
        c."id" AS "categoryRowId", c."slug" AS "categorySlug", c."name" AS "categoryName",
        c."description" AS "categoryDescription", c."assetType" AS "categoryAssetType",
        COUNT(*) OVER() AS "total"
      FROM "products" p
      JOIN "categories" c ON c."id" = p."categoryId"
      WHERE ${whereSql}
      ORDER BY ${orderBySql}
      LIMIT ${options.pageSize} OFFSET ${offset}
    `;

    const total = rows.length > 0 ? Number(rows[0]?.total) : 0;
    return {
      items: rows.map(toSearchRowRecord),
      total,
      page: options.page,
      pageSize: options.pageSize,
    };
  }

  // --- Admin authoring surface (MVP-012, FR-009) -----------------------

  async createProductDraft(input: ProductCreateInput): Promise<ProductRecord> {
    const row = await this.db.product.create({
      data: {
        name: input.name,
        slug: input.slug,
        summary: input.summary,
        categoryId: input.categoryId,
      },
    });
    return toProductRecord(row);
  }

  /** Core fields only -- never touches status/publishedAt (see
   * ProductUpdateInput's doc comment in @ppu/domain-catalog). */
  async updateProductDraft(id: string, input: ProductUpdateInput): Promise<ProductRecord> {
    const row = await this.db.product.update({
      where: { id },
      data: {
        name: input.name,
        slug: input.slug,
        summary: input.summary,
        categoryId: input.categoryId,
      },
    });
    return toProductRecord(row);
  }

  async findProductByIdForAdmin(id: string): Promise<ProductWithCategory | null> {
    const row = await this.db.product.findUnique({ where: { id }, include: { category: true } });
    if (!row) return null;
    return { ...toProductRecord(row), category: toCategoryRecord(row.category) };
  }

  async listProductsForAdmin(): Promise<ProductRecord[]> {
    const rows = await this.db.product.findMany({ orderBy: { createdAt: "desc" } });
    return rows.map(toProductRecord);
  }

  /**
   * Loads the counts checkProductPublishReadiness (@ppu/domain-catalog)
   * needs. "a release with at least one attached CLEAN file" is computed as
   * the count of distinct releases that have at least one ReleaseFile whose
   * FileScan.status is CLEAN -- a release with zero attachments, or only
   * attachments that never passed scanning, does not count.
   */
  async getProductPublishSnapshot(id: string): Promise<ProductPublishSnapshot> {
    const [licenseCount, supportPolicy, compatibilityCount, releasesWithCleanFile] =
      await Promise.all([
        this.db.productLicense.count({ where: { productId: id } }),
        this.db.supportPolicy.findUnique({ where: { productId: id } }),
        this.db.compatibilityRecord.count({ where: { productId: id } }),
        this.db.release.findMany({
          where: { productId: id, files: { some: { fileScan: { status: "CLEAN" } } } },
          select: { id: true },
        }),
      ]);

    return {
      licenseCount,
      hasSupportPolicy: supportPolicy !== null,
      compatibilityCount,
      releasesWithCleanFileCount: releasesWithCleanFile.length,
    };
  }

  /** Current assigned license ids, support policy, and every compatibility
   * entry, any status -- the admin editor's own pre-fill/pre-check read
   * (distinct from the PUBLISHED-only findPublishedProductDetailBySlug). */
  async getProductEvidenceForAdmin(id: string): Promise<ProductEvidenceForAdmin> {
    const [licenses, supportPolicy, compatibility] = await Promise.all([
      this.db.productLicense.findMany({
        where: { productId: id },
        select: { licenseDefinitionId: true },
      }),
      this.db.supportPolicy.findUnique({ where: { productId: id } }),
      this.db.compatibilityRecord.findMany({
        where: { productId: id },
        orderBy: { platformArea: "asc" },
      }),
    ]);

    return {
      licenseDefinitionIds: licenses.map((license) => license.licenseDefinitionId),
      support: supportPolicy
        ? { status: supportPolicy.status as SupportStatus, channel: supportPolicy.channel }
        : null,
      compatibility: compatibility.map(toCompatibilityEntry),
    };
  }

  /**
   * Transitions DRAFT -> PUBLISHED and sets publishedAt, inside a
   * transaction that re-checks the row's actual current status (not a
   * caller-supplied belief), so a race between two publish requests can
   * never double-publish or silently overwrite publishedAt -- mirrors
   * PrismaContentRepository.publishArticle exactly. Unlike Article, no
   * publish-event log entity exists for Product in this pass; structured
   * telemetry (the API route's product.published log) is the MVP-017
   * precedent's substitute until MVP-019 builds a persisted AuditEvent.
   */
  async publishProduct(id: string): Promise<ProductRecord> {
    const publishedAt = new Date();
    const product = await this.db.$transaction(async (tx) => {
      const current = await tx.product.findUnique({ where: { id } });
      if (!current) {
        throw new Error(`Product ${id} not found`);
      }
      if (!isValidProductStatusTransition(current.status as ProductStatus, "PUBLISHED")) {
        throw new Error(`Cannot publish a Product in status ${current.status}`);
      }
      return tx.product.update({ where: { id }, data: { status: "PUBLISHED", publishedAt } });
    });
    return toProductRecord(product);
  }

  /** Replaces the full assigned set -- not an incremental add/remove
   * (simplest correct semantics for a checkbox-style picker). Runs as one
   * transaction so a concurrent reader never observes a moment with zero
   * licenses assigned. */
  async setProductLicenses(productId: string, licenseDefinitionIds: string[]): Promise<void> {
    await this.db.$transaction([
      this.db.productLicense.deleteMany({ where: { productId } }),
      ...(licenseDefinitionIds.length > 0
        ? [
            this.db.productLicense.createMany({
              data: licenseDefinitionIds.map((licenseDefinitionId) => ({
                productId,
                licenseDefinitionId,
              })),
              skipDuplicates: true,
            }),
          ]
        : []),
    ]);
  }

  async listLicenseDefinitions(): Promise<LicenseDefinitionRecord[]> {
    const rows = await this.db.licenseDefinition.findMany({ orderBy: { sortOrder: "asc" } });
    return rows.map(toLicenseDefinitionRecord);
  }

  async upsertSupportPolicy(
    productId: string,
    input: { status: SupportStatus; channel: string | null },
  ): Promise<SupportPolicyRecord> {
    const row = await this.db.supportPolicy.upsert({
      where: { productId },
      create: { productId, status: input.status, channel: input.channel },
      update: { status: input.status, channel: input.channel },
    });
    return { status: row.status as SupportStatus, channel: row.channel };
  }

  /**
   * Upsert keyed on the existing (productId, platformArea) unique
   * constraint. Defense in depth (TD-008 section 9, MVP-012's own hard
   * gate): refuses to persist any evidenceStatus other than
   * CREATOR_DECLARED, even though the API route must already reject it
   * before this is ever called -- this repository is the last line before
   * the database. Never touches `reviewedAt`: it is explicitly nulled on
   * every write this method performs, since only the not-yet-built trusted
   * server-side moderation workflow (TD-008, MVP-013) may ever set it, and
   * this method only ever writes CREATOR_DECLARED.
   */
  async upsertCompatibilityEntry(
    productId: string,
    input: ValidCompatibilityEntry,
  ): Promise<CompatibilityEntry> {
    if (input.evidenceStatus !== "CREATOR_DECLARED") {
      throw new Error(
        `upsertCompatibilityEntry only accepts CREATOR_DECLARED evidenceStatus, got ${input.evidenceStatus}`,
      );
    }
    const row = await this.db.compatibilityRecord.upsert({
      where: { productId_platformArea: { productId, platformArea: input.platformArea } },
      create: {
        productId,
        platformArea: input.platformArea,
        minReleaseYear: input.minReleaseYear,
        minReleaseWave: input.minReleaseWave,
        notes: input.notes,
        evidenceStatus: input.evidenceStatus,
        evidenceSummary: input.evidenceSummary,
        lastVerifiedAt: input.lastVerifiedAt ? new Date(input.lastVerifiedAt) : null,
      },
      update: {
        minReleaseYear: input.minReleaseYear,
        minReleaseWave: input.minReleaseWave,
        notes: input.notes,
        evidenceStatus: input.evidenceStatus,
        evidenceSummary: input.evidenceSummary,
        lastVerifiedAt: input.lastVerifiedAt ? new Date(input.lastVerifiedAt) : null,
        reviewedAt: null,
      },
    });
    return toCompatibilityEntry(row);
  }

  async createRelease(productId: string, version: string): Promise<ReleaseRecord> {
    const row = await this.db.release.create({ data: { productId, version } });
    return toReleaseRecord(row);
  }

  /**
   * Re-verifies FileScan.status === "CLEAN" server-side before creating the
   * ReleaseFile row -- never trusts a client-supplied "this file is clean"
   * claim (mirrors MVP-006/MVP-009's existing signed-download authorization
   * discipline). Upsert (not create) so attaching the same file twice is a
   * harmless no-op rather than a unique-constraint error.
   */
  async attachReleaseFile(releaseId: string, fileScanId: string): Promise<void> {
    const [release, fileScan] = await Promise.all([
      this.db.release.findUnique({ where: { id: releaseId } }),
      this.db.fileScan.findUnique({ where: { id: fileScanId } }),
    ]);
    if (!release) {
      throw new Error(`Release ${releaseId} not found`);
    }
    if (!fileScan) {
      throw new Error(`FileScan ${fileScanId} not found`);
    }
    if (fileScan.status !== "CLEAN") {
      throw new Error(`FileScan ${fileScanId} is not CLEAN (status: ${fileScan.status})`);
    }
    await this.db.releaseFile.upsert({
      where: { releaseId_fileScanId: { releaseId, fileScanId } },
      create: { releaseId, fileScanId },
      update: {},
    });
  }

  async listReleasesForAdmin(
    productId: string,
  ): Promise<Array<ReleaseRecord & { files: Array<{ fileScanId: string; status: string }> }>> {
    const rows = await this.db.release.findMany({
      where: { productId },
      orderBy: { createdAt: "desc" },
      include: { files: { include: { fileScan: { select: { status: true } } } } },
    });
    return rows.map((row) => ({
      ...toReleaseRecord(row),
      files: row.files.map((file) => ({ fileScanId: file.fileScanId, status: file.fileScan.status })),
    }));
  }
}

interface RawSearchRow {
  id: string;
  slug: string;
  name: string;
  summary: string;
  status: string;
  categoryId: string;
  categoryRowId: string;
  categorySlug: string;
  categoryName: string;
  categoryDescription: string | null;
  categoryAssetType: string;
  total: bigint;
}

function toSearchRowRecord(row: RawSearchRow): ProductWithCategory {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    summary: row.summary,
    status: row.status as ProductStatus,
    categoryId: row.categoryId,
    category: {
      id: row.categoryRowId,
      slug: row.categorySlug,
      name: row.categoryName,
      description: row.categoryDescription,
      assetType: row.categoryAssetType as AssetType,
    },
  };
}

function toCategoryRecord(row: {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  assetType: string;
}): CategoryRecord {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    description: row.description,
    assetType: row.assetType as AssetType,
  };
}

function toLicenseDefinitionRecord(row: {
  id: string;
  slug: string;
  name: string;
  description: string;
  sortOrder: number;
}): LicenseDefinitionRecord {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    description: row.description,
    sortOrder: row.sortOrder,
  };
}

/** `lastVerifiedAt` is a DATE column; Prisma hands back UTC midnight, so the ISO date prefix is the stored calendar date. `reviewedAt` (TD-008) is a full timestamp, kept as ISO. */
function toCompatibilityEntry(row: {
  id: string;
  platformArea: PlatformArea;
  minReleaseYear: number;
  minReleaseWave: number;
  notes: string | null;
  evidenceStatus: CompatibilityEvidenceStatus;
  evidenceSummary: string | null;
  lastVerifiedAt: Date | null;
  reviewedAt: Date | null;
}): CompatibilityEntry {
  return {
    id: row.id,
    platformArea: row.platformArea,
    minReleaseYear: row.minReleaseYear,
    minReleaseWave: row.minReleaseWave,
    notes: row.notes,
    evidenceStatus: row.evidenceStatus,
    evidenceSummary: row.evidenceSummary,
    lastVerifiedAt: row.lastVerifiedAt ? row.lastVerifiedAt.toISOString().slice(0, 10) : null,
    reviewedAt: row.reviewedAt ? row.reviewedAt.toISOString() : null,
  };
}

function toReleaseRecord(row: {
  id: string;
  productId: string;
  version: string;
  publishedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}): ReleaseRecord {
  return {
    id: row.id,
    productId: row.productId,
    version: row.version,
    publishedAt: row.publishedAt,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

function toProductRecord(row: {
  id: string;
  slug: string;
  name: string;
  summary: string;
  status: string;
  categoryId: string;
}): ProductRecord {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    summary: row.summary,
    status: row.status as ProductStatus,
    categoryId: row.categoryId,
  };
}
