# What to offer for each technology: market research (2026-10-08)

**Status:** research for the product owner's decision. Nothing here is approved. Asked for in chat: *"research what best things competitors are offering in components for Power Apps, what is missing and what we can give even better; and the same for each technology."*

**Ground rules applied:** this describes what others offer so we can find gaps. We take no content, code or designs from anyone. Prices and counts are vendors' own claims or third-party listings as of 2026-10-08; they change, so check them before quoting.

**Our constraints** (`docs/final-decisions.md`): first-party only (only we publish); mostly free, with ads as the main revenue and only a few priced items, each with one USD price; every paid asset needs a license, version, compatibility metadata, support policy and refund classification; uploads are scanned; no Microsoft endorsement claims.

## The short version

- **Power Apps components are a real, paying market**, but the products are mostly **copy-paste UI snippets**: PowerLibs (180+ YAML components, $99 a year or $499 lifetime), PowerBlocks (€79 a year), Power Apps UI (27 free MIT components). Microsoft's own Creator Kit (Fluent UI) is free, but parts are preview or experimental.
- **No one sells trust.** No offering we found states which licence an app needs after using a component, whether it's delegation-safe, whether it's accessible, which versions it was tested on, or how it's updated. Those are exactly the fields our marketplace already requires.
- **Power BI templates sell cheaply and badly:** Etsy .pbix files at about $10, template stores at $99 to $599 a year. A template without a working data model still leaves the hard part to the buyer.
- **Power Automate, Copilot Studio, Dataverse and Power Pages have almost no third-party market.** Microsoft's free kits (approvals kit, Copilot Studio Kit) are in preview and admin-heavy. That's open ground.
- **Recommendation:** be the **trusted, free, best-documented** source, with a few premium packs. Every item ships as an importable, tested solution with a "what this needs" label (licence, connectors, delegation, accessibility), linked to a guide that explains it.

## Power Apps: components

### What exists

