---
title: "Delegation cheat sheet: what works on SharePoint, Dataverse and SQL Server"
slug: delegation-cheat-sheet
type: REFERENCE
technology: POWER_APPS
topic: data-and-delegation
excerpt: "Which Power Apps functions and operators run on the data source, and which quietly stop at 500 rows, for SharePoint, Dataverse and SQL Server, with the delegable rewrite for each common trap."
searchPhrase: "power apps delegation cheat sheet"
---
A canvas app only sees every row when the data source does the work. When a formula can't be handed to the source (it isn't **delegable**), Power Apps fetches the first 500 rows (2,000 at most) and works on those. Anything past that is silently missing. This page is the lookup table: what each source accepts, and how to rewrite the formulas that don't fit.

For the why and a worked example, read [Why your gallery stops at 500 rows](/guides/power-apps-delegation-500-rows) first.

> [!ANSWER] Quick answer
> 1. [If any part of a query can't be delegated, none of it is](#the-rules-that-apply-everywhere): the whole query works on the first 500 rows (2,000 at most).
> 2. [Rewrite the common traps](#rewrites-for-the-common-traps): for example `StartsWith` instead of `Search`, and `= Blank()` instead of `IsBlank`, on SharePoint.
> 3. [Set the data row limit to 1 while you build](#test-that-it-really-delegates), so anything that isn't delegated shows at once.

> [!NOTE]
> Checked against Microsoft Learn on 6 October 2026. Microsoft extends delegation support over time, so trust the warning in Power Apps Studio over any table, including this one.

## The rules that apply everywhere

- **All or nothing.** If any part of a query can't be delegated, *none* of it is: the whole query runs on the first 500 or 2,000 rows.
- **The warning.** A non-delegable formula over a delegable source shows a yellow triangle and a blue underline. No warning on Excel, collections or variables doesn't mean "fine". Those sources never delegate, because the data is already on the device.
- **Constants are free.** Anything that's the same for every row, such as `Today()`, `User().Email`, a variable or a control's value, is sent to the source as a value and never blocks delegation.
- **The column goes on the left.** Write `Status = varStatus`, not `varStatus = Status`, especially when one side is a lookup.
- **Lookups.** At most two levels of lookup in one query (one when offline), and up to 20 joined tables.
- **Usually delegable** (if the source supports it): `Filter`, `LookUp`, `Search`, `First`, `Sort`, `SortByColumns`; inside them, `And`, `Or`, `Not`, `in` (on base columns), `=`, `<>`, `<`, `>`, `<=`, `>=`, `+`, `-`, `StartsWith`, `EndsWith`, `IsBlank`, `TrimEnds`.
- **Never delegable:** `If` inside a filter, `*`, `/`, `Mod`, `Text()`, `Value()`, `&` and `Concatenate`, `Lower`, `Upper`, `Left`, `Mid`, `Len` (with source-specific exceptions below), `FirstN`, `Last`, `LastN`, `Choices`, `Concat`, `Distinct`, `GroupBy`, `Ungroup`, `Collect`, `ClearCollect`.

## SharePoint

SharePoint delegates the least. The surprises are text comparisons and search.

| | Number | Text | Yes/No | Date | Choice, Lookup, Person |
| --- | --- | --- | --- | --- | --- |
| `=` | Yes | Yes | Yes | Yes | Yes, on the subfield |
| `<` `>` `<=` `>=` `<>` | Yes | **No** | No | Yes | Depends on the subfield |
| `StartsWith` | | Yes | | | **No** on Choice or Lookup subfields |
| `IsBlank` | | **No** | | | No |
| `Search`, `in` (substring) | | **No** | | | |
| `Sort`, `SortByColumns` | Yes | Yes | Yes | Yes | No |
| `Not` | **No** | **No** | **No** | **No** | **No** |

**SharePoint traps:**
- **ID only supports `=`.** It looks like a number in Power Apps but is text underneath, so `ID > 100` won't delegate.
- **Person columns:** only `Email` and `DisplayName` delegate.
- **System fields don't delegate.** That includes Name, Path, FullPath, Content Type, Version, Is Checked Out, Moderation Status and the other built-in columns.
- **`UpdateIf` and `RemoveIf`** run on the device for SharePoint and only change up to the 500/2,000 limit per run. For bulk changes, use a flow.

## Dataverse

Dataverse delegates the most. If you're choosing a data source for a large app, this table is the argument.

| | Number | Text | Choice | Date | Unique ID |
| --- | --- | --- | --- | --- | --- |
| `=` `<>` | Yes | Yes | Yes | Yes | Yes |
| `<` `>` `<=` `>=` | Yes | Yes | No | Yes | |
| `And` `Or` `Not` | Yes | Yes | Yes | Yes | Yes |
| `in` (is one of) | Yes | Yes | Yes | Yes | Yes |
| `in` (text contains) | | Yes | | | |
| `Search` | | Yes | | | |
| `StartsWith` | | Yes | | | |
| `IsBlank` | Yes | Yes | **No** | Yes | Yes |
| `Sum` `Min` `Max` `Average` | Yes | | | No | |
| `CountRows` `CountIf` | Yes | Yes | Yes | Yes | Yes |

**Dataverse traps:**
- **Arithmetic on a column** (`Amount + 10 > 100`) doesn't delegate. Move the arithmetic to the other side: `Amount > 90`.
- **No `Len` or `TrimEnds`.** `Left`, `Mid`, `Upper`, `Lower`, `Replace` and `Substitute` are supported; casting with `Text(column)` isn't.
- **`Now()` and `Today()`** don't delegate against date columns. Put them in a variable first.
- **Counting:** `CountRows` and `CountIf` delegate once **Enhanced delegation for Microsoft Dataverse** is on (Settings → Upcoming features → Preview).
  - With a filter, counts stop at **50,000**.
  - `CountRows(Table)` with no filter uses a cached count that updates periodically, so it may lag slightly. For an exact number under the limit, use `CountIf(Table, true)`.

## SQL Server

| | Number | Text | Yes/No | Date | Unique ID |
| --- | --- | --- | --- | --- | --- |
| `=` `<>` | Yes | Yes | Yes | Yes | Yes |
| `<` `>` `<=` `>=` | Yes | **No** | No | Yes | |
| `+` `-` `*` `/` | Yes | | | No | |
| `StartsWith`, `EndsWith` | | Yes | | | |
| `Search`, `in` (text contains), `Len` | | Yes | | | |
| `IsBlank` | **No** | **No** | **No** | **No** | **No** |
| `Sum` `Average` | Yes | | | | |
| `Min` `Max` | Yes | | | No | |

Unlike SharePoint, SQL Server delegates `Not`, `Search` and arithmetic. Like SharePoint, it doesn't delegate `IsBlank`.

## Rewrites for the common traps

| You wrote | Problem | Delegable instead |
| --- | --- | --- |
| `Filter(List, IsBlank(Customer))` on SharePoint | `IsBlank` doesn't delegate | `Filter(List, Customer = Blank())`. It doesn't treat an empty string `""` as blank, which is usually what you want; works with `=`, not `<>` |
| `Search(List, txtSearch.Text, Title)` on SharePoint | `Search` doesn't delegate | `Filter(List, StartsWith(Title, txtSearch.Text))`. It matches from the start of the text, not anywhere in it |
| `Filter(List, ID > 100)` on SharePoint | ID only supports `=` | Filter on a real number or date column, such as `Created` |
| `Filter(Orders, Total * 1.05 > 1000)` | Arithmetic on the column | `Filter(Orders, Total > 1000 / 1.05)` |
| `Filter(Tasks, Due < Today())` on Dataverse | `Today()` against a date column | A named formula `varToday = Today();` in `App.Formulas` (or `Set(varToday, Today())` in `OnStart`), then `Filter(Tasks, Due < varToday)` |
| `Filter(List, Not(Done))` on SharePoint | `Not` doesn't delegate | `Filter(List, Done = false)` |
| `Distinct(Orders, Region)` for a dropdown | `Distinct` never delegates | A separate Regions list or table, or a Dataverse choice column |
| `CountRows(Filter(...))` for a dashboard | May stop at 50,000, or at 500 if the filter isn't delegable | Keep the filter delegable; for big totals, use a Power BI tile or a stored rollup column |

## Test that it really delegates

- **Set the row limit to 1 while you build.** In **Settings → General → Data row limit**, choose 1. Any formula that isn't delegated now returns at most one row, so you'll notice straight away. Put it back before you publish.
- **Use Monitor to confirm.** **Advanced tools → Monitor** shows the request each formula sends and how many rows come back. Use it when there's no warning but the numbers look short.
- **Test with more than 2,000 rows.** Delegation problems never show on a list of 50 test items.

## Sources

- Microsoft Learn: [Delegation and query limits](https://learn.microsoft.com/power-apps/maker/canvas-apps/delegation-overview)
- Microsoft Learn: [Delegable functions and operations for SharePoint](https://learn.microsoft.com/power-apps/maker/canvas-apps/connections/connection-sharepoint-online#power-apps-delegable-functions-and-operations-for-sharepoint)
- Microsoft Learn: [Delegable functions and operations for Dataverse](https://learn.microsoft.com/power-apps/maker/canvas-apps/connections/connection-common-data-service#power-apps-delegable-functions-and-operations-for-dataverse)
- Microsoft Learn: [Functions and operations delegable to SQL Server](https://learn.microsoft.com/power-apps/maker/canvas-apps/connections/sql-connection-overview#power-apps-functions-and-operations-delegable-to-sql-server)
- Microsoft Learn: [Count, CountA, CountIf and CountRows](https://learn.microsoft.com/power-platform/power-fx/reference/function-table-counts)
- Microsoft Learn: [Distinct function](https://learn.microsoft.com/power-platform/power-fx/reference/function-distinct)
