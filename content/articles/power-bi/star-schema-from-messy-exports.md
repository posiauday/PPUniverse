---
title: "Build a star schema from messy exports"
slug: star-schema-from-messy-exports
type: TUTORIAL
technology: POWER_BI
topic: data-modelling
excerpt: "One wide export loaded as one Power BI table works until the report grows. Here is how to split a flat file into fact and dimension tables in Power Query, step by step, so the model stays fast and the numbers stay right."
searchPhrase: "power bi star schema"
---
Most Power BI reports start the same way: someone exports a spreadsheet from a system, loads it as a single table, and builds visuals on it. It works at first. Then the file grows, a second export arrives that needs to line up with the first, and totals start behaving strangely.

The fix is a **star schema**: a model with one table of events (the **fact** table) and separate tables that describe them (the **dimension** tables). Microsoft's modelling guidance recommends it for Power BI, and this tutorial shows how to build one from a flat export using only Power Query.

## What you're building

The example is a sales export with one row per order line:

| OrderDate | OrderNumber | CustomerName | CustomerRegion | ProductName | Category | Quantity | UnitPrice |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 2026-03-02 | SO-1041 | Northwind Traders | West | Desk lamp | Lighting | 4 | 39.00 |
| 2026-03-02 | SO-1041 | Northwind Traders | West | Cable tray | Accessories | 10 | 6.50 |

You'll turn it into four tables:

- **Sales** (fact): one row per order line, with keys and numbers only.
- **Customer** (dimension): one row per customer.
- **Product** (dimension): one row per product.
- **Date** (dimension): one row per day.

Each dimension relates to **Sales** with a **one-to-many** relationship. Dimension tables are what you filter and group by; the fact table is what you add up. In Power BI, the relationship's "one" side is always the dimension and the "many" side is always the fact.

## Step 1: clean once, in a staging query

Load the export into Power Query and name the query **SalesClean**. Do all the cleaning here, once, before anything is split:

- Set the data types for every column (dates as **Date**, numbers as **Decimal number** or **Whole number**).
- Trim spaces from text columns, and make casing consistent.
- Remove blank rows and any total rows the export added.

```powerquery
let
    Source = Csv.Document(File.Contents("C:\Exports\sales.csv"), [Delimiter = ",", Encoding = 65001]),
    Headers = Table.PromoteHeaders(Source, [PromoteAllScalars = true]),
    Typed = Table.TransformColumnTypes(Headers, {
        {"OrderDate", type date}, {"OrderNumber", type text},
        {"CustomerName", type text}, {"CustomerRegion", type text},
        {"ProductName", type text}, {"Category", type text},
        {"Quantity", Int64.Type}, {"UnitPrice", type number}
    }),
    Trimmed = Table.TransformColumns(Typed, {
        {"CustomerName", each Text.Proper(Text.Trim(_)), type text},
        {"CustomerRegion", each Text.Trim(_), type text},
        {"ProductName", each Text.Trim(_), type text},
        {"Category", each Text.Trim(_), type text}
    }),
    NoBlanks = Table.SelectRows(Trimmed, each [OrderNumber] <> null and [OrderNumber] <> "")
in
    NoBlanks
```

Right-click **SalesClean** and clear **Enable load**. It feeds the other queries but doesn't become a table in the model.

> [!WARNING]
> Clean before you remove duplicates. Power Query compares text exactly, so "Northwind Traders" and "northwind traders " count as two customers. The model engine, however, compares text without regard to case. The two can disagree, and a dimension that looks unique in Power Query can then fail as the "one" side of a relationship.

## Step 2: build each dimension

Right-click **SalesClean**, select **Reference**, and name the new query **Customer**. Then keep the descriptive columns, remove duplicates, and add a key:

```powerquery
let
    Source = SalesClean,
    Columns = Table.SelectColumns(Source, {"CustomerName", "CustomerRegion"}),
    Distinct = Table.Distinct(Columns),
    WithKey = Table.AddIndexColumn(Distinct, "CustomerKey", 1, 1, Int64.Type)
in
    WithKey
```

The index column is a **surrogate key**: a unique number added so the dimension has one column that identifies each row. Microsoft's star schema guidance uses exactly this technique when the source has no single unique column.

Repeat for **Product** with `ProductName` and `Category`, adding `ProductKey`.

> [!NOTE]
> These keys are regenerated on every refresh. That's fine inside the model, because the fact table is rebuilt from the same queries at the same time. Don't copy them into other systems as permanent IDs.

