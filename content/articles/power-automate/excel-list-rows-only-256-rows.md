---
title: "List rows present in a table only returns 256 rows? Fix it, plus dates and filters"
slug: excel-list-rows-only-256-rows
type: TUTORIAL
technology: POWER_AUTOMATE
topic: errors-and-limits
excerpt: "The Excel action List rows present in a table only returns 256 rows by default, shows dates as numbers like 45567, and rejects most filters. Here's how to get every row, real dates and filters that work, and when to stop using Excel."
searchPhrase: "list rows present in a table only 256 rows"
---
The Excel Online (Business) action **List rows present in a table** is the most common way flows read a spreadsheet, and it surprises almost everyone the same three ways: it only returns **256 rows**, dates come back as **numbers**, and filters that look right **fail**. Here's the fix for each, and the limits that cause the rest.

> [!ANSWER] Quick answer
> 1. [Only 256 rows](#1-get-every-row-not-just-256): in the action's **Settings**, turn on **Pagination** and set a **Threshold** above your row count.
> 2. [Dates look like 45567](#2-dates-come-back-as-numbers): set **DateTime Format** to **ISO 8601** in the action's advanced parameters.
> 3. [Filter Query fails](#3-filters-that-work): use only `eq`, `ne`, `contains`, `startswith` or `endswith`, on a column whose name is letters and numbers only.

> [!NOTE]
> Checked against Microsoft Learn on 8 October 2026.

## 1. Get every row, not just 256

By default the action returns up to 256 rows. Nothing warns you: the flow succeeds and silently works on the first 256.

1. Select the action, then **Settings** (in the new designer: **Settings** > **Networking**).
2. Turn on **Pagination**.
3. Set **Threshold** to a number above the most rows the table will ever have, such as `5000`. The highest threshold you can set depends on your Power Automate plan, up to 100,000.

Then check it: add a **Compose** with `length(body('List_rows_present_in_a_table')?['value'])` and compare it with the row count in Excel.

> [!TIP]
> If you only need some rows, filter first (section 3). Fewer rows means a faster flow and fewer throttled calls.

## 2. Dates come back as numbers

Excel stores a date as a **serial number**: the days since 30 December 1899. So `45567` is a date, and `45567.5` is noon on that date. The connector returns that number unless you ask otherwise.

**The fix:** in the action's advanced parameters, set **DateTime Format** to **ISO 8601**. Dates then arrive as text like `2024-10-01T00:00:00.000Z`, which `formatDateTime()` and date comparisons understand. **Get a row**, **Add a row into a table** and **Update a row** have the same setting.

If you can't change the action, convert the number with an expression:

```text
addDays('1899-12-30', int(item()?['Due date']), 'yyyy-MM-dd')
```

That only works for whole days. For a date with a time, use seconds:

```text
addSeconds('1899-12-30', int(mul(float(item()?['Due date']), 86400)))
```

> [!WARNING]
> An empty cell comes back as an empty string, and `int('')` fails the run. Wrap the expression in `if(empty(item()?['Due date']), null, …)`.

## 3. Filters that work

**Filter Query** on this action is much more limited than OData filters elsewhere:

| Rule | What it means |
| --- | --- |
| Only `eq`, `ne`, `contains`, `startswith`, `endswith` | No `gt`, `lt`, `and` or `or`. So no date ranges |
| One filter function per column | You can't stack two conditions on the same column |
| Column names must be letters and numbers | `Status` works; `Due Date` or `Cost (USD)` doesn't |
| One column in **Order By** | Sort by a second column afterwards, if you need to |
| Results can be slightly behind | When you filter or sort, very recent changes may not show yet |

Examples that work:

```text
Status eq 'Open'
contains(Region, 'North')
```

**When the filter you need isn't allowed** (a date range, two conditions, a column with a space), skip **Filter Query**, turn on pagination, then add a **Filter array** action after it. Filter array accepts any condition, including dates once they're ISO 8601:

```text
@and(equals(item()?['Status'], 'Open'), less(item()?['Due date'], utcNow()))
```

Or rename the column in Excel to letters and numbers only, such as `DueDate`.

## 4. Writing rows: the limits that cause odd results

| Symptom | Cause | Fix |
| --- | --- | --- |
| A row you just added isn't there yet | Changes can take up to 30 seconds to show | Don't read straight after writing; or keep the data in the flow |
| "The file is locked" | The connector can hold a lock for up to 6 minutes after its last use | Don't edit the file by hand while flows use it; retry later |
| Only one row changed | **Update a row** and **Delete a row** change the **first** match only | Make the key column unique |
| Key column "not found" | The key column name is case-sensitive | Pick it from the drop-down rather than typing it |
| Rows added twice | A slow recalculation timed out, and the retry wrote again | Simplify formulas, or set the workbook's calculation to Manual |
| `403 Forbidden` | The connection's account can't write to the file | Give it edit access. Even reading needs write access |
| `502 Bad Gateway` | The workbook is read-only | Turn off read-only in Excel |
| `429 Too many requests` | Throttled: 100 calls per minute per connection, and Excel's own limits | Turn down **Apply to each** concurrency, add a short **Delay** |
| Fails on a big file | The connector supports files up to 25 MB | Archive old rows to another workbook |

> [!NOTE]
> Don't let people, other flows and apps write to the same workbook at the same time. Microsoft doesn't support it, and it causes merge conflicts and lost rows.

## 5. When to stop using Excel

Excel is fine for a few hundred rows that one flow reads. Move the data to a **SharePoint list** or **Dataverse** when:

- more than one person or flow writes to it;
- you need date ranges or several conditions in the filter;
- it's heading past a few thousand rows;
- you keep hitting locks and throttling.

Our guide [Dataverse or SharePoint lists?](/learn/dataverse-or-sharepoint-lists) helps you choose. For more than 5,000 SharePoint items, see [Get more than 5,000 SharePoint items](/learn/get-more-than-5000-sharepoint-items).

## Sources

- Microsoft Learn: [Excel Online (Business) connector: known issues and limitations](https://learn.microsoft.com/connectors/excelonlinebusiness/#known-issues-and-limitations-with-actions)
- Microsoft Learn: [Connector pagination support](https://learn.microsoft.com/connectors/common/known-issues#pagination-support)
- Microsoft Learn: [Use lists of rows in flows: pagination threshold](https://learn.microsoft.com/power-automate/dataverse/list-rows#turn-on-pagination-to-request-more-than-5,000-rows)
- Microsoft Learn: [Use data operations: Filter array](https://learn.microsoft.com/power-automate/data-operations#use-the-filter-array-action)
