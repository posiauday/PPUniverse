---
title: "Refresh on your terms: table-level refresh, automatic retries and refreshing from Power Automate"
slug: refresh-on-your-terms
type: TUTORIAL
technology: POWER_BI
topic: refresh-and-gateways
excerpt: "Refresh only the Power BI table that changed, refresh data without pulling in schema changes, retry failed refreshes automatically, and trigger refresh from Power Automate when the data is ready instead of on a fixed clock. With the limits for each."
searchPhrase: "power bi refresh retry"
---
Scheduled refresh at fixed times works until it doesn't: the data lands late, one huge table makes everything slow, or a refresh fails at 3 a.m. and nobody re-runs it. Power BI now gives you finer control. Here's what to use, and when.

> [!ANSWER] Quick answer
> 1. [Know your limits](#know-your-limits-first): 8 scheduled refreshes a day on Pro, 48 on Premium, PPU or Fabric; 4 failures in a row turn the schedule off.
> 2. [Refresh when the data is ready](#3-refresh-when-the-data-is-ready-power-automate), from a Power Automate flow, instead of guessing a time.
> 3. [Add failure contacts](#4-make-the-scheduled-ones-healthier), and on Premium, PPU or Embedded [let the enhanced refresh API retry](#2-retry-failures-automatically-premium-ppu-embedded).

> [!NOTE]
> Checked against Microsoft Learn on 6 October 2026.

## Know your limits first

| | Shared capacity (Pro) | Premium, PPU or Fabric capacity |
| --- | --- | --- |
| Scheduled refreshes per day | **8** | **48** |
| Longest refresh | **2 hours** | **5 hours** (longer through XMLA) |
| API-triggered refreshes | Count toward the 8 | No fixed number; limited by capacity resources |
| **Refresh now** in the service | Doesn't count toward the 8 | — |

Also good to know:
- A schedule is turned off after **4 failures in a row**.
- Scheduled refresh is **paused after two months** of nobody viewing the reports.
- Scheduled refreshes start within about **15 minutes** of the slot, occasionally up to an hour later, and can begin up to 5 minutes early.

## 1. Choose what to refresh

Open the **Refresh** drop-down, in Power BI Desktop or when editing the model in the service:

| Option | Does | Use when |
| --- | --- | --- |
| **Refresh schema and data** | Syncs the structure with the source, then loads data. This is the default | Normal use |
| **Sync schema only** | Picks up new columns or type changes without loading data | You changed the source structure and want to check the model first |
| **Refresh data only** | Loads fresh data and **keeps the current structure** | The source gained columns you don't want in the model yet |

**Table level:** select a single table (in the service, in **Model explorer**) to refresh only that table's schema, data or both. That's ideal when one table changed and the rest is expensive to reload.

> [!WARNING]
> A schema sync **removes** columns or tables that were renamed or removed at the source. That can break visuals, measures and row-level security that depend on them. When a source changes shape, use **Sync schema only** and check the model before you refresh data.

In the service, when you only *view* a model, just **Refresh data** is offered. Switch to editing to see every option.

## 2. Retry failures automatically (Premium, PPU, Embedded)

The **enhanced refresh** REST API can retry by itself. Send a `POST` to `…/groups/{workspaceId}/datasets/{modelId}/refreshes` with a body such as:

```json
{
  "type": "full",
  "retryCount": 2,
  "timeout": "02:00:00",
  "objects": [ { "table": "Sales" } ]
}
```

- **`retryCount`** (default `0`): how many times Power BI retries before marking it failed.
- **`timeout`** (default **5 hours**): applies to **each attempt**. Retries can make the total longer, but never more than **24 hours**.
- **`objects`**: refresh only the tables or partitions you list.
- **Only one refresh at a time** per model. A second request while one runs gets **400 Bad Request**.
- You can check progress or **cancel** an enhanced refresh by its request ID, which you can't do with a normal refresh.

It needs a model on Premium, PPU or Embedded, and an app or user with **Dataset.ReadWrite.All** and permission on the model.

## 3. Refresh when the data is ready (Power Automate)

Instead of guessing a time, refresh **after** the data lands:

1. Trigger on the event that means "data is ready". For example: a file arrives in SharePoint, a pipeline finishes, or a row is written to a control table.
2. Add the **Power BI** connector's refresh action (it still uses the old word *dataset*) and pick the workspace and model.

Things to plan for:
- **No failure email.** Refreshes started by Power Automate or the API **don't send** refresh-failure notifications. Check the refresh history, or have your flow alert someone.
- **Shared capacity:** API-triggered refreshes count toward the **8 a day**.
- **Monthly refresh:** Power BI has no monthly schedule option. Microsoft suggests Power Automate for a custom interval. On Fabric, **data pipeline refresh templates** can also run monthly and cascading refreshes.

## 4. Make the scheduled ones healthier

- **Add failure contacts:** in the model's settings, add a shared mailbox or support alias under **Email these contacts when the refresh fails**. External addresses aren't supported.
- **Use incremental refresh** for big fact tables, so each run loads only recent data. See [Refresh failed: a checklist](/guides/refresh-failures-checklist) for the full set of fixes.
- **On Premium,** use the admin portal's **Refresh summary** to spot overlapping refresh slots.

## Sources

- Microsoft Learn: [Data refresh in Power BI: refresh options, limits and notifications](https://learn.microsoft.com/power-bi/connect-data/refresh-data)
- Microsoft Learn: [Edit semantic models in the service: refresh options](https://learn.microsoft.com/power-bi/transform-model/service-edit-data-models#model-data)
- Microsoft Learn: [Configure scheduled refresh](https://learn.microsoft.com/power-bi/connect-data/refresh-scheduled-refresh)
- Microsoft Learn: [Enhanced refresh with the Power BI REST API](https://learn.microsoft.com/power-bi/connect-data/asynchronous-refresh)
- Microsoft Learn: [Troubleshoot refresh scenarios](https://learn.microsoft.com/power-bi/connect-data/refresh-troubleshooting-refresh-scenarios)
- Microsoft Learn: [Refresh summaries](https://learn.microsoft.com/power-bi/connect-data/refresh-summaries)
- Microsoft Learn: [What's new in Power BI: August 2026](https://learn.microsoft.com/power-bi/fundamentals/whats-new)
