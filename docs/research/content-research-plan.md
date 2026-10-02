# Content research plan: what each section needs, how to present it, and how to earn links

**Status:** plan for product-owner approval, 2026-10-02. Nothing here is a decision until it is approved and recorded in `docs/final-decisions.md`.

**Why:** the navigation restructure (approved 2026-10-02) gives every technology its own sections. Each section should be filled with what practitioners actually struggle with, written the way they want to read it, so that the site is worth returning to and worth linking to. This plan says how we find that out before writing, instead of guessing.

**Standing rules that apply throughout:**
- **Research before writing.** Every claim is checked against Microsoft's official documentation.
- **Competitors are inspiration only.** Their content is never copied.
- **The agent only drafts.** Drafts are imported; the product owner publishes.
- **No Microsoft endorsement is claimed.**

---

## 1. What we want to know for every section

For each section (for example Power BI → *Refresh & gateways*), a one-page **content brief** answers:

1. **Real problems.** The 10–20 most common questions and errors people hit, in their own words.
2. **Search language.** The exact phrases they type, including error messages verbatim.
3. **Intent.** Do they want a quick fix, to understand why, to decide between options, or to measure something? That maps to Fix · Choose · Design · Measure.
4. **Best existing answer.** What the top results already give, and what they miss. This is our gap: outdated, no code, no explanation, no "what to check first".
5. **Ground truth.** The Microsoft Learn pages, limits pages and troubleshooting pages the guide must agree with.
6. **Preferred format.** Step list, copy-paste code, decision table, checklist, before/after, screenshot of the error. This is judged from what the best-received answers use (section 3).
7. **Who would link to it.** Communities, newsletters, blogs and docs that would reasonably cite the guide (section 4).
8. **Proposed guides.** 1–3 titles, each with its kind, the search phrase it targets, and a priority.

Briefs live in `docs/research/content-briefs/<technology>/<section>.md`.

## 2. Where the demand data comes from (free, and within each site's rules)

| Source | What it tells us | How it's used |
|---|---|---|
| **Microsoft Power Platform community** (community.powerplatform.com), and the **Fabric community** for Power BI | The most-asked problems per product, in practitioners' words | Read and cluster thread titles per section; record the phrasing. Read-only: no posting during research |
| **Microsoft Q&A** and **Stack Overflow** tags (`powerapps`, `power-automate`, `powerbi`, `dax`, `dataverse`, `power-pages`, `microsoft-copilot-studio`) | Highest-voted and most-viewed questions, and the accepted answers | Shows demand by votes and views. Accepted answers show what format satisfied people |
| **Reddit** (r/PowerApps, r/PowerAutomate, r/PowerBI) | Candid pain points and "what I wish I knew" | Read-only research. Each subreddit's own rules apply to any later participation |
| **Google autocomplete and "People also ask"** for seed terms | Real search phrasing and follow-up questions | Seeds the search-language field of each brief |
| **YouTube search suggestions and comments** on popular how-to videos | What viewers still didn't understand after the video | Finds the "why" gaps |
| **Microsoft Ideas portals** (Power Apps, Power Automate, Fabric/Power BI) | Long-standing frustrations and missing features | Workaround guides ("until Microsoft adds X, do Y") |
| **Microsoft Learn**: product docs, troubleshooting, limits pages, "Important changes" | Ground truth, and the official answer's gaps | Every guide is checked against it and cites it |
| **After launch: Google Search Console** (free) | The queries we already appear for, impressions, click-through | Shows which sections to deepen and which titles to fix |
| **After launch: our own site search** (already logged, not linked to a person) | What visitors look for and don't find | A "no results" query becomes a candidate guide |

**Not used:** paid keyword tools (not needed to start), scraping, or anything a site's terms forbid.

## 3. How people want answers presented: hypotheses we test, not assume

**Starting hypotheses**, from what tends to be accepted on Q&A sites:
- **Start from the symptom.** The title and the first line restate the error or problem in the reader's words.
- **The fix before the theory.** Copy-paste code or steps first; the "why" follows. This matches our symptom → fix → why format.
- **Version and date stamps.** Which experience (classic or modern, canvas or model-driven) and when it was checked.
- **Decision tables** for comparisons; **checklists** for go-live and security; **before/after code** for performance and delegation.
- **One screenshot of the error.** People search by what they see.

**How we test them:**
1. **Before writing:** for each brief, note the format of the top 3 accepted answers and the top 5 ranking pages: length, code, screenshots, tables, video. Inspiration only.
2. **After publishing:** Search Console click-through by title, and site search refinements.
3. **On-page signals need product-owner decisions.** Scroll depth, return visits and time on page need analytics, and the site deliberately has none (Privacy notice). Options: (a) stay analytics-free and rely on Search Console; (b) add privacy-friendly, cookie-free analytics, which means updating the Privacy notice first. **The product owner decides.**
4. **Optional:** a one-question "Did this fix it? Yes / No" at the end of each guide, storing no personal data. Also a product-owner decision.

## 4. Backlinks: earning them, never buying or planting them

**Rules:**
- Google's spam policies treat bought links, link exchanges, automated links, and keyword-stuffed links in forum posts or signatures as spam.
- Microsoft's Power Platform community code of conduct forbids using the community to market a business or site.

So links are earned by being the best reference.

