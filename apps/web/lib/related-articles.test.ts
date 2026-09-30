import type { ArticleSummary } from "@ppu/domain-content";
import { describe, expect, it, vi } from "vitest";
import { findRelatedArticles } from "./related-articles";

const summary = (slug: string): ArticleSummary => ({
  slug,
  title: slug,
  type: "TUTORIAL",
  excerpt: null,
  publishedAt: new Date("2026-09-01T00:00:00.000Z"),
});
const article = { slug: "self", type: "TUTORIAL" as const };

describe("findRelatedArticles", () => {
  it("returns same-type articles only, with one query, when there are enough", async () => {
    const list = vi.fn().mockResolvedValue([summary("a"), summary("b")]);
    const related = await findRelatedArticles({ listPublishedArticleSummaries: list }, article, 2);
    expect(related.map((r) => r.slug)).toEqual(["a", "b"]);
    expect(list).toHaveBeenCalledTimes(1);
    expect(list).toHaveBeenCalledWith({ limit: 2, type: "TUTORIAL", excludeSlug: "self" });
  });

  it("tops up with the newest articles of any type, without duplicates", async () => {
    const list = vi
      .fn()
      .mockResolvedValueOnce([summary("a")])
      .mockResolvedValueOnce([summary("a"), summary("x"), summary("y"), summary("z")]);
    const related = await findRelatedArticles({ listPublishedArticleSummaries: list }, article, 3);
    expect(related.map((r) => r.slug)).toEqual(["a", "x", "y"]);
    expect(list).toHaveBeenLastCalledWith({ limit: 3, excludeSlug: "self" });
  });

  it("returns nothing when this is the only published article", async () => {
    const list = vi.fn().mockResolvedValue([]);
    expect(await findRelatedArticles({ listPublishedArticleSummaries: list }, article)).toEqual([]);
  });
});
