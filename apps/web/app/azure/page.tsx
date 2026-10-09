import type { Metadata } from "next";
import Link from "next/link";
import { NOINDEX_ROBOTS } from "../../lib/seo/metadata";
import { SITE_NAME } from "../../lib/seo/site";

export const metadata: Metadata = {
  title: `Azure: coming soon | ${SITE_NAME}`,
  description:
    "Azure guides are coming to LowCodeStacks, starting with where Azure and Power Platform meet.",
  // A teaser: kept out of search until the first Azure guides are published.
  robots: NOINDEX_ROBOTS,
};

/**
 * The areas the Azure section is planned to cover, from the research
 * (docs/research/2026-10-09-azure-hub-research.md, section 4.3). A plan for
 * the product owner to confirm, shown here as what's coming, not as a menu.
 */
const AZURE_PLANNED_AREAS: ReadonlyArray<{ name: string; blurb: string; tint: string }> = [
  {
    name: "Azure + Power Platform",
    blurb:
      "Custom connectors from Functions and API Management, Key Vault secrets, Dataverse events.",
    tint: "bg-tech-apps",
  },
  {
    name: "AI & agents",
    blurb: "Deploy a model, fix 429s and quota, guardrails, and retrieval with AI Search.",
    tint: "bg-tech-copilot",
  },
  {
    name: "Identity & security",
    blurb: "Sign-in errors decoded, managed identities, role-based access and MFA.",
    tint: "bg-tech-automate",
  },
  {
    name: "Apps & integration",
    blurb: "Where your code should run: App Service, Functions, Container Apps, messaging.",
    tint: "bg-tech-pages",
  },
  {
    name: "Data & storage",
    blurb: "Pick the right data store: Azure SQL, Storage, Cosmos DB and Data Factory.",
    tint: "bg-tech-dataverse",
  },
  {
    name: "Networking",
    blurb: "Private endpoints and DNS, virtual networks and outbound access, step by step.",
    tint: "bg-tech-gov",
  },
  {
    name: "Cost & FinOps",
    blurb: "Never get a surprise bill: budgets, alerts and the usual cost traps.",
    tint: "bg-tech-bi",
  },
  {
    name: "Governance & operations",
    blurb: "Landing zones, Azure Policy, Bicep and Terraform, and monitoring.",
    tint: "bg-tech-gov",
  },
];

/**
 * The Azure section's "coming soon" teaser (docs/final-decisions.md,
 * 2026-10-09, "Top bar: Azure, coming soon"): the top bar's "Azure (Soon)"
 * leads here until the first Azure guides are published.
 */
export default function AzureComingSoonPage() {
  return (
    <main className="px-4 pb-16 md:px-6">
      <header className="motion-rise mx-auto mt-4 max-w-[77.5rem] rounded-[2.5rem] bg-stage px-6 py-10 md:px-16 md:py-14">
        <p className="flex flex-wrap items-center gap-2 font-mono text-xs font-medium tracking-widest text-muted-foreground uppercase">
          Azure
          <span className="rounded-full bg-foreground px-2.5 py-0.5 font-sans text-xs font-semibold tracking-normal text-background normal-case">
            Coming soon
          </span>
        </p>
        <h1 className="mt-3 text-4xl leading-[1.04] font-bold md:text-[3.5rem]">
          Azure, explained{" "}
          <span className="accent-word text-[1.08em] text-accent">for builders</span>
        </h1>
        <p className="mt-4 max-w-3xl text-lg leading-relaxed">
          Plain-English guides for the Azure problems people hit most, starting where Azure and
          Power Platform meet. We&rsquo;re researching and writing the first ones now.
        </p>
        <p className="mt-6 flex flex-wrap gap-3">
          <Link
            href="/guides"
            className="inline-flex min-h-11 items-center rounded-full bg-primary px-5 font-semibold text-primary-foreground no-underline"
          >
            Browse the Power Platform guides
          </Link>
          <Link
            href="/updates"
            className="inline-flex min-h-11 items-center rounded-full border-[1.5px] border-foreground px-5 font-semibold no-underline hover:bg-muted"
          >
            See what&rsquo;s new
          </Link>
        </p>
      </header>

      <section aria-labelledby="azure_planned" className="mx-auto mt-12 max-w-[77.5rem]">
        <h2 id="azure_planned" className="text-2xl font-bold">
          What we&rsquo;re planning
        </h2>
        <ul className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {AZURE_PLANNED_AREAS.map((area) => (
            <li key={area.name} className={`rounded-[1.5rem] p-5 ${area.tint}`}>
              <p className="font-display text-lg font-bold">{area.name}</p>
              <p className="mt-1.5 text-sm leading-relaxed">{area.blurb}</p>
            </li>
          ))}
        </ul>
        <p className="mt-8 max-w-3xl text-sm text-muted-foreground">
          {SITE_NAME} is independent. It isn&rsquo;t affiliated with, endorsed by or certified by
          Microsoft. Azure is a trademark of the Microsoft group of companies.
        </p>
      </section>
    </main>
  );
}