**Link-worthy assets** (people cite references, not blog posts):
1. **Deprecation tracker** (Updates). Useful to admins and consultants; likely to be cited in internal wikis and newsletters.
2. **Limits cheat sheet**: delegation by connector, flow and API limits, in one place, dated, with sources.
3. **Error index**: one page per real error message.
4. **Free components and snippets on GitHub** (MIT), each README linking back to its guide. Developers star and fork; the links are natural.
5. **Decision guides** ("X or Y?"), which consultants share with clients.

**Distribution, within each community's rules:**
- **Answer, don't advertise.** In forums, answer the question fully in the post. Link a guide only where the rules allow and it's genuinely the best next read, never in signatures.
- **User groups and newsletters.** Offer a talk or a resource to Power Platform user groups; submit genuinely useful pieces to curated community newsletters and roundups.
- **Bloggers and MVPs.** When a guide extends someone's well-known post, tell them; citations follow naturally. No exchanges, no payments.
- **LinkedIn and short video.** One practical tip per post, linking the full guide.
- **Guest articles.** Only on relevant sites. Any paid or sponsored placement carries `rel="sponsored"`, as Google requires.

**Measured with:** the Search Console Links report (free): referring sites and the pages they link to.

## 5. Per-technology research seeds (to validate, not facts)

Seed search terms that start the demand research for each section. They are starting points: the research keeps the ones with real demand and finds better ones.

- **Power Apps**
  - Choose & plan: canvas vs model-driven; licensing for apps.
  - Data & delegation: delegation warning, SharePoint 2000 rows.
  - Formulas & components: named formulas, component library.
  - Performance & offline: app slow to load, offline.
  - Ship it: solutions, pipelines, environment variables.
  - Adoption & usage: app usage analytics.
- **Power Automate**
  - Triggers: trigger not firing, trigger conditions.
  - Approvals: reminders, parallel approvals.
  - Errors, retries & limits: throttling, timeout, retry policy, run after.
  - Desktop flows: unattended, UI elements.
  - Run & monitor: flow run history, failure alerts.
- **Power BI**
  - Data modelling: star schema, relationships, many-to-many.
  - DAX: CALCULATE, filter context, totals wrong.
  - Reports, visuals & KPIs: KPI visual, conditional formatting, report design.
  - Refresh & gateways: gateway offline, refresh failed, credentials.
  - Security & sharing: row-level security, sharing reports, apps.
- **Copilot Studio**
  - Build: instructions, topics vs generative orchestration.
  - Knowledge: SharePoint knowledge not answering.
  - Tools & MCP: connectors and MCP servers.
  - Test & evaluate: evaluation sets.
  - Publish: Teams channel, authentication.
  - Monitor & cost: analytics, credits.
- **Dataverse**
  - Tables & schema: table design, choice vs lookup.
  - Security: security roles, business units, teams.
  - Business logic: business rules, low-code plug-ins, real-time workflows.
  - Choose: Dataverse vs SharePoint vs SQL.
  - Data quality: duplicate detection, data import.
- **Power Pages**
  - Build: lists, forms.
  - Access: table permissions, web roles.
  - Sign-in & identity: Entra External ID, local sign-in.
  - Liquid & code: Liquid, Web API.
  - Go-live: go-live checklist, site checker, analytics.

## 6. Process and cadence

1. **Research sprint per technology.** The agent gathers and clusters the demand data from section 2 into the briefs from section 1. Read-only, nothing posted.
2. **Product-owner review of the briefs**: which guides to write, in what order.
3. **Write.** Drafts follow the brief, are checked against Microsoft Learn, and are imported as drafts.
4. **Publish** (the product owner), and share them through the channels in section 4.
5. **Measure after 4–8 weeks** in Search Console. Deepen what earns impressions, and fix titles with low click-through.

**Suggested order:** start with the two sections with the most gaps and demand, which the sprint's data will confirm. Likely candidates are Power BI *Refresh & gateways* and Power Automate *Errors, retries & limits*, which already have planned guides on the structure board.

## 7. Decisions the product owner needs to make
1. **Approve this plan** and the order of research sprints.
2. **Analytics:** stay analytics-free (Search Console only), or add privacy-friendly analytics (Privacy notice updated first).
3. **"Did this fix it?" feedback** on guides: yes or no.
4. **Participation:** will the product owner answer community questions personally? Community participation works best from a real, named person.

## Sources checked for this plan (2026-10-02)
- [Google Search spam policies: link spam](https://developers.google.com/search/docs/essentials/spam-policies)
- [Microsoft Power Platform public communities code of conduct](https://www.microsoft.com/en-us/business-applications/legal/tos-powerplatform-public-communities-codeofconduct/)
- [Power Platform 2026 release wave 1 plan](https://learn.microsoft.com/en-us/power-platform/release-plan/2026wave1/) (release plans end September 2026)
- Microsoft Learn documentation hubs for [Power Apps](https://learn.microsoft.com/en-us/power-apps/), [Power Automate](https://learn.microsoft.com/en-us/power-automate/), [Power BI](https://learn.microsoft.com/en-us/power-bi/), [Copilot Studio](https://learn.microsoft.com/en-us/microsoft-copilot-studio/), [Dataverse](https://learn.microsoft.com/en-us/power-apps/maker/data-platform/) and [Power Pages](https://learn.microsoft.com/en-us/power-pages/)
