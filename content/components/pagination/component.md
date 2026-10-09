---
title: "Pagination"
slug: pagination
category: navigation-and-layout
summary: "First, previous, next and last, page numbers with ellipses, rows per page and a summary such as 21–40 of 312 orders. It tells your gallery which rows to show, and OnPageChange lets you load one page at a time."
access: OPEN
version: 0.1.0
modernControls: yes
---
## When to use it

Use **lcsPagination** under a gallery or table with more rows than fit on one screen. Power Apps galleries only scroll; paging means rebuilding the same formulas every time. This component has them:

- **First, previous, next and last** buttons, which turn grey at either end;
- **Page numbers with ellipses**, never more than seven buttons: 1 … 4 5 6 … 32;
- **Rows per page**, from your own list (`PageSizes`), which goes back to page 1 when it changes;
- **A summary**, such as "21–40 of 312 orders";
- **A compact mode**, "Page 3 of 32", for phones;
- **Outputs that drive your gallery**: `Page`, `PageSize`, `PageCount`, `FirstRow`, `LastRow` and `RowsOnPage`;
- **`OnPageChange(NewPage, NewPageSize)`**, for apps that load one page at a time;
- **`GoTo(PageNumber)`** and **`Reset()`**, for when a filter or search changes.

## Use it

The examples call it `pgOrders` on your screen.

Page a collection of up to 2,000 rows:

```powerfx
// Screen1.OnVisible
ClearCollect(colOrders, Orders)

// pgOrders.TotalItems
CountRows(colOrders)

// galOrders.Items
LastN(FirstN(colOrders, pgOrders.LastRow), pgOrders.RowsOnPage)
```

Call the items what they are:

```powerfx
// pgOrders.ItemLabel
"orders"
```

Go back to page 1 when the search changes:

```powerfx
// txtSearch.OnChange
pgOrders.GoTo(1)
```

On a phone, show "Page 3 of 32" and hide the extras:

```powerfx
// pgOrders.Compact
App.Width < 600

// pgOrders.ShowFirstLast and pgOrders.ShowPageSize
App.Width >= 600
```

Load one page at a time, with your own flow or query that takes a page and a size:

```powerfx
// pgOrders.OnPageChange
ClearCollect(colPage, GetOrdersPage.Run(NewPage, NewPageSize))
```

## Accessibility

- Every button has a name: "First page", "Previous page", "Page 4, current page", "Next page" and "Last page". The ellipses are named "More pages" and can't be selected.
- The current page is filled in your accent colour, and its name says "current page", so it doesn't rely on colour alone.
- The buttons at either end turn grey and are skipped by the Tab key when there's nowhere to go.

## Known limits

- `LastN(FirstN(...))` works on a collection or up to your app's data row limit (500 by default, 2,000 at most), because those functions aren't delegable. For bigger tables, load each page yourself in `OnPageChange`.
- The component can't tell when `TotalItems` changes. If a filter leaves fewer pages, it shows the last page there is; call `GoTo(1)` when you'd rather start again.
- At most seven page buttons show. Make the component wider than 456 so they fit with First and Last, or use `Compact`.
- Put `DefaultPageSize` in `PageSizes`, or the list starts empty (the default size still applies).

## Change log

- **0.1.0:** first version: first, previous, next and last; page numbers with ellipses; rows per page; the summary; compact mode; the row outputs; `OnPageChange`, `GoTo` and `Reset`.
