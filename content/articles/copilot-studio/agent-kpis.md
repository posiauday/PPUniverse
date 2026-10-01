---
title: "Agent KPIs: resolution rate, escalation rate and answer quality"
slug: agent-kpis
type: KPI_GUIDE
technology: COPILOT_STUDIO
excerpt: "Session counts show an agent is being used, not that it helps. How Copilot Studio defines resolution, escalation and abandonment, the traps in those definitions, and how to measure answer quality and value honestly."
---
> [!NOTE]
> **As of September 2026.** Copilot Studio analytics change often, and some reports differ between agents using generative orchestration and classic agents. The definitions below come from Microsoft's documentation at the time of writing.

"How many conversations did it have?" is the first thing anyone asks about an agent, and the least useful answer. An agent can have thousands of sessions and resolve almost none of them. This guide covers the KPIs Copilot Studio gives you, what each one really measures, and how to add the two things the dashboard can't tell you on its own: answer quality and value.

## The built-in KPIs

Copilot Studio records analytics from an agent's first conversation. For conversational agents, the core KPIs are:

| KPI | What Microsoft counts |
| --- | --- |
| **Total sessions** | Analytics sessions in the period. One conversation can produce several sessions, because a new session starts when the user asks something new after a conversation completes. |
| **Engagement rate** | The share of sessions that triggered a custom topic, Escalate, Fallback or Conversational Boosting. |
| **Resolution rate** | The share of **engaged** sessions that reached a resolved outcome, confirmed or implied. |
| **Escalation rate** | The share of engaged sessions handed off through Escalate or a Transfer conversation node. |
| **Abandon rate** | The share of engaged sessions that ended without resolution or escalation after 60 minutes. |
| **CSAT** | The average score (1 to 5) from the End of Conversation survey. |

Note the denominator: resolution, escalation and abandon rates are shares of **engaged** sessions, not of all sessions. An agent with a high resolution rate and a low engagement rate is resolving a small slice of what people ask.

For **autonomous agents**, which run on triggers rather than chat, the analytics report run outcomes, trigger use, tool use and knowledge source use instead.

## Traps in the definitions

### "Resolved" includes "implied"

A **confirmed** resolution happens when the End of Conversation topic runs and the user confirms their question was answered. An **implied** resolution happens when the session ends without that confirmation, but the agent's logic treats it as resolved.

Microsoft recommends designing conversations to finish with the End of Conversation topic, so more outcomes are confirmed and users get the chance to give a CSAT score. Until you do, read the resolution rate as an upper bound.

### Escalation isn't always failure

For some agents, handing off is the right answer: a sensitive HR case, a complaint, a request that needs approval. Split escalations by reason. An escalation you designed is success; an escalation because the agent didn't understand is a gap.

### Topic analytics depend on the agent type

The per-topic **Monitor** panel, which shows outcomes and satisfaction for each topic, is only available for agents in classic mode. For agents that use generative orchestration, Microsoft points you to **conversation outcomes** and **themes** instead. Themes group users' questions by subject, which is often more useful than topics for spotting what the agent can't answer.

## Measuring answer quality

Resolution tells you the conversation ended well. It doesn't tell you the answer was right. Add these:

- **Reactions:** the thumbs-up and thumbs-down users give on individual answers, with optional comments. They're kept for 28 days, so export or review them regularly.
- **Generated answer rate and quality:** reports that surface questions the agent couldn't answer and the quality of the answers it gave.
- **Evaluation test sets:** the same set of real questions run against the agent on a schedule, scored for relevance, groundedness and completeness. Unlike live traffic, this gives a like-for-like trend: if the score drops after a change, the change caused it.

> [!TIP]
> Build your evaluation set from real questions: pull them from the themes report and from thumbs-down comments. A test set written before launch tests what you expected people to ask. One built from traffic tests what they actually ask.

## Measuring value

Microsoft's guidance on agent value starts with a baseline captured **before** go-live:

- volume of requests by channel and by type;
- handle time for those requests, reported as a median and 90th percentile rather than an average;
- the cost per hour of the people handling them today;
- current satisfaction scores.

With a baseline, two measures follow:

- **Deflection rate:** the share of requests resolved through self-service instead of reaching a person. Each organisation defines it slightly differently; write your definition down, including whether abandoned sessions count.
- **Savings:** Copilot Studio can report time and cost savings for successful runs, from a per-run or per-tool value that the agent owner enters. The number is only as good as that input, so base it on your measured handle times and keep the assumption visible.

> [!WARNING]
> Don't count every resolved session as a request taken off the service desk. Many questions people ask an agent are ones they would never have raised as a ticket. Deflection claims need the baseline: did ticket volume for those request types actually fall?

## A monthly review

Microsoft suggests reviewing agent performance monthly. A practical agenda:

1. **Engagement, resolution and escalation rates**, with the trend from last month, split by channel.
2. **The themes with the lowest resolution**, and the three to fix next.
3. **Thumbs-down comments and CSAT verbatims.**
4. **The evaluation test set score** after the month's changes.
5. **Deflection and savings** against the baseline.

## Checklist

- Everyone reading the dashboard knows resolution and escalation rates are shares of engaged sessions.
- Conversations end with the End of Conversation topic where possible, so resolutions are confirmed.
- Escalations are split into designed and unplanned.
- Answer quality is tracked with reactions and a scheduled evaluation test set.
- A pre-launch baseline exists, and deflection and savings are measured against it.

The KPI definitions follow Microsoft's documentation for Copilot Studio analytics as of September 2026. The review agenda and the advice on reading the numbers are our own recommendations.

## Sources

- [Measure and improve agent performance with KPIs and analytics (Microsoft Learn)](https://learn.microsoft.com/microsoft-copilot-studio/guidance/analytics)
- [Deflection overview (Microsoft Learn)](https://learn.microsoft.com/microsoft-copilot-studio/guidance/deflection-overview)
- [Communicate the value story to stakeholders (Microsoft Learn)](https://learn.microsoft.com/microsoft-copilot-studio/guidance/agent-business-value-tell-value-story)
- [Use case blueprints for measuring agent value (Microsoft Learn)](https://learn.microsoft.com/microsoft-copilot-studio/guidance/agent-business-value-use-case-blueprints)
- [Monitor overview: topic usage analytics (Microsoft Learn)](https://learn.microsoft.com/microsoft-copilot-studio/analytics-overview)
- [About agent evaluation (Microsoft Learn)](https://learn.microsoft.com/microsoft-copilot-studio/analytics-agent-evaluation-intro)
