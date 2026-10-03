import type { ArticleSummary, Technology } from "@ppu/domain-content";

/**
 * Technology hubs (MVP-033 slice C; docs/final-decisions.md, 2026-10-02:
 * "Structure boards approved" and "Technology pages are hubs"). Each area
 * has its own sections, researched from how Microsoft Learn organises that
 * product, not one template copied everywhere. A KPI section exists only in
 * Power BI; measuring guides elsewhere sit in that product's own section.
 *
 * A guide's section is its stored `topic` (MVP-033 slice B, which resolved
 * TD-025). The section ids and names come from TECHNOLOGY_TOPICS in
 * @ppu/domain-content; this file adds the hub copy (descriptions, planned
 * guides), and a test keeps the two in step. A guide with no topic, or one
 * that no longer matches, still appears, in its area's first section, so
 * nothing published is ever hidden.
 */

/** Every area has a hub: the six products and Governance & admin. */
export type HubKey = Technology;

export interface HubTopic {
  /** Anchor id on the hub page. */
  id: string;
  name: string;
  description: string;
  /** Planned guides, shown as "Coming": titles approved on the structure board. */
  planned: readonly string[];
}

export interface HubProblem {
  label: string;
  query: string;
}

export const HUB_TOPICS: Readonly<Record<HubKey, readonly HubTopic[]>> = {
  POWER_APPS: [
    {
      id: "choose-and-plan",
      name: "Choose & plan",
      description: "Pick the app type and the data source before you build.",
      planned: [],
    },
    {
      id: "data-and-delegation",
      name: "Data & delegation",
      description: "Connect to data and keep every row in reach.",
      planned: [],
    },
    {
      id: "formulas-and-components",
      name: "Formulas & components",
      description: "Power Fx, named formulas and reusable components.",
      planned: [],
    },
    {
      id: "performance-and-offline",
      name: "Performance & offline",
      description: "Fast screens, mobile and offline apps.",
      planned: ["Making a slow app fast"],
    },
    {
      id: "solutions-and-alm",
      name: "Ship it: solutions & ALM",
      description: "Solutions, environments and pipelines.",
      planned: ["Solutions and pipelines for your first app"],
    },
    {
      id: "adoption-and-usage",
      name: "Adoption & usage",
      description: "Who uses your app, and is it worth it?",
      planned: [],
    },
  ],
  POWER_AUTOMATE: [
    {
      id: "triggers-and-design",
      name: "Triggers & flow design",
      description: "Automated, scheduled and instant flows.",
      planned: ["Why didn't my trigger fire?"],
    },
    { id: "approvals", name: "Approvals", description: "Approvals that don't stall.", planned: [] },
    {
      id: "errors-and-limits",
      name: "Errors, retries & limits",
      description: "Error handling, throttling and limits.",
      planned: ["Throttling and flow limits"],
    },
    {
      id: "desktop-flows",
      name: "Desktop flows (RPA)",
      description: "Automate apps that have no API.",
      planned: [],
    },
    {
      id: "choose-the-tool",
      name: "Choose the right tool",
      description: "Flows, Logic Apps or something else.",
      planned: [],
    },
    {
      id: "run-and-monitor",
      name: "Run & monitor",
      description: "Flow health and hours saved.",
      planned: [],
    },
  ],
  POWER_BI: [
    {
      id: "data-modelling",
      name: "Data modelling",
      description: "Star schemas and semantic models.",
      planned: [],
    },
    {
      id: "dax",
      name: "DAX & calculations",
      description: "Measures, filter context and totals.",
      planned: [],
    },
    {
      id: "reports-and-kpis",
      name: "Reports, visuals & KPIs",
      description: "Report design, KPI cards and targets.",
      planned: [],
    },
    {
      id: "refresh-and-gateways",
      name: "Refresh & gateways",
      description: "Scheduled refresh and the on-premises gateway.",
      planned: ["Fixing refresh failures and the gateway"],
    },
    {
      id: "security-and-sharing",
      name: "Security & sharing",
      description: "Row-level security, workspaces and apps.",
      planned: ["Row-level security that holds up"],
    },
  ],
  COPILOT_STUDIO: [
    {
      id: "build-your-agent",
      name: "Build your agent",
      description: "Instructions, topics and first tests.",
      planned: [],
    },
    {
      id: "knowledge-and-grounding",
      name: "Knowledge & grounding",
      description: "What the agent knows, and what to keep out.",
      planned: [],
    },
    {
      id: "tools-and-mcp",
      name: "Tools, actions & MCP",
      description: "Let the agent do things.",
      planned: ["Tools and MCP servers"],
    },
    {
      id: "test-and-evaluate",
      name: "Test & evaluate",
      description: "Test sets and evaluations.",
      planned: ["Testing and evaluating an agent"],
    },
    {
      id: "publish",
      name: "Publish to Teams & web",
      description: "Channels and authentication.",
      planned: [],
    },
    {
      id: "monitor-and-cost",
      name: "Monitor & cost",
      description: "Resolution, escalation and credits.",
      planned: [],
    },
  ],
  DATAVERSE: [
    {
      id: "tables-and-schema",
      name: "Tables & schema",
      description: "Tables, columns and relationships.",
      planned: [],
    },
    {
      id: "security-model",
      name: "Security model",
      description: "Roles, business units and teams.",
      planned: [],
    },
    {
      id: "business-logic",
      name: "Business logic",
      description: "Business rules and low-code plug-ins.",
      planned: ["Low-code plug-ins and business rules"],
    },
    {
      id: "choose-dataverse",
      name: "Dataverse or something else",
      description: "When Dataverse is the right home.",
      planned: [],
    },
    {
      id: "data-quality",
      name: "Data quality & integration",
      description: "Completeness, duplicates and freshness.",
      planned: [],
    },
  ],
  POWER_PAGES: [
    {
      id: "build-your-site",
      name: "Build your site",
      description: "Design studio, lists and forms.",
      planned: [],
    },
    {
      id: "access-and-permissions",
      name: "Access & table permissions",
      description: "Web roles and table permissions.",
      planned: [],
    },
    {
      id: "sign-in-and-identity",
      name: "Sign-in & identity",
      description: "Identity providers and authentication.",
      planned: ["Sign-in and identity providers"],
    },
    {
      id: "liquid-and-code",
      name: "Liquid & custom code",
      description: "Liquid, web templates and the Web API.",
      planned: [],
    },
    { id: "choose", name: "Choose", description: "Power Pages or a SharePoint site.", planned: [] },
    {
      id: "go-live-and-monitor",
      name: "Go-live & monitor",
      description: "Sign-ups, self-service and form completion.",
      planned: [],
    },
  ],
  GOVERNANCE_ADMIN: [
    {
      id: "environments",
      name: "Environments & strategy",
      description: "Environment types, groups and rules, Managed Environments.",
      planned: ["An environment strategy that scales"],
    },
    {
      id: "data-policies",
      name: "Data policies (DLP) & connectors",
      description: "Data policies, advanced connector policies, custom and MCP connectors.",
      planned: ["Data policies that don't break makers' flows"],
    },
    {
      id: "security-and-access",
      name: "Security & access",
      description: "Security roles, identity and tenant settings.",
      planned: ["Tenant settings every admin should check"],
    },
    {
      id: "coe-and-visibility",
      name: "CoE & visibility",
      description: "Inventory, Usage, Monitor and Actions in the admin center.",
      planned: ["Moving off the CoE Starter Kit"],
    },
    {
      id: "alm",
      name: "ALM & deployment",
      description: "Solutions, pipelines and deploying from Git.",
      planned: ["Pipelines and deploying from Git"],
    },
    {
      id: "licensing",
      name: "Licensing & capacity",
      description: "Licences, Dataverse capacity and Copilot credits.",
      planned: ["Licensing and capacity, explained"],
    },
    {
      id: "ai-governance",
      name: "AI & agent governance",
      description: "Governing Copilot Studio agents and their tools.",
      planned: ["Governing Copilot Studio agents"],
    },
  ],
};

