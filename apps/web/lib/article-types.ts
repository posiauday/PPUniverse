import type { ArticleType } from "@ppu/domain-content";

/** Display names for article types, shared by the article page, the /learn hub and share images. */
export const ARTICLE_TYPE_LABEL: Record<ArticleType, string> = {
  TUTORIAL: "Tutorial",
  PATTERN: "Pattern",
  COMPARISON: "Comparison",
  KPI_GUIDE: "KPI guide",
};

/** Section headings on the /learn hub, in display order. */
export const ARTICLE_TYPE_SECTIONS: ReadonlyArray<{ type: ArticleType; heading: string }> = [
  { type: "TUTORIAL", heading: "Tutorials" },
  { type: "PATTERN", heading: "Patterns" },
  { type: "COMPARISON", heading: "Comparisons" },
  { type: "KPI_GUIDE", heading: "KPI guides" },
];

/** Stable anchors for the /learn hub's sections; the header's "KPI guides" link uses one. */
export const SECTION_ANCHOR: Record<ArticleType, string> = {
  TUTORIAL: "tutorials",
  PATTERN: "patterns",
  COMPARISON: "comparisons",
  KPI_GUIDE: "kpi-guides",
};
