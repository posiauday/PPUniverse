---
title: "Cloud flow, agent flow or desktop flow? Which one to build"
slug: cloud-agent-or-desktop-flow
type: COMPARISON
technology: POWER_AUTOMATE
topic: choose-the-tool
excerpt: "Three kinds of flow, three ways to pay. What each is for, how it's licensed or billed, what it can't do, and a quick way to pick: connectors and APIs, an agent's tools, or clicking through an app that has no API."
searchPhrase: "agent flow vs cloud flow"
---
Power Automate cloud flows, Copilot Studio agent flows and Power Automate desktop flows all automate steps, and from a distance they look alike. They're licensed differently, managed in different places, and each has things it can't do. Choose before you build, because switching later isn't always possible.

> [!NOTE]
> Checked against Microsoft Learn on 6 October 2026.

## The short answer

- **The systems have connectors or an API?** Build a **cloud flow**.
- **The automation is a tool your Copilot Studio agent calls,** or you want it billed per use instead of per user? Build an **agent flow**.
- **The only way in is the screen** (an old desktop app, a website with no API, a terminal)? Build a **desktop flow**, and usually start it from a cloud flow.

## Side by side

| | **Cloud flow** | **Agent flow** | **Desktop flow** |
| --- | --- | --- | --- |
| Built in | Power Automate | Copilot Studio | Power Automate for desktop |
| Runs | In the cloud | In the cloud | On a Windows machine you register |
| Talks to systems through | Connectors and APIs | Connectors and APIs | The user interface: clicks, typing, screen reading |
| Paid for by | Power Automate licences: the owner's or runner's licence, or a Process licence for the flow | **Copilot Studio capacity:** Copilot Credits per action run. No individual licence needed | Premium licence for **attended** runs; Process licence (or an add-on) for **unattended** runs |
| Premium connectors | Need Premium or Process | Included | Not applicable |
| Sharing, co-owners, run-only users | Yes | **No.** Agent flows can't be copied, shared, co-owned or given run-only users | Yes |
| Must be in a solution | Recommended | Yes | Recommended |
| Call a desktop flow | Yes | **No**, not currently | Can call other desktop flows |

## Cloud flows

The default choice for connecting services: "when an item is added, notify someone, update a record, file the attachment".

- **Licensing:** Microsoft 365 licences cover **standard** connectors. A flow that uses **premium** connectors needs the right licence: the owner's for automated and scheduled flows, and **each person who runs it** for instant flows. Alternatively, give the flow a **Process** licence.
- **Strengths:** sharing, co-owners, run-only users, child flows, and a huge connector catalogue.

## Agent flows

Flows built in Copilot Studio, aimed at agents and business processes.

- **How they're billed:**
  - each run consumes Copilot Studio capacity for **every action it executes**, billed as "agent flow actions" (Microsoft's rate table lists **13 Copilot Credits per 100 actions**);
  - nobody needs a Power Automate licence;
  - runs triggered by an agent for a user with a **Microsoft 365 Copilot** licence aren't charged;
  - test runs, from the designer or the agent's test chat, don't use capacity.
- **When capacity runs out:** **new runs are blocked** in that environment until capacity is added or pay-as-you-go is turned on. Runs already in progress finish normally. Watch usage in the Power Platform admin center under **Licensing → Copilot Studio**.
- **To use one as an agent tool:** it needs the **When an agent calls the flow** trigger and a **Respond to the agent** action.
- **AI steps cost more:** prompts and AI models in agent flows always use Copilot Credits, even in tests.

> [!WARNING]
> You can **convert a cloud flow into an agent flow** (in a solution, by changing its plan to **Copilot Studio**). It's **one-way**. You can't change it back, and it then loses sharing and run-only users. Check that before converting a flow other people run.

## Desktop flows

Robotic process automation (RPA): the flow clicks and types through applications as a person would.

- **Use it only when there's no connector or API.** UI automation breaks when screens change, and it needs a machine, a Windows session and credentials.
- **Attended or unattended:**
  - *attended* runs use the signed-in user's session and need a Premium licence;
  - *unattended* runs sign in on their own and need a Process licence or an unattended add-on.

  The details, and the errors that go with them, are in [Desktop flow won't run from the cloud](/learn/desktop-flow-connection-not-found).
- **Start it from a cloud flow,** which handles the trigger, the data and the notifications, and keep the desktop flow to the screen work alone.

## Mixed designs that work

- **A cloud flow plus a desktop flow:** the cloud flow receives the request, then calls the desktop flow to type it into the old system.
- **An agent plus an agent flow:** the agent talks to the user, and the agent flow does the dependable, step-by-step part, such as creating the record or sending the approval.
- **An agent plus a cloud flow:** keep a cloud flow when its people need to share and co-own it. For an agent to call a flow directly, the flow needs to be an agent flow.

## Sources

- Microsoft Learn: [Agent flows FAQ](https://learn.microsoft.com/microsoft-copilot-studio/flows-faqs)
- Microsoft Learn: [Agent flows overview: capacity and converting a cloud flow](https://learn.microsoft.com/microsoft-copilot-studio/flows-overview)
- Microsoft Learn: [Copilot Studio billing rates and management](https://learn.microsoft.com/microsoft-copilot-studio/requirements-messages-management#copilot-credits-billing-rates)
- Microsoft Learn: [Licensing and Copilot Credits for AI tools](https://learn.microsoft.com/ai-builder/message-management#copilot-credit-consumption-rules)
- Microsoft Learn: [Power Automate licensing FAQ](https://learn.microsoft.com/power-platform/admin/power-automate-licensing/faqs)
- Microsoft Learn: [Troubleshoot triggers: licences for shared flows](https://learn.microsoft.com/troubleshoot/power-platform/power-automate/flow-run-issues/triggers-troubleshoot#users-can't-run-shared-flows,-but-owner-can-run-the-flow)
- Microsoft Learn: [Types of Power Automate licenses: RPA entitlements](https://learn.microsoft.com/power-platform/admin/power-automate-licensing/types#license-entitlements)
