---
title: "Data quality KPIs: completeness, duplicates and freshness"
slug: data-quality-kpis
type: KPI_GUIDE
technology: DATAVERSE
topic: data-quality
excerpt: "Every report and agent built on Dataverse is only as good as the rows underneath it. Four KPIs that show whether the data can be trusted, how to measure each one, and which Dataverse features stop the problems at the source."
---
When a report shows the wrong number or an agent gives a wrong answer, the cause is often not the report or the agent. It's the data: missing values, duplicate customers, records nobody has touched in years. Data quality is rarely measured, so it's rarely noticed until it causes a visible mistake.

This guide sets out four KPIs for the quality of data in Dataverse, how to measure each, and which Dataverse features prevent the problems rather than just reporting them.

## The four KPIs

| KPI | Question it answers | Formula |
| --- | --- | --- |
| **Completeness** | Are the important columns filled in? | Rows with the column filled ÷ all active rows, per key column |
| **Duplicate rate** | Is each real thing recorded once? | Rows flagged as duplicates ÷ all active rows |
| **Freshness** | Is the data still current? | Active rows modified in the last N days ÷ all active rows |
| **Validity** | Do values follow the rules? | Rows breaking a rule ÷ all active rows, per rule |

Measure each **per table** and for the **columns that matter**. "Email is filled in on 92% of contacts" is a KPI someone can act on; "data quality is 87%" isn't.

These KPIs and their definitions are our recommendation. Dataverse doesn't calculate them for you, but it gives you everything needed to measure and enforce them.

## Measuring them in Power BI

Connect Power BI to Dataverse and build a small data quality report. A few measures cover most needs. In this example, **Contact** has an **Email** column and the standard **Modified On** column:

```dax
Active Contacts = COUNTROWS ( Contact )

Email Completeness % =
DIVIDE (
    CALCULATE ( COUNTROWS ( Contact ), NOT ISBLANK ( Contact[Email] ) ),
    [Active Contacts]
)

Updated In Last 365 Days % =
DIVIDE (
    CALCULATE ( COUNTROWS ( Contact ), Contact[Modified On] >= TODAY () - 365 ),
    [Active Contacts]
)
```

Filter the model to active rows, so deactivated records don't count against you.

> [!TIP]
> With the Dataverse connector, a choice column arrives as two columns: the numeric value and the label. Filter on the **value** column, not the label. Microsoft notes that filtering on label columns needs an extra join and can noticeably slow report queries.

Freshness needs a threshold that suits the data. A customer's address may be fine after two years; an open opportunity untouched for 90 days probably isn't. Agree the threshold per table with the people who own the data.

## Finding duplicates

Dataverse has built-in **duplicate detection**:

- **Duplicate detection rules** define what counts as a duplicate. For example: two contacts with the same email, or the same name and phone number. Rules can match across tables, such as a lead and a contact.
- **Warnings at entry.** When duplicate detection is on, users are warned about likely duplicates as they create or update rows.
- **Scheduled duplicate detection jobs** check existing rows against the rules. Duplicates found can be merged, deactivated or deleted.

Run a duplicate detection job on a schedule, and use its results as your duplicate count.

## Stopping problems at the source

Measuring is half the job. These Dataverse features stop bad data from being written in the first place:

| Problem | Prevention in Dataverse |
| --- | --- |
| Missing values | Make the column **required**, or use a **business rule** to require it in specific situations |
| Duplicates of a business identifier | An **alternate key**, which refuses a second row with the same value. Make the key column required: blank values aren't checked for uniqueness |
| Likely duplicate people or companies | **Duplicate detection rules** with warnings at entry |
| Invalid combinations | **Business rules**, which apply no matter which app writes the data |
| Free-text variations ("Ltd", "Limited", "LTD") | A **choice** column or a **lookup** to a reference table instead of free text |

> [!NOTE]
> Rules enforced only in one app's form don't protect the data. A flow, an import or a second app can still write anything. Put rules that must always hold in Dataverse itself.

## Setting targets and owners

There's no universal benchmark for data quality. Use your first measurement as the baseline, then set targets per table and column:

- **Critical columns** (anything used to contact, bill or decide): aim high, and review weekly.
- **Useful columns:** track the trend; don't chase perfection.
- **Unused columns:** if nobody fills them and nobody reads them, consider removing them instead of measuring them.

Every KPI needs an **owner**: someone in the business who can fix the process that creates bad data, not just the rows themselves.

## Checklist

- Completeness is measured per table for the columns that matter, on active rows only.
- A freshness threshold has been agreed per table with its owner.
- Duplicate detection rules exist for key tables, and a scheduled job measures duplicates.
- Required columns, alternate keys and business rules prevent the most common problems at entry.
- Each KPI has a named business owner and a target based on your own baseline.

The features described follow Microsoft's documentation for Dataverse duplicate detection, alternate keys, business rules and the Power BI Dataverse connector. The KPI definitions and targets are our own recommendations.

## Sources

- [Detect duplicate data using code: duplicate detection overview (Microsoft Learn)](https://learn.microsoft.com/power-apps/developer/data-platform/detect-duplicate-data-with-code)
- [Define alternate keys to reference rows (Microsoft Learn)](https://learn.microsoft.com/power-apps/maker/data-platform/define-alternate-keys-reference-records)
- [Create a Power BI report using data from Dataverse (Microsoft Learn)](https://learn.microsoft.com/power-apps/maker/data-platform/data-platform-powerbi-connector)
- [Comparing Lists, Dataverse for Teams and Dataverse: business rules and calculations (Microsoft Learn)](https://learn.microsoft.com/power-apps/teams/compare-data-sources)
