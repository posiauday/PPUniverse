---
title: "Why are my totals wrong? Filter context explained"
slug: why-are-my-totals-wrong
type: TUTORIAL
technology: POWER_BI
topic: dax
excerpt: "Every row in the table looks right and the total doesn't add up. It isn't a bug: Power BI recalculates the total rather than adding the rows. Here is why, and four patterns that make totals behave."
searchPhrase: "power bi total wrong"
---
You build a table visual, check a few rows against the source, and they're right. Then you look at the total row, and it isn't the sum of the rows above it. Sometimes it's bigger, sometimes smaller, sometimes blank.

This isn't a bug. It's **filter context**, the single most important idea in DAX. Once you see it, wrong totals become easy to fix.

> [!ANSWER] Quick answer
> 1. [The total row is evaluated with no row filter](#what-the-total-row-actually-does): it isn't the sum of the rows above it.
> 2. [For a rule that applies per item, iterate](#case-1-a-condition-in-the-measure) with `SUMX` or `AVERAGEX` over that item.
> 3. [For a share of the total, use `CALCULATE` with `REMOVEFILTERS`](#case-3-a-share-of-the-total) on only the right table.

## What the total row actually does

A measure has no fixed value. Power BI evaluates it separately for every cell in a visual, each time with a different set of filters:

- **The "West" row** is evaluated with the filter `Region = West`.
- **The "East" row** is evaluated with the filter `Region = East`.
- **The total row** is evaluated with **no region filter at all**.

That set of filters is the **filter context**. It comes from the visual's rows and columns, slicers, page and report filters, and relationships that carry filters from one table to another.

The key point: **the total row doesn't add up the cells above it.** It runs the same measure again, over all the data the total covers. For a simple sum those are the same thing. For anything else, they may not be.

## Case 1: a condition in the measure

A sales bonus pays 5% to anyone who sells more than 10,000:

```dax
Bonus =
IF ( [Total Sales] > 10000, [Total Sales] * 0.05, 0 )
```

| Salesperson | Total Sales | Bonus |
| --- | --- | --- |
| Ana | 8,000 | 0 |
| Ben | 12,000 | 600 |
| Chen | 9,000 | 0 |
| **Total** | **29,000** | **1,450** |

The rows are right; the total is wrong. In the total row there's no salesperson filter, so `[Total Sales]` is 29,000. That's more than 10,000, so the measure pays 5% of 29,000.

The fix is to tell DAX to work out the bonus **per salesperson** and then add those results up. `SUMX` does this: it goes through a table row by row, evaluates an expression for each, and sums the answers.

```dax
Bonus =
SUMX (
    VALUES ( Salesperson[Salesperson] ),
    IF ( [Total Sales] > 10000, [Total Sales] * 0.05, 0 )
)
```

`VALUES ( Salesperson[Salesperson] )` returns the salespeople visible in the current cell: one on each row, all three on the total row. For each one, DAX evaluates the `IF`. Because `[Total Sales]` is a measure, calling it inside the loop gives **that salesperson's** sales. That's called **context transition**. The total is now 0 + 600 + 0 = 600.

> [!TIP]
> Ask "at what level does this rule apply?" Here the rule applies per salesperson, so the iteration goes over salespeople. If the bonus were per order, you'd iterate over orders instead.

## Case 2: an average that isn't the average of the rows

```dax
Average Order Value =
DIVIDE ( [Total Sales], DISTINCTCOUNT ( Sales[OrderNumber] ) )
```

| Region | Total Sales | Orders | Average Order Value |
| --- | --- | --- | --- |
| West | 40,000 | 100 | 400 |
| East | 10,000 | 50 | 200 |
| **Total** | **50,000** | **150** | **333** |

People often expect 300, the average of 400 and 200. But 333 is correct: it's total sales divided by total orders. Averaging the two regional averages would give East the same weight as West, although it has half the orders.

Here the total isn't wrong, it's **different from what someone expected**. Decide which answer the business wants, and say which one the visual shows. If people truly need the average of the regional figures, make that its own clearly named measure:

```dax
Average of Regional AOV =
AVERAGEX ( VALUES ( Region[Region] ), [Average Order Value] )
```

`DIVIDE` returns a blank instead of an error when the denominator is zero, which is why Microsoft recommends it over the `/` operator for measures.

## Case 3: a share of the total

To show each region's share of all sales, you need the denominator to ignore the region filter while the numerator keeps it. `CALCULATE` changes the filter context, and `REMOVEFILTERS` clears filters from a table or column:

```dax
% of All Regions =
DIVIDE (
    [Total Sales],
    CALCULATE ( [Total Sales], REMOVEFILTERS ( Region ) )
)
```

On each row, the numerator is that region's sales and the denominator is all regions. On the total row both are the same, so the total shows 100%.

> [!NOTE]
> `REMOVEFILTERS ( Region )` clears only filters on the **Region** table. A slicer on year or product still applies to both parts, which is usually what you want: "this region's share of all sales in 2026", not "of all time".

## Case 4: a value that has no meaningful total

Some measures only make sense for one item at a time: a unit price, a latest status, a target that's set per region. On the total row they produce a confusing number. Return a blank when more than one item is in context:

```dax
Current Unit Price =
IF (
    HASONEVALUE ( Product[ProductName] ),
    MAX ( Product[UnitPrice] )
)
```

`HASONEVALUE` is true when the filter context has narrowed a column to exactly one value. With no third argument, `IF` returns a blank otherwise, so the total row stays empty instead of showing the highest price of all products.

## Calculated columns aren't the answer

A common workaround is to calculate the bonus in a **calculated column** on the sales table. Calculated columns are computed once per row at refresh time. They don't know about the report's filters, so a rule like "more than 10,000 in total" can't be expressed per row of a sales table at all. Rules about totals belong in measures.

## Checklist

- Every measure has been checked on the total row, not just on the detail rows.
- Rules that apply per item (per customer, per order) iterate with `SUMX` or `AVERAGEX` over that item.
- Averages state what they average, and the visual shows the one the business wants.
- Shares of a total use `CALCULATE` with `REMOVEFILTERS` on only the right table.
- Measures that have no meaningful total return a blank there.
- Divisions use `DIVIDE`.

The examples follow Microsoft's documented behaviour for DAX filter context and functions. The measures are examples written for this article.

## Sources

- [DAX overview: context (Microsoft Learn)](https://learn.microsoft.com/dax/dax-overview#context)
- [SUMX function (Microsoft Learn)](https://learn.microsoft.com/dax/sumx-function-dax)
- [CALCULATE function (Microsoft Learn)](https://learn.microsoft.com/dax/calculate-function-dax)
- [HASONEVALUE function (Microsoft Learn)](https://learn.microsoft.com/dax/hasonevalue-function-dax)
- [DIVIDE function vs. divide operator (Microsoft Learn)](https://learn.microsoft.com/dax/best-practices/dax-divide-function-operator)