## Step 3: build the fact table

Reference **SalesClean** again and name the query **Sales**. Merge in each dimension's key, then drop the descriptive columns:

```powerquery
let
    Source = SalesClean,
    WithCustomer = Table.NestedJoin(Source, {"CustomerName", "CustomerRegion"},
        Customer, {"CustomerName", "CustomerRegion"}, "C", JoinKind.LeftOuter),
    CustomerKey = Table.ExpandTableColumn(WithCustomer, "C", {"CustomerKey"}),
    WithProduct = Table.NestedJoin(CustomerKey, {"ProductName", "Category"},
        Product, {"ProductName", "Category"}, "P", JoinKind.LeftOuter),
    ProductKey = Table.ExpandTableColumn(WithProduct, "P", {"ProductKey"}),
    Amount = Table.AddColumn(ProductKey, "SalesAmount", each [Quantity] * [UnitPrice], type number),
    Final = Table.SelectColumns(Amount,
        {"OrderDate", "OrderNumber", "CustomerKey", "ProductKey", "Quantity", "UnitPrice", "SalesAmount"})
in
    Final
```

The fact table now holds only what you'll add up, plus the keys that connect it to the dimensions. `OrderNumber` stays in it: it's an attribute of the event that people filter by, and Microsoft's guidance calls this a **degenerate dimension**, an accepted exception to "facts and dimensions in separate tables".

> [!TIP]
> Keep every fact table at one **grain**: here, one row per order line. If a second export has one row per order, or targets per month, it becomes a separate fact table that shares the same dimensions, not extra columns on this one.

## Step 4: add a date table

Don't rely on **Auto date/time** for a model like this. It creates a hidden date table for every date column, which makes the model bigger. It also can't filter two fact tables with one date slicer, and it only knows calendar years. Microsoft recommends your own date table instead, and turning the automatic option off (**File > Options and settings > Options > Current File > Data Load > Time intelligence**).

A date table needs one row per day, with no gaps or blanks, covering full years. Create it in DAX with **New table**:

```dax
Date =
ADDCOLUMNS (
    CALENDAR ( DATE ( 2024, 1, 1 ), DATE ( 2026, 12, 31 ) ),
    "Year", YEAR ( [Date] ),
    "Month Number", MONTH ( [Date] ),
    "Month", FORMAT ( [Date], "mmm yyyy" )
)
```

If you use the classic time intelligence functions (such as `SAMEPERIODLASTYEAR`), also **mark it as a date table** on the **Table tools** ribbon. Sort the **Month** column by **Month Number** so months appear in calendar order.

## Step 5: relate the tables

In the **Model** view, create these relationships:

| From (one side) | To (many side) | Direction |
| --- | --- | --- |
| `Customer[CustomerKey]` | `Sales[CustomerKey]` | Single |
| `Product[ProductKey]` | `Sales[ProductKey]` | Single |
| `Date[Date]` | `Sales[OrderDate]` | Single |

Then tidy up for report authors:

- **Hide the key columns** in every table. Nobody should drag `CustomerKey` into a visual.
- **Hide the numeric columns** in **Sales** and create **explicit measures** instead, such as `Total Sales = SUM ( Sales[SalesAmount] )`. Measures can be reused in other measures, and they stop authors summing things that must not be summed, like `UnitPrice`.
- **Add descriptions** to measures. They appear as tooltips in the **Data** pane.

## Checklist

- One staging query does all the cleaning, and isn't loaded.
- Each dimension is unique on its key, with text cleaned before duplicates are removed.
- The fact table holds keys, numbers and degenerate attributes, at a single grain.
- A proper date table replaces Auto date/time.
- Relationships are one-to-many, single direction, from dimension to fact.
- Keys and raw numeric columns are hidden; explicit measures are used instead.

The steps follow Microsoft's documented star schema, relationship and date table guidance for Power BI.

## Sources

- [Understand star schema and the importance for Power BI (Microsoft Learn)](https://learn.microsoft.com/power-bi/guidance/star-schema)
- [Model relationships in Power BI Desktop (Microsoft Learn)](https://learn.microsoft.com/power-bi/transform-model/desktop-relationships-understand)
- [Design guidance for date tables in Power BI Desktop (Microsoft Learn)](https://learn.microsoft.com/power-bi/guidance/model-date-tables)
- [Auto date/time guidance in Power BI Desktop (Microsoft Learn)](https://learn.microsoft.com/power-bi/guidance/auto-date-time)
