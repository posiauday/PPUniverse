import type { ArticleType } from "@ppu/domain-content";

/** Display names for article types, shared by the article page, the /learn hub and share images. */
export const ARTICLE_TYPE_LABEL: Record<ArticleType, string> = {
  TUTORIAL: "Tutorial",
  PATTERN: "Pattern",
  COMPARISON: "Comparison",
  KPI_GUIDE: "KPI guide",
  REFERENCE: "Quick reference",
};

/** Section headings on the /learn hub and the footer, in display order: the
 * goal labels (MVP-033; docs/final-decisions.md, 2026-10-02, "Navigation
 * restructure: by technology and by goal"). */
export const ARTICLE_TYPE_SECTIONS: ReadonlyArray<{ type: ArticleType; heading: string }> = [
  { type: "TUTORIAL", heading: "Fix a problem" },
  { type: "COMPARISON", heading: "Choose the right tool" },
  { type: "PATTERN", heading: "Design it to last" },
  { type: "KPI_GUIDE", heading: "Measure success" },
  // MVP-038: the quick-lookup pages behind each hub's Daily reference row.
  { type: "REFERENCE", heading: "Look it up" },
];

/** Stable anchors for the /learn hub's sections. They keep the type names, so
 * links made before the goal labels still land on the right section. */
export const SECTION_ANCHOR: Record<ArticleType, string> = {
  TUTORIAL: "tutorials",
  PATTERN: "patterns",
  COMPARISON: "comparisons",
  KPI_GUIDE: "kpi-guides",
  REFERENCE: "reference",
};
