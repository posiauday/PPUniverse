---
title: "Incremental refresh: set it up, and prove it's working"
slug: incremental-refresh-set-up-and-verify
type: TUTORIAL
technology: POWER_BI
topic: refresh-and-gateways
excerpt: "Load only the recent part of a big Power BI table on each refresh. RangeStart and RangeEnd, the policy settings in plain words, the query-folding trap that quietly loads everything, the republishing rule, and four ways to confirm each refresh really is incremental."
searchPhrase: "power bi incremental refresh"
---
A 50-million-row fact table doesn't need to reload ten years of history every night. **Incremental refresh** splits the table into date partitions, refreshes only the recent ones, and leaves history alone. It works on **Pro** as well as Premium and PPU. The hard part isn't turning it on; it's being sure it's actually incremental.

> [!NOTE]
> Checked against Microsoft Learn on 6 October 2026.

## How it works, in one paragraph

You add two date/time parameters, `RangeStart` and `RangeEnd`, and filter the table with them. In Power BI Desktop they load a small slice. After you publish, the **service** overrides them. The first refresh creates **historical** partitions (stored, rarely refreshed) and **refresh** partitions (reloaded each time). Each later refresh queries only the refresh period. Old partitions merge, and drop off after the archive period. Microsoft calls this a *rolling window*.

## Step 1: Parameters and filter

1. In Power Query, select **Manage Parameters** and create `RangeStart` and `RangeEnd`. The names are **case-sensitive**, the type is **Date/Time**, and the values give you a couple of days of data in Desktop.
2. Filter the date column. Include the start, exclude the end, so no row lands in two partitions:

```powerquery
Table.SelectRows(Source, each [OrderDate] >= RangeStart and [OrderDate] < RangeEnd)
```

Integer date keys such as `20261006`? Convert the parameters inside the filter:

```powerquery
each [OrderDateKey] >= Int32.From(DateTime.ToText(RangeStart, [Format="yyyyMMdd"]))
 and [OrderDateKey] <  Int32.From(DateTime.ToText(RangeEnd,   [Format="yyyyMMdd"]))
```

## Step 2: The policy, in plain words

Right-click the table, select **Incremental refresh**, and switch it on.

| Setting | Means | Typical |
| --- | --- | --- |
| **Archive data starting … before refresh date** | How much history to keep | 5 years |
| **Incrementally refresh data starting … before refresh date** | How much recent data to reload every time | 3–10 days: enough to catch late changes |
| **Only refresh complete days** | Skip today's partial data | On for daily totals |
| **Detect data changes** | Reload a period only if a "last updated" column changed. Use a **different** column from the one you partition on | When the source has an audit column |
| **Get the latest data in real time with DirectQuery** | Adds a live partition after the refresh period | Premium, PPU or Embedded only |

**Time zone:** "today" is in **UTC** unless you set a time zone under the model's **Refresh** settings.

## Step 3: Watch out for query folding

The filter has to reach the **source**, as a `WHERE` clause or similar. If a step before the filter stops query folding, the import may still **download every row** and filter it inside Power BI or on the gateway. Then the refresh is as slow as before, and can run out of resources.

- Put the `RangeStart`/`RangeEnd` filter **right after** the source step.
- If the policy dialog shows a **folding warning**, check with Power Query **Query Diagnostics**, or with the source's own trace.
- A hand-written SQL query can work too, if you put the parameters *inside* the SQL.

## Step 4: Publish once, then refresh

- Run the **first refresh manually** and watch it. It's the long one: it creates partitions and loads all the history.
- On Premium, turn on the **large semantic model** format **before** that first refresh if the model may grow beyond 1 GB.
- **After publishing, you can't download the PBIX back** from the service.
- **Republishing from Desktop replaces the model's partitions and data.** On Premium, deploy later changes as **metadata only**, for example through the XMLA endpoint with tools such as ALM Toolkit.

## Step 5: Prove each refresh is incremental

Partitions existing only shows the policy was **applied**. It doesn't prove the last refresh loaded only the recent window. Check one of these:

1. **Duration:** later scheduled refreshes should take a fraction of the first. Compare them in the refresh history.
2. **The source's logs:** the queries Power BI sends should carry a date filter covering only the refresh period. Use SQL Server's query store or a trace, or the source's equivalent.
3. **Enhanced refresh details** (Premium, PPU or Embedded): `GET …/refreshes/{requestId}` shows what each refresh processed.
4. **Partitions in SQL Server Management Studio** (Premium, with the XMLA endpoint on): connect to the workspace and look at the table's partitions after a refresh.

## Limits to remember

- Refresh still has the **2-hour (Pro)** and **5-hour (Premium)** limits. XMLA refreshes on Premium don't.
- Every table with a policy must use the **same** `RangeStart` and `RangeEnd` parameters.
- All partitions must come from **one data source**.

## Sources

- Microsoft Learn: [Incremental refresh and real-time data for semantic models](https://learn.microsoft.com/power-bi/connect-data/incremental-refresh-overview)
- Microsoft Learn: [Configure incremental refresh and real-time data](https://learn.microsoft.com/power-bi/connect-data/incremental-refresh-configure)
- Microsoft Learn: [Advanced incremental refresh with the XMLA endpoint](https://learn.microsoft.com/power-bi/connect-data/incremental-refresh-xmla)
- Microsoft Learn: [Query folding guidance in Power BI Desktop](https://learn.microsoft.com/power-bi/guidance/power-query-folding)
- Microsoft Learn: [Enhanced refresh with the Power BI REST API](https://learn.microsoft.com/power-bi/connect-data/asynchronous-refresh)
