import { describe, expect, it } from "vitest";
import { TECHNOLOGIES, isValidTechnology, technologyBySlug, technologyInfo } from "./technology.js";
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

  it("validate only the six values", () => {
    expect(isValidTechnology("POWER_APPS")).toBe(true);
    expect(isValidTechnology("SHAREPOINT")).toBe(false);
    expect(isValidTechnology("power_apps")).toBe(false);
  });

  it("resolve a URL segment to its section, or null for anything else", () => {
    expect(technologyBySlug("power-bi")?.technology).toBe("POWER_BI");
    expect(technologyBySlug("Power-BI")).toBeNull();
    expect(technologyBySlug("learn")).toBeNull();
    expect(technologyInfo("DATAVERSE").slug).toBe("dataverse");
  });

  it("KPI_GUIDE is a valid article type", () => {
    expect(isValidArticleType("KPI_GUIDE")).toBe(true);
  });
});
