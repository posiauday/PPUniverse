import type {
  AssetType,
  CategoryRecord,
  ProductWithCategory,
  SearchOptions,
  SearchResult,
} from "@ppu/domain-catalog";
import {
  TECHNOLOGIES,
  type ArticleSummary,
  type ArticleType,
  type ContentRepository,
  type Technology,
  type TechnologyInfo,
} from "@ppu/domain-content";

/**
 * Technology sections (MVP-028; docs/final-decisions.md, "Technology
 * sections (MVP-028)"): six sections, each with four tabs at
 * /{technology}, /{technology}/architecture, /{technology}/components and
 * /{technology}/kpis. This module decides what each tab shows; the pages only
 * render it.
 */

export type SectionTab = "learn" | "architecture" | "components" | "kpis";

export interface SectionTabInfo {
  tab: SectionTab;
  /** The tab's link text. */
  label: string;
  /** The URL segment after /{technology}; the Learn tab has none. */
  segment: string | null;
  /** The article types the tab lists; the Components tab lists products instead. */
  articleTypes: readonly ArticleType[] | null;
}

export const SECTION_TABS: readonly SectionTabInfo[] = [
  { tab: "learn", label: "Learn", segment: null, articleTypes: ["TUTORIAL", "COMPARISON"] },
  {
    tab: "architecture",
    label: "Architecture",
    segment: "architecture",
    articleTypes: ["PATTERN"],
  },
  { tab: "components", label: "Components", segment: "components", articleTypes: null },
  { tab: "kpis", label: "KPIs", segment: "kpis", articleTypes: ["KPI_GUIDE"] },
];

/** The tab for a URL segment after /{technology}, or null (a 404). "learn" is not a
 * segment: the Learn tab lives at /{technology} itself. */
export function tabBySegment(segment: string): SectionTabInfo | null {
  return SECTION_TABS.find((entry) => entry.segment === segment) ?? null;
}

export function tabInfo(tab: SectionTab): SectionTabInfo {
  return SECTION_TABS.find((entry) => entry.tab === tab) as SectionTabInfo;
}

/** The site-relative path of a section tab: /power-apps, /power-apps/kpis ... */
export function sectionPath(technology: TechnologyInfo, tab: SectionTab): string {
  const { segment } = tabInfo(tab);
  return segment ? `/${technology.slug}/${segment}` : `/${technology.slug}`;
}

/**
 * Which technology a product category belongs to, from its fixed asset type.
 * Kept in code rather than a database column so it cannot drift from the
 * categories themselves. Architecture blueprints and governance assets span
 * every technology, so they belong to none.
 */
export const ASSET_TECHNOLOGY: Readonly<Record<AssetType, Technology | null>> = {
  POWER_APPS_COMPONENT: "POWER_APPS",
  POWER_APPS_TEMPLATE: "POWER_APPS",
  POWER_AUTOMATE_TEMPLATE: "POWER_AUTOMATE",
  POWER_BI_TEMPLATE: "POWER_BI",
  ARCHITECTURE_BLUEPRINT: null,
  GOVERNANCE_ASSET: null,
};

/** One-line descriptions: what each section covers, and nothing more. */
export const TECHNOLOGY_BLURB: Readonly<Record<Technology, string>> = {
  POWER_APPS:
    "Build canvas and model-driven apps: galleries, forms, components and the formulas behind them.",
  POWER_AUTOMATE:
    "Automate work with cloud flows: approvals, error handling, reuse and monitoring.",
  POWER_BI: "Model data, write DAX and design reports that people actually read.",
  COPILOT_STUDIO: "Build agents that answer from your own knowledge and act through flows.",
  DATAVERSE: "Design the tables, relationships and security your apps and flows rely on.",
  POWER_PAGES: "Build secure external websites on top of Dataverse data.",
};

/** How each tab describes itself, for headings and meta descriptions. */
export function tabDescription(technology: TechnologyInfo, tab: SectionTab): string {
  switch (tab) {
    case "learn":
      return `Free tutorials and comparisons for ${technology.name}.`;
    case "architecture":
      return `Architecture patterns and best practices for ${technology.name}.`;
    case "components":
      return `Free ${technology.name} components and templates, each with its licence and compatibility.`;
    case "kpis":
      return `KPI guides for measuring ${technology.name} adoption, quality and value.`;
  }
}

