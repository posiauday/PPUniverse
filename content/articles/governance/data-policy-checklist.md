---
title: "Data policy (DLP) checklist: design, roll out and support Power Platform data policies"
slug: data-policy-checklist
type: REFERENCE
technology: GOVERNANCE_ADMIN
topic: data-policies
excerpt: "How Power Platform data policies decide what makers can connect, the rules that surprise admins (combined policies, unblockable connectors, HTTP and child flows), a safe rollout checklist, and what to do when a policy suspends a flow."
searchPhrase: "power platform dlp policy"
---
Data policies (still widely called **DLP policies**) decide which connectors can be used together in an app, flow or agent, and which can't be used at all. Done well, they stop company data quietly flowing to personal services without slowing makers down. Done badly, one change suspends dozens of flows overnight. This page is the admin's reference for doing it well.

> [!NOTE]
> Checked against Microsoft Learn on 6 October 2026.

## How a data policy works

Every connector in a policy sits in exactly one of three groups.

| Group | Meaning |
| --- | --- |
| **Business** | Can be used with other Business connectors, never with Non-business ones, in the same app, flow or agent |
| **Non-business** | Can be used with other Non-business connectors, never with Business ones |
| **Blocked** | Can't be used at all where the policy applies |

The labels mean nothing in themselves. What matters is that the two groups can't be mixed. A typical setup puts SharePoint, Outlook, Teams, Dataverse and SQL Server in **Business**, so nobody can build a flow that copies them into a personal storage or social media connector.

**The rules that apply everywhere:**
- **No policy by default.** A new tenant has no data policies at all; everything is allowed until you create one.
- **Policies apply to environments, not people.** You scope a policy to the whole tenant, to chosen environments, or to all except some. You can't target users.
- **Policies stack, and the strictest wins.** All policies that apply to an environment are evaluated together. If *any* of them blocks a connector, it's blocked there, whatever the others say. An environment policy can't loosen a tenant policy.
- **Connectors, not connections.** A policy can allow SharePoint, but it can't tell a test site from a production site. For that, use connector endpoint filtering (below) or your environment strategy.

## Rules that surprise admins

- **Some connectors can't be blocked.** Microsoft-owned standard connectors, such as the Microsoft 365 ones and core Power Platform connectors, can only be Business or Non-business.
  - In **advanced connector policies** on **Managed Environments**, you *can* block any connector or action, including these.
- **New connectors land in the default group.** That's **Non-business** unless you change it. Microsoft recommends keeping it, then moving each new connector deliberately once you've judged it. If you set the default to Blocked, new unblockable connectors still go to Non-business.
- **The HTTP connector affects child flows.** Child flows depend on the **HTTP** connector internally, so where you put HTTP decides whether makers can run child flows in that environment.
  - If you don't want HTTP as Business in the shared **default** environment, make it Non-business or block it there.
  - Then give makers who need child flows a dedicated environment.
- **Custom connectors are handled separately.**
  - Environment policies list them alongside other connectors.
  - Tenant policies classify them by **URL pattern**. The final `*` rule is **Ignore** by default, which lets custom connectors mix with both groups until you set it.
- **Copilot Studio is covered too.** Agents are subject to data policies in real time. Copilot Studio's own connectors, such as **Chat without Microsoft Entra ID authentication** or **Direct Line channels**, usually land in Non-business, which can block publishing without anyone expecting it.
- **What PowerShell shows differs.** The admin center shows every connector; PowerShell and the admin connector show only the explicitly classified ones, and may still list connectors that have since been retired.

## Finer controls

| Control | What it does | Where it applies |
| --- | --- | --- |
| **Connector action control** | Allow or block individual actions and triggers in a connector, such as allowing "Get items" but blocking "Delete item". Set a default for actions Microsoft adds later | Blockable connectors only, not unblockable or custom ones |
| **Connector endpoint filtering** (preview) | Allow or deny specific endpoints, such as one SQL server or certain URLs | HTTP, HTTP with Entra ID, HTTP Webhook, SQL Server, Azure Blob Storage, SMTP, Browser Automation, UI Automation |
| **Advanced connector policies** | An allow-list model: everything is blocked unless allowed, at connector and action level, including MCP servers | Certified connectors; not yet custom or HTTP connectors |

> [!WARNING]
> Endpoint filtering checks only **fixed** endpoints entered in the designer. Endpoints built at run time, taken from environment variables or typed in as custom inputs aren't checked.

## Rollout checklist

Before you change a policy that makers already depend on:

1. **Take an inventory.** Know which apps, flows and agents use the connectors you're moving, for example from the admin center's inventory or the CoE toolkit.
2. **Pilot it.** Apply the change to a test environment first, and keep the default environment's policy until you've seen the impact.
3. **Warn the owners of affected resources,** with the date and what they need to change.
4. **Set the admin contact and help link** that appear in data policy error messages (set with PowerShell), so makers who hit a block know who to ask.
5. **Expect a delay.** Policy changes are picked up by a background process, not instantly. Watch for suspended flows over the next day.
6. **Have a support process.** Decide who reviews requests to reclassify a connector and how quickly they respond.

## When a policy blocks something

| What makers see | What it means | What to do |
| --- | --- | --- |
| Power Apps: "Using these connections together conflicts with the company data loss prevention policies" | The app mixes Business and Non-business connectors, or uses a blocked one | Remove or replace the conflicting connector, or ask the admin to reclassify it |
| Power Apps: "It looks like this app isn't compliant with the latest data loss prevention policies" | A policy changed after the app was built | Same as above. The app won't open until it's resolved |
| Power Automate: the flow saves but is marked **Suspended** | The flow breaks a policy, either when it was saved or after a policy change | Open the flow checker, fix the connector combination, then turn the flow back on |
| Several flows broke at once and nobody edited them | A policy changed | Check with your admin which policy changed. This is the most common cause of mass failures |
| Copilot Studio: publishing is blocked by a data policy | A tool, knowledge source or channel connector is blocked or in the wrong group | Check the **Review** panel; ask the admin to move the Copilot Studio connector into the right group |

## Sources

- Microsoft Learn: [Implement a data policy strategy](https://learn.microsoft.com/power-platform/guidance/adoption/dlp-strategy)
- Microsoft Learn: [Connector classification](https://learn.microsoft.com/power-platform/admin/dlp-connector-classification)
- Microsoft Learn: [Combined effect of multiple data policies](https://learn.microsoft.com/power-platform/admin/dlp-combined-effect-multiple-policies)
- Microsoft Learn: [Manage data policies](https://learn.microsoft.com/power-platform/admin/prevent-data-loss)
- Microsoft Learn: [Impact of data policies on apps and flows](https://learn.microsoft.com/power-platform/admin/dlp-impact-policies-apps-flows)
- Microsoft Learn: [Connector action control](https://learn.microsoft.com/power-platform/admin/connector-action-control)
- Microsoft Learn: [Connector endpoint filtering (preview)](https://learn.microsoft.com/power-platform/admin/connector-endpoint-filtering)
- Microsoft Learn: [Advanced connector policies](https://learn.microsoft.com/power-platform/admin/advanced-connector-policies)
- Microsoft Learn: [Configure data policies for agents](https://learn.microsoft.com/microsoft-copilot-studio/admin-data-loss-prevention)
