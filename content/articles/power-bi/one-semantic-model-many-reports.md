---
title: "One semantic model, many reports"
slug: one-semantic-model-many-reports
type: PATTERN
technology: POWER_BI
excerpt: "When every report brings its own copy of the data, every report defines revenue a little differently. Shared semantic models fix that. Here is how to set one up, let people build on it, and keep it trustworthy."
---
In most organisations, Power BI grows one report at a time. Each report author imports the data they need, writes their own measures, and publishes. A year later there are twelve definitions of "active customer", refreshes are hammering the source system twelve times a night, and two directors bring different revenue figures to the same meeting.

The pattern that fixes this is simple to describe: **build the data model once, publish it as a shared semantic model, and have every report connect to it.** This article explains how to set it up in Power BI and how to keep it trusted.

## The pattern

1. **A semantic model** (formerly called a dataset) holds the tables, relationships and measures. It's owned by people who know the data.
2. **Reports connect to it live.** They contain visuals and pages, but no data model of their own. These are often called **thin reports**.
3. **Endorsement** tells report authors which models are official.
4. **Permissions** decide who can build on it.

Power BI's own guidance on managed self-service BI describes this as working towards **a single version of the truth**: fewer, better semantic models, reused widely.

## Step 1: publish the model on its own

Build the model in Power BI Desktop as usual: star schema, explicit measures, hidden keys, descriptions on every measure. Then publish it to a workspace meant for shared models.

Keep the model file free of report pages, or leave just one page for testing. Reports come later, in their own files. Separating them means:

- **Model changes** are made in one place.
- **Report changes** can't accidentally alter a measure.
- **Different people** can own each.

> [!TIP]
> Put shared models in their own workspace, separate from the workspaces where reports are published. It makes ownership and access obvious: the model workspace belongs to the data team, and report workspaces belong to the teams that use them.

## Step 2: let people build on it

The **Build** permission on a semantic model controls who can create new content from it: reports, Excel workbooks through **Analyze in Excel**, and other tools. Grant it to the groups that should author reports, rather than making them workspace members.

Report authors then connect from Power BI Desktop with **Get data > Power BI semantic models** (or from the **OneLake catalog** in the Power BI service). This creates a **live connection**. The report uses the model where it lives, without copying it, and gets every measure and relationship already defined.

Row-level security defined on the model still applies. A report author with a live connection sees only the data their security role allows.

## Step 3: mark it as official

Power BI has two levels of **endorsement**, which show as badges wherever people look for data:

- **Promoted:** the owner, or anyone with write access to the workspace, says this is ready for others to use.
- **Certified:** the model meets the organisation's quality standards. Only reviewers chosen by a Power BI administrator can certify, and an administrator has to turn certification on first.

Endorsed models appear first in search and can be filtered with **Endorsed in your org**. Agree what certification means in your organisation (tested measures, a named owner, documented refresh), and certify only models that meet it.

## Step 4: allow extensions without forks

Sometimes a team needs the shared model plus something of their own, such as departmental targets from a spreadsheet. Instead of copying the whole model, they can use a **DirectQuery connection to the Power BI semantic model**:

- **It creates a local model.** Converting the live connection builds a local model that still reads the shared one remotely.
- **It can add to the shared model.** New tables and relationships can be added alongside it.
- **The shared measures stay the same.** They're still defined in one place.

If a model must not be extended this way, its owner can set the **Discourage DirectQuery connections** property in Power BI Desktop.

> [!WARNING]
> Extensions are a pressure valve, not the default. If many teams add the same table, it belongs in the shared model. Review extensions regularly and bring the common ones back into the centre.

## Licensing to check

The pattern works in any capacity, but some actions need licences. Microsoft's documentation lists these:

- **Connecting to shared models is available to anyone.** It isn't restricted to Premium.
- **Promoting or certifying a model** requires a Pro or Premium Per User licence.
- **Copying reports** between workspaces, or from an app, also requires Pro or Premium Per User.
- **Users with no Pro or PPU licence** can author reports from a shared model only if it's on Premium or Fabric F64-or-higher capacity and they have Build permission. Even then, they can save those reports only to **My workspace**, and can't share them.

Check the current licensing documentation for your tenant before planning who does what.

## How many models?

One model for the whole organisation is rarely practical, and one model per report is the problem you started with. Aim for **one model per subject area** (sales, finance, HR, operations), each with a named owner. Create a new model only when the data, the audience or the security rules are genuinely different.

## Checklist

- Each shared model is published without report pages, to a workspace for models.
- Report authors get **Build** permission, not workspace membership.
- Reports connect live; nobody re-imports the same data.
- Official models are promoted or certified against written criteria.
- Extensions use DirectQuery to the shared model and are reviewed regularly.
- Every model has a named owner and a subject area.

The steps follow Microsoft's documented behaviour for shared semantic models, Build permission, endorsement and composite models in Power BI.

## Sources

- [Introduction to semantic models across workspaces (Microsoft Learn)](https://learn.microsoft.com/power-bi/connect-data/service-datasets-across-workspaces)
- [Connect to semantic models in the Power BI service from Power BI Desktop (Microsoft Learn)](https://learn.microsoft.com/power-bi/connect-data/desktop-report-lifecycle-datasets)
- [Promote and certify Power BI content (Microsoft Learn)](https://learn.microsoft.com/power-bi/collaborate-share/service-endorsement-overview)
- [Power BI usage scenarios: customizable managed self-service BI (Microsoft Learn)](https://learn.microsoft.com/power-bi/guidance/powerbi-implementation-planning-usage-scenario-customizable-managed-self-service-bi)