/** The page title's subject for each tab. */
export function tabTitle(technology: TechnologyInfo, tab: SectionTab): string {
  switch (tab) {
    case "learn":
      return `${technology.name} tutorials`;
    case "architecture":
      return `${technology.name} architecture and best practices`;
    case "components":
      return `${technology.name} components and templates`;
    case "kpis":
      return `${technology.name} KPIs`;
  }
}

export const SECTION_ARTICLE_LIMIT = 60;
export const SECTION_PRODUCTS_PER_CATEGORY = 12;

export type SectionContent =
  | { kind: "articles"; articles: ArticleSummary[] }
  | {
      kind: "components";
      groups: Array<{ category: CategoryRecord; products: ProductWithCategory[]; total: number }>;
    };

export interface SectionDeps {
  content: Pick<ContentRepository, "listPublishedArticleSummaries">;
  catalog: {
    listCategories(): Promise<CategoryRecord[]>;
    searchProducts(options: SearchOptions): Promise<SearchResult>;
  };
}

/** What a tab shows: PUBLISHED articles of its types for the technology, or
 * PUBLISHED products in the technology's categories, grouped by category. */
export async function loadSection(
  deps: SectionDeps,
  technology: TechnologyInfo,
  tab: SectionTab,
): Promise<SectionContent> {
  const { articleTypes } = tabInfo(tab);
  if (articleTypes) {
    const articles = await deps.content.listPublishedArticleSummaries({
      limit: SECTION_ARTICLE_LIMIT,
      technology: technology.technology,
      types: articleTypes,
    });
    return { kind: "articles", articles };
  }
  const categories = (await deps.catalog.listCategories()).filter(
    (category) => ASSET_TECHNOLOGY[category.assetType] === technology.technology,
  );
  const groups = await Promise.all(
    categories.map(async (category) => {
      const result = await deps.catalog.searchProducts({
        categorySlug: category.slug,
        sort: "recent",
        page: 1,
        pageSize: SECTION_PRODUCTS_PER_CATEGORY,
      });
      return { category, products: result.items, total: result.total };
    }),
  );
  return { kind: "components", groups: groups.filter((group) => group.products.length > 0) };
}

/** How many PUBLISHED guides a technology has, in total and by type (MVP-031:
 * the section header's chips and the tab badges). */
export interface SectionCounts {
  articles: number;
  byType: Partial<Record<ArticleType, number>>;
  /** The newest guide of each type, for the Learn tab's "Also in" cards. */
  newestByType: Partial<Record<ArticleType, ArticleSummary>>;
}

export async function loadSectionCounts(
  deps: Pick<SectionDeps, "content">,
  technology: TechnologyInfo,
): Promise<SectionCounts> {
  const articles = await deps.content.listPublishedArticleSummaries({
    limit: SECTION_ARTICLE_LIMIT,
    technology: technology.technology,
  });
  const byType: Partial<Record<ArticleType, number>> = {};
  const newestByType: Partial<Record<ArticleType, ArticleSummary>> = {};
  // Summaries arrive newest first, so the first of each type is its newest.
  for (const article of articles) {
    byType[article.type] = (byType[article.type] ?? 0) + 1;
    newestByType[article.type] ??= article;
  }
  return { articles: articles.length, byType, newestByType };
}

/** A tab's guide count, or null for the Components tab, which lists products. */
export function tabCount(counts: SectionCounts, tab: SectionTab): number | null {
  const { articleTypes } = tabInfo(tab);
  if (!articleTypes) return null;
  return articleTypes.reduce((sum, type) => sum + (counts.byType[type] ?? 0), 0);
}

export function sectionHasContent(content: SectionContent): boolean {
  return content.kind === "articles" ? content.articles.length > 0 : content.groups.length > 0;
}

/** Every technology hub that has guides, for sitemap.xml (MVP-028). Since
 * MVP-033 the tabs redirect to the hub, so only hub paths are listed. */
export async function listSectionPathsWithContent(deps: SectionDeps): Promise<string[]> {
  const paths: string[] = [];
  for (const technology of TECHNOLOGIES) {
    const guides = await deps.content.listPublishedArticleSummaries({
      limit: 1,
      technology: technology.technology,
    });
    if (guides.length > 0) {
      paths.push(sectionPath(technology, "learn"));
    }
  }
  return paths;
}

/** The most sitemap URLs the sections can take: one hub per technology. */
export const MAX_SECTION_PATHS = TECHNOLOGIES.length;
