# What people need day to day, per technology (research, 2026-10-06)

**Why this exists.** The product owner noticed that each technology hub's tagline names one problem from one launch guide, for example Power Apps "Apps that scale past 500 rows". A tagline like that describes an article, not the product. This note records the evidence for broader, product-level framing and for what each hub should surface first.

**Status: proposal.** Nothing here is approved until it is recorded in `docs/final-decisions.md`.

**Method.**
- **Evidence:** Microsoft's own troubleshooting and "common issues" pages, which reflect what support and documentation teams see most often. Read via Microsoft Learn on 2026-10-06; sources are linked under each technology. They are inspiration only: we write our own guides and link to Microsoft.
- **Not used:** no community forums were scraped or copied.
- **Limit:** we have no site analytics yet. Once there is traffic, real search terms (`catalog.search` logs) should re-rank these lists.

## Power Apps

**Daily jobs:**
- connecting to data, and delegation (the 500/2,000-row limit);
- writing Power Fx: Patch or SubmitForm, collections, variables;
- making apps fast: OnStart, App.Formulas, payloads;
- sharing and connection permissions;
- forms and galleries;
- model-driven forms and performance.

**Most common problems** (from Microsoft's pages):
- "My gallery only shows 500 records";
- "you don't have permission to use a connection";
- slow app load caused by OnStart;
- column names with spaces (`_x0020_`);
- external data changes not showing up (needs Refresh);
- saving blank values.

**Sources:**
- learn.microsoft.com/power-apps/maker/canvas-apps/working-with-data-sources ("Troubleshoot common data source issues");
- learn.microsoft.com/troubleshoot/power-platform/power-apps/create-and-use-apps/common-issues-and-resolutions;
- learn.microsoft.com/troubleshoot/power-platform/power-apps/canvas-app-performance/troubleshoot-perf-table.

## Power Automate

**Daily jobs:**
- triggers that fire (or don't);
- keeping connections alive;
- reading a failed run and its error code;
- approvals;
- error handling and failure alerts;
- DLP suspensions;
- limits and throttling (429).

**Most common problems:**
- the trigger didn't fire (conditions, polling, the flow is suspended);
- the connection broke (password or MFA change, 90-day token expiry);
- error codes 401, 403, 404, 429, 500 and 502;
- a DLP change suspends many flows at once;
- silent failures with nobody notified.

**Sources:**
- learn.microsoft.com/power-automate/fix-connection-failures;
- learn.microsoft.com/power-automate/troubleshoot-flow-errors;
- learn.microsoft.com/troubleshoot/power-platform/power-automate/flow-run-issues/triggers-troubleshoot.

## Power BI

**Daily jobs:**
- data refresh and the gateway;
- modelling (star schema);
- writing DAX measures;
- report performance;
- sharing, workspaces and row-level security.

**Most common problems:**
- refresh failures (the gateway is offline, credentials, privacy levels);
- "completed with warnings" refreshes that hide broken measures;
- slow reports (use Performance Analyzer);
- the gateway's concurrency limit;
- dashboard tiles not updating after refresh.

**Sources:**
- learn.microsoft.com/power-bi/connect-data/refresh-troubleshooting-refresh-scenarios;
- learn.microsoft.com/power-bi/connect-data/refresh-data;
- learn.microsoft.com/power-bi/guidance/report-performance-troubleshoot;
- learn.microsoft.com/data-integration/gateway/service-gateway-tshoot.

## Copilot Studio

**Daily jobs:**
- building an agent;
- adding knowledge sources;
- tools and actions, including MCP;
- authentication;
- publishing to Teams and Microsoft 365 Copilot;
- testing;
- response speed.

**Most common problems:**
- publishing errors (for example, the knowledge-source limits, such as 4 public sites in a generative answers node);
- "You don't have access to talk to this bot" in Teams (tenant app settings);
- authentication set-up;
- slow answers (model choice, number of SharePoint sources).

**Sources:**
- learn.microsoft.com/microsoft-copilot-studio/publication-fundamentals-publish-channels;
- learn.microsoft.com/troubleshoot/power-platform/copilot-studio/knowledge/agent-publish-fails-bing-sources;
- learn.microsoft.com/microsoft-365/copilot/extensibility/known-issues.

## Dataverse

**Daily jobs:**
- designing tables and relationships;
- security roles and access;
- solutions and their import or export;
- business logic;
- data quality.

**Most common problems:**
- "One or more commands are unavailable due to your current privileges";
- "Principal user is missing privilege";
- users who can't reach an environment (no role, licence or group sync);
- solution import errors and version mismatch;
- duplicate-key errors.

**Sources:**
- learn.microsoft.com/power-platform/admin/database-security ("Common issues");
- learn.microsoft.com/troubleshoot/power-platform/dataverse/user-permissions/client-errors;
- learn.microsoft.com/troubleshoot/power-platform/dataverse/environment-app-access/troubleshooting-user-needs-read-write-access-organization.

## Power Pages

**Daily jobs:**
- building pages, lists and forms;
- table permissions and web roles;
- sign-in and identity providers;
- page permissions;
- the Site Checker and security scan;
- going live.

**Most common problems:**
- data left open to anonymous users, either through "Enable table permissions" being off or table permissions on the Anonymous role;
- a parent table permission missing the child's web role;
- "Email already in use" (duplicate contacts);
- authentication set-up errors (AADSTS700016);
- conflicting page permissions.

**Sources:**
- learn.microsoft.com/power-pages/security/table-permissions;
- learn.microsoft.com/power-pages/admin/site-checker-configuration-issues;
- learn.microsoft.com/power-pages/security/authentication/configure-site.

## What this means for the hubs (proposal)

1. **Taglines describe the product's job, not one guide.** Each hub's hero says what you do with the product and that the site helps you do it well, for example Power Apps "Build, fix and speed up your apps". The specific problems move to the chips and cards below.
2. **"Top fixes" chips come from the common-problem lists above.** Each chip runs a site search; they replace today's chips, which were tied to the launch guides.
3. **A "Daily reference" row on every hub**, the "Quick reference" row already approved on 2026-10-02 ("Technology pages are hubs"). It holds short lookup pages people return to: error-code tables, limits, cheat sheets and checklists. They're marked "Coming" until written, like the planned guides.
4. **Search stays central.** The hub search box gets scoped to the hub's technology, and the reference pages are indexed like guides.
5. **Same design system.** Same hero, chips, cards and colours; only the words and the order change.
