---
title: "Measuring Power Apps adoption: users, retention and time saved"
slug: measuring-power-apps-adoption
type: KPI_GUIDE
technology: POWER_APPS
topic: adoption-and-usage
excerpt: "Launches and active users tell you an app was opened, not that it helped. Six KPIs that show whether a Power Apps app is adopted and worth it, where each number comes from, and how to report time saved honestly."
---
"How many people use the app?" is the first question every sponsor asks, and the least useful answer is a single number of launches. An app can be opened a thousand times by people who give up, or fifty times by a team that now finishes a week's work in a day.

This guide sets out six KPIs that together show whether a Power Apps app is adopted and worth keeping, where each number comes from, and how to report time saved without overclaiming.

## The six KPIs

| KPI | Question it answers | Formula |
| --- | --- | --- |
| **Reach** | Did the intended people start using it? | Distinct users in the period ÷ size of the intended audience |
| **Stickiness** | Is it part of daily work? | Average daily active users ÷ monthly active users |
| **Retention** | Do people keep using it? | Users active in month 1 who are still active in month 3 ÷ users active in month 1 |
| **Task completion** | Do people finish what they came for? | Sessions that complete the key task ÷ sessions that start it |
| **Error rate** | Is it working for them? | Sessions with an error message ÷ all sessions |
| **Time saved** | Is it worth it? | (Minutes per task before − minutes per task now) × tasks completed |

Read them together. High reach with low retention means people tried it and went back to the old way. High stickiness with low task completion means people are stuck in it, not helped by it.

## Where the numbers come from

### The Power Platform admin center

Admins get two built-in sources:

- **Power Apps analytics** (**Manage > Power Apps**) has a **Usage** report with app launches and daily active users, filterable by device, player version and location. It also has a **Toast Errors** report of the error messages users saw, and a **Service Performance** report for connectors.
- **The Usage page** gives distinct users in total and per app, and a daily active usage trend. It was in public preview from February 2026, so check its status in your tenant.

Know the limits before you build a KPI on them:

- **Only canvas apps.** Power Apps analytics doesn't report on model-driven apps.
- **28 days of history.** Data is kept for at most 28 days and refreshed about once a day. Retention needs three months, so you have to keep the numbers yourself (see below).
- **Admin roles only.** An environment admin sees their environments; a Power Platform admin sees all of them.

> [!NOTE]
> The Center of Excellence (CoE) Starter Kit, long the usual way to keep usage history, is no longer actively maintained; Microsoft has moved its core capabilities into the admin center. Don't start a new adoption dashboard on it.

### Keeping history longer

Two options give you the months of data that retention and trend lines need:

- **Self-service analytics** (in preview) exports Power Apps inventory and usage data from the admin center to your own Azure Data Lake Storage, with a daily incremental update. You keep it for as long as your retention policy allows and report on it in Power BI. It needs Azure, a Global Admin for the one-time connection, and a paid premium Dataverse license in the tenant.
- **A monthly snapshot.** If that is too much for now, export the Usage report at the end of each month and append it to a table. It's manual, but three snapshots are enough for a first retention figure.

### Application Insights for task completion

Launches and users come from the platform. **Task completion and time per task** only come from your own app, because only your app knows what "done" means.

Connect the canvas app to Azure Application Insights in its settings, then record the start and end of the key task with `Trace`:

```powerfx
// OnSelect of the button that starts a request
Set(varRequestStarted, Now());
Trace("RequestStarted", TraceSeverity.Information, {Screen: App.ActiveScreen.Name})
```

```powerfx
// After the request is saved successfully
Trace(
    "RequestSubmitted",
    TraceSeverity.Information,
    {DurationSeconds: DateDiff(varRequestStarted, Now(), TimeUnit.Seconds)}
)
```

Each `Trace` call lands in the **traces** table. Power Apps adds dimensions such as the app ID and a session ID to every event. A query for task completion by week then looks like this:

```kusto
traces
| where message in ("RequestStarted", "RequestSubmitted")
| extend session = tostring(customDimensions.sessionId)
| summarize
    started = dcountif(session, message == "RequestStarted"),
    completed = dcountif(session, message == "RequestSubmitted")
    by week = startofweek(timestamp)
| extend completionRate = round(100.0 * completed / started, 1)
| order by week asc
```

> [!WARNING]
> Events are sent only from the **published** app, not from a preview in Power Apps Studio. Offline sessions aren't recorded, and neither are events from a phone app while it's suspended. Treat these numbers as a floor, not a census.

> [!TIP]
> Don't put names or email addresses in trace data unless you need them and your privacy obligations allow it. The KPIs above are all aggregates. A session ID is enough to count completions, and Application Insights already keeps a user identifier for distinct-user counts.

## Reporting time saved honestly

Time saved is the number sponsors remember, so it's worth getting right.

1. **Measure the baseline before launch.** Time five to ten people doing the task the old way, and use the median. If the app is already live, time people who still use the old process, and say so.
2. **Measure the new time from the app.** Use the `DurationSeconds` you traced, and take the median, not the mean, so a few abandoned sessions don't skew it.
3. **Count only completed tasks** in the period, from the `RequestSubmitted` events.
4. **Report it as a range, with its inputs.** For example: "about 110 to 140 hours a month (baseline median 18 minutes, now 6 minutes, 620 requests)". Anyone can check that.

> [!NOTE]
> Time saved isn't money saved. Freed-up time usually goes to other work, not to lower costs. Report hours, and let the sponsor decide what they're worth.

## Setting targets

There are no official benchmarks for these KPIs, and numbers from other organisations rarely transfer. Use your own first full month as the baseline, then set targets as improvements on it. Watch the direction of each line more than its level:

- **Reach rising, retention flat or falling:** the launch worked, the app didn't. Talk to the people who left.
- **Task completion falling after a release:** check the Toast Errors report and the unfinished sessions for that release.
- **Stickiness low on a daily-use app:** people are working around it. Find out what they use instead.

## Checklist

- Every KPI has an owner and a source, written down.
- Usage history is kept beyond the admin center's 28 days.
- The app traces the start and the successful end of its key task.
- Trace data holds no personal data you don't need.
- Time saved is reported as a range with its inputs, never as a single impressive number.

The setup follows Microsoft's documented behaviour for Power Platform admin analytics, self-service analytics and Application Insights for canvas apps. The KPI definitions and the time-saved method are our own recommendations.

## Sources

- [Admin analytics for Power Apps (Microsoft Learn)](https://learn.microsoft.com/power-platform/admin/analytics-powerapps)
- [Set up self-service analytics to export inventory and usage data (Microsoft Learn)](https://learn.microsoft.com/power-platform/admin/self-service-analytics)
- [Analyze app telemetry using Application Insights (Microsoft Learn)](https://learn.microsoft.com/power-apps/maker/canvas-apps/application-insights)
- [Trace function (Microsoft Learn)](https://learn.microsoft.com/power-platform/power-fx/reference/function-trace)
- [CoE Power BI dashboard, including its maintenance status (Microsoft Learn)](https://learn.microsoft.com/power-platform/guidance/coe/power-bi)
