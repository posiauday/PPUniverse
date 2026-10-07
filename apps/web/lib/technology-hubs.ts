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
      planned: [],
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
      planned: [],
    },
    {
      id: "security-and-sharing",
      name: "Security & sharing",
      description: "Row-level security, workspaces and apps.",
      planned: [],
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
      planned: [],
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
/**
 * The H1 "Fix first" hub (MVP-037; docs/final-decisions.md, 2026-10-06,
 * "Guide page and hub designs chosen" and "Hub headlines"). Each area's
 * headline, in two parts: the plain lead, then the accent drawn in the serif.
 */
export interface HubHeadline {
  lead: string;
  accent: string;
}

export const HUB_HEADLINES: Readonly<Record<HubKey, HubHeadline>> = {
  POWER_APPS: { lead: "Apps that open fast,", accent: "and see every row" },
  POWER_AUTOMATE: { lead: "Flows that run,", accent: "and tell you when they don't" },
  POWER_BI: { lead: "From messy exports", accent: "to numbers people trust" },
  COPILOT_STUDIO: { lead: "Agents that answer right,", accent: "and know when not to" },
  DATAVERSE: { lead: "Tables that stay fast,", accent: "and open only to the right people" },
  POWER_PAGES: { lead: "Sites for your customers,", accent: "secured table by table" },
  GOVERNANCE_ADMIN: { lead: "Room to build,", accent: "with guardrails that hold" },
};

/** A "Most-needed fixes" chip: a short label that links straight to one guide. */
export interface HubFix {
  slug: string;
  label: string;
}

/**
 * The problems people bring to each area most often (the research in
 * docs/research/content-briefs/), each linked to the guide that fixes it.
 * The hub shows a chip only while its guide is published, so a draft or a
 * removed guide never leaves a dead link; a test checks every slug exists.
 */
export const HUB_TOP_FIXES: Readonly<Record<HubKey, readonly HubFix[]>> = {
  POWER_APPS: [
    { slug: "power-apps-delegation-500-rows", label: "Gallery stops at 500 rows" },
    { slug: "delegation-cheat-sheet", label: "Delegation warning" },
    { slug: "save-attachments-and-photos-to-sharepoint", label: "Save photos to SharePoint" },
    { slug: "canvas-vs-model-driven-apps", label: "Canvas or model-driven?" },
  ],
  POWER_AUTOMATE: [
    { slug: "why-didnt-my-trigger-fire", label: "My trigger didn't fire" },
    { slug: "502-bad-gateway-intermittent-failures", label: "502 and random failures" },
    { slug: "dynamic-content-missing-parse-json", label: "Dynamic content missing" },
    { slug: "get-more-than-5000-sharepoint-items", label: "More than 5,000 items" },
    { slug: "desktop-flow-connection-not-found", label: "Desktop flow won't run" },
  ],
  POWER_BI: [
    { slug: "refresh-failures-checklist", label: "Refresh failed" },
    { slug: "move-upgrade-share-a-gateway", label: "Gateway problems" },
    { slug: "power-bi-permissions-cheat-sheet", label: "Who can see what" },
    { slug: "why-are-my-totals-wrong", label: "Totals are wrong" },
  ],
  COPILOT_STUDIO: [
    { slug: "knowledge-limits-and-fixes", label: "Agent finds nothing" },
    { slug: "agent-on-dataverse-tables", label: "Generic answers from Dataverse" },
    { slug: "copilot-studio-licensing-and-credits", label: "Which licence do I need?" },
    { slug: "your-first-agent", label: "Build your first agent" },
  ],
  DATAVERSE: [
    { slug: "security-access-cheat-sheet", label: "‘Missing privilege’ error" },
    { slug: "dataverse-or-sharepoint-lists", label: "Dataverse or SharePoint?" },
    { slug: "security-roles-business-units-teams", label: "Roles and teams in a tangle" },
    { slug: "design-your-first-dataverse-schema", label: "Design a schema" },
  ],
  POWER_PAGES: [
    { slug: "table-permissions-checklist", label: "Users see no data" },
    { slug: "invite-users-to-power-pages", label: "Invitations not working" },
    { slug: "power-pages-web-api-cheat-sheet", label: "Web API errors" },
    { slug: "power-pages-licensing-explained", label: "Who counts as a user?" },
  ],
  GOVERNANCE_ADMIN: [
    { slug: "dataverse-capacity-email", label: "Got a capacity email?" },
    { slug: "data-policy-checklist", label: "Set up data policies" },
  ],
};

/**
 * Power BI's hub draws its sections as a journey (the H2 concept, chosen for
 * Power BI only): the order a report gets built, each stop one section.
 */
export const HUB_JOURNEYS: Readonly<Partial<Record<HubKey, Readonly<Record<string, string>>>>> = {
  POWER_BI: {
    "data-modelling": "Model the data",
    dax: "Get the maths right",
    "reports-and-kpis": "Show it well",
    "refresh-and-gateways": "Keep it fresh",
    "security-and-sharing": "Share it safely",
  },
};

/**
 * Each hub's page title and description for search results (MVP-042): the
 * product, then what the hub helps with, in the words people search.
 */
export const HUB_SEO: Readonly<Record<HubKey, { title: string; description: string }>> = {
  POWER_APPS: {
    title: "Power Apps guides: delegation, speed and app design",
    description:
      "Free Power Apps guides: fix delegation warnings and the 500-row limit, save photos to SharePoint, and choose canvas or model-driven.",
  },
  POWER_AUTOMATE: {
    title: "Power Automate guides: fix flows, triggers and errors",
    description:
      "Free Power Automate guides: triggers that don't fire, 502 errors, more than 5,000 items, approvals, desktop flows and error codes.",
  },
  POWER_BI: {
    title: "Power BI guides: refresh, gateways, DAX and sharing",
    description:
      "Free Power BI guides: fix failed refreshes and gateways, totals that don't add up, row-level security and who can see what.",
  },
  COPILOT_STUDIO: {
    title: "Copilot Studio guides: knowledge, licensing and agents",
    description:
      "Free Copilot Studio guides: knowledge sources that find nothing, grounding on Dataverse, licences and credits, and agent KPIs.",
  },
  DATAVERSE: {
    title: "Dataverse guides: schema, security roles and data",
    description:
      "Free Dataverse guides: design a schema, untangle security roles and teams, fix missing-privilege errors, and choose Dataverse or SharePoint.",
  },
  POWER_PAGES: {
    title: "Power Pages guides: permissions, Web API and sign-in",
    description:
      "Free Power Pages guides: table permissions and web roles, the Web API, inviting users, licensing and your first site.",
  },
  GOVERNANCE_ADMIN: {
    title: "Power Platform governance & admin",
    description:
      "Environments, data policies (DLP), security, the CoE, ALM, licensing and AI governance for Power Platform admins.",
  },
};

/** The "Most-needed fixes" whose guides are published, in the configured order. */
export function publishedFixes(key: HubKey, articles: readonly ArticleSummary[]): HubFix[] {
  const published = new Set(articles.map((article) => article.slug));
  return HUB_TOP_FIXES[key].filter((fix) => published.has(fix.slug));
}

/** The area's quick-reference guides (up to three), for the "Look it up" row. */
export function lookItUp(articles: readonly ArticleSummary[]): ArticleSummary[] {
  return articles.filter((article) => article.type === "REFERENCE").slice(0, 3);
}

/**
 * A guide title split for a card: "Cloud flow error codes: what each one
 * means" becomes the heading "Cloud flow error codes" and the line "What each
 * one means". A title without ": " stays whole.
 */
export function splitTitle(title: string): { heading: string; detail: string | null } {
  const at = title.indexOf(": ");
  if (at < 0) return { heading: title, detail: null };
  const detail = title.slice(at + 2);
  return { heading: title.slice(0, at), detail: detail.charAt(0).toUpperCase() + detail.slice(1) };
}

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
