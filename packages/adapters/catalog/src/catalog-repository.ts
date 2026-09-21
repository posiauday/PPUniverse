import { Prisma, type PrismaClient } from "@ppu/db";
import type {
  AssetType,
  CategoryRecord,
  CatalogRepository,
  ProductRecord,
  ProductStatus,
  ProductWithCategory,
  SearchOptions,
  SearchResult,
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
