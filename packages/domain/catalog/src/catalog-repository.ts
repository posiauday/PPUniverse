import type { CategoryRecord, ProductRecord, ProductWithCategory } from "./types.js";

export interface CatalogRepository {
  listCategories(): Promise<CategoryRecord[]>;
  findCategoryBySlug(slug: string): Promise<CategoryRecord | null>;
  listPublishedProductsByCategory(categoryId: string): Promise<ProductRecord[]>;
  findPublishedProductBySlug(slug: string): Promise<ProductWithCategory | null>;
}
