import type { AssetType, CategoryRecord } from "@ppu/domain-catalog";
import { TECHNOLOGIES, technologyInfo } from "@ppu/domain-content";
import { describe, expect, it, vi } from "vitest";
import {
  ASSET_TECHNOLOGY,
  MAX_SECTION_PATHS,
  SECTION_TABS,
  listSectionPathsWithContent,
  loadSection,
  loadSectionCounts,
  sectionHasContent,
  tabCount,
  sectionPath,
  tabBySegment,
  type SectionDeps,
} from "./technology-sections";

const POWER_APPS = technologyInfo("POWER_APPS");

const category = (slug: string, assetType: AssetType): CategoryRecord => ({
  id: `c-${slug}`,
  slug,
  name: slug,
  description: null,
  assetType,
});

function deps(
  overrides: Partial<{
    articles: unknown[];
    categories: CategoryRecord[];
    products: unknown[];
  }> = {},
) {
  const listPublishedArticleSummaries = vi.fn().mockResolvedValue(overrides.articles ?? []);
  const listCategories = vi.fn().mockResolvedValue(overrides.categories ?? []);
  const searchProducts = vi.fn().mockImplementation(async () => ({
    items: overrides.products ?? [],
    total: (overrides.products ?? []).length,
    page: 1,
    pageSize: 12,
  }));
  const value = {
    content: { listPublishedArticleSummaries },
    catalog: { listCategories, searchProducts },
  } as unknown as SectionDeps;
  return { value, listPublishedArticleSummaries, listCategories, searchProducts };
}

describe("section tabs and paths", () => {
  it("are Learn, Architecture, Components and KPIs, with Learn at the section root", () => {
    expect(SECTION_TABS.map((entry) => entry.label)).toEqual([
      "Learn",
      "Architecture",
      "Components",
      "KPIs",
    ]);
    expect(sectionPath(POWER_APPS, "learn")).toBe("/power-apps");
    expect(sectionPath(POWER_APPS, "kpis")).toBe("/power-apps/kpis");
  });

  it("resolve only the three tab segments; 'learn' and anything else are not tabs", () => {
    expect(tabBySegment("architecture")?.tab).toBe("architecture");
    expect(tabBySegment("components")?.tab).toBe("components");
    expect(tabBySegment("kpis")?.tab).toBe("kpis");
    expect(tabBySegment("learn")).toBeNull();
    expect(tabBySegment("Architecture")).toBeNull();
    expect(tabBySegment("")).toBeNull();
  });

  it("maps every asset type, and cross-cutting categories to no technology", () => {
    expect(ASSET_TECHNOLOGY.POWER_APPS_COMPONENT).toBe("POWER_APPS");
    expect(ASSET_TECHNOLOGY.POWER_APPS_TEMPLATE).toBe("POWER_APPS");
    expect(ASSET_TECHNOLOGY.POWER_BI_TEMPLATE).toBe("POWER_BI");
    expect(ASSET_TECHNOLOGY.ARCHITECTURE_BLUEPRINT).toBeNull();
    expect(ASSET_TECHNOLOGY.GOVERNANCE_ASSET).toBeNull();
  });

  it("reserve one sitemap slot per area hub, plus /updates", () => {
    expect(MAX_SECTION_PATHS).toBe(TECHNOLOGIES.length + 2);
  });
});

describe("loadSectionCounts and tabCount (MVP-031)", () => {
  it("counts the technology's published guides by type, and each tab's share", async () => {
    const d = deps({
      articles: [
        { type: "TUTORIAL", slug: "newer-tutorial" },
        { type: "COMPARISON" },
        { type: "PATTERN" },
        { type: "KPI_GUIDE" },
        { type: "TUTORIAL", slug: "older-tutorial" },
      ],
    });
    const counts = await loadSectionCounts(d.value, POWER_APPS);
    expect(d.listPublishedArticleSummaries).toHaveBeenCalledWith(
      expect.objectContaining({ technology: "POWER_APPS" }),
    );
    expect(d.listPublishedArticleSummaries.mock.calls[0]?.[0]).not.toHaveProperty("types");
    expect(counts.articles).toBe(5);
    expect(counts.byType).toEqual({ TUTORIAL: 2, COMPARISON: 1, PATTERN: 1, KPI_GUIDE: 1 });
    // Newest first in, so the first tutorial is the newest one.
    expect(counts.newestByType.TUTORIAL).toEqual({ type: "TUTORIAL", slug: "newer-tutorial" });
    expect(counts.newestByType.PATTERN).toEqual({ type: "PATTERN" });
    expect(tabCount(counts, "learn")).toBe(3);
    expect(tabCount(counts, "architecture")).toBe(1);
    expect(tabCount(counts, "kpis")).toBe(1);
    expect(tabCount(counts, "components")).toBeNull();
  });

  it("is zero everywhere for a technology with nothing published", async () => {
    const counts = await loadSectionCounts(deps().value, POWER_APPS);
    expect(counts).toEqual({ articles: 0, byType: {}, newestByType: {} });
    expect(tabCount(counts, "learn")).toBe(0);
  });
});

describe("loadSection", () => {
  it("lists the tab's article types for the technology", async () => {
    const d = deps({ articles: [{ slug: "a" }] });
    const learn = await loadSection(d.value, POWER_APPS, "learn");
    expect(d.listPublishedArticleSummaries).toHaveBeenCalledWith(
      expect.objectContaining({ technology: "POWER_APPS", types: ["TUTORIAL", "COMPARISON"] }),
    );
    expect(sectionHasContent(learn)).toBe(true);

    await loadSection(d.value, POWER_APPS, "architecture");
    expect(d.listPublishedArticleSummaries).toHaveBeenLastCalledWith(
      expect.objectContaining({ types: ["PATTERN"] }),
    );
    await loadSection(d.value, POWER_APPS, "kpis");
    expect(d.listPublishedArticleSummaries).toHaveBeenLastCalledWith(
      expect.objectContaining({ types: ["KPI_GUIDE"] }),
    );
  });

  it("lists components only from the technology's own categories, grouped, and drops empty groups", async () => {
    const d = deps({
      categories: [
        category("power-apps-components", "POWER_APPS_COMPONENT"),
        category("power-bi-templates", "POWER_BI_TEMPLATE"),
        category("architecture-blueprints", "ARCHITECTURE_BLUEPRINT"),
      ],
      products: [{ id: "p1" }],
    });
    const components = await loadSection(d.value, POWER_APPS, "components");
    expect(d.searchProducts).toHaveBeenCalledTimes(1);
    expect(d.searchProducts).toHaveBeenCalledWith(
      expect.objectContaining({ categorySlug: "power-apps-components", sort: "recent" }),
    );
    expect(
      components.kind === "components" && components.groups.map((g) => g.category.slug),
    ).toEqual(["power-apps-components"]);

    const empty = deps({ categories: [category("power-apps-components", "POWER_APPS_COMPONENT")] });
    expect(sectionHasContent(await loadSection(empty.value, POWER_APPS, "components"))).toBe(false);
  });
});

describe("listSectionPathsWithContent", () => {
  it("returns only hubs with a published guide of any type (MVP-033)", async () => {
    const d = deps();
    d.listPublishedArticleSummaries.mockImplementation(async (options: { technology: string }) =>
      options.technology === "POWER_BI" || options.technology === "GOVERNANCE_ADMIN"
        ? [{ slug: "k" }]
        : [],
    );
    expect(await listSectionPathsWithContent(d.value)).toEqual(["/power-bi", "/governance"]);
  });
});
