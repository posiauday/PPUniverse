# Azure hub: what Azure users need, and what we could offer (research, 2026-10-09)

**Status: research and recommendations only.** Nothing in this note is an approved decision. The product owner decides. Under the decision validation rule in `CLAUDE.md`, anything accepted from here must be recorded in `docs/final-decisions.md` (or an ADR) before it is treated as decided. That includes adding the Azure tab itself.

**What was asked (as relayed to this research session):** the product owner wants an "Azure" tab next to "Power Platform" in the site header, shown as "Soon" for now, and full, architect-level research on what Azure users need most, so the site can help "all Azure users with everything we can".

**Ground rules applied.**
- We describe what others offer so we can find gaps. We take no text, code or designs from anyone.
- Every guide would be written by us and link to Microsoft Learn for the official detail.
- No Microsoft endorsement, certification or compatibility claims anywhere (see section 5.4).
- Figures are as published on the day they were read, mostly 2026-10-09. They change, so check them again before quoting them in public content.

**Companion notes:** `docs/research/technology-daily-needs.md` (daily jobs and common problems per Power Platform product) and `docs/research/2026-10-08-components-and-offers-by-technology.md` (what to offer per technology). This note follows the same shape for Azure.

---

## The short version

- **Azure is big and still growing fast.** About a quarter of developers use it (26% in Stack Overflow's 2025 survey) [1]. Microsoft reported Azure and other cloud services revenue up 43% in the quarter to 30 June 2026 [2]. Azure appears in about a quarter of US tech job postings [4].
- **Where people ask has moved.** New Stack Overflow questions about Azure have nearly stopped (319 in the last 12 months, against about 145,000 in total) [7]. Microsoft Q&A holds about 176,000 Azure questions [6], and AI assistants now answer many of the rest. To be found, our pages need to be the clear, tested, dated source that people and AI tools cite.
- **The biggest question areas** on Microsoft Q&A are identity (Entra ID), data services, app hosting, virtual machines and networking, and AI [6]. **AI is the fastest-growing:** the Foundry and Azure OpenAI tags reached about 21,000 questions in roughly three years [6].
- **Cost is the top pain.** 85% of organisations in Flexera's 2026 survey name managing cloud cost as a top challenge [8]. 98% of FinOps practitioners now manage AI spend, up from 31% in 2024 [9].
- **2026 is a year of heavy change.** Microsoft's AI platform has been renamed twice (Azure AI Studio, then Azure AI Foundry, now Microsoft Foundry) [16]. The Assistants API was sunset on 26 August 2026 [17]. Five Azure certifications were retired and replaced in 2026, including AZ-204, AI-102 and AZ-500 [10][11]. The Azure Functions .NET in-process model loses support on 10 November 2026 [32]. Change creates search demand, and also a maintenance load.
- **Our unique angle is the bridge between Power Platform and Azure.** Microsoft documents each side in separate doc sets. The joins are where makers get stuck: Key Vault secrets in environment variables, custom connectors through API Management or Functions, private network access, Foundry models in Copilot Studio, flow monitoring in Application Insights, and pay-as-you-go billing on an Azure subscription [47]–[61].
- **Proposed menu: eight columns, same pattern as the Power Platform menu** (a "Start here" guide plus sub-topics): Azure + Power Platform; AI & agents; Identity & security; Apps & integration; Data & storage; Networking & VMs; Cost & FinOps; Governance & operations.
- **Ship first:** about 20 guides, roughly half of them error-fix pages, plus a "Daily reference" row of error-code tables.
- **Later:** tested, labelled assets: a secure integration baseline in Bicep and Terraform, a policy starter set, KQL query packs, a cost alert kit, a Power BI cost dashboard, and our own architecture drawings.
- **Main risks:** scope creep (Azure has hundreds of services), keeping content current, the cost of a test subscription, SEO against Microsoft Learn, and trademark care.

---

## Method and limits

**Read on 2026-10-09:**
- Microsoft Learn (product docs, troubleshooting articles, Azure Architecture Center, Well-Architected Framework, Cloud Adoption Framework, certification pages) through the Microsoft Learn search and fetch tools.
- Microsoft's FY26 Q4 earnings release; the Stack Overflow 2025 survey; Flexera 2026; State of FinOps 2026; job-posting studies.
- **Demand counts:** Microsoft Q&A tag counts, read from the first ten pages of the public tag directory (about 330 tags, sorted by popularity) [6]; Stack Overflow tag counts and 12-month question counts, from the public Stack Exchange API [7].
- **Community tools:** AzAdvertizer's and Azure Charts' own home pages [67][68].

**Limits:**
- **Reddit couldn't be read** (blocked for automated tools), so r/AZURE pain points come only indirectly, through the Microsoft Q&A threads Microsoft Learn search surfaced. No forum text was copied.
- **Google Trends wasn't reachable.** Search interest is inferred from question volumes, job postings and survey data instead.
- **Q&A counts are totals since each tag began.** They favour older services. AI tags are only about three years old, so their rate of growth is much higher than their totals suggest.
- **Some smaller tags** (for example Service Bus and Event Grid) fall outside the first ten directory pages and aren't counted.
- **We have no site analytics for Azure yet.** Once the tab exists, real searches (`catalog.search` logs) and clicks on the "Soon" tab should re-rank everything here.

---

## 1. Who Azure users are

Azure's audiences overlap, but each has its own daily jobs and its own certification path. The certification landscape changed a lot in 2026 (see 2.4).

| Audience | Daily jobs | Certifications in 2026 | Overlap with Power Platform teams |
|---|---|---|---|
| **App and API developers** | Build and deploy web apps, APIs and functions; connect to data; sign users in | AZ-204 retired on 31 July 2026; replaced by Azure AI Cloud Developer Associate, exam AI-200 [10][11][12] | **High:** custom connectors, Azure Functions, API Management, Dataverse plug-ins calling Azure |
| **AI builders** | Deploy models, build retrieval (RAG), agents and guardrails; manage quota | AI-102 retired on 30 June 2026, replaced by AI-103; AI-900 replaced by AI-901; new AI-500 (multi-agent) [10][11][14][79] | **High:** Copilot Studio with Foundry models and Azure AI Search [56] |
| **Cloud and platform engineers, DevOps** | Landing zones, infrastructure as code, CI/CD, containers, Kubernetes | AZ-104 and AZ-400 (not on Microsoft's retirement list as of 2026-10-09) [10] | **Medium:** ALM pipelines, network access for Power Platform, environments next to subscriptions |
| **Architects** | Choose services; review designs against the Well-Architected Framework; plan landing zones and security | AZ-305 and SC-100 (not on the retirement list) [10] | **Medium:** Power Platform or Azure decisions; reference architectures |
| **Data engineers** | Pipelines, lakes, warehouses; more and more Microsoft Fabric | DP-203 retired on 31 March 2025; nearest replacement is DP-700 (Fabric) [15] | **High:** Dataverse to Fabric or Synapse, Power BI [58] |
| **Administrators (IT operations)** | Identities, VMs, networks, backup, monitoring | AZ-900, AZ-104 [10] | **Medium to high:** Entra ID, Conditional Access, telemetry export from Power Platform [60] |
| **FinOps and cost owners** | Budgets, cost allocation, commitments, AI spend | Mostly outside Microsoft's own certifications | **Medium:** Power Platform pay-as-you-go billing runs on an Azure subscription [55] |
| **Security engineers** | Posture management, Key Vault, network security, identity protection | AZ-500 retired on 31 August 2026; replaced by SC-500 [10][11][13] | **Medium:** Key Vault, data policies next to Azure Policy |

**Best fit for us, in order:** Power Platform makers and pro developers who need Azure; administrators; AI builders; architects; data engineers. Deep platform engineering (AKS internals, large-scale networking) is the hardest market for us to win, and should come later.

### Where Azure and Power Platform meet

These are the joins our current readers already hit. Each one is documented by Microsoft, but in a different doc set from the other side of the join.

1. **Custom connectors from Azure.** API Management can export an API straight to a Power Platform environment as a custom connector. Testing it from the maker portal needs a CORS policy for the maker portal's origin [47][48]. Azure Functions are usually published this way.
2. **Logic Apps or Power Automate.** Both share a designer heritage, but they're licensed differently. Power Automate is licensed per user; Logic Apps is billed to an Azure subscription, per run (Consumption) or at a fixed price (Standard). They also differ in monitoring, ALM and networking [49][50].
3. **Secrets in Key Vault.** Environment variables of type "secret" can point at Azure Key Vault. Setup needs the `Microsoft.PowerPlatform` resource provider registered, plus the Key Vault Secrets User role for both the maker and the Dataverse service principal. Power Platform isn't one of Key Vault's trusted services behind its firewall [53][54].
4. **Private network access.** Virtual network support lets Dataverse plug-ins and some connectors call private Azure resources through a delegated subnet. The subnet must be in the region that matches the environment. Turning it on can break plug-ins that call public endpoints [51]. Microsoft's release plan lists more connectors (including Azure AI Search) supported from April 2026 [52].
5. **Copilot Studio with Foundry models.** Copilot Studio prompts can use models deployed in Foundry. The connection is governed in data policies as its own connector [56].
6. **Dataverse events into Azure.** Dataverse can post events to Service Bus queues, topics and Event Hubs through service endpoints registered with the Plug-in Registration tool [57].
7. **Dataverse analytics.** Link to Fabric (no copy, uses Dataverse storage) or Azure Synapse Link (exports to your own storage) [58]. Synapse Link's Delta Lake export is closed to new customers from 15 October 2026, and existing customers must move off it by December 2027 [59].
8. **Monitoring.** Dataverse, Power Automate and Copilot Studio telemetry can be exported to Application Insights. This is supported for managed environments only, and the flow telemetry isn't lossless [60][61].
9. **Billing.** Pay-as-you-go plans bill Power Platform usage to an Azure subscription through a Power Platform account resource in a resource group [55].
10. **Identity and automation.** The same Entra ID tenant underpins both. Mandatory MFA for Azure management (CLI, PowerShell, IaC tools and the REST API from 1 October 2025) affects scripts and pipelines that admins use for both [27]. Pipelines now authenticate without secrets through workload identity federation [76][78].

---

## 2. What's in demand now (2025 to 2026)

### 2.1 Market and usage signals

| Signal | Figure | Source |
|---|---|---|
| Developers using Azure | 26.3% of all respondents and 27.2% of professional developers (AWS 43.3% and 45.9%; Google Cloud 24.6% and 24.3%) | Stack Overflow survey 2025 [1] |
| Azure growth | "Azure and other cloud services" revenue up 43% in the quarter to 30 June 2026; Microsoft says Azure passed USD 100 billion in annual revenue for the first time | Microsoft FY26 Q4 release [2] |
| Market share, Q4 2025 | AWS 28%, Microsoft 21%, Google 14% of cloud infrastructure spend | Synergy Research, via Statista [3] |
| US job postings (about 850,000, January 2025 to March 2026) | Azure in 24% (AWS 30%, Google Cloud 14%). Azure in 42% of data engineer and 45% of DevOps/SRE postings. Kubernetes in 39% and Terraform in 38% of DevOps/SRE postings. Power BI in 9% overall | Oxylabs [4] |
| UK permanent job ads (6 months to 9 October 2026) | 10,909 ads name Azure (9.25% of all, rank 7). Skills named alongside it: DevOps 26.8%, CI/CD 23.7%, AI 22.5%, SQL 22.3%, Python 20.4% | IT Jobs Watch [5] |
| Cloud cost | 85% name managing cost as a top challenge; estimated waste rose to 29%; every respondent uses some generative AI cloud service | Flexera 2026 (753 respondents) [8] |
| AI spend | 98% of 1,192 practitioners manage AI spend; "FinOps for AI" is the top forward-looking priority; workload optimisation and waste reduction is the top current one | State of FinOps 2026 [9] |

### 2.2 Where people ask questions

**Microsoft Q&A, total questions per tag (read 2026-10-09)** [6]

| Tag | Questions | | Tag | Questions |
|---|---|---|---|---|
| Azure (all Azure tags) | 176,132 | | Azure Blob Storage | 3,428 |
| Microsoft Entra ID | 31,320 | | Azure Virtual Network | 3,173 |
| Azure Data Factory | 12,211 | | Azure Databricks | 3,035 |
| Azure Virtual Machines | 10,408 | | Azure API Management | 2,845 |
| Azure App Service | 10,081 | | Azure Kubernetes Service | 2,789 |
| Azure SQL Database | 6,962 | | Document Intelligence (Foundry Tools) | 2,492 |
| Azure Functions | 6,545 | | Azure VPN Gateway | 2,189 |
| Azure Synapse Analytics | 5,664 | | Azure Cosmos DB | 2,166 |
| Azure OpenAI in Foundry Models | 5,067 | | Defender for Cloud | 1,794 |
| Cost Management | 5,044 | | Azure DevOps | 1,640 |
| Foundry Tools | 4,609 | | Azure AI Search | 1,598 |
| Azure Monitor | 4,025 | | Azure Key Vault | 1,585 |
| Azure Storage | 3,886 | | Azure Policy | 1,252 |
| Azure Logic Apps | 3,844 | | Azure RBAC | 1,196 |
| Azure Machine Learning | 3,694 | | Azure Container Apps | 1,007 |

**Grouped by the menu columns proposed in section 4** (approximate sums of the tags above plus a few smaller ones from the same pages):

| Proposed column | Q&A questions | Note |
|---|---|---|
| Identity & security | about 44,500 | Entra ID also covers Microsoft 365 sign-in, so not all of it is Azure |
| Data & storage | about 43,800 | Data Factory, SQL and Synapse lead |
| Apps & integration | about 28,600 | App Service and Functions lead |
| Networking & VMs | about 26,300 | VMs lead; private networking is spread across several tags |
| AI & agents | about 21,000 | All gathered since about 2023, so the fastest rate by far |
| Governance & operations | about 8,400 | Monitor, DevOps, Automation, Policy |
| Cost & FinOps | about 5,000 | Low volume, but the top pain in surveys [8] |

**Stack Overflow: all time against the last 12 months** (since 1 October 2025) [7]

| Tag | All time | Last 12 months |
|---|---|---|
| azure | 144,928 | 319 |
| azure-devops | 33,333 | 115 |
| azure-active-directory / microsoft-entra-id | 18,443 / not read | 30 / 38 |
| azure-functions | 17,494 | 78 |
| azure-pipelines | 13,181 | 66 |
| azure-web-app-service | 12,525 | 24 |
| azure-databricks | 5,036 | 36 |
| azure-data-factory | 9,817 | 25 |
| azure-blob-storage | 9,175 | 23 |
| azure-api-management | 2,645 | 16 |
| azure-container-apps | not read | 15 |
| azure-aks | 3,682 | 12 |
| azure-openai | not read | 11 |
| power-automate (for comparison) | not read | 41 |

**What the two tables say together:**
- **Stack Overflow is now an archive for Azure, not a live signal.** Its old answers still rank in search, but many predate the 2025 and 2026 renames, which makes them stale.
- **Among the little new activity there,** DevOps pipelines, Functions and identity lead, the same order as the job-ad skills.
- **Microsoft Q&A is the main public forum.** The high Entra ID, Data Factory, App Service and VM totals match the problem areas in section 3.

### 2.3 Fastest-growing areas

1. **AI and agents.**
   - Foundry, Azure OpenAI and related AI tags already total about 21,000 Q&A questions [6].
   - "AI" sits beside Azure in 22.5% of UK Azure job ads [5].
   - The platform keeps changing:
     - The new Foundry portal and resource model, the Responses API, renamed roles (Azure AI User became Foundry User), and a v1 API without monthly version parameters [16][17].
     - The Assistants API and the `azure-ai-inference` package retired on 26 August 2026 [17].
     - Classic agents retire on 31 March 2027 [18].

   Every one of these changes creates "what changed and what do I do" searches.
2. **Containers.**
   - AKS Automatic, a managed Kubernetes option with less day-to-day operation, became generally available in late 2025 [39].
   - Serverless GPUs in Container Apps became generally available in April 2025 [77].
   - The new AI-200 developer exam gives containers (Container Registry, Container Apps, AKS) 20 to 25% of its weight [12].
3. **A serverless reset.**
   - The .NET in-process model for Functions loses support on 10 November 2026 [32].
   - Linux Consumption plan hosting retires on 30 September 2028. The replacement, Flex Consumption, is Linux-only and needs a new app [33][34].

   Many existing apps must move in the next 1 to 24 months.
4. **Identity hardening.**
   - Mandatory MFA for Azure management reached CLI, PowerShell, IaC tools and REST writes from 1 October 2025. Tenants could postpone until 1 July 2026 at the latest [27].
   - Pipelines are moving to secretless workload identity federation [76][78].
5. **Cost and FinOps, especially for AI** [8][9].
6. **Landing zones and infrastructure as code.**
   - Microsoft now recommends an IaC accelerator built on Azure Verified Modules, in Bicep or Terraform, for platform landing zones [41].
   - Terraform appears in 38% of DevOps/SRE postings [4].
7. **Data moving towards Fabric.**
   - DP-203 retired, and its nearest replacement is a Fabric exam [15].
   - Microsoft reported more than 31,000 Fabric customers on its January 2026 earnings call (from a transcript summary, so treat it as indicative) [70].
   - Dataverse's Synapse Link Delta export is being deprecated in favour of Link to Fabric [59].
8. **New networking defaults.** New virtual networks created with API versions released after 31 March 2026 use private subnets by default. VMs then need an explicit way out to the internet, for Windows activation and updates too [28].

### 2.4 Certifications changed in 2026

Brief codes such as AI-102 and DP-203 are no longer available. Any learning path we build should map to the current codes, and shouldn't put exam codes into URLs.

| Earlier exam | Status (Microsoft Learn, 2026-10-09) | Current equivalent |
|---|---|---|
| AZ-900, AZ-104, AZ-305, AZ-400, SC-100 | Not on the retired or retiring lists [10] | Unchanged |
| AZ-204 Azure Developer | Retired 31 July 2026 [10] | Azure AI Cloud Developer Associate, exam AI-200 [11][12] |
| AI-102 Azure AI Engineer | Retired 30 June 2026 [10] | Azure AI Apps and Agents Developer Associate (AI-103) [11] |
| AI-900 Azure AI Fundamentals | Retired 30 June 2026 [10] | AI-901 [14] |
| DP-100 Azure Data Scientist | Retired 1 June 2026 [10] | MLOps Engineer Associate (AI-300) [11] |
| AZ-500 Azure Security Engineer | Retired 31 August 2026 [10] | Cloud and AI Security Engineer Associate (SC-500) [11][13] |
| DP-203 Azure Data Engineer | Retired 31 March 2025 [15] | Fabric Data Engineer (DP-700) [15] |
| PL-600 and PL-200 (Power Platform) | Retired 30 June and 31 August 2026 [10] | Partly replaced by Agentic AI Business Solutions Architect (AB-100) and Intelligent Applications Builder Associate [11] |

This churn is itself a content opportunity for our Power Platform readers. Their own certifications changed at the same time.

### 2.5 What this means for us

1. **Lead with the bridge, AI and identity.** They match our current readers, the fastest growth and the largest question volume.
2. **Be error-first.** People paste exact error strings (AADSTS50011, AuthorizationFailed, RequestDisallowedByPolicy, 429, "User is not authorized to read secrets").
   - Microsoft's troubleshooting articles are now very good, for example the private endpoint DNS decision map [25].
   - Our value is what they leave out: cross-product context, a tested-on date, the Power Platform angle, and a clear "do this" for small teams.
3. **Turn change into return visits.** Retirement and rename pages get searched right before the deadlines. They need an owner and a review date (see section 7).

---

## 3. The most common problems, and what a great guide would contain

### 3.1 Identity and access

| Problem | Why it's hard | A great guide would contain |
|---|---|---|
| "AuthorizationFailed" or 403 after assigning a role | Two planes: Contributor manages a storage account but can't read its blobs or a vault's secrets. Scopes inherit. Role changes take up to about 10 minutes to apply; a managed identity's group membership can be cached for about 24 hours; moving a resource orphans its role assignments [23][24][26] | One picture of scopes and planes; a table of the right data-plane role per service (Storage Blob Data Reader, Key Vault Secrets User, Service Bus Data Sender, Foundry User); how to test with the CLI; the wait and refresh rules |
| Managed identity set-up | System-assigned or user-assigned; which SDK credential; local development against cloud; propagation delays; a system-assigned identity is new after a redeploy [24] | A decision table; the credential chain explained; a Bicep snippet with a role assignment that sets the principal type; a "works on my machine" section |
| App registrations and consent: AADSTS50011, 65001, 700016, 7000215 | Many settings: redirect URIs must match exactly; platform types; delegated or application permissions; admin consent; expiring secrets [29][30] | An AADSTS lookup table; a secret-expiry monitoring recipe; when to use certificates or federated credentials instead of secrets |
| MFA enforcement breaking automation | Phase 2 covers create, update and delete operations from CLI, PowerShell, IaC tools and the REST API. User accounts used as service accounts start to fail [27] | How to find affected accounts; how to move them to managed identities or workload identities; the dates and postponement facts |
| Pipeline sign-in errors (AADSTS700213, 70021, 70025) | Federated credentials must match issuer and subject exactly, so renaming an organisation, project or service connection breaks them [31] | Recipes for GitHub Actions and Azure DevOps; an error table; a rename checklist |

### 3.2 Networking

| Problem | Why it's hard | A great guide would contain |
|---|---|---|
| A private endpoint name resolves to a public IP, or returns NXDOMAIN | The private DNS zone isn't linked to the VNet (the most common cause); custom DNS servers don't forward `privatelink` zones; 168.63.129.16 is only reachable from inside Azure, so on-premises resolvers need a Private Resolver or forwarder [25] | A decision map in our own words; one diagram; `nslookup` tests at each hop; the DNS Private Resolver pattern for hybrid networks |
| Still 403 when the network is private | The caller lacks a data-plane role, or a second host name (for example queue or DFS) has no endpoint [26] | A combined network-and-identity checklist |
| New default: no outbound internet | New VNets created with newer API versions use private subnets, so VMs can't reach the internet, Windows activation or updates without NAT Gateway or similar [28] | How to tell which kind you have; a NAT Gateway template; a cost note |
| Power Platform VNet support | Region matching, subnet sizing, and plug-ins or connectors that call public endpoints break once it's on [51] | A pre-flight checklist, a sizing table and a test plan |

### 3.3 AI and Foundry

| Problem | Why it's hard | A great guide would contain |
|---|---|---|
| 429 "Too Many Requests" while usage looks below quota | The rate check counts estimated tokens including `max_tokens`; RPM is checked in 1 to 10 second windows; quota must be assigned to the deployment that gets the traffic; shared pools can temporarily lower limits; failed requests still count [19] | How to read the rate-limit headers; sizing `max_tokens`; retries that honour `retry-after-ms`; when to spread across deployments or use provisioned throughput; a test harness |
| Content filter errors and cut-off answers | Blocked prompts return HTTP 400 with `content_filter`. Filtered outputs return 200 with `finish_reason` set to `content_filter`. Jailbreak detection is probabilistic. Requests filtered after processing are still charged [21][22] | Handling code for both cases; logging filter results; user-facing wording; when and how to change filter settings |
| 401, 403 and 404 | Wrong token scope, a missing role (with roles recently renamed), or a wrong deployment name or API version [17][20] | An Entra sign-in recipe; an endpoint and version map |
| Naming and API churn | Studio to AI Foundry to Microsoft Foundry; classic and new portals with separate docs; Assistants API sunset; classic agents retiring [16][17][18] | A "what changed" glossary (old name, new name, what to do) and a migration checklist |
| AI cost | Tokens, provisioned throughput, many deployments [9] | A cost worksheet, budget alerts and a per-deployment usage query |

### 3.4 App hosting

| Problem | Why it's hard | A great guide would contain |
|---|---|---|
| App Service 502 and 503 | Long requests, memory or CPU pressure, wrong start-up port, deploying to an undersized plan [35] | A diagnosis flow (Diagnose and solve problems, Kudu, logs); slots for safe deploys |
| Functions plan and runtime changes | In-process ends 10 November 2026. Linux Consumption retires 30 September 2028. Flex Consumption is Linux-only and needs a new app. .NET 10 doesn't run on Linux Consumption [32][33][34] | A decision tree; a migration checklist; side-by-side infrastructure-as-code changes |
| Cold starts | Consumption scales to zero; Flex Consumption offers always-ready instances at a cost [33] | When it matters, the options, and their cost |
| Container Apps deployment failures | Image pull and registry sign-in, health probes, the target port, identity [36] | A symptom-to-fix table |
| AKS upgrades fail | Pod disruption budgets block node drain; surge nodes need spare quota; version skew rules [37][38] | A pre-upgrade checklist, maintenance windows, and when to choose AKS Automatic [39] |

### 3.5 Infrastructure as code and deployments

| Problem | Why it's hard | A great guide would contain |
|---|---|---|
| A generic "DeploymentFailed" | The real cause sits in the inner error: an unregistered resource provider, a policy deny, a quota, an unavailable SKU, or the limit of 800 deployments per resource group [23] | A "read the error" guide and a lookup table |
| Drift and accidental deletes | Portal changes drift from code; complete mode deletes resources | Deployment stacks with deny settings and what-if in pull requests; `terraform plan` in CI [40] |
| Landing zones feel overwhelming | Many design areas; the accelerator assumes IaC skills [41] | A "small team" landing zone: what to do on day one and what to leave for later |

### 3.6 Cost

| Problem | Why it's hard | A great guide would contain |
|---|---|---|
| Surprise bills | Forgotten resources keep billing. The free account's credit lasts 30 days. The spending limit exists only on credit-based offers, not pay-as-you-go [65][66] | Budgets, anomaly alerts and scheduled cost emails set up in 15 minutes; a clean-up habit; the usual suspects |
| Alerts arrive late | Anomaly detection runs daily, about 36 hours behind, and only per subscription [43][44] | Pair it with forecast-based budgets |
| Who spent it | Tags, tag inheritance and shared-cost allocation [42][45] | A tagging standard; exports to Fabric and Power BI [45] |

### 3.7 The Power Platform and Azure bridge

| Problem | Why it's hard | A great guide would contain |
|---|---|---|
| "User is not authorized to read secrets" when saving an environment variable | The maker and the Dataverse service principal both need Key Vault Secrets User; the older Key Vault Reader role isn't enough; the resource provider must be registered; the Key Vault firewall blocks Power Platform by default [53][54] | Step-by-step fix, a check script and a firewall decision |
| A custom connector to API Management or Functions fails in test | CORS for the maker portal, and Entra ID resource and redirect settings [44][47] | A recipe and a troubleshooting table |
| Apps and flows can't reach private Azure resources | Public endpoints, VNet support or the on-premises gateway: three paths with different licences [51] | A "choose the path" guide |
| Logic Apps or Power Automate | Licensing, limits, ALM and networking differ [49][50] | A decision table with worked cost examples |
| Dataverse analytics | Link to Fabric or Synapse Link, Dataverse storage use, and the Delta export deprecation [58][59] | A comparison and migration notes |
| Monitoring flows centrally | Application Insights export needs managed environments, and the telemetry isn't complete [60][61] | A KQL query pack and alert rules |

### 3.8 Keeping up with change

| Problem | Why it's hard | A great guide would contain |
|---|---|---|
| Retirements catch teams out | Notices are spread across Azure Updates, Service Health and Azure Advisor. The Advisor retirement workbook doesn't cover every service at resource level [46][71]. Even whole services retire, for example Microsoft Dev Box (closing down from September 2026, retiring in 2028) [72] | A curated retirement calendar for our audience, a Resource Graph query, and a quarterly checklist |

---

## 4. Proposed information architecture for the Azure tab

### 4.1 How it mirrors the Power Platform menu

- **Same pattern.** Today's Power Platform menu has one column per area (Power Apps, Power Automate, Power BI, Copilot Studio, Dataverse, Power Pages, Governance & admin). Each column has a "Start here" guide and the area's first four sections (`MENU_SECTION_COUNT = 4` in `apps/web/lib/technology-menu.ts`). The Azure menu should work the same way.
- **Each column also becomes a hub page.** The hub can hold more sections than the four the menu shows, plus the "Daily reference" row approved on 2026-10-02 for every hub.
- **Five sub-topics per column below.** The first four would show in the menu; the fifth (and any later ones) live on the hub.

### 4.2 Ordering

- **Option A (recommended): fit first.** Order by demand combined with our right to win: the bridge, AI, identity, apps, data, networking, cost, governance.
- **Option B: volume first.** Pure Q&A volume would put identity and data first, then apps, networking, AI, governance and cost (section 2.2).

Option A keeps the column our current readers need most in the first position, and AI second because it's growing fastest and overlaps with Copilot Studio.

### 4.3 The eight columns

**1. Azure + Power Platform**
- **Start here:** "When your Power Platform solution needs Azure: the services worth knowing".
- **Sub-topics:**
  1. Custom connectors from Azure Functions and API Management.
  2. Logic Apps or Power Automate.
  3. Secrets and private access (Key Vault environment variables, VNet support).
  4. Dataverse and Azure (Service Bus, Event Hubs, Link to Fabric).
  5. Copilot Studio with Foundry models and Azure AI Search.
- **More on the hub:** monitoring with Application Insights; pay-as-you-go billing; ALM pipelines with Azure DevOps or GitHub.
- **Why:** this is our unique angle and our current audience. Every sub-topic is a join between two Microsoft doc sets [47]–[61]. No competitor in section 6 owns it.

**2. AI & agents**
- **Start here:** "Microsoft Foundry from zero: deploy a model, set quota and call it safely".
- **Sub-topics:**
  1. Deploy models and manage quota.
  2. Fix 429s and throttling.
  3. Guardrails and content filters.
  4. Retrieval (RAG) with Azure AI Search.
  5. Agents, and moving off the Assistants API.
- **More on the hub:** AI cost, private networking for AI, and evaluations.
- **Why:** the fastest growth (section 2.3), heavy churn [16][17], and a direct link to the Copilot Studio hub.

**3. Identity & security**
- **Start here:** "Azure access in one picture: Entra ID, RBAC and managed identities".
- **Sub-topics:**
  1. App registrations and consent (AADSTS errors).
  2. Managed identities and workload identity federation.
  3. Azure RBAC (control and data planes, least privilege).
  4. Key Vault and secrets.
  5. MFA, Conditional Access and admin hardening.
- **More on the hub:** Defender for Cloud basics.
- **Why:** the largest question volume (about 44,500) [6] and the root cause of many errors in other columns [23][24].

**4. Apps & integration**
- **Start here:** "Where should my code run? App Service, Functions, Container Apps or AKS".
- **Sub-topics:**
  1. App Service (deploy, slots, 502 and 503).
  2. Azure Functions (plans, Flex Consumption, the move to isolated worker).
  3. Containers (Container Apps and AKS).
  4. API Management.
  5. Messaging and events (Service Bus, Event Grid, Logic Apps).
- **Why:** about 28,600 questions [6], two hard deadlines [32][33], and the developer audience that builds our connectors.

**5. Data & storage**
- **Start here:** "Pick the right Azure data store, and when Dataverse or Fabric is the better answer".
- **Sub-topics:**
  1. Azure SQL Database (connect securely, Entra sign-in, tiers).
  2. Storage accounts and Blob (access, SAS or RBAC, lifecycle).
  3. Data Factory pipelines.
  4. Fabric, Synapse and Databricks: what goes where.
  5. Cosmos DB and PostgreSQL, including vector search.
- **Why:** about 43,800 questions [6]. A natural partner for our Power BI and Dataverse hubs. The Fabric shift [15][59] creates decision questions.

**6. Networking & VMs**
- **Start here:** "Azure networking for app builders: VNets, private endpoints and DNS".
- **Sub-topics:**
  1. VNets, subnets and NSGs.
  2. Private endpoints and private DNS.
  3. Outbound internet and NAT Gateway.
  4. Hybrid connectivity (VPN Gateway, ExpressRoute, DNS Private Resolver).
  5. Virtual machines (sizes, quotas, backup).
- **Why:** about 26,300 questions [6]. Private networking is the classic blocker for secure integrations. The default changed in 2026 [28].

**7. Cost & FinOps**
- **Start here:** "Never get a surprise Azure bill: budgets, alerts and the usual suspects".
- **Sub-topics:**
  1. Budgets, anomaly alerts and scheduled reports.
  2. Read your bill (cost analysis, tags, allocation).
  3. Cost traps and clean-up.
  4. Reservations, savings plans and Azure Hybrid Benefit.
  5. AI and token costs.
- **More on the hub:** a Power BI cost dashboard.
- **Why:** low question volume but the top pain in every survey [8][9]. It suits the site because a Power BI cost dashboard ties into our KPI library plans.

**8. Governance & operations**
- **Start here:** "Set up Azure properly from day one: subscriptions, policy and infrastructure as code".
- **Sub-topics:**
  1. Subscriptions, management groups and landing zones.
  2. Azure Policy.
  3. Infrastructure as code (Bicep, Terraform, Azure Verified Modules, deployment stacks).
  4. CI/CD with GitHub Actions and Azure DevOps without secrets.
  5. Monitoring with Azure Monitor, Log Analytics and KQL.
- **Why:** this is the architect and platform column. It mirrors "Governance & admin" in the Power Platform menu, and IaC and DevOps lead the job-ad skills [4][5].

### 4.4 Hub extras (same design system as the Power Platform hubs)

- **"Top fixes" chips** from section 3, each running a scoped site search, as already proposed for the Power Platform hubs.
- **A "Daily reference" row** (section 5.2).
- **"Retirement watch":** a single page listing dated changes that matter to our readers, each linked to Microsoft's notice [46][71].
- **Cross-links both ways.** For example, the Copilot Studio hub links to "AI & agents", and the Dataverse hub links to "Azure + Power Platform".

### 4.5 Implementation notes for later (not decisions)

- **Header.** Add an "Azure" link next to "Power Platform" with the same "Soon" mark Learn uses. The mark is part of the link's accessible name, so screen readers announce it too. Until a column has a published start-here guide, the link could go to a short `/azure` page listing what's planned, marked "Coming", like planned guides on today's hubs.
- **Routing.** Use the path `/azure`, never an `azure.` subdomain. Microsoft's brand guidelines rule out its marks in domain names [62], and `docs/final-decisions.md` already applies the same rule to "Power" in subdomains.
- **Data model.** Today's hub keys (`HubKey`) are Power Platform products. Azure needs either a platform level (Power Platform or Azure) above the hubs, or new hub keys. The product taxonomy in `docs/04-information-architecture.md` already lists "Platform". This is a data-model change for a story, and possibly an ADR.
- **Feature flag.** Put the Azure hub behind a feature flag, as `CLAUDE.md` requires for incomplete modules.
- **Search.** Scope search to the Azure hub, so that "429" finds the Azure OpenAI page rather than the Power Automate one.

---

## 5. What to ship first

### 5.1 Launch list (20 guides, in priority order)

"Intent" is the search intent we target: **fix** (error string), **how-to**, **choose** (comparison), **change** (migration or deadline), **reference** (lookup).

| # | Working title | Column | Main audience | Intent | Why it's on the list |
|---|---|---|---|---|---|
| 1 | Call an Azure Function from Power Apps and Power Automate: a custom connector with Entra ID sign-in | Azure + PP | Makers, pro developers | how-to | The most common bridge task; spans two doc sets [47] |
| 2 | Fix "User is not authorized to read secrets": Key Vault secrets in environment variables | Azure + PP | Makers, admins | fix | An exact error with a precise, testable fix [53][54] |
| 3 | Azure OpenAI 429 errors: why you're throttled below quota, and how to fix it | AI | Developers, AI builders | fix | Fastest-growing area; Microsoft notes it's widely misread [19] |
| 4 | Logic Apps or Power Automate? Choose with licensing, limits and ALM in view | Azure + PP | Makers, architects | choose | An evergreen decision for our readers [49][50] |
| 5 | Never get a surprise Azure bill: budgets, anomaly alerts and the usual suspects | Cost | Everyone | how-to | The top pain in every survey [8][43] |
| 6 | Managed identities explained: connect Azure services without secrets | Identity | Developers, admins | how-to | Underpins half the error pages [24] |
| 7 | Private endpoint resolves to a public IP: fix private DNS step by step | Networking | Admins, developers | fix | The classic blocker for secure integrations [25] |
| 8 | AADSTS sign-in errors decoded (reference) | Identity | Developers, makers | reference | Highest-volume area; ideal "Daily reference" page [29][30] |
| 9 | Azure deployment errors decoded: AuthorizationFailed, RequestDisallowedByPolicy, SkuNotAvailable and more (reference) | Governance | Everyone who deploys | reference | Every deployment hits these [23] |
| 10 | Mandatory MFA for Azure: what breaks for scripts, pipelines and service accounts, and how to fix it | Identity | Admins, DevOps | change | Phase 2 enforcement since October 2025, postponements end July 2026 [27][31] |
| 11 | Use a Foundry model in Copilot Studio, and keep it governed | Azure + PP / AI | Makers | how-to | Direct overlap with our Copilot Studio hub [56] |
| 12 | Expose an internal API to Power Platform through API Management (CORS included) | Azure + PP | Pro developers | how-to | Microsoft's one-click export has a known test trap [47][48] |
| 13 | Azure Functions .NET in-process ends on 10 November 2026: a migration checklist | Apps | Developers | change | A hard deadline one month away [32] |
| 14 | Microsoft Foundry for people who learned Azure OpenAI: what changed and what to migrate | AI | Developers | change | Renames, API sunsets, new roles [16][17][18] |
| 15 | Alerts for failed Power Automate flows in Application Insights, with KQL queries | Azure + PP | Admins | how-to | Pairs with a free KQL query pack [60][61] |
| 16 | Where should my code run? App Service, Functions, Container Apps or AKS | Apps | Developers, architects | choose | The start-here guide for its column |
| 17 | Dataverse to Fabric: Link to Fabric or Azure Synapse Link, and the Delta export deprecation | Data / Azure + PP | Data engineers, makers | choose / change | Deprecation from 15 October 2026 [58][59] |
| 18 | Pay-as-you-go Power Platform billing on an Azure subscription: set it up and keep it in budget | Azure + PP / Cost | Admins | how-to | Joins two admin centres [55] |
| 19 | New networks have no internet by default: give VMs explicit outbound access | Networking | Admins | change | The 2026 default change [28] |
| 20 | AKS upgrade failed: fix pod disruption budget and capacity blockers | Apps | Platform engineers | fix | A recurring, well-defined failure [37][38] |

Next wave candidates: "Connect Power Apps to Azure SQL securely"; "Container Apps deployment failures by symptom"; "Move from Linux Consumption to Flex Consumption"; "Azure Policy for beginners: audit first, then deny"; "A small-team landing zone".

### 5.2 "Daily reference" pages

Short lookup pages that people return to, indexed like guides:
- **AADSTS error table:** code, meaning, the usual cause, the fix, and a link to Microsoft [29][30][31].
- **Azure deployment error table:** the top 25 codes from Microsoft's list, in plain words with the first thing to check [23].
- **Azure OpenAI HTTP errors and rate-limit headers** [19][20].
- **Data-plane roles cheat sheet:** which role reads blobs, secrets, queues or models.
- **Retirement watch** for our audience, each item dated and linked [46][71].
- **Limits that bite:** for example, 800 deployments per resource group [23].

### 5.3 Later offers that fit the site's model

The site is first-party only, mostly free with ads, with a few priced items (`docs/final-decisions.md`). Every asset gets the "what this needs" label proposed in the 2026-10-08 research. For Azure, the label would show:
- the Azure roles needed to deploy it;
- the regions it was tested in;
- an estimated monthly cost at list price, with the date;
- the API versions used;
- the Power Platform requirements (for example, a managed environment);
- the tested-on date;
- the licence;
- the support policy;
- for paid items, the refund classification.

**Reusable assets**
- **Secure integration baseline (Bicep and Terraform).** It deploys:
  - a VNet with a subnet delegated to Power Platform, plus NAT Gateway;
  - Key Vault behind a private endpoint, with its private DNS zone;
  - Application Insights and Log Analytics;
  - a budget with an anomaly alert;
  - a tagging standard.

  It would be built on Azure Verified Modules [41] and deployed as a deployment stack with deny settings [40]. This is the flagship asset, because it joins the two worlds.
- **Azure Policy starter set.** Allowed locations, required tags, and no public network access for Key Vault and Storage, with "audit first, then deny" guidance. AzAdvertizer already catalogues every built-in definition [67]. Our gap is a small, explained, tested set.
- **KQL query packs.**
  - Failed flows by environment (Application Insights) [61].
  - Slow Dataverse plug-ins [60].
  - Azure OpenAI token use by deployment.
  - Orphaned disks, IPs and network cards (Resource Graph).
  - Resources affected by retirements (Resource Graph) [46].
- **Cost alert kit.** A budget, an action group and an anomaly alert as code, plus a weekly scheduled cost email.
- **Power BI cost dashboard.** A `.pbit` over Cost Management exports in the FOCUS format, following the export-to-Fabric-to-Power-BI pipeline Microsoft describes [45]. It joins our planned Power BI KPI library.
- **Architecture diagrams as our own drawings.** About six patterns:
  1. Power Apps to API Management to Functions to private Azure SQL.
  2. Copilot Studio with Foundry and AI Search.
  3. Dataverse to Service Bus to Functions.
  4. Flow monitoring with Application Insights.
  5. Link to Fabric analytics.
  6. A small-team landing zone.

**Checklists**
- Before production: a Power Platform and Azure integration (identity, secrets, network, monitoring, cost, ALM).
- AI app go-live (quota, retries, content filters, cost limits, logging, evaluation).
- A new subscription in 30 minutes.
- Quarterly retirement readiness.

**Error-fix pages:** the "Daily reference" row above, plus one page per high-volume error.

**Learning paths** (in the Learn module, still "Soon"):
- "Azure for Power Platform makers" (about six lessons).
- "Azure administrator essentials" (follows AZ-104 topics but is practical, not exam prep).
- "Build AI apps on Azure" (follows AI-103 and AI-200 topics).

Each path links Microsoft's official skills outline instead of restating it.

**Possible paid items** (one or two, one USD price each):
- the secure integration baseline, as templates plus an importable solution and a guide;
- the Power BI cost dashboard.

Both carry a higher support burden than Power Apps components, because Azure APIs change. See risks.

### 5.4 Trademark and endorsement care

1. **The tab label "Azure" is referential use:** it describes the topic. Add Microsoft's trademark footnote to the footer, and a plain "independent; not affiliated with or endorsed by Microsoft" line on the Azure hub [62].
2. **Never use "Azure" (or other Microsoft marks) in product or pack names, domain names, subdomains or social handles** [62]. Name packs descriptively, for example "Secure integration baseline", and mention Azure only in the description. Ask for a legal check before the first paid Azure item.
3. **No Microsoft logos as our icons.** That includes the tab icon. Microsoft's Azure product icons may be used in architecture diagrams, training material and documentation, unaltered (no cropping, flipping, rotating or recolouring), and never to represent our own product [63]. Entra icons must not appear in marketing at all [64]. Our own drawings avoid the issue; where we use official icons, we follow these terms.
4. **No "certified", "official", "verified", "approved" or "compatible" claims.** Say "tested on [date] in [region] with API version [x]" instead.
5. **Certification content:** no exam dumps or "real exam questions", no claim of official preparation, no Microsoft certification badges. Exam codes are factual references only.
6. **Templates that build on Microsoft samples or modules:** check each repository's licence and keep its notice. Never copy documentation text.
7. **Screenshots:** check Microsoft's permissions for using product screenshots before publishing any. Scrub tenant IDs, subscription IDs and email addresses (`CLAUDE.md` forbids committing tenant IDs).
8. **Structured data:** keep the existing rule. Never give Microsoft as the brand of our pages or assets.
9. **Cost figures:** always dated, "at list price in [region]", with a link to Microsoft's pricing page.

---

## 6. Competitive landscape

| Who | Strong at | Gaps we can fill |
|---|---|---|
| **Microsoft Learn** (docs, troubleshooting, Architecture Center, Well-Architected Framework, Cloud Adoption Framework) [73][74][75] | Authoritative, free and deep. New troubleshooting articles use clear decision maps [25]. Strong reference architectures | Organised product by product, so cross-product journeys (Power Platform and Azure) are split across doc sets. Two Foundry doc sets during the transition [17]. Rarely says "don't use this" or gives small-team defaults. Little dated cost realism |
| **Microsoft Q&A** [6] | The largest live forum (about 176,000 Azure questions); Microsoft moderators | Answer depth varies. Many accepted answers in the threads surfaced here are general checklists rather than tested fixes |
| **Stack Overflow** [7] | A deep archive | New activity has almost stopped. Old answers go stale after renames |
| **AI assistants** (including Microsoft's own: the Functions migration guide now offers a GitHub Copilot skill [34]; the Azure Updates page offers a feed for AI tools [71]) | Instant, contextual answers | They need good sources to cite and can't test in your tenant. Our tested, dated pages can be the source they cite |
| **YouTube**, for example John Savill's free Azure Master Class [69] and Microsoft's own shows | Depth, clear whiteboard explanations, certification prep | Hard to search for an exact error string. No tested, downloadable assets |
| **Reference catalogues:** AzAdvertizer (policies, RBAC roles, aliases, with daily change tracking; a personal project, not a Microsoft service) [67]; Azure Charts (service and lifecycle views; access limited to approved users) [68] | Breadth and freshness of reference data | Raw data, not "what should I do". No Power Platform angle |
| **Training vendors** (course platforms and practice-test sites) | Structured courses, exam practice | Exam-focused, not production troubleshooting. Many need updates after the 2026 code changes [10] |
| **Individual MVP and consultancy blogs** | Niche depth | Uneven upkeep. No version or tested-on metadata |
| **Power Platform community sites** | Maker depth | Rarely go deep on Azure |

**Where we can win:**
1. **The bridge.** Nobody owns "Power Platform plus Azure".
2. **Error-first, tested and dated pages,** each with a "what this needs" label.
3. **Plain decisions for small teams,** with costs.
4. **Assets that apply the guide:** templates, queries, dashboards and checklists.
5. **Accessible by default** (WCAG 2.2 AA), as across the site.

---

## 7. Risks and open questions for the product owner

### 7.1 Risks

| Risk | Why it matters | Mitigation |
|---|---|---|
| **Scope creep** | Azure has hundreds of services. "Everything for all Azure users" can't be done well by a small first-party team | Start with the bridge and the top 20; add columns one at a time behind a feature flag; let search data choose the next wave |
| **Keeping current** | 2026 alone brought platform renames, API sunsets, certification swaps and several retirements [10][16][17][32][59]. Power Platform release plans also stop being published from September 2026, moving to the "AI at Work" roadmap [52] | A "last tested" date on every page; a 90-day review for AI pages and 180 days for others; an owner per column; watch Azure Updates and the Advisor retirement workbook [46][71] |
| **SEO against Microsoft Learn** | Learn ranks first for "what is X" | Target exact error strings, cross-product questions and decisions; structured, dated pages that AI assistants can cite |
| **A test subscription is needed** | Guides must be tested to be trusted. The free account gives USD 200 credit for 30 days, then limited free services after upgrading [65]. Pay-as-you-go has no spending limit [66] | A dedicated test tenant and subscription; a monthly budget with alerts; one resource group per guide; tear-down scripts; build, test and remove expensive services (AKS, Firewall, VPN Gateway, provisioned AI throughput) the same day |
| **Power Platform side costs** | Some bridge features need managed environments and premium licences, for example Application Insights export [60] | Budget for a licensed test environment |
| **Security of test work** | Templates and guides change real security settings | Separate tenant; MFA; no secrets in the repo; scrubbed screenshots; security review per asset, as `CLAUDE.md` requires |
| **Brand fit** | "LowCodeStacks" may look like the wrong place for pro-code Azure content | Position the tab as "Azure for Power Platform teams" first, then widen |
| **Support burden of paid assets** | Azure templates break when APIs or defaults change [28] | Keep most assets free; version and changelog everything; pin API versions |
| **Trademark** | Misuse risks a takedown and trust | Section 5.4, plus a legal check before paid items |

### 7.2 Questions for the product owner

1. **The tab.** Approve an "Azure" link with a "Soon" mark next to "Power Platform"? Should it open a "what's coming" page until the first guides publish? (Record the decision in `docs/final-decisions.md`.)
2. **Scope for the first release:** "Azure for Power Platform teams" (the bridge plus top errors), or all eight columns from day one?
3. **Column order:** Option A (fit first, recommended) or Option B (volume first)? See 4.2.
4. **Fabric:** cover it only where it touches Azure and Dataverse (in Data & storage), or plan a separate Fabric hub later?
5. **Test environment:** what monthly budget cap for a test subscription and test tenant? Who owns tear-down and the review dates?
6. **Freshness:** is a visible "last tested" date and a 90- or 180-day review cadence acceptable?
7. **Assets:** free, with at most one or two paid packs (the secure integration baseline, the Power BI cost dashboard)? Which licence for free templates (for example MIT)?
8. **Learning paths and certifications:** in scope for the Learn module, aligned to the 2026 codes?
9. **Data model:** add a platform level above the hubs, or new hub keys? Should this get its own story and ADR?
10. **Demand test:** count clicks on the "Soon" tab (anonymous, with no new personal data) to size interest before writing beyond the first wave?

---

## Sources

1. Stack Overflow, Developer Survey 2025, Technology (cloud platforms): https://survey.stackoverflow.co/2025/technology
2. Microsoft, FY26 Q4 earnings release (Form 8-K exhibit 99.1, 29 July 2026): https://www.sec.gov/Archives/edgar/data/0000789019/000119312526323632/msft-ex99_1.htm
3. Statista, cloud infrastructure market share (Synergy Research Group), Q4 2025: https://www.statista.com/chart/18819/worldwide-market-share-of-leading-cloud-infrastructure-service-providers/
4. Oxylabs, tech tools in US job postings (about 850,000 postings, January 2025 to March 2026): https://oxylabs.io/press-area/tech-tools-us-job-postings-demand
5. IT Jobs Watch, Azure (UK permanent jobs, 6 months to 9 October 2026): https://www.itjobswatch.co.uk/jobs/uk/azure.do
6. Microsoft Q&A, tag directory with question counts (read 2026-10-09, pages 1 to 10): https://learn.microsoft.com/en-us/answers/tags/
7. Stack Exchange API (Stack Overflow tag counts and questions since 2025-10-01, queried 2026-10-09): https://api.stackexchange.com/docs
8. Flexera, 2026 State of the Cloud Report: https://info.flexera.com/CM-REPORT-State-of-the-Cloud
9. FinOps Foundation, State of FinOps 2026: https://data.finops.org/
10. Microsoft Learn, exam and assessment lab retirement: https://learn.microsoft.com/credentials/support/retired-certification-exams
11. Microsoft Partner Center, June 2026 announcements (retiring certifications and replacements): https://learn.microsoft.com/partner-center/announcements/2026-june
12. Microsoft Learn, study guide for exam AI-200: https://learn.microsoft.com/credentials/certifications/resources/study-guides/ai-200
13. Microsoft Learn, study guide for exam SC-500: https://learn.microsoft.com/credentials/certifications/resources/study-guides/sc-500
14. Microsoft Learn, study guide for exam AI-901: https://learn.microsoft.com/credentials/certifications/resources/study-guides/ai-901
15. Microsoft Learn, study guide for exam DP-203 (retired) and DP-700: https://learn.microsoft.com/credentials/certifications/resources/study-guides/dp-203
16. Microsoft Learn, What is Microsoft Foundry?: https://learn.microsoft.com/azure/foundry/what-is-foundry
17. Microsoft Learn, migrate from the Foundry (classic) portal: https://learn.microsoft.com/azure/foundry/how-to/navigate-from-classic
18. Microsoft Learn, create a new agent (classic), retirement note: https://learn.microsoft.com/azure/foundry-classic/agents/quickstart
19. Microsoft Learn, manage Azure OpenAI in Microsoft Foundry Models quota: https://learn.microsoft.com/azure/foundry/openai/how-to/quota
20. Microsoft Learn, troubleshoot common HTTP errors for Azure OpenAI: https://learn.microsoft.com/azure/foundry/openai/how-to/troubleshoot-errors
21. Microsoft Learn, content filtering overview: https://learn.microsoft.com/azure/ai-foundry/openai/concepts/content-filter
22. Microsoft Learn, Azure OpenAI frequently asked questions: https://learn.microsoft.com/azure/ai-foundry/openai/faq
23. Microsoft Learn, troubleshoot common Azure deployment errors: https://learn.microsoft.com/azure/azure-resource-manager/troubleshooting/common-deployment-errors
24. Microsoft Learn, troubleshoot Azure RBAC: https://learn.microsoft.com/azure/role-based-access-control/troubleshooting
25. Microsoft Learn, troubleshoot private endpoint DNS resolution failure: https://learn.microsoft.com/troubleshoot/azure/private-link/troubleshoot-private-endpoint-dns-resolution
26. Microsoft Learn, troubleshoot 403 errors for Storage or Key Vault through a private endpoint: https://learn.microsoft.com/troubleshoot/azure/private-link/troubleshoot-403-access-denied-private-endpoint
27. Microsoft Learn, mandatory multifactor authentication for Azure and admin portals: https://learn.microsoft.com/entra/identity/authentication/concept-mandatory-multifactor-authentication
28. Microsoft Learn, default outbound access in Azure: https://learn.microsoft.com/azure/virtual-network/ip-services/default-outbound-access
29. Microsoft Learn, error AADSTS50011 (redirect URI mismatch): https://learn.microsoft.com/troubleshoot/entra/entra-id/app-integration/error-code-aadsts50011-redirect-uri-mismatch
30. Microsoft Learn, troubleshooting common Microsoft Entra ID Auth SDK issues (AADSTS codes): https://learn.microsoft.com/entra/msidweb/agent-id-sdk/troubleshooting
31. Microsoft Learn, troubleshoot an Azure Resource Manager workload identity service connection: https://learn.microsoft.com/azure/devops/pipelines/release/troubleshoot-workload-identity
32. Microsoft Learn, migrate C# apps from the in-process model to the isolated worker model: https://learn.microsoft.com/azure/azure-functions/migrate-dotnet-to-isolated-model
33. Microsoft Learn, Azure Functions Consumption plan hosting (legacy): https://learn.microsoft.com/azure/azure-functions/consumption-plan
34. Microsoft Learn, migrate Consumption plan apps to the Flex Consumption plan: https://learn.microsoft.com/azure/azure-functions/migration/migrate-plan-consumption-to-flex
35. Microsoft Learn, troubleshoot HTTP 502 and 503 errors in Azure App Service: https://learn.microsoft.com/azure/app-service/troubleshoot-http-502-http-503
36. Microsoft Learn, troubleshoot common deployment failures in Azure Container Apps: https://learn.microsoft.com/azure/container-apps/troubleshoot-deployment-errors
37. Microsoft Learn, AKS upgrade options and recommendations: https://learn.microsoft.com/azure/aks/upgrade-options
38. Microsoft Learn, troubleshoot UpgradeFailed errors due to pod disruption budgets: https://learn.microsoft.com/troubleshoot/azure/azure-kubernetes/create-upgrade-delete/error-code-poddrainfailure
39. InfoQ, Microsoft releases AKS Automatic to general availability (October 2025): https://www.infoq.com/news/2025/10/microsoft-kubernetes-automatic
40. Microsoft Learn, create and deploy Azure deployment stacks in Bicep: https://learn.microsoft.com/azure/azure-resource-manager/bicep/deployment-stacks
41. Microsoft Learn (Cloud Adoption Framework), platform landing zone implementation options: https://learn.microsoft.com/azure/cloud-adoption-framework/ready/landing-zone/implementation-options
42. Microsoft Learn, what is Microsoft Cost Management: https://learn.microsoft.com/azure/cost-management-billing/costs/overview-cost-management
43. Microsoft Learn, identify anomalies and unexpected changes in cost: https://learn.microsoft.com/azure/cost-management-billing/understand/analyze-unexpected-charges
44. Microsoft Learn, cost baseline for startups (anomaly alert timing): https://learn.microsoft.com/startups/build/cost-optimization/startup-cost-baseline
45. Microsoft Learn (Well-Architected Framework), architecture strategies for collecting and reviewing cost data: https://learn.microsoft.com/azure/well-architected/cost-optimization/collect-review-cost-data
46. Microsoft Learn, Azure Advisor Service Retirement workbook: https://learn.microsoft.com/azure/advisor/advisor-workbook-service-retirement
47. Microsoft Learn, export APIs from Azure API Management to the Power Platform: https://learn.microsoft.com/azure/api-management/export-api-power-platform
48. Microsoft Learn, enable CORS policies for an API Management custom connector: https://learn.microsoft.com/azure/api-management/enable-cors-power-platform
49. Microsoft Learn, choose the right integration and automation services in Azure: https://learn.microsoft.com/azure/azure-functions/functions-compare-logic-apps-ms-flow-webjobs
50. Microsoft Learn, Power Automate migration to Azure Logic Apps (Standard), capability comparison: https://learn.microsoft.com/azure/logic-apps/power-automate-migration
51. Microsoft Learn, Azure virtual network support overview (Power Platform): https://learn.microsoft.com/power-platform/admin/vnet-support-overview
52. Microsoft Learn, release plan: take advantage of expanded Virtual Network support (2026 release wave 1): https://learn.microsoft.com/power-platform/release-plan/2026wave1/power-platform-governance-administration/take-advantage-expanded-virtual-network-support
53. Microsoft Learn, use environment variables for Azure Key Vault secrets: https://learn.microsoft.com/power-apps/maker/data-platform/environmentvariables-azure-key-vault-secrets
54. Microsoft Learn, "User is not authorized to read secrets" error when saving environment variables: https://learn.microsoft.com/troubleshoot/power-platform/dataverse/working-with-solutions/environment-variable-key-vault-auth-error
55. Microsoft Learn, Power Platform pay-as-you-go plan: https://learn.microsoft.com/power-platform/admin/pay-as-you-go-overview
56. Microsoft Learn, bring your own model for your prompts (Copilot Studio): https://learn.microsoft.com/microsoft-copilot-studio/bring-your-own-model-prompts
57. Microsoft Learn, Azure Service Bus integration (Dataverse): https://learn.microsoft.com/power-apps/developer/data-platform/azure-integration
58. Microsoft Learn, link your Dataverse environment to Microsoft Fabric (comparison with Azure Synapse Link): https://learn.microsoft.com/power-apps/maker/data-platform/azure-synapse-link-view-in-fabric
59. Microsoft Learn, export Dataverse data in Delta Lake format (deprecation notice): https://learn.microsoft.com/power-apps/maker/data-platform/azure-synapse-link-delta-lake
60. Microsoft Learn, export data to Application Insights (Power Platform admin center): https://learn.microsoft.com/power-platform/admin/set-up-export-application-insights
61. Microsoft Learn, set up Application Insights with Power Automate: https://learn.microsoft.com/power-platform/admin/app-insights-cloud-flow
62. Microsoft, Trademark and Brand Guidelines: https://www.microsoft.com/en-us/legal/intellectualproperty/trademarks
63. Microsoft Learn, Azure architecture icons (terms of use): https://learn.microsoft.com/azure/architecture/icons/
64. Microsoft Learn, Microsoft Entra architecture icons (terms of use): https://learn.microsoft.com/entra/architecture/architecture-icons
65. Microsoft Learn, services included with an Azure free account: https://learn.microsoft.com/azure/cost-management-billing/manage/create-free-services
66. Microsoft Learn, Azure spending limit: https://learn.microsoft.com/azure/cost-management-billing/manage/spending-limit
67. AzAdvertizer (home page, read 2026-10-09): https://www.azadvertizer.net/
68. Azure Charts (home page, read 2026-10-09): https://azurecharts.com/
69. Azure Master Class course materials (John Savill), GitHub: https://github.com/AutomationStudyGroup/AzureMasterClass
70. Microsoft Q2 FY2026 earnings call transcript (third-party transcript; Fabric customer figure): https://www.aol.com/articles/microsoft-msft-q2-2026-earnings-000320024.html
71. Microsoft Azure, Azure Updates: https://azure.microsoft.com/en-us/updates/
72. Microsoft Learn, Microsoft Dev Box retirement guide: https://learn.microsoft.com/azure/dev-box/dev-box-retirement-guide
73. Microsoft Learn, Azure Well-Architected Framework: https://learn.microsoft.com/azure/well-architected/
74. Microsoft Learn, Cloud Adoption Framework for Azure: https://learn.microsoft.com/azure/cloud-adoption-framework/
75. Microsoft Learn, Azure Architecture Center: https://learn.microsoft.com/azure/architecture/
76. Microsoft Learn, Azure DevOps release notes: workload identity federation for Azure Resource Manager service connections generally available: https://learn.microsoft.com/azure/devops/release-notes/2024/sprint-234-update
77. InfoQ, serverless GPUs generally available in Azure Container Apps (April 2025): https://www.infoq.com/news/2025/04/azure-serverless-gpus-nvidia-nim
78. Microsoft Learn, deploy to Azure Functions by using GitHub Actions (OpenID Connect): https://learn.microsoft.com/azure/azure-functions/functions-how-to-github-actions
79. Microsoft Learn, study guide for exam AI-500 (multi-agent solutions): https://learn.microsoft.com/credentials/certifications/resources/study-guides/ai-500
