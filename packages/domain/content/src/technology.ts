import type { ProductTechnology, Technology } from "./types.js";

/**
 * The technology areas (MVP-028; Governance & admin added by MVP-033): each
 * with its display name, the path segment of its hub (/power-apps,
 * /governance ...), and whether it is a Microsoft product or a cross-product
 * area. The single source for all three, so a name or address cannot drift
 * between the header menu, the hubs, the sitemap and the admin editor.
 */
export interface TechnologyInfo<T extends Technology = Technology> {
  technology: T;
  name: string;
  /** The hub's URL segment: lower-case, hyphenated. */
  slug: string;
  /** "product": a Microsoft product (named in the trademark notice, given a
   * home panel). "area": cuts across the products (Governance & admin). */
  kind: T extends ProductTechnology ? "product" : "area";
}

/** The six Microsoft products, in display order. Places that mean products
 * only (the trademark notice, the home panels, the product hubs) use this. */
export const TECHNOLOGIES: readonly TechnologyInfo<ProductTechnology>[] = [
  { technology: "POWER_APPS", name: "Power Apps", slug: "power-apps", kind: "product" },
  { technology: "POWER_AUTOMATE", name: "Power Automate", slug: "power-automate", kind: "product" },
  { technology: "POWER_BI", name: "Power BI", slug: "power-bi", kind: "product" },
  { technology: "COPILOT_STUDIO", name: "Copilot Studio", slug: "copilot-studio", kind: "product" },
  { technology: "DATAVERSE", name: "Dataverse", slug: "dataverse", kind: "product" },
  { technology: "POWER_PAGES", name: "Power Pages", slug: "power-pages", kind: "product" },
];

/** Governance & admin (docs/final-decisions.md, "Governance & admin area"). */
export const GOVERNANCE_ADMIN: TechnologyInfo<"GOVERNANCE_ADMIN"> = {
  technology: "GOVERNANCE_ADMIN",
  name: "Governance & admin",
  slug: "governance",
  kind: "area",
};

/** Every area an article can belong to: the six products, then Governance & admin. */
export const AREAS: readonly TechnologyInfo[] = [...TECHNOLOGIES, GOVERNANCE_ADMIN];

export function isValidTechnology(value: string): value is Technology {
  return AREAS.some((entry) => entry.technology === value);
}

/** The product hub for a URL segment, or null for anything else (a 404).
 * Products only: Governance & admin has its own route, /governance. */
export function technologyBySlug(slug: string): TechnologyInfo<ProductTechnology> | null {
  return TECHNOLOGIES.find((entry) => entry.slug === slug) ?? null;
}

/** Any area, products and Governance & admin, by its URL segment. */
export function areaBySlug(slug: string): TechnologyInfo | null {
  return AREAS.find((entry) => entry.slug === slug) ?? null;
}

export function technologyInfo(technology: Technology): TechnologyInfo {
  const info = AREAS.find((entry) => entry.technology === technology);
  if (!info) throw new Error(`Unknown technology: ${technology}`);
  return info;
}

export interface TechnologyTopic {
  /** Stored on the article and used as the section's anchor on the hub. */
  id: string;
  name: string;
}

/**
 * Each area's sections, in hub order (docs/final-decisions.md, "Structure
 * boards approved" and "Governance & admin area"). An article's `topic` is
 * one of its area's ids. The web app's hub copy (descriptions, planned
 * guides) is keyed by these ids, and a test keeps the two in step.
 */
export const TECHNOLOGY_TOPICS: Readonly<Record<Technology, readonly TechnologyTopic[]>> = {
  POWER_APPS: [
    { id: "choose-and-plan", name: "Choose & plan" },
    { id: "data-and-delegation", name: "Data & delegation" },
    { id: "formulas-and-components", name: "Formulas & components" },
    { id: "performance-and-offline", name: "Performance & offline" },
    { id: "solutions-and-alm", name: "Ship it: solutions & ALM" },
    { id: "adoption-and-usage", name: "Adoption & usage" },
  ],
  POWER_AUTOMATE: [
    { id: "triggers-and-design", name: "Triggers & flow design" },
    { id: "approvals", name: "Approvals" },
    { id: "errors-and-limits", name: "Errors, retries & limits" },
    { id: "desktop-flows", name: "Desktop flows (RPA)" },
    { id: "choose-the-tool", name: "Choose the right tool" },
    { id: "run-and-monitor", name: "Run & monitor" },
  ],
  POWER_BI: [
    { id: "data-modelling", name: "Data modelling" },
    { id: "dax", name: "DAX & calculations" },
    { id: "reports-and-kpis", name: "Reports, visuals & KPIs" },
    { id: "refresh-and-gateways", name: "Refresh & gateways" },
    { id: "security-and-sharing", name: "Security & sharing" },
  ],
  COPILOT_STUDIO: [
    { id: "build-your-agent", name: "Build your agent" },
    { id: "knowledge-and-grounding", name: "Knowledge & grounding" },
    { id: "tools-and-mcp", name: "Tools, actions & MCP" },
    { id: "test-and-evaluate", name: "Test & evaluate" },
    { id: "publish", name: "Publish to Teams & web" },
    { id: "monitor-and-cost", name: "Monitor & cost" },
  ],
  DATAVERSE: [
    { id: "tables-and-schema", name: "Tables & schema" },
    { id: "security-model", name: "Security model" },
    { id: "business-logic", name: "Business logic" },
    { id: "choose-dataverse", name: "Dataverse or something else" },
    { id: "data-quality", name: "Data quality & integration" },
  ],
  POWER_PAGES: [
    { id: "build-your-site", name: "Build your site" },
    { id: "access-and-permissions", name: "Access & table permissions" },
    { id: "sign-in-and-identity", name: "Sign-in & identity" },
    { id: "liquid-and-code", name: "Liquid & custom code" },
    { id: "choose", name: "Choose" },
    { id: "go-live-and-monitor", name: "Go-live & monitor" },
  ],
  GOVERNANCE_ADMIN: [
    { id: "environments", name: "Environments & strategy" },
    { id: "data-policies", name: "Data policies (DLP) & connectors" },
    { id: "security-and-access", name: "Security & access" },
    { id: "coe-and-visibility", name: "CoE & visibility" },
    { id: "alm", name: "ALM & deployment" },
    { id: "licensing", name: "Licensing & capacity" },
    { id: "ai-governance", name: "AI & agent governance" },
  ],
};

/** Whether `topic` is one of `technology`'s sections. */
export function isValidTopic(technology: Technology, topic: string): boolean {
  return TECHNOLOGY_TOPICS[technology].some((entry) => entry.id === topic);
}
