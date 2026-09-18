import type { PrismaClient } from "@ppu/db";
import type {
  AssetType,
  CategoryRecord,
  CatalogRepository,
  ProductRecord,
  ProductStatus,
  ProductWithCategory,
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
