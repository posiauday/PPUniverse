---
title: "Why did I get a Dataverse capacity email? What it means and what to do"
slug: dataverse-capacity-email
type: TUTORIAL
technology: GOVERNANCE_ADMIN
topic: licensing
excerpt: "Weekly 'running low' or 'over capacity' emails about Dataverse storage, often in tenants that never meant to use Dataverse. Where the usage comes from, how borrowing between database, file and log works, what's blocked when you're over, the new sandbox restrictions, and how to get back under."
searchPhrase: "dataverse storage capacity"
---
Many admins, and even makers, get a weekly email saying Dataverse storage is **running low** or **over capacity**, sometimes in a tenant that "doesn't use Dataverse". Here's what triggers it, what really happens if you ignore it, and how to fix it.

> [!NOTE]
> Checked against Microsoft Learn on 6 October 2026.

## Why you got it

The email and a banner appear when your tenant's Dataverse **database**, **file** or **log** storage:
- has **less than 15%** left (informational);
- has **less than 5%** left (warning);
- is **over** what you're entitled to (critical).

Notes on who gets it:
- It goes **weekly** to global admins, Power Platform admins, Dynamics 365 admins, system admins and makers.
- **You can't opt out** or redirect it.
- **"But we don't use Dataverse"**: features often create a Dataverse database quietly. **Approvals** in Power Automate is the classic example: the first approval in an environment sets up Dataverse to store it. Every **environment** also counts as **1 GB**, whether it has a database or not.

## Read the capacity page

Go to **Power Platform admin center → Licensing → Capacity** (or **Resources → Capacity**).

- **Entitled versus consumed** is shown for database, file and log, from your licences plus any add-ons.
- **Borrowing:** before counting you as "over", Microsoft lets one type borrow unused space from another, in eligible combinations. Notifications use this **effective** figure.
- **Zero-GB environments:** Teams, trial, preview, support and developer environments don't count, and show as 0 GB.
- **The default environment** includes **3 GB database, 3 GB file and 1 GB log** of its own. The report shows only what it uses **above** that.

Select **Details** to see which environments, and which tables, use the space.

> [!TIP]
> An environment can be blocked from operations like **copy** or **restore** even when the tenant shows no overall deficit. Those operations need free space in the **specific** storage type, without borrowing.

## What happens when you're over

**While you're over** (any tenant):
- You can't **create**, **copy**, **restore** or **recover** environments, or **convert** a trial to paid (each needs at least 1 GB free).
- You can't **add a Dataverse database** to an environment.
- Apps, flows and data keep working. Microsoft says exceeding storage doesn't currently affect service availability, but its licence terms still require you to be licensed for what you use.

**The new storage validation**, announced in September 2026 and rolling out per Microsoft's Message center, adds stages for **Dataverse-only** tenants (Dynamics 365 Sales, Customer Service and similar, without finance and operations):

| Stage | When | Effect |
| --- | --- | --- |
| Early notice | Over 85% effective use | Notifications |
| 1. Restricted | You first go over 100% | Environment create, copy, restore and recover are blocked |
| 2. Administration mode | Still over after **30 days** | Affected **sandbox** environments are limited to admins |
| 3. Disabled | Still over after **60 days** | Nobody can sign in to affected **sandboxes**, admins included. Data is kept |

**Production environments** don't enter administration mode or get disabled, and nor do **sandboxes with pay-as-you-go** billing.

## How to get back under

1. **Find the biggest users.** Open the capacity **Details**, then the environment's capacity analytics, and sort tables by size.
2. **Free up space.** Microsoft's *Free up storage space* guide lists methods per table:
   - **database:** completed system jobs and workflow logs (**AsyncOperationBase**, **WorkflowLogBase**), old imports and duplicate-detection jobs, activity and email records, trace logs, and tables you don't need in **Dataverse search**;
   - **file:** email attachments and notes with attachments;
   - **log:** **audit logs** and plug-in trace logs.

   Use **bulk deletion jobs** for most of these. Where it's rolling out, the **Dataverse storage advisor** in **Licensing → Dataverse** suggests what to clean up, and can move old data to **long-term retention** instead of deleting it. Storage figures can take up to **72 hours** to update.
3. **Delete environments nobody uses,** remembering each counts 1 GB. Check with their owners first.
4. **Buy capacity add-ons** for steady growth, or link environments to **pay-as-you-go** (Azure billing) for variable use.
5. **Short on time?** Admins can request a one-time **45-day capacity extension**. It's temporary and doesn't fix the cause.

Moving allocated capacity between environments **doesn't** fix a **tenant** overage, because it only moves what you already have.

## Prevent the next one

- Govern who can create environments, and clean up trials and sandboxes regularly.
- Set **capacity alerts** per environment, for example with the CoE Starter Kit's capacity alerting. These are soft limits for reporting.
- Audit only the tables you need, and delete old audit logs on a schedule.
- Keep plug-in trace logging **off** in production.

## Sources

- Microsoft Learn: [Dataverse capacity-based storage details: notifications, overage lifecycle, scope, FAQ](https://learn.microsoft.com/power-platform/admin/capacity-storage)
- Microsoft Learn: [What's new in storage](https://learn.microsoft.com/power-platform/admin/whats-new-storage)
- Microsoft Learn: [Extend Dataverse capacity for 45 days](https://learn.microsoft.com/power-platform/admin/extend-capacity)
- Microsoft Learn: [Free up storage space](https://learn.microsoft.com/power-platform/admin/free-storage-space)
- Microsoft Learn: [Delete completed system jobs and process logs](https://learn.microsoft.com/power-platform/admin/cleanup-asyncoperationbase-table)
- Microsoft Learn: [Legacy storage capacity](https://learn.microsoft.com/power-platform/admin/legacy-capacity-storage)
- Microsoft Learn: [CoE Starter Kit: environment capacity alerting](https://learn.microsoft.com/power-platform/guidance/coe/capacity-alerting)
