---
title: "Move a cloud flow into a solution, and fix 'missing dependencies' on import"
slug: move-flow-into-solution-missing-dependencies
type: TUTORIAL
technology: POWER_AUTOMATE
topic: run-and-monitor
excerpt: "Why flows belong in solutions, how to add existing flows (one at a time or in bulk), what to set up so they deploy cleanly, and how to read and fix 'Import failed due to missing dependencies'."
searchPhrase: "move flow to solution missing dependencies"
---
A flow built straight in **My flows** works fine until you need to move it to test or production, hand it to someone else, or call it from an agent. Then you need it in a **solution**: a package of the flow and everything it depends on, which is how Power Platform moves work between environments. This guide covers getting flows in, and getting solutions to import.

> [!ANSWER] Quick answer
> 1. [Add the flow from **Solutions**](#add-an-existing-flow-to-a-solution): **Add existing → Automation → Cloud flow**, on the **Outside Dataverse** tab.
> 2. [Use connection references and environment variables](#make-it-deploy-cleanly) before the first export, and keep child flows in the same solution.
> 3. [Missing dependencies on import?](#import-failed-due-to-missing-dependencies) Select **Show dependencies**, then add or install what the target lacks.

> [!NOTE]
> Checked against Microsoft Learn on 6 October 2026.

## Why bother

Flows in solutions ("solution-aware" flows) can:
- move between environments **with their dependencies**, by exporting and importing the solution, or through pipelines;
- use **connection references**, so each environment plugs in its own connections at import time;
- use **environment variables** for values that change per environment, such as a site URL or an email address, instead of hard-coding them;
- **change owner in place**. A flow outside a solution can't, because its owner is part of its identity;
- be used by **Copilot Studio agents**, which need flows to be in a solution.

> [!TIP]
> New environments with Dataverse create new cloud flows **inside solutions** by default. Admins can check this under **Settings → Product → Features → Create new canvas apps and cloud flows in Dataverse solutions**.

## Add an existing flow to a solution

1. In Power Automate, go to **Solutions** and open your solution, or create one with your own **publisher**.
2. Select **Add existing → Automation → Cloud flow**.
3. Choose the **Outside Dataverse** tab for flows not yet in any solution. Flows already in other solutions are on **From Dataverse**.
4. Select the flow and select **Add**.

**To move many flows at once,** an admin can run the PowerShell cmdlet `Add-AdminFlowsToSolution` to move some or all flows outside solutions in an environment.

Some flows outside solutions can't be added. Microsoft lists these cases under the solution's known limitations.

## Make it deploy cleanly

Before the first export:

- **Connection references:**
  - check the solution's **Connection References** and that each flow action uses one;
  - on import, you'll pick or create a connection for each reference in the target environment;
  - an unmapped reference makes actions fail with **ConnectionNotConfigured**.
- **Environment variables:** replace hard-coded values such as site URLs, list names, recipients and IDs with environment variables, and set each environment's value at import time.
- **Child flows:** add any child flow the parent calls to the **same** solution.
- **Only what you use:** add only the parts of a table you actually changed (specific columns, views, forms), not the whole table. Whole tables drag in extra dependencies and layers.

## "Import failed due to missing dependencies"

The solution refers to something that exists in the source environment but not in the target. Select **Show dependencies**. The page groups the missing items into three sections.

| Section | It means | Fix |
| --- | --- | --- |
| **Applications** | A Dynamics 365 or Microsoft app is missing or older in the target | Install or update it (an admin can use the **Install** / **Update** buttons). For first-party apps, the **Deploy Dependencies** option can install them and then import |
| **Managed Solutions** | Your solution builds on another managed solution the target doesn't have | Import **the same version** of that solution into the target first |
| **Unmanaged Components** | Something you customized in the source but didn't include, such as a column, view or form | Go back to the source, **add those components to your solution**, export again, and import |

> [!TIP]
> Not sure what's missing? Unzip the solution file and open `solution.xml`. The `<MissingDependencies>` element lists each required component by name and ID.

**Other import errors and warnings:**
- **"There was an error calculating dependencies … Missing component id [GUID]":** search `solution.xml` for that GUID to find the component's name, then add it to the solution or to the target.
- **Version warning** ("exported from an environment with a more recent version of Dataverse"): the target is behind the source. You *can* continue, but missing components are likely, so keep development, test and production on the same versions.
- **A managed solution can only depend on managed components.** If you import as managed, everything it needs must also be managed in the target.

## Habits that prevent it

- **Build in a development environment, in an unmanaged solution,** and deploy to test and production as **managed** solutions.
- **Don't edit managed components** directly in test or production. That creates an unmanaged layer that hides future updates.
- **Keep environments on the same versions,** and install standard first-party solutions everywhere before importing ones that depend on them.
- **Avoid dependencies on deprecated apps.** They can't be installed in a new environment.

## Sources

- Microsoft Learn: [Create a cloud flow in a solution: add an existing flow](https://learn.microsoft.com/power-automate/create-flow-solution#add-an-existing-cloud-flow-into-a-solution)
- Microsoft Learn: [Understand the benefits of solution-aware cloud flows](https://learn.microsoft.com/power-automate/guidance/coding-guidelines/understand-benefits-solution-aware-flows)
- Microsoft Learn: [Add canvas apps and cloud flows to a solution by default](https://learn.microsoft.com/power-apps/maker/canvas-apps/add-app-solution-default)
- Microsoft Learn: [Create and use environment variables in flows](https://learn.microsoft.com/power-automate/environment-variables)
- Microsoft Learn: [Change the owner of a cloud flow](https://learn.microsoft.com/power-automate/change-cloud-flow-owner)
- Microsoft Learn: [Missing dependencies error during solution import](https://learn.microsoft.com/troubleshoot/power-platform/dataverse/working-with-solutions/missing-dependency-on-solution-import)
- Microsoft Learn: ["Error calculating dependencies … missing component id"](https://learn.microsoft.com/troubleshoot/power-platform/dataverse/working-with-solutions/an-error-calculating-dependencies)
- Microsoft Learn: [Environment version mismatch warning](https://learn.microsoft.com/troubleshoot/power-platform/dataverse/working-with-solutions/version-mismatch-on-solution-import)
- Microsoft Learn: [Dependency tracking for solution components](https://learn.microsoft.com/power-platform/alm/dependency-tracking-solution-components)
- Microsoft Learn: [Modify an existing flow to use with an agent](https://learn.microsoft.com/microsoft-copilot-studio/flow-modify-use-with-agent)