| Offer | What it is | Price |
|---|---|---|
| [PowerLibs](https://powerlibs.com/) | 180+ canvas components as copy-paste YAML; 13 free | $99 a year or $499 lifetime |
| [PowerBlocks](https://www.powerblocks.dev/) | Copy-paste components and editable screens | Free tier; Pro €79 a year |
| [Power Apps UI](https://www.powerappsui.com/) | 27 components and 4 templates, standard controls only, no premium connectors | Free, MIT |
| [Creator Kit](https://learn.microsoft.com/en-us/power-platform/guidance/creator-kit/overview) (Microsoft Power CAT) | 24+ Fluent UI components, templates, theme editor, as managed solutions; some components preview or experimental | Free |
| [PCF Gallery](https://pcf.gallery/) | Community code components (PCF) | Free, varying quality and upkeep |
| Resco Power Components | Commercial PCF controls | Priced by apps in production |
| Microsoft marketplace | Code components can be listed | Varies |

### What's missing (the gaps)

1. **Licence impact isn't stated.** A code component that calls an outside service directly makes the whole app premium, so every user needs a Power Apps licence ([Microsoft Learn](https://learn.microsoft.com/en-us/power-apps/developer/component-framework/overview)). Snippet stores don't tell you this.
2. **Updating is painful.** Makers report library components behaving differently once imported, properties needing re-setting on every instance after a schema change, and event code being overwritten ([community forum](https://powerusers.microsoft.com/t5/Power-Apps-Experimental-Features/What-is-the-Plan-ENHANCED-COMPONENT-PROPERTIES/m-p/2733512/highlight/true)). Copy-paste YAML means no updates at all: each copy is on its own.
3. **No quality bar you can check:** accessibility (screen reader, keyboard, contrast), delegation safety, performance, dark mode, right-to-left text.
4. **No version or compatibility record:** which authoring version it was tested on, and what changed.
5. **Snippets, not solutions.** Few offers are importable, managed, ALM-ready solutions with a component library that can be updated centrally.

### What we can do better

- **A free core library, packaged properly:** a managed solution with a component library (central updates), plus copy-paste YAML for quick use. Every component gets a **"what this needs" label**: licence impact (standard or premium), connectors, delegation behaviour, accessibility checks passed, tested-on version, last updated.
- **Accessible by default:** keyboard and screen-reader tested, with contrast checked, written up per component. This would be a first for the category, and it matches our own WCAG 2.2 AA bar.
- **Fewer, deeper components** solving common hard problems, each with a guide: a delegation-safe searchable data table with paging, accessible forms with validation and error summary, a navigation shell (header, side menu, responsive), toasts and confirm dialogs, an empty-state and loading pattern, a date range picker, an offline-aware sync indicator.
- **Change logs and upgrade notes** per version, so updating is a choice rather than a gamble.
- **A paid pack or two, at most:** for example complete app starter templates (an approvals app, an asset tracker) as managed solutions with a data model and sample data.

## Power BI

### What exists

- **Template stores:** numerro (250 to 300+ templates, visuals and themes; listed at $99, $249 and $599 a year on [TrustRadius](https://www.trustradius.com/compare-products/numerro)). Etsy finance, HR and sales .pbix files at about $10 each, or $26 for five.
- **Theme tools:** the [powerbi.tips theme generator](https://powerbi.tips/2023/02/28/powerbi-tips-theme-generator-the-ultimate-tool-for-creating-complex-themes) (free, with paid theme storage).
- **Premium visuals:** [Zebra BI](https://zebrabi.com/pricing-select-product) for finance reporting (from about $68 a month for 10 users, and every viewer needs a licence) and [Inforiver](https://inforiver.com/pricing) for tables, matrices and write-back (from about $2 per user per month).
- **Microsoft:** free sample reports and template apps.

### What's missing

1. **A template isn't a model.** A .pbit carries the report, not the modelling, cleaning or refresh: the buyer still builds the hard part.
2. **KPIs without definitions.** Templates show numbers but rarely say how each KPI is defined, which DAX computes it, or what good looks like.
3. **Design without accessibility:** colour-blind-safe palettes, contrast and keyboard reading order are seldom addressed.
4. **Per-viewer licensing for premium visuals** gets expensive for wide audiences.

### What we can do better

- **A KPI library** (this is "KPIs for Power BI"): each KPI as a page with its definition, the DAX measure, the data it needs, pitfalls, and a small sample model. Free, indexable, and a natural partner to the six KPI guides we already have.
- **Model-first starter kits:** a star-schema sample model (date table, measures folder, naming conventions) for a few areas, such as sales, service desk and Power Platform adoption. Each kit is one .pbit with sample data and a guide. Possibly a paid premium pack.
- **An accessible theme pack:** colour-blind-safe themes with contrast checked, as free JSON downloads.
- **Power Platform's own KPIs:** adoption, flow health and app usage dashboards built on data makers already have (CoE Starter Kit or Dataverse audit). This is unique to our niche.

## Power Automate

### What exists

- **Microsoft's built-in templates**, plus a [business approvals kit](https://learn.microsoft.com/en-us/power-automate/guidance/business-approvals-templates/introduction) that is in preview.
- **Patterns in blogs** (for example error handling with try, catch and finally scopes); very little sold. One approval template preview on Gumroad was marked not for sale.
- **Paid connectors** for documents (Encodian, Plumsail), priced by action allowance.

### What's missing

1. **Error handling, logging and alerts aren't there by default.** A flow without it just fails and waits for someone to notice ([guide](https://www.matthewdevaney.com/3-power-automate-error-handling-patterns-you-must-know/)).
2. **Production-ready, tested flow solutions** (with connection references, environment variables and documentation) are rare.
3. **No packaged way to see the health of all your flows** without the full CoE Starter Kit.

### What we can do better

- **A free "production flow" starter solution:** a try/catch/finally template, a central error log (a Dataverse table or SharePoint list), alerts with a link to the failed run, retry policy defaults, and connection references and environment variables set up for ALM.
- **Flow patterns library:** approvals with escalation and delegation, batch processing past the 5,000-item threshold, child flows with proper error propagation. Each one is an importable solution plus a guide.
- **Flow health KPIs** that connect to the Power BI pack above.

## Copilot Studio

### What exists

- **Microsoft's [Copilot Studio Kit](https://github.com/microsoft/Power-CAT-Copilot-Studio-Kit):** an [Agent Library](https://learn.microsoft.com/en-us/microsoft-copilot-studio/guidance/kit-agent-library-templates-overview) of agent templates, a Component Library, a Prompt Advisor and an adaptive cards gallery. Free, but preview, and installing needs admin roles.
- **Third-party prompt lists**, of mixed quality.

### What's missing

1. **Templates you can trust for production:** most are starting points, without test sets, guardrails or a description of the knowledge they expect.
2. **Testing and evaluation guidance** for makers who aren't developers.
3. **Topic patterns** that work well together: fallback, hand-off to a human, authentication, citations.

### What we can do better

- **Agent starter solutions** for common jobs, such as an IT help desk, an HR policy Q&A or an internal knowledge search. Each comes with a recommended knowledge setup, guardrail topics, and **a test set of questions with expected answers**.
- **A topic patterns library:** escalation to a person, clarifying questions, safe "I don't know" answers, citations.
- **A pre-launch checklist:** data loss prevention, authentication, content moderation, analytics. Free, and good for search.

## Dataverse

### What exists

- **Developer tools:** [XrmToolBox](https://learn.microsoft.com/en-us/power-apps/developer/data-platform/community-tools) (30+ plugins: FetchXML Builder, SQL 4 CDS and others) and community templates (for example TALXIS, which describes itself as not production-ready). These target developers, mostly on Windows.
- **Microsoft's industry accelerators and the Common Data Model** (large, enterprise-oriented).

### What's missing

1. **Small, ready-to-use data models** for common business apps (assets, requests, inspections), with the security set up.
2. **A clear starting point for the security model:** roles, teams, business units and column security, explained with a matrix.
3. **Guidance that makers, not developers, can follow.**

### What we can do better

- **Starter data models** as solutions: tables, relationships, views, forms and **security roles with a role matrix**, plus sample data. These pair with the Power Apps and Power BI kits.
- **A security role builder or matrix template** (a spreadsheet, plus solution roles) and a guide on Dataverse security. This was already a planned Learn topic.
- **Naming and ALM conventions:** a publisher prefix, solution layering and environment variables, as a one-page standard.

## Power Pages

### What exists

- **Microsoft's built-in templates and 13 preset themes**, Liquid web templates, and code components on pages ([Microsoft Learn](https://learn.microsoft.com/power-pages/configure/web-templates)).
- **No third-party theme or component marketplace** turned up in this research.

### What's missing

1. **Themes and components beyond the 13 presets**, especially accessible ones.
2. **Reusable Liquid components** (cards, lists, filters, breadcrumbs) with documentation.
3. **Secure-by-default patterns:** table permissions and web roles set up correctly, and a review checklist.

### What we can do better

- **An accessible theme pack and a Liquid component kit** (parameterised web templates) with usage docs.
- **A table permissions starter and checklist**, the most common Power Pages security mistake. This pairs with the planned Learn topic.
- **Site starters:** an authenticated request portal and a public knowledge base, as solutions.

## Across all six: what makes us different

1. **The "what this needs" label on everything:** licence impact (standard or premium), connectors, delegation, accessibility checks, tested-on versions, last updated, support policy. These are our marketplace fields already (CLAUDE.md), and no competitor shows them.
2. **Solutions, not snippets:** importable, ALM-ready (connection references, environment variables), versioned, with change logs.
3. **Every item comes with a guide.** Our guides are the free content that brings people in, and each one links the item that applies it.
4. **Accessible and dark-mode-ready by default**, written up per item.
5. **Mostly free.** Competitors charge $79 to $599 a year for libraries. A free, better library fits our model (ads, coming back to learn) and wins on trust. A few premium packs (complete app starters, Power BI model kits) could carry a single price each.

## A possible first wave (to decide)

1. **Power Apps core library (free):** about 8 components (data table, form with error summary, navigation shell, dialog and toast, empty and loading states, date range), as a managed solution plus YAML, each with a label and a guide.
2. **Power BI KPI library (free):** start with the six existing KPI guides, adding definitions, DAX and a sample model.
3. **Power Automate production flow starter (free):** error handling, logging and alerts.
4. **One premium pack** to prove checkout end to end: for example an approvals app (Power Apps, Dataverse and Power Automate together) with a Power BI dashboard.

## Questions for the product owner

1. **Which to build first:** the Power Apps library, the KPI library, or both?
2. **Formats:** a managed solution plus copy-paste YAML for components (recommended), or only one of them?
3. **Free vs paid:** is "everything free except a few complete starter packs" the line?
4. **Copilot Studio, Dataverse and Power Pages:** later waves, or one small item each soon for coverage?