/** Quick problem chips under each hub's search box (searches the site). */
export const HUB_PROBLEMS: Readonly<Record<HubKey, readonly HubProblem[]>> = {
  POWER_APPS: [
    { label: "Delegation warning", query: "delegation" },
    { label: "App is slow", query: "performance" },
    { label: "Formula errors", query: "formula" },
  ],
  POWER_AUTOMATE: [
    { label: "Approval stuck", query: "approval" },
    { label: "Flow failed", query: "error handling" },
    { label: "Flows or Logic Apps?", query: "logic apps" },
  ],
  POWER_BI: [
    { label: "Totals are wrong", query: "totals" },
    { label: "Star schema", query: "star schema" },
    { label: "KPI card", query: "kpi" },
  ],
  COPILOT_STUDIO: [
    { label: "Knowledge sources", query: "knowledge" },
    { label: "Grounding safely", query: "grounding" },
    { label: "First agent", query: "agent" },
  ],
  DATAVERSE: [
    { label: "Security roles", query: "security roles" },
    { label: "Schema design", query: "schema" },
    { label: "Dataverse or SharePoint?", query: "sharepoint lists" },
  ],
  POWER_PAGES: [
    { label: "Table permissions", query: "table permissions" },
    { label: "First site", query: "power pages site" },
    { label: "Pages or SharePoint?", query: "sharepoint site" },
  ],
  GOVERNANCE_ADMIN: [
    { label: "Data policies", query: "data policies" },
    { label: "Environments", query: "environments" },
    { label: "Security roles", query: "security roles" },
  ],
};

export interface HubSection extends HubTopic {
  guides: ArticleSummary[];
}

/** Groups an area's published guides into its sections, in the area's order. A guide
 * with no known section lands in the first one, so it is never hidden. */
export function groupIntoSections(key: HubKey, articles: readonly ArticleSummary[]): HubSection[] {
  const topics = HUB_TOPICS[key];
  const sections: HubSection[] = topics.map((topic) => ({ ...topic, guides: [] }));
  for (const article of articles) {
    const section = sections.find((s) => s.id === article.topic) ?? sections[0];
    section?.guides.push(article);
  }
  return sections;
}

/** The ordered "New here?" path: the first guide of each of the first three sections that have one. */
export function startHerePath(sections: readonly HubSection[]): ArticleSummary[] {
  return sections
    .map((section) => section.guides[0])
    .filter((guide): guide is ArticleSummary => Boolean(guide))
    .slice(0, 3);
}
