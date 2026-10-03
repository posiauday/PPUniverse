---
title: "Flow health KPIs: success rate, failure causes and hours saved"
slug: flow-health-kpis
type: KPI_GUIDE
technology: POWER_AUTOMATE
topic: run-and-monitor
excerpt: "A flow that fails quietly costs more than no flow at all. Five KPIs that show whether your automations are healthy and paying off, where to get each number, and the traps in the built-in reports."
---
Most organisations find out a flow is broken when someone complains. By then it may have been failing for days, and if it failed continuously for 14 days, Power Automate has already turned it off.

This guide sets out five KPIs that show whether your automations are healthy and worth running, where each number comes from, and what the built-in reports don't tell you.

## The five KPIs

| KPI | Question it answers | Formula |
| --- | --- | --- |
| **Success rate** | Do runs finish? | Succeeded runs ÷ all finished runs, per flow |
| **Top failure causes** | Why do they fail? | Failed runs grouped by error code and failing action |
| **Time to detect** | How fast do we notice? | Time of first alert or ticket − time of first failed run |
| **Run duration** | Is it getting slower? | Median and 90th-percentile run time, per flow |
| **Hours saved** | Is it worth it? | Successful runs × minutes saved per run ÷ 60 |

Track success rate per flow, not across all flows. A few busy healthy flows can hide a critical one that fails every run.

## Where the numbers come from

### Per flow: the Analytics page

Each flow has an **Analytics** page (open the flow, then **Analytics** in the menu at the top). It shows:

- the number of runs;
- success and failure rates;
- average run time;
- the errors by type and count, and when each last occurred.

Its limits:

- **About 30 days of history.** It's a rolling window.
- **Refreshed about once a day.** It isn't real time.
- **One flow at a time.** It's no good for comparing a whole estate.

### Across an environment: the admin center

Admins get environment-level Power Automate analytics in the Power Platform admin center: runs, usage, errors, connectors and sharing, over the last **28 days**. One important gap: the environment report counts **failed runs without saying which flows failed**. Use it for trends and the per-flow page, or the Monitor experience below, to find the culprit.

The admin center's **Monitor** experience lists every failed run, per flow and across an environment. Microsoft recommends it as the most complete view of failures.

### Longer history: run history in Dataverse

For **solution-aware** cloud flows, every run is also written to the **FlowRun** table in Dataverse:

- **Contents:** start and end times, duration, status and error details.
- **Retention:** 28 days by default. Admins can extend it with the `FlowRunTimeToLiveInSeconds` setting on the organisation.
- **Automation center:** the **automation center** in Power Automate builds its overview on this data: top-level flow runs, error rate, error trends and the flows failing most often.

> [!TIP]
> This is one more reason to build flows inside solutions. Flows outside a solution don't get Dataverse run history, so they're missing from the automation center and from any report you build on it.

### Application Insights

Admins can send cloud flow telemetry (runs, triggers and actions) to Azure Application Insights at environment level. You can send several environments to one resource. That gives you:

- queries across all flows;
- alerts on failures or slow runs;
- history for as long as you keep it.

It's the best source for time to detect and for run duration percentiles.

## Don't rely on failure emails

Power Automate does email owners about some failures, but the rules are narrower than most people assume:

- **Only some failures.** Per-run alert emails go out only for failures that have a known fix, and only if alerts are turned on for that flow.
- **One alert per flow for 28 days.** After an alert is sent, no more go out for the same flow until a 28-day cooldown ends.
- **A weekly digest.** It summarises all failures, including the ones that got no individual email.

So a flow can fail every day for weeks while its owner receives one email, or none. Time to detect should be measured from your own alerting, not the default emails.

> [!WARNING]
> **Turn-off rules apply.** A flow whose trigger or actions fail continuously for **14 days** is turned off, and so is one that's consistently throttled for 14 days. A flow with no trigger activity for **90 days** may be turned off too, unless its owner has a premium or capacity licence. Owners are warned 30 days before that.

## Hours saved, without overclaiming

Hours saved is the KPI sponsors ask for, and the easiest to inflate.

1. **Measure the manual time first.** Time the task done by hand by a few people, and take the median. Include only the steps the flow actually removes.
2. **Count successful runs only.** A failed run saved nothing, and it may have created rework.
3. **Subtract the time people still spend.** Include checking the flow's output and handling its exceptions.
4. **Report a range, with its inputs.** For example: "about 40 to 55 hours a month (2,100 successful runs, 1.5 minutes saved per run, minus about 5 hours of exception handling)".

> [!NOTE]
> For desktop flows (RPA), Microsoft's Automation Kit includes tools to estimate savings and return on investment for automation projects. For cloud flows, the method above is ours: keep the inputs visible so anyone can check the figure.

## Setting targets

There's no official benchmark for flow success rates. Start from each flow's own first month and set targets by how critical it is:

- **Critical flows** (money, customers, compliance): investigate every failure, and alert on the first one.
- **Important flows:** alert when the daily success rate drops below your baseline.
- **Convenience flows:** review failure causes weekly.

Watch for these patterns:

- **Success rate falls on one weekday.** Look for a scheduled job or a batch upload colliding with the flow.
- **The same error code repeats.** It's a design issue, such as throttling, a missing retry policy or an expired connection, not bad luck.
- **Duration creeps up month on month.** Data volume is growing faster than the design. Look at pagination, filtering and loops.

## Checklist

- Success rate is tracked per flow, and critical flows alert on the first failure.
- Failures are grouped by error code and action, and reviewed regularly.
- Flows are in solutions, so run history reaches Dataverse and the automation center.
- Alerting doesn't depend on the default failure emails.
- Hours saved is reported as a range with its inputs.

The setup follows Microsoft's documented behaviour for flow analytics, the admin center, run history in Dataverse and failure notifications. The KPI definitions and the hours-saved method are our own recommendations.

## Sources

- [Monitor your flows (Microsoft Learn)](https://learn.microsoft.com/power-automate/guidance/coding-guidelines/monitoring-and-alerting)
- [Understand flow failure notifications (Microsoft Learn)](https://learn.microsoft.com/power-automate/understand-flow-failure-notifications)
- [Manage cloud flow run history in Dataverse (Microsoft Learn)](https://learn.microsoft.com/power-automate/dataverse/cloud-flow-run-metadata)
- [Explore Power Automate's automation center (Microsoft Learn)](https://learn.microsoft.com/power-automate/automation-center-overview)
- [Limits of automated, scheduled and instant flows (Microsoft Learn)](https://learn.microsoft.com/power-automate/limits-and-config)
