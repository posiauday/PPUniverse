import type { ArticleType } from "@ppu/domain-content";

/**
 * The one name of each kind of guide (docs/final-decisions.md, 2026-10-09,
 * "Top bar: a Guides menu ... one name per kind of guide"), used everywhere a
 * kind is named: the Guides menu, the /guides hub's sections, the article
 * page, filters, the footer and share images.
 */
export const ARTICLE_TYPE_LABEL: Record<ArticleType, string> = {
  TUTORIAL: "Fix a problem",
  COMPARISON: "Choose a tool",
  PATTERN: "Design patterns",
  KPI_GUIDE: "Measure",
  REFERENCE: "Quick reference",
};

/** What each kind is for, in a few words, for the Guides menu. */
export const ARTICLE_TYPE_BLURB: Record<ArticleType, string> = {
  TUTORIAL: "Errors and how to fix them",
  COMPARISON: "Which option fits your case",
  PATTERN: "Build it to last",
  KPI_GUIDE: "KPIs that show it works",
  REFERENCE: "Look it up fast",
};

/** Section headings on the /guides hub and the footer, in display order: the
 * goal labels (MVP-033; docs/final-decisions.md, 2026-10-02, "Navigation
 * restructure: by technology and by goal"). */
export const ARTICLE_TYPE_SECTIONS: ReadonlyArray<{ type: ArticleType; heading: string }> = (
  ["TUTORIAL", "COMPARISON", "PATTERN", "KPI_GUIDE", "REFERENCE"] as const
).map((type) => ({ type, heading: ARTICLE_TYPE_LABEL[type] }));

/** Stable anchors for the /guides hub's sections. They keep the type names, so
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
  REFERENCE: { label: "Look up", className: "bg-[#d9f7e3] text-[#166534]" },
};
