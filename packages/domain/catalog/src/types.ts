export type AssetType =
  | "POWER_APPS_COMPONENT"
  | "POWER_APPS_TEMPLATE"
  | "POWER_AUTOMATE_TEMPLATE"
  | "POWER_BI_TEMPLATE"
  | "ARCHITECTURE_BLUEPRINT"
  | "GOVERNANCE_ASSET";

export type ProductStatus = "DRAFT" | "PUBLISHED";

export interface CategoryRecord {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  assetType: AssetType;
}

export interface ProductRecord {
  id: string;
  slug: string;
  name: string;
  summary: string;
  status: ProductStatus;
  categoryId: string;
}

export interface ProductWithCategory extends ProductRecord {
  category: CategoryRecord;
}
