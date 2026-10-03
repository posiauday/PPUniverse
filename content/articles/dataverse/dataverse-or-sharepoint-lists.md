---
title: "Dataverse or SharePoint lists? An honest comparison"
slug: dataverse-or-sharepoint-lists
type: COMPARISON
technology: DATAVERSE
topic: choose-dataverse
excerpt: "SharePoint lists are free with Microsoft 365 and quick to start. Dataverse costs more and does far more. Where each one wins, where lists quietly break down, and how to decide before you build."
---
Almost every Power Platform project starts with the same question: do we keep the data in SharePoint lists, or do we use Dataverse? The answer usually decides the licensing cost of the whole solution, so it's worth getting right before anything is built.

Neither is better in general. Lists are the right choice more often than Dataverse advocates admit, and Dataverse is necessary more often than budget holders hope. Here's how to tell which situation you're in.

## Side by side

| | Microsoft Lists (SharePoint) | Dataverse |
| --- | --- | --- |
| **Licensing for app users** | Included with Microsoft 365: canvas apps on lists use standard connectors | Premium: every user of an app that uses Dataverse needs a premium Power Apps licence |
| **Data model** | Lists with lookups; relationships are loose | True relational tables, one-to-many and many-to-many relationships, cascading rules |
| **Size** | Up to 30 million rows, but views over 5,000 items need indexed columns and filtered views | No stated row limit; storage comes from licence entitlements and paid capacity |
| **Security** | Site and list permissions, with item-level permissions if you break inheritance | Security roles, business units, teams, field-level and hierarchical security, auditing |
| **Logic in the data layer** | Calculated columns; validation formulas | Business rules, calculated and rollup columns, plug-ins, server-side workflows |
| **Apps** | Canvas apps, Power Automate, Lists itself, Teams | Canvas and model-driven apps, Power Pages, Dynamics 365, Copilot Studio |
| **Moving between environments** | Lists are recreated or copied per site | Solutions move tables, apps and flows together |

The comparison follows Microsoft's own comparison of Lists, Dataverse for Teams and Dataverse, plus its licensing documentation, in our wording.

## Where lists win

- **Simple, flat data.** A request log, an asset register, a list of events. One or two lookups at most.
- **Small teams and moderate volume.** Thousands of rows, not hundreds of thousands, with a handful of people editing.
- **Everyone already has the licence.** No extra cost per user, which can be the difference between a project happening and not.
- **People want to work in the list itself.** Lists has views, formatting, alerts and Excel export out of the box.

## Where lists quietly break down

The problems with lists rarely show on day one. They appear after a year of growth:

- **The 5,000-item list view threshold.** SharePoint blocks views, filters and sorts that would scan more than 5,000 items without an indexed column. The list still holds the data, but views and some queries fail until they're redesigned around indexes.
- **Delegation in Power Apps.** Many common formulas can't be delegated to SharePoint, so apps silently work on the first 500 or 2,000 rows (see our delegation guide).
- **Permissions don't scale.** Giving each item its own permissions means breaking inheritance item by item, which is slow to manage and hard to audit.
- **Relationships are weak.** There's no cascading delete, no many-to-many relationship, and no guarantee that a lookup still points at something.

> [!WARNING]
> "We'll move to Dataverse later if we need to" is a real plan only if you budget for it. Migrating means rebuilding the app's data connections, rewriting formulas, moving the data and re-checking permissions. Decide early if growth is likely.

## Where Dataverse wins

- **Related data.** Customers, orders, order lines and products, where relationships and their rules matter.
- **Record-level security.** Different people see different records, by role, by team or by business unit, without managing item permissions by hand.
- **Rules that must always apply.** Business rules and calculations run in the data layer, so they hold no matter which app or flow writes the data.
- **More than one app on the same data.** A model-driven app for the office, a canvas app for the field, a Power Pages site for customers, all with one security model.
- **Auditing and compliance.** Who changed what and when, plus customer-managed keys where required.
- **Proper deployment.** Tables, apps, flows and security roles travel together in solutions from development to production.

## The licensing question, honestly

Dataverse's cost is real. An app that uses Dataverse is a **premium** app, so every user needs a licence with premium Power Apps rights. Model-driven apps always use Dataverse. Storage is also capacity you pay for, pooled from licence entitlements and add-ons.

Before you decide, cost it both ways:

- **With lists:** no licence cost now. Add the expected cost of working around the list view threshold and delegation, and of a migration if the solution grows.
- **With Dataverse:** licences for every user who'll run the app, plus storage. Check the current Microsoft Power Platform Licensing Guide, since terms change.

## A quick way to decide

Answer these five questions. Two or more "yes" answers usually point to Dataverse:

1. Will any table pass a few thousand rows within two years?
2. Do different users need to see different records?
3. Are there three or more related tables?
4. Must rules hold no matter which app or flow writes the data?
5. Will more than one app, or an external portal, use the data?

If every answer is "no", start with lists, and design them well: indexed columns on anything you filter by, and delegable formulas from day one.

The comparison follows Microsoft's documented capabilities and licensing guidance as of September 2026. The decision questions are our own recommendation.

## Sources

- [Comparing Microsoft Lists, Dataverse for Teams and Dataverse (Microsoft Learn)](https://learn.microsoft.com/power-apps/teams/compare-data-sources)
- [Power Apps licensing FAQs (Microsoft Learn)](https://learn.microsoft.com/power-platform/admin/powerapps-licensing-faq)
- [List view threshold in SharePoint Online (Microsoft Learn)](https://learn.microsoft.com/troubleshoot/sharepoint/lists-and-libraries/items-exceeds-list-view-threshold)
- [Use Dataverse as a data source for canvas apps (Microsoft Learn)](https://learn.microsoft.com/power-platform/architecture/reference-architectures/dataverse-canvas-app)

