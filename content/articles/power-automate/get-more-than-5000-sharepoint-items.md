---
title: "Get more than 5,000 SharePoint items in Power Automate"
slug: get-more-than-5000-sharepoint-items
type: TUTORIAL
technology: POWER_AUTOMATE
topic: triggers-and-design
excerpt: "Why Get items returns 100 rows, stops at 5,000 or fails with 'exceeds the list view threshold', and the four fixes in order: Top Count, pagination, indexed columns, and a loop for lists beyond 100,000 items."
searchPhrase: "get items more than 5000 power automate"
---
Your SharePoint list has 12,000 items and the Power Automate flow processes 100. Or it processes exactly 5,000, or fails with *"The attempted operation is prohibited because it exceeds the list view threshold."* Three different limits cause these, and each has its own fix.

> [!ANSWER] Quick answer: match your symptom
> 1. [Exactly 100 items](#fix-1-more-than-100-but-under-5000): set **Top Count** to `5000` in Get items.
> 2. [Stops at 5,000, or could grow past it](#fix-2-up-to-100000-items-with-pagination): turn on **Pagination** with a threshold above the list's size.
> 3. ["Exceeds the list view threshold"](#fix-3-exceeds-the-list-view-threshold-index-the-columns-you-filter-on): index the columns you filter or sort on.
> 4. [Over 100,000 items](#fix-4-more-than-100000-items-loop-in-batches): loop through the list in batches by ID.

> [!NOTE]
> Checked against Microsoft Learn on 6 October 2026.

## The three limits

| Limit | Value | What it does |
| --- | --- | --- |
| **Get items default** | **100** items | With no settings changed, Get items returns the first 100. Nothing warns you |
| **Top Count** | up to **5,000** | One request can't return more than 5,000. Asking for more makes the action fail |
| **List view threshold** | **5,000** items | A query that has to look at more than 5,000 items to answer, such as a filter on a column without an index, is refused |

Pagination then lifts the total a single **Get items** can return to **100,000** items, or 5,000 on the Low performance profile.

## Fix 1: More than 100 but under 5,000

Open **Get items** → **Advanced parameters** (or **Show advanced options**), and set **Top Count** to `5000`.

That's all you need for a small list. Any list that may grow past 5,000 needs fix 2.

## Fix 2: Up to 100,000 items, with pagination

1. Select the **Get items** action → **Settings** (in the classic designer, **…** → **Settings**).
2. Turn **Pagination** on.
3. Set **Threshold** to the most items you expect, for example `20000`. The maximum is **100,000**.

The action now repeats its request behind the scenes and returns everything up to the threshold as one array.

> [!WARNING]
> On a list with more than 5,000 items, a **Filter Query** with pagination *off* can return **nothing** if no matching items happen to be in the first 5,000. Turn pagination on for big lists even when you expect only a few matches.

Things to know:
- **The threshold rounds up to whole pages.** With 5,000-item pages, a threshold of 7,000 returns up to 10,000.
- **Every page counts toward your request limits.** Pagination and retries count as actions, so 100,000 items is 20 requests before you've processed a single row.
- **Big outputs are slow.** Turn on **Limit Columns by View** in the action and pick a view with only the columns you need, or use **Select** straight after, so the flow carries less data.

## Fix 3: "Exceeds the list view threshold": index the columns you filter on

If the error appears even with pagination on, your **Filter Query** or **Order By** uses a column SharePoint can't search efficiently. On a list over 5,000 items, filters must be able to use an **indexed** column.

1. In the list, go to **Settings** → **List settings** → **Indexed columns** → **Create a new index**.
2. Index each column used in **Filter Query** and **Order By**: commonly Status, a date, Created and Modified.
3. Put the most selective condition first, the one that leaves the fewest items. For example, filter on a date range before a Yes/No column.

> [!TIP]
> Add indexes **before** a list grows large. SharePoint only lets you add or remove an index while the list has **20,000 items or fewer**. On a bigger list, plan the indexes ahead or you'll need a new list.

## Fix 4: More than 100,000 items: loop in batches

Past the pagination limit, fetch the list in chunks yourself. A common pattern walks the list by ID, which is always indexed:

1. Initialize two variables: `lastId` (integer, `0`) and `done` (boolean, `false`).
2. Add a **Do until** loop that stops when `done` is `true`. Raise its count limit; it allows 60 rounds by default and up to 5,000.
3. Inside the loop, use **Get items** with:
   - **Filter Query:** `ID gt @{variables('lastId')}`
   - **Order By:** `ID asc`
   - **Top Count:** `5000`
4. Process the items, often by appending them to an array variable or writing them out in bulk.
5. Set `lastId` to the ID of the last item returned:

```text
last(body('Get_items')?['value'])?['ID']
```

6. If the action returned fewer than 5,000 items, set `done` to `true`:

```text
less(length(body('Get_items')?['value']), 5000)
```

This keeps every request under the threshold, works on lists of any size, and lets you resume from `lastId` if a run fails part-way.

> [!NOTE]
> Watch your daily request limit. A 300,000-item list is 60 requests just to read, plus whatever you do with each item. For one-off exports of very large lists, the list's own **Export to CSV** or a Power BI dataflow is often faster than a flow.

## Choosing the fix

| Your list | Do this |
| --- | --- |
| Under 5,000 items, for good | Top Count `5000` |
| Could pass 5,000 | Pagination with a threshold above the expected size, plus indexes on filtered columns |
| Filter or sort errors with "exceeds the list view threshold" | Index those columns |
| Over 100,000 items | Batch loop by ID |
| Reading the whole list every run | Rethink it: trigger on changes (**When an item is created or modified**) and process only what changed |

## Sources

- Microsoft Learn: [Working with Get items and Get files](https://learn.microsoft.com/sharepoint/dev/business-apps/power-automate/guidance/working-with-get-items-and-get-files)
- Microsoft Learn: [Limits of automated, scheduled and instant flows: paginated items and Do until](https://learn.microsoft.com/power-automate/limits-and-config#concurrency-looping-and-debatching-limits)
- Microsoft Learn: [Use lists of rows in flows: pagination threshold](https://learn.microsoft.com/power-automate/dataverse/list-rows#turn-on-pagination-to-request-more-than-5000-rows)
- Microsoft Learn: ["The number of items in this list exceeds the list view threshold"](https://learn.microsoft.com/troubleshoot/sharepoint/lists-and-libraries/items-exceeds-list-view-threshold)
- Microsoft Learn: ["Cannot show the value of the filter" (indexes and the 20,000-item limit)](https://learn.microsoft.com/troubleshoot/sharepoint/lists-and-libraries/fails-filtering-sharepoint-column)
- Microsoft Learn: [Troubleshoot cloud flow errors: list view threshold message](https://learn.microsoft.com/power-automate/troubleshoot-flow-errors)
