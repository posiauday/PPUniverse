import { AREAS, TECHNOLOGY_TOPICS, type ArticleSummary } from "@ppu/domain-content";
import { describe, expect, it } from "vitest";
import { HUB_PROBLEMS, HUB_TOPICS, groupIntoSections, startHerePath } from "./technology-hubs";

function guide(slug: string, topic: string | null): ArticleSummary {
  return {
    slug,
    title: slug,
    type: "TUTORIAL",
    technology: "POWER_BI",
    topic,
    excerpt: null,
    publishedAt: new Date(0),
  };
}

describe("technology hubs (MVP-033)", () => {
  it("give every area hub copy for exactly its domain sections, in the same order", () => {
    for (const area of AREAS) {
      expect(HUB_TOPICS[area.technology].map(({ id, name }) => ({ id, name }))).toEqual(
        TECHNOLOGY_TOPICS[area.technology],
      );
      expect(HUB_PROBLEMS[area.technology]).toHaveLength(3);
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
