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

/**
 * The short goal label and its badge colours, for lists and guide headers
 * (the Daylight board's FIX / CHOOSE / DESIGN / MEASURE / LOOK IT UP chips,
 * MVP-037). Light tints with dark text, readable in both themes.
 */
export const ARTICLE_KIND: Record<ArticleType, { label: string; className: string }> = {
  TUTORIAL: { label: "Fix", className: "bg-[#ffe4d6] text-[#9a3412]" },
  COMPARISON: { label: "Choose", className: "bg-[#dcebff] text-[#1e40af]" },
  PATTERN: { label: "Design", className: "bg-[#ede4ff] text-[#5b21b6]" },
  KPI_GUIDE: { label: "Measure", className: "bg-[#fff0c2] text-[#92400e]" },
  REFERENCE: { label: "Look it up", className: "bg-[#d9f7e3] text-[#166534]" },
};
