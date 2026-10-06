---
title: "Delegation in Power Apps: why your gallery stops at 500 rows"
slug: power-apps-delegation-500-rows
type: TUTORIAL
technology: POWER_APPS
topic: data-and-delegation
excerpt: "Your app shows some records but not others, and there is no error. Here is why delegation causes it, how to spot it, and the formula rewrites that fix it."
searchPhrase: "power apps delegation 500 rows"
---
If a gallery shows only some of your records, or a search can't find an item you know exists, the cause is almost always **delegation**. Part of the formula can't run on the data source, so Power Apps downloads only the first 500 rows and works on those. Nothing errors. The results are just incomplete.

This tutorial explains what is happening, how to find the formulas that cause it, and how to rewrite them so they work on every row.

## What delegation means

When you write `Filter(Tasks, Status = "Open")` against a SharePoint list, Power Apps doesn't download the whole list. It sends the condition to SharePoint, SharePoint finds the matching items, and only those come back. That hand-off is called **delegation**, and it is what lets an app work with lists of any size.

A data source can only run the operations it understands. If any part of your formula uses something the source can't do, Power Apps can't delegate **any** of that query. It falls back to downloading a limited number of rows and running the whole formula on the device.

## Why 500, and why sometimes 2,000

The limit for work done on the device is the app's **data row limit**:

- It is **500 by default**.
- You can raise it to **2,000** in **Settings > General > Data row limit**.
- It can't go higher, and a higher limit makes the app slower, especially with wide tables.

So an app that "stops at 500" or "stops at 2,000" is showing you its data row limit. Records after that point are never looked at, so a matching record at row 2,001 simply doesn't appear.

> [!WARNING]
> Raising the limit to 2,000 hides the problem until your data grows past 2,000 rows. Treat it as a stopgap, not a fix.

## Find the formulas that don't delegate

Power Apps flags them for you, but only when the data source is one that supports delegation (SharePoint, Dataverse, SQL Server and Salesforce, among others):

- A **yellow warning triangle** appears on the control.
- A **blue wavy underline** marks the part of the formula that can't be delegated.

> [!TIP]
> While you build, set the data row limit to **1**. Any formula that isn't delegated now returns at most one record, so the problem is obvious in testing instead of surfacing months later in production. Set it back before you publish.

## What SharePoint can and can't delegate

Every data source has its own list. SharePoint is where most people meet this problem, and its rules are narrower than Dataverse's:

| In a `Filter` on SharePoint | Delegates? |
| --- | --- |
| `=` on text, numbers, dates, yes/no, choices | Yes |
| `<`, `>`, `<=`, `>=` on numbers and dates | Yes |
| `<`, `>` on text | No |
| `StartsWith` on text | Yes |
| `Search`, and the `in` operator for "contains" | No |
| `IsBlank` on text | No |
| `Not` | No |
| Person columns | Only on `.Email` and `.DisplayName` |
| The `ID` column | Only `=` |

Joining conditions with `And` (`&&`) or `Or` (`||`) keeps them delegable, as long as every part is.

## Four rewrites that fix most apps

The examples use a SharePoint list called **Tasks** with a text column **Title**, a date column **DueDate** and a text column **ReviewNotes**.

### 1. A search box

`Search` and `in` look for text anywhere in a column, and SharePoint can't do that.

```powerfx
// Not delegable on SharePoint: only the first 500 rows are searched
Search(Tasks, txtSearch.Text, Title)
```

`StartsWith` is delegable. It matches the beginning of the text, which is what most people type into a search box anyway.

```powerfx
// Delegable: searches every row
Filter(Tasks, StartsWith(Title, txtSearch.Text))
```

If you're using the modern text input control, its text is in `.Value` rather than `.Text`.

### 2. Checking for empty values

```powerfx
// Not delegable on SharePoint for text columns
Filter(Tasks, IsBlank(ReviewNotes))
```

Comparing with `Blank()` delegates:

```powerfx
// Delegable on SharePoint
Filter(Tasks, ReviewNotes = Blank())
```

These two aren't exactly the same. `IsBlank` also treats an empty string (`""`) as blank, and `= Blank()` doesn't. For most lists that difference doesn't matter, but check it for yours. This trick works for `=` only, not for `<>`.

### 3. Calculations on a column

Functions that transform a column value, such as `Year()`, `Text()`, `Left()` or `Len()`, can't be delegated.

```powerfx
// Not delegable: Year() runs on every row's DueDate
Filter(Tasks, Year(DueDate) = 2026)
```

Move the calculation to the other side of the comparison. Values that are the same for every row, such as `Date(2026, 1, 1)` or a variable, are sent to the data source as constants and don't block delegation.

> [!NOTE]
> Be careful with `Today()` and `Now()`. Microsoft's general guidance treats them as constants, but its Dataverse page lists them as not delegable for date columns. Put the value in a variable first, for example `Set(varToday, Today())`, and compare the column with the variable.

```powerfx
// Delegable: compares the column with two constant dates
Filter(
    Tasks,
    DueDate >= Date(2026, 1, 1) && DueDate < Date(2027, 1, 1)
)
```

### 4. Copying a list into a collection

```powerfx
// Only the first 500 (or 2,000) rows are copied
ClearCollect(colTasks, Tasks)
```

`ClearCollect` can't be delegated. Copying a large list into a collection "to make filtering easier" quietly truncates it. Filter the source first with a delegable condition, and collect only what you need:

```powerfx
ClearCollect(colMyOpenTasks, Filter(Tasks, Status = "Open" && Owner.Email = User().Email))
```

This result is complete as long as it stays under your data row limit.

## When you can't make it delegable

Some needs, such as "contains" searches across tens of thousands of items, don't have a delegable form on SharePoint. The fix then is to move the work to where the data lives:

- **Dataverse** delegates far more, including `in` for "contains" searches on text.
- **Views or indexed columns** in the data source can do the filtering before Power Apps asks.
- **Narrow the data first** with a delegable filter, such as by owner, status or date range, so the remaining non-delegable step works on a small set.

## Checklist

- No yellow triangles on controls that read large data sources.
- The data row limit is set to 1 during testing, and every screen still works.
- Search boxes use `StartsWith` on SharePoint, not `Search` or `in`.
- No calculations wrap a column inside `Filter`.
- No `ClearCollect` of a whole large list.

The examples follow Microsoft's documented delegation behaviour for SharePoint and Dataverse. Delegation support differs between data sources, so check your connector's list before relying on a specific function.

## Sources

- [Understand delegation in a canvas app (Microsoft Learn)](https://learn.microsoft.com/power-apps/maker/canvas-apps/delegation-overview)
- [Power Apps delegable functions and operations for SharePoint (Microsoft Learn)](https://learn.microsoft.com/power-apps/maker/canvas-apps/connections/connection-sharepoint-online#power-apps-delegable-functions-and-operations-for-sharepoint)
- [Filter, Search and LookUp functions (Microsoft Learn)](https://learn.microsoft.com/power-platform/power-fx/reference/function-filter-lookup)
