import type { ArticleSummary } from "@ppu/domain-content";
import { describe, expect, it, vi } from "vitest";
import { ALL_AREAS } from "../app/[technology]/OtherAreas";
import { HUB_TOPICS } from "./technology-hubs";
import {
  MENU_SECTION_COUNT,
  buildTechnologyMenu,
  loadTechnologyMenu,
  menuCountLabel,
} from "./technology-menu";

vi.mock("@ppu/telemetry", () => ({ logger: { error: vi.fn() } }));

function summary(slug: string, technology: ArticleSummary["technology"]): ArticleSummary {
  return {
    slug,
    title: `Title of ${slug}`,
    type: "TUTORIAL",
    technology,
    topic: null,
    excerpt: null,
    publishedAt: new Date("2026-10-01T00:00:00Z"),
  };
}

describe("buildTechnologyMenu", () => {
  it("lists all seven areas in menu order, each with its first sections linking to the hub", () => {
    const menu = buildTechnologyMenu(ALL_AREAS, []);
    expect(menu.map((area) => area.href)).toEqual(ALL_AREAS.map((area) => `/${area.slug}`));
    const apps = menu.find((area) => area.key === "POWER_APPS");
    expect(apps?.sections).toHaveLength(MENU_SECTION_COUNT);
    expect(apps?.sections[0]).toEqual({
      name: HUB_TOPICS.POWER_APPS[0]?.name,
      href: `/power-apps#${HUB_TOPICS.POWER_APPS[0]?.id}`,
    });
  });

  it("counts each area's guides and picks the hub's first start-here guide", () => {
    const menu = buildTechnologyMenu(ALL_AREAS, [
      summary("bi-one", "POWER_BI"),
      summary("bi-two", "POWER_BI"),
      summary("apps-one", "POWER_APPS"),
    ]);
    const bi = menu.find((area) => area.key === "POWER_BI");
    expect(bi?.count).toBe(2);
    expect(bi?.countLabel).toBe("2 guides");
    expect(bi?.startHere?.href).toMatch(/^\/learn\/bi-(one|two)$/);
    expect(menu.find((area) => area.key === "GOVERNANCE_ADMIN")?.count).toBe(0);
    expect(menu.find((area) => area.key === "DATAVERSE")?.startHere).toBeNull();
  });

  it("drops counts and start-here guides when the guides could not be loaded", () => {
    const menu = buildTechnologyMenu(ALL_AREAS, null);
    expect(menu.every((area) => area.count === null && area.startHere === null)).toBe(true);
    expect(menu.every((area) => area.sections.length > 0)).toBe(true);
  });
});

describe("loadTechnologyMenu", () => {
  it("falls back to areas and sections when the read fails, rather than breaking the page", async () => {
    const menu = await loadTechnologyMenu(ALL_AREAS, {
      listPublishedArticleSummaries: () => Promise.reject(new Error("database paused")),
    });
    expect(menu).toHaveLength(ALL_AREAS.length);
    expect(menu.every((area) => area.count === null)).toBe(true);
  });
});

describe("menuCountLabel", () => {
  it("says how many guides, New for Governance & admin, and Coming soon for an empty technology", () => {
    expect(menuCountLabel({ key: "POWER_BI", count: 4 })).toBe("4 guides");
    expect(menuCountLabel({ key: "POWER_BI", count: 1 })).toBe("1 guide");
    expect(menuCountLabel({ key: "GOVERNANCE_ADMIN", count: 0 })).toBe("New");
    expect(menuCountLabel({ key: "DATAVERSE", count: 0 })).toBe("Coming soon");
    expect(menuCountLabel({ key: "DATAVERSE", count: null })).toBeNull();
  });
});
