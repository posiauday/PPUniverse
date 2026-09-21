import type {
  CategoryRecord,
  ProductDetail,
  ProductRecord,
  ProductWithCategory,
  SearchOptions,
  SearchResult,
  SitemapEntries,
} from "./types.js";

export interface CatalogRepository {
  listCategories(): Promise<CategoryRecord[]>;
  findCategoryBySlug(slug: string): Promise<CategoryRecord | null>;
  listPublishedProductsByCategory(categoryId: string): Promise<ProductRecord[]>;
  findPublishedProductBySlug(slug: string): Promise<ProductWithCategory | null>;
  /** Published-only, with license/version/support/compatibility evidence (MVP-005). Empty evidence means "not provided yet", never an error. */
  findPublishedProductDetailBySlug(slug: string): Promise<ProductDetail | null>;
  searchProducts(options: SearchOptions): Promise<SearchResult>;
  /**
   * Sitemap eligibility (MVP-021): PUBLISHED products, and categories that
   * have at least one PUBLISHED product. `maxEntries` bounds categories plus
   * products combined; `maxEntries` must be a non-negative integer.
   */
  listSitemapEntries(maxEntries: number): Promise<SitemapEntries>;
}
