import { describe, expect, it } from "vitest";
import {
  AREAS,
  TECHNOLOGIES,
  TECHNOLOGY_TOPICS,
  areaBySlug,
  isValidTechnology,
  isValidTopic,
  technologyBySlug,
  technologyInfo,
} from "./technology.js";
import { isValidArticleType } from "./transitions.js";

describe("technology sections (MVP-028)", () => {
  it("are the six decided sections, in display order, with URL-safe unique slugs", () => {
    expect(TECHNOLOGIES.map((entry) => entry.name)).toEqual([
      "Power Apps",
      "Power Automate",
      "Power BI",
      "Copilot Studio",
      "Dataverse",
      "Power Pages",
    ]);
    const slugs = TECHNOLOGIES.map((entry) => entry.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
    for (const slug of slugs) expect(slug).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/);
  });

  it("validate the six products and Governance & admin, and nothing else", () => {
    expect(isValidTechnology("POWER_APPS")).toBe(true);
    expect(isValidTechnology("GOVERNANCE_ADMIN")).toBe(true);
    expect(isValidTechnology("SHAREPOINT")).toBe(false);
    expect(isValidTechnology("power_apps")).toBe(false);
  });

  it("resolve a URL segment to its section, or null for anything else", () => {
    expect(technologyBySlug("power-bi")?.technology).toBe("POWER_BI");
    expect(technologyBySlug("Power-BI")).toBeNull();
    expect(technologyBySlug("learn")).toBeNull();
    expect(technologyInfo("DATAVERSE").slug).toBe("dataverse");
    // Governance & admin has its own route, so it is no product hub, but it is an area.
    expect(technologyBySlug("governance")).toBeNull();
    expect(areaBySlug("governance")?.technology).toBe("GOVERNANCE_ADMIN");
    expect(technologyInfo("GOVERNANCE_ADMIN").kind).toBe("area");
  });

  it("list Governance & admin last among the areas, as the only non-product (MVP-033)", () => {
    expect(AREAS.map((entry) => entry.kind)).toEqual([...Array(6).fill("product"), "area"]);
    expect(AREAS.at(-1)?.slug).toBe("governance");
  });

  it("give every area its own sections, with unique URL-safe ids (MVP-033)", () => {
    for (const area of AREAS) {
      const ids = TECHNOLOGY_TOPICS[area.technology].map((topic) => topic.id);
      expect(ids.length).toBeGreaterThanOrEqual(5);
      expect(new Set(ids).size).toBe(ids.length);
      for (const id of ids) expect(id).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/);
    }
    expect(isValidTopic("POWER_BI", "dax")).toBe(true);
    expect(isValidTopic("POWER_APPS", "dax")).toBe(false);
    // A KPI section exists only in Power BI (docs/final-decisions.md, "Structure boards approved").
    const kpi = AREAS.filter((area) =>
      TECHNOLOGY_TOPICS[area.technology].some((topic) => /KPI/.test(topic.name)),
    );
    expect(kpi.map((area) => area.technology)).toEqual(["POWER_BI"]);
  });

  it("KPI_GUIDE is a valid article type", () => {
    expect(isValidArticleType("KPI_GUIDE")).toBe(true);
  });
});
