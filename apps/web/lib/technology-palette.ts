import type { Technology } from "@ppu/domain-content";

/**
 * Each technology's Daylight colours and tagline (MVP-031; docs/final-
 * decisions.md, "Visual redesign: Daylight"). The class names are written out
 * in full -- never assembled from parts -- because Tailwind only generates the
 * classes it can find as literal strings in the source.
 *
 * Every ink-on-tint and page-ink-on-tint pairing is checked at 4.5:1 in both
 * themes by lib/design-tokens.test.ts.
 */
export interface TechnologyPalette {
  /** Background tint for the technology's panels and chips. */
  tint: string;
  /** Text colour on that tint (labels, counts, secondary text). */
  ink: string;
  /** A solid marker in the technology's ink colour. */
  dot: string;
  /** A short promise of what the section helps with. */
  tagline: string;
}

export const TECHNOLOGY_PALETTE: Readonly<Record<Technology, TechnologyPalette>> = {
  POWER_APPS: {
    tint: "bg-tech-apps",
    ink: "text-tech-apps-ink",
    dot: "bg-tech-apps-ink",
    tagline: "Apps that scale past 500 rows",
  },
  POWER_AUTOMATE: {
    tint: "bg-tech-automate",
    ink: "text-tech-automate-ink",
    dot: "bg-tech-automate-ink",
    tagline: "Flows that don't fail quietly",
  },
  POWER_BI: {
    tint: "bg-tech-bi",
    ink: "text-tech-bi-ink",
    dot: "bg-tech-bi-ink",
    tagline: "Totals that add up",
  },
  COPILOT_STUDIO: {
    tint: "bg-tech-copilot",
    ink: "text-tech-copilot-ink",
    dot: "bg-tech-copilot-ink",
    tagline: "Agents grounded safely",
  },
  DATAVERSE: {
    tint: "bg-tech-dataverse",
    ink: "text-tech-dataverse-ink",
    dot: "bg-tech-dataverse-ink",
    tagline: "Schemas you won't regret",
  },
  POWER_PAGES: {
    tint: "bg-tech-pages",
    ink: "text-tech-pages-ink",
    dot: "bg-tech-pages-ink",
    tagline: "Portals with locked-down data",
  },
};

/** The neutral palette for an article with no technology (cross-cutting). */
export const NEUTRAL_PALETTE: TechnologyPalette = {
  tint: "bg-muted",
  ink: "text-muted-foreground",
  dot: "bg-foreground",
  tagline: "",
};

export function paletteFor(technology: Technology | null | undefined): TechnologyPalette {
  return technology ? TECHNOLOGY_PALETTE[technology] : NEUTRAL_PALETTE;
}
