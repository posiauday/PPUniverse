import { Prisma, type PrismaClient } from "@ppu/db";
import type {
  AssetType,
  CategoryRecord,
  CatalogRepository,
  CompatibilityEntry,
  CompatibilityEvidenceStatus,
  LicenseDefinitionRecord,
  PlatformArea,
  ProductDetail,
  ProductRecord,
  ProductStatus,
  ProductWithCategory,
  SearchOptions,
  SearchResult,
  SitemapEntries,
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

/** `lastVerifiedAt` is a DATE column; Prisma hands back UTC midnight, so the ISO date prefix is the stored calendar date. */
function toCompatibilityEntry(row: {
  id: string;
  platformArea: PlatformArea;
  minReleaseYear: number;
  minReleaseWave: number;
  notes: string | null;
  evidenceStatus: CompatibilityEvidenceStatus;
  evidenceSummary: string | null;
  lastVerifiedAt: Date | null;
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
