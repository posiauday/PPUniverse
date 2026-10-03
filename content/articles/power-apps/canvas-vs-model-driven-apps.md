---
title: "Canvas app or model-driven app? A decision guide"
slug: canvas-vs-model-driven-apps
type: COMPARISON
technology: POWER_APPS
topic: choose-and-plan
excerpt: "Canvas apps give you full control of the screen, and model-driven apps give you speed and consistency on Dataverse. Five questions to pick the right one, plus when to use both."
---
Power Apps has two ways to build an app, and choosing the wrong one costs you weeks. A **canvas app** starts from a blank screen, and you place and wire every control yourself. A **model-driven app** starts from your data model, and Power Apps builds the forms, views and navigation from it.

Neither is better in general. This guide explains how they differ and gives you five questions that settle the choice for most projects.

## The short version

| | Canvas app | Model-driven app |
| --- | --- | --- |
| **Data** | Dataverse and hundreds of other sources through connectors | Dataverse only |
| **How you build** | Controls on screens, configured with Power Fx formulas | Tables, forms, views and a site map, mostly without code |
| **Layout control** | Full: every pixel is yours | Limited: the layout follows the components you add |
| **Consistency between apps** | Depends on the maker | High: every model-driven app works the same way |
| **Responsive design** | Only if you design for it | Automatic |
| **Accessibility** | You design it in | Built in |
| **Moving between environments** | Can be complex if data sources change | Simple, with solutions |
| **Speed to first version** | Depends on how complex the design is | Fast, once the data model exists |

The table follows Microsoft's own comparison of the two app types, with our wording.

## Five questions that decide it

### 1. Where does the data live?

If the data is in SharePoint, SQL Server, Excel or another service, and it will stay there, the answer is a **canvas app**. Model-driven apps work only on Dataverse.

If the data is in Dataverse, or you're free to put it there, both options stay open.

### 2. Is the job "work through records" or "do one task well"?

Model-driven apps are built for record-centric work: find a record, open it, update it, follow its related records, move it through a process. Case management, approvals with several stages, asset registers and CRM-style work all fit this shape.

Canvas apps suit task-centric work: a single, focused job, often on a phone. Examples include a site inspection with photos, a quick request form, a stock check with a barcode scanner, or a kiosk.

### 3. How much does the exact layout matter?

If the screen has to match a paper form, a brand guide, or a step-by-step flow that a model-driven form can't express, you need a **canvas app**.

If people mainly need to see and edit data, the standard model-driven layout is usually good enough. You also avoid designing, testing and maintaining every screen yourself.

### 4. How many apps will you build on the same data?

Every model-driven app looks and behaves the same way. Once people know one, the next is easy to adopt. The more apps you plan on shared data, the more that consistency pays off.

With canvas apps, each app is as consistent as its maker makes it. A shared **component library** helps (see our guide to named formulas and components), but you have to maintain it.

### 5. Who will support it in two years?

A model-driven app is mostly configuration: tables, forms, views, business rules and security roles. Someone new can read it in the designer.

A canvas app is mostly formulas. It can be just as maintainable, but only with naming conventions, reusable components and documentation, and those don't happen by default.

## Licensing is part of the decision

Check licensing before you commit, because it often decides the question:

- **Model-driven apps use Dataverse**, so they are premium apps. Every user needs a license with premium Power Apps rights.
- **A canvas app that uses only standard connectors**, such as SharePoint, Outlook or Excel, can usually run on the Power Apps rights included with Microsoft 365.
- **A canvas app becomes premium** as soon as it uses Dataverse, a premium connector, a custom connector or an on-premises data gateway.
- **You can see an app's designation** (Standard or Premium) on its details page in the maker portal.

> [!WARNING]
> Microsoft has announced stricter enforcement of these licensing rules from February 2027, including for model-driven apps and apps in managed environments. Users without a qualifying license won't be able to open them. Check the current Microsoft Power Platform Licensing Guide before you plan a rollout; licensing terms change.

## You don't always have to choose

The two types can be combined:

- **Custom pages** bring canvas-style screens into a model-driven app. You get model-driven navigation, forms and security, plus one or more free-form pages for the parts that need them. Microsoft recommends custom pages over the older approach of embedding a canvas app in a form.
- **Canvas components from a component library** can be used on custom pages, so the same building blocks work in both kinds of app.

A common, sensible architecture is a **model-driven app for the back office** (the team that manages all the records) and a **canvas app for the front line** (the people who do one task on a phone), both on the same Dataverse tables.

> [!NOTE]
> Microsoft's guidance is to keep a model-driven app to no more than 25 custom pages. More can slow the first launch after each publish.

## Quick decision rules

- Data must stay outside Dataverse: **canvas**.
- Record management on Dataverse, several related tables, and users who spend their day in the app: **model-driven**.
- A single focused task, a custom layout, or phone-first use: **canvas**.
- Both kinds of user on the same data: **model-driven for the office, canvas for the field**, or a model-driven app with custom pages.
- Unsure, and the data is already in Dataverse: build a model-driven prototype first. It takes hours, not days, and shows quickly whether the standard layout is enough.

This guide follows Microsoft's documented behaviour for both app types and its published licensing guidance at the time of writing.

## Sources

- [What are model-driven apps in Power Apps? (Microsoft Learn)](https://learn.microsoft.com/power-apps/maker/model-driven-apps/model-driven-app-overview)
- [Overview of custom pages for model-driven apps (Microsoft Learn)](https://learn.microsoft.com/power-apps/maker/model-driven-apps/model-app-page-overview)
- [Power Apps licensing FAQs (Microsoft Learn)](https://learn.microsoft.com/power-platform/admin/powerapps-licensing-faq)
- [How to check license designation for an app (Microsoft Learn)](https://learn.microsoft.com/power-apps/maker/canvas-apps/license-designation)
