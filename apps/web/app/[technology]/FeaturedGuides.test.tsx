import type { ArticleSummary } from "@ppu/domain-content";
import { describe, expect, it } from "vitest";
import { featuredFirst } from "./FeaturedGuides";

const summary = (slug: string): ArticleSummary => ({
  slug,
  title: slug,
  type: "TUTORIAL",
  technology: "POWER_APPS",
  excerpt: null,
  publishedAt: new Date("2026-09-30T00:00:00Z"),
});

describe("featuredFirst", () => {
  it("puts guides with a drawn cover first and keeps newest-first order otherwise", () => {
    const order = featuredFirst([
      summary("newest-plain"),
      summary("canvas-vs-model-driven-apps"),
      summary("older-plain"),
      summary("power-apps-delegation-500-rows"),
    ]).map((article) => article.slug);
    expect(order).toEqual([
      "canvas-vs-model-driven-apps",
      "power-apps-delegation-500-rows",
      "newest-plain",
      "older-plain",
    ]);
  });

  it("does not change the list it is given", () => {
    const input = [summary("b"), summary("power-apps-delegation-500-rows")];
    featuredFirst(input);
    expect(input.map((article) => article.slug)).toEqual(["b", "power-apps-delegation-500-rows"]);
  });
});
