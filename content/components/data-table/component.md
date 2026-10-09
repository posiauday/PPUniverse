---
title: "Data table"
slug: data-table
category: data-display
summary: "Your rows as a table, cards or a list, with coloured status pills, segmented progress, sortable headers, checkboxes with bulk actions, a row menu, and loading and empty states. Select a row to open it. Built on a gallery, so it looks the way you want."
access: MEMBERS
version: 0.1.0
modernControls: yes
---
## When to use it

Use **lcsDataTable** for any list of records people scan, open and act on: requests, orders, cases, tasks. A plain gallery needs all of this built by hand. Microsoft's modern Data grid control can't be styled this way. This component gives you:

- **Three views from one switch:** a **Table**, **Cards** that wrap two or three across, and a **List** with an initial and pills. The user picks; you can start them on any view.
- **Select a row to open it.** The whole row, card or list item is the button, and it runs `OnRowSelect(RowId)`.
- **Columns from a table you set:** up to six, each with a label, a width and a kind. **Text**, **Strong** (bold, for IDs), **Badge** (a coloured pill) or **Progress** (a segmented bar from text such as `2/4`).
- **Pills coloured by their text,** from your `BadgeStyles` table: In progress is blue, Completed green, High red. Text with no style is grey.
- **Sortable headers** that tell your app which column and which way (`OnSort`), so you sort the data source itself.
- **Checkboxes and bulk actions:** select rows, then Approve or Reject them together (`OnBulkAction(Action, RowIds)`).
- **A row menu** that opens inside the row (View, Edit, Delete) and runs `OnRowAction(Action, RowId)`.
- **Loading and empty states**, two densities, your `AccentColor` and a `Dark` theme.

## Use it

The examples call it `dtOrders` on your screen.

Give it your rows. Each row needs an `Id` and the text for each column in `C1` to `C6`, in the order of `Columns`:

```powerfx
// dtOrders.Rows
ForAll(
    colOrders,
    {
        Id: Text(ID),
        C1: "#" & OrderNumber,
        C2: Customer,
        C3: Status,
        C4: StepsDone & "/" & StepsTotal,
        C5: Text(DueDate, "mmm d"),
        C6: Priority
    }
)
```

Describe the columns:

```powerfx
// dtOrders.Columns
Table(
    { Label: "Order", Width: 110, Kind: "Strong" },
    { Label: "Customer", Width: 200, Kind: "Text" },
    { Label: "Status", Width: 140, Kind: "Badge" },
    { Label: "Progress", Width: 190, Kind: "Progress" },
    { Label: "Due", Width: 110, Kind: "Text" },
    { Label: "Priority", Width: 110, Kind: "Badge" }
)
```

Open the record the user selects:

```powerfx
// dtOrders.OnRowSelect
Navigate(OrderScreen, ScreenTransition.None, { varOrder: LookUp(Orders, Text(ID) = RowId) })
```

Act from the row menu:

```powerfx
// dtOrders.RowActions
"View,Edit,Delete"

// dtOrders.OnRowAction
Switch(
    Action,
    "View", Navigate(OrderScreen, ScreenTransition.None, { varOrder: LookUp(Orders, Text(ID) = RowId) }),
    "Edit", Navigate(EditScreen, ScreenTransition.None, { varOrder: LookUp(Orders, Text(ID) = RowId) }),
    "Delete", Remove(Orders, LookUp(Orders, Text(ID) = RowId))
)
```

Approve several at once:

```powerfx
// dtOrders.BulkActions
"Approve,Reject"

// dtOrders.OnBulkAction
ForAll(
    Split(RowIds, ";") As picked,
    Patch(Orders, LookUp(Orders, Text(ID) = picked.Value), { Status: If(Action = "Approve", "Approved", "Rejected") })
);
dtOrders.ClearSelection()
```

Sort when a header is selected. Sorting the data source keeps it delegable:

```powerfx
// colOrders, where you load it, sorted by dtOrders.SortColumn
Switch(
    dtOrders.SortColumn,
    2, SortByColumns(Orders, Customer, If(dtOrders.SortDescending, SortOrder.Descending, SortOrder.Ascending)),
    5, SortByColumns(Orders, DueDate, If(dtOrders.SortDescending, SortOrder.Descending, SortOrder.Ascending)),
    Orders
)
```

Show grey rows while you load, and page long lists with the **Pagination** component:

```powerfx
// dtOrders.Loading
locLoading

// dtOrders.Rows, with Pagination named pgOrders
LastN(FirstN(colOrderRows, pgOrders.LastRow), pgOrders.RowsOnPage)
```

## Accessibility

- Each row, card and list item is one button, named by its title column, so screen readers say what it opens.
- Checkboxes are named "Select" and the row's title. The menu button says "Actions for" the row, and each action says what it does and to which row ("Edit Avery Brooks").
- Headers say which column they sort and how it's sorted now. Sorted columns also show an arrow.
- Pills always show their text, so colour is never the only signal.
- Choose `BadgeStyles` colours with enough contrast; the defaults meet WCAG AA.

## Known limits

- Up to six columns, as text. Turn numbers and dates into text in `Rows` (`Text(DueDate, "mmm d")`).
- Keep the column widths within the component's width; columns past the edge are cut off.
- Cards show the first two Badge columns, the first Progress column and one more text column. The list shows the first two Badge columns.
- Progress bars show up to ten segments.
- The row menu opens inside the row, so it can't hang below the last row.
- Checkboxes use the modern Checkbox control. If your environment doesn't have it, set `Selectable` to false.
- For very large tables with thousands of rows on screen, Microsoft's modern Data grid control virtualises its rows; this component draws the rows you give it, so page them.

## Change log

- **0.1.0:** first version: table, card and list views; Text, Strong, Badge and Progress columns; badge styles; sorting through `OnSort`; checkboxes and bulk actions; the row menu; loading and empty states; two densities.
