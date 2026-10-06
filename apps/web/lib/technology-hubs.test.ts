import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { AREAS, TECHNOLOGY_TOPICS, type ArticleSummary } from "@ppu/domain-content";
import { describe, expect, it } from "vitest";
import {
  HUB_HEADLINES,
  HUB_JOURNEYS,
  HUB_SEO,
  HUB_TOP_FIXES,
  HUB_TOPICS,
  groupIntoSections,
  lookItUp,
  publishedFixes,
  splitTitle,
  startHerePath,
} from "./technology-hubs";

function guide(
  slug: string,
  topic: string | null,
  type: ArticleSummary["type"] = "TUTORIAL",
): ArticleSummary {
  return {
    slug,
    title: slug,
    type,
    technology: "POWER_BI",
    topic,
    excerpt: null,
    publishedAt: new Date(0),
  };
}

/** Each launch guide's slug and area, read from content/articles' front matter. */
function contentGuides(): Map<string, string> {
  const root = join(__dirname, "..", "..", "..", "content", "articles");
  const guides = new Map<string, string>();
  for (const folder of readdirSync(root, { withFileTypes: true })) {
    if (!folder.isDirectory()) continue;
    for (const file of readdirSync(join(root, folder.name))) {
      if (!file.endsWith(".md")) continue;
      const text = readFileSync(join(root, folder.name, file), "utf8");
      const slug = /^slug:\s*"?([^"\r\n]+)"?/m.exec(text)?.[1];
      const technology = /^technology:\s*"?([A-Z_]+)"?/m.exec(text)?.[1];
      if (slug && technology) guides.set(slug, technology);
    }
  }
  return guides;
}

describe("technology hubs (MVP-033)", () => {
  it("give every area hub copy for exactly its domain sections, in the same order", () => {
    for (const area of AREAS) {
      expect(HUB_TOPICS[area.technology].map(({ id, name }) => ({ id, name }))).toEqual(
        TECHNOLOGY_TOPICS[area.technology],
      );
    }
  });

  it("place each guide in its stored section, and one with no or an unknown topic in the first", () => {
    const sections = groupIntoSections("POWER_BI", [
      guide("totals", "dax"),
      guide("loose", null),
      guide("stale", "no-such-section"),
    ]);
    expect(sections.map((section) => section.guides.map((g) => g.slug))).toEqual([
      ["loose", "stale"],
      ["totals"],
      [],
      [],
      [],
    ]);
    expect(startHerePath(sections).map((g) => g.slug)).toEqual(["loose", "totals"]);
  });
});

describe("Fix first hubs (MVP-037)", () => {
  it("give every area a two-part headline", () => {
    for (const area of AREAS) {
      const headline = HUB_HEADLINES[area.technology];
      expect(headline.lead.length).toBeGreaterThan(0);
      expect(headline.accent.length).toBeGreaterThan(0);
    }
  });

  it("link every most-needed fix to a real guide in the same area, once", () => {
    const guides = contentGuides();
    expect(guides.size).toBeGreaterThan(40);
    for (const area of AREAS) {
      const fixes = HUB_TOP_FIXES[area.technology];
      expect(fixes.length).toBeGreaterThanOrEqual(2);
      expect(fixes.length).toBeLessThanOrEqual(5);
      expect(new Set(fixes.map((fix) => fix.slug)).size).toBe(fixes.length);
      for (const fix of fixes) {
        expect(guides.get(fix.slug), fix.slug).toBe(area.technology);
      }
    }
  });

  it("show a fix only while its guide is published, in the configured order", () => {
    const published = [
      guide("why-are-my-totals-wrong", "dax"),
      guide("refresh-failures-checklist", null),
    ];
    expect(publishedFixes("POWER_BI", published).map((fix) => fix.slug)).toEqual([
      "refresh-failures-checklist",
      "why-are-my-totals-wrong",
    ]);
    expect(publishedFixes("POWER_BI", [])).toEqual([]);
  });

  it("draw Power BI's journey over exactly its sections, and no other hub's", () => {
    expect(Object.keys(HUB_JOURNEYS)).toEqual(["POWER_BI"]);
    expect(Object.keys(HUB_JOURNEYS.POWER_BI ?? {})).toEqual(
      HUB_TOPICS.POWER_BI.map((topic) => topic.id),
    );
  });

  it("keep hub titles and descriptions within what search results show", () => {
    for (const area of AREAS) {
      const seo = HUB_SEO[area.technology];
      expect(seo.title.length, seo.title).toBeLessThanOrEqual(60);
      expect(seo.description.length, seo.description).toBeLessThanOrEqual(160);
    }
  });

  it("list up to three quick-reference guides for Look it up", () => {
    const articles = [
      guide("a", null, "REFERENCE"),
      guide("b", null, "TUTORIAL"),
      guide("c", null, "REFERENCE"),
      guide("d", null, "REFERENCE"),
      guide("e", null, "REFERENCE"),
    ];
    expect(lookItUp(articles).map((g) => g.slug)).toEqual(["a", "c", "d"]);
  });

  it("split a guide title at its colon for a card", () => {
    expect(splitTitle("Cloud flow error codes: what each one means")).toEqual({
      heading: "Cloud flow error codes",
      detail: "What each one means",
    });
    expect(splitTitle("Cloud flows or Azure Logic Apps?")).toEqual({
      heading: "Cloud flows or Azure Logic Apps?",
      detail: null,
    });
  });
});
