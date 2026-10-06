---
title: "Copilot Studio licensing and Copilot Credits: who needs a licence, and what uses credits"
slug: copilot-studio-licensing-and-credits
type: REFERENCE
technology: COPILOT_STUDIO
topic: monitor-and-cost
excerpt: "Makers need a licence; the people chatting with your agent usually don't. How Copilot Credits are bought and spent, what each feature costs, what's free for Microsoft 365 Copilot users, how the GitHub Copilot harness bills differently, and what happens when credits run out."
---
Two questions come up again and again: **"Does everyone who uses my agent need a licence?"** and **"Why did we run out of credits?"** The short answers are *usually not*, and *because credits pay for activity, not people*. Here are the details.

> [!NOTE]
> Checked against Microsoft Learn on 6 October 2026. Microsoft's Copilot Studio Licensing Guide is the final word on prices and terms.

## Who needs what

| Person | Needs |
| --- | --- |
| **People who build and publish agents** | One of: a **Copilot Studio user licence** (free, but your tenant needs a prepaid Copilot Credit pack subscription first); the **Copilot Studio authors** role set in the Power Platform admin center; or a **Microsoft 365 Copilot** licence |
| **Trial users** | Can build and test, but **can't publish** |
| **People who chat with a published agent** | **No special licence.** Anyone who can reach the published agent can use it. Their usage is paid for with your tenant's **Copilot Credits** |
| **Guest users of your tenant** | Can't use Copilot Studio to build |

**Can't publish?** You need one of these:
- a Microsoft 365 Copilot licence;
- a Copilot Studio user licence, plus credits allocated to the environment, or "draw from tenant pool" turned on;
- an Office licence only, if the agent uses no generative AI features.

## How to get credits

- **Prepaid Copilot Credit packs:** a monthly subscription, bought in the Microsoft 365 admin center. **Unused credits don't carry over**, and usage resets on the **1st of each month**, not on your purchase date.
- **Pay-as-you-go:** link an environment to an Azure subscription with a billing policy, and pay monthly for what's used.
- **Copilot Credits prepurchase plan:** a one-year prepaid pool bought in the Azure portal.

Allocate credits to environments in the Power Platform admin center, under **Licensing → Copilot Studio**.

## What uses credits (standard harness)

| Activity | Copilot Credits | For Microsoft 365 Copilot licensed users |
| --- | --- | --- |
| Classic answer (a scripted topic reply) | 1 | No charge |
| Generative answer | 2 | No charge |
| Agent action (tool or connector call) | 5 | No charge |
| Tenant graph grounding (Microsoft 365 data) | 10 | No charge |
| Agent flow actions | 13 per 100 actions | No charge only when the flow is started by an agent for such a user |
| AI tools (prompts) | From 1 credit per 10 basic responses, up to 100 per 10 premium responses | No charge |
| Document processing | 8 per page | No charge |

One answer can combine several lines. For example, a grounded generative answer can cost 10 + 2 = **12 credits**. Reasoning models add a premium token charge on top.

**Free:**
- the embedded **test chat** and agent-flow test runs;
- agents used in **Copilot Chat, Teams or SharePoint** by people with a **Microsoft 365 Copilot** licence, for classic answers, generative answers and tenant graph grounding;
- agents built **inside Teams** with Copilot Studio for Teams.

**Watch for:**
- a **proactive greeting** costs credits even if the user never replies;
- AI prompts and models in **agent flows** cost credits even in tests.

## The GitHub Copilot harness bills differently

Agents, workflows and apps built on the newer **GitHub Copilot harness** use usage-based billing:
- credits pay for model tokens, tools (including knowledge and MCP) and the harness itself;
- **billing starts while you build**, including natural-language building, previews, tests and evaluations;
- see the agent's credits on its **Monitor** page.

The standard harness bills only after you publish.

## When credits run out

- Capacity is **enforced monthly**. Over your purchased capacity, **service can be denied** until you add credits.
- For **agent flows**, **new runs are blocked** when the environment's prepaid capacity is used up. Runs already going finish normally. Microsoft 365 Copilot users and test runs aren't affected.
- **To avoid surprises:**
  - set **monthly limits per agent** (**Licensing → Copilot Studio → Manage agents**);
  - turn on **pay-as-you-go** as overflow;
  - estimate first with Microsoft's **agent usage estimator**.

## Sources

- Microsoft Learn: [Licensing for agents powered by the standard harness](https://learn.microsoft.com/microsoft-copilot-studio/billing-licensing)
- Microsoft Learn: [Assign licenses and manage access to Copilot Studio](https://learn.microsoft.com/microsoft-copilot-studio/requirements-licensing)
- Microsoft Learn: [Billing rates and management](https://learn.microsoft.com/microsoft-copilot-studio/requirements-messages-management#copilot-credits-billing-rates)
- Microsoft Learn: [FAQ for Copilot Studio billing and licensing](https://learn.microsoft.com/microsoft-copilot-studio/faq-billing-licensing)
- Microsoft Learn: [Usage-based billing for the GitHub Copilot harness](https://learn.microsoft.com/microsoft-copilot-studio/agents-experience/billing-credit-overview)
- Microsoft Learn: [Agent flows overview: capacity](https://learn.microsoft.com/microsoft-copilot-studio/flows-overview)
