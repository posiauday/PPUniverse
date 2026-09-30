import type { Technology } from "./types.js";

/**
 * The technology sections (MVP-028; docs/final-decisions.md, "Technology
 * sections (MVP-028)"): six, in display order, each with its display name and
 * the path segment of its section (/power-apps, /power-apps/architecture ...).
 * The single source for both, so a name or address cannot drift between the
 * header menu, the section pages, the sitemap and the admin editor.
 */
export interface TechnologyInfo {
  technology: Technology;
  name: string;
  /** The section's URL segment: lower-case, hyphenated. */
  slug: string;
}

export const TECHNOLOGIES: readonly TechnologyInfo[] = [
  { technology: "POWER_APPS", name: "Power Apps", slug: "power-apps" },
  { technology: "POWER_AUTOMATE", name: "Power Automate", slug: "power-automate" },
  { technology: "POWER_BI", name: "Power BI", slug: "power-bi" },
  { technology: "COPILOT_STUDIO", name: "Copilot Studio", slug: "copilot-studio" },
  { technology: "DATAVERSE", name: "Dataverse", slug: "dataverse" },
  { technology: "POWER_PAGES", name: "Power Pages", slug: "power-pages" },
];

export function isValidTechnology(value: string): value is Technology {
  return TECHNOLOGIES.some((entry) => entry.technology === value);
}

/** The section for a URL segment, or null for anything else (a 404). */
export function technologyBySlug(slug: string): TechnologyInfo | null {
  return TECHNOLOGIES.find((entry) => entry.slug === slug) ?? null;
}

export function technologyInfo(technology: Technology): TechnologyInfo {
  const info = TECHNOLOGIES.find((entry) => entry.technology === technology);
  if (!info) throw new Error(`Unknown technology: ${technology}`);
  return info;
}
