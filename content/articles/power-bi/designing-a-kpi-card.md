---
title: "Designing a KPI card: target, trend and context"
slug: designing-a-kpi-card
type: KPI_GUIDE
technology: POWER_BI
topic: reports-and-kpis
excerpt: "A big number on its own tells people nothing: they can't tell if 1.2M is good. A KPI card needs a target, a trend and enough context to read it correctly. Here is how to design one in Power BI, with the DAX behind it."
---
The most common visual on any dashboard is a large number in a box. It's also the most often misread. "Revenue: 1.2M". Is that good? Compared with what? Is it going up? Is it this month or this year? Was the data refreshed this morning or last week?

A KPI card has to answer those questions at a glance. This guide covers what a card needs, how to build it in Power BI, and how to make sure everyone can read it, including people who can't tell red from green.

## The five things a card needs

| Element | Question it answers | Example |
| --- | --- | --- |
| **Value** | Where are we? | Revenue 1.2M |
| **Target** | Where should we be? | Target 1.3M, 8% below |
| **Trend** | Which way are we heading? | Up 12% on the same month last year |
| **Period** | What time does this cover? | March 2026, month to date |
| **Definition** | What exactly is counted? | Invoiced revenue, excluding tax |

A card with only a value makes every reader supply the rest from memory, and different readers remember different things. The five elements above are our recommendation; they aren't a Power BI feature, but Power BI has what you need to show all of them.

## The measures behind the card

Start with measures, not formatting. Assume a model with a **Sales** fact table, a **Targets** table and a marked **Date** table:

```dax
Revenue = SUM ( Sales[SalesAmount] )

Revenue Target = SUM ( Targets[TargetAmount] )

Revenue vs Target % =
DIVIDE ( [Revenue] - [Revenue Target], [Revenue Target] )

Revenue Last Year =
CALCULATE ( [Revenue], SAMEPERIODLASTYEAR ( 'Date'[Date] ) )

Revenue YoY % =
DIVIDE ( [Revenue] - [Revenue Last Year], [Revenue Last Year] )
```

`SAMEPERIODLASTYEAR` is one of the classic time intelligence functions, which need a proper date table marked as a date table. `DIVIDE` returns a blank rather than an error when there's no target or no prior year, so the card shows nothing rather than a misleading value.

Then add a status measure that says in words how the value compares with the target:

```dax
Revenue Status =
VAR Gap = [Revenue vs Target %]
RETURN
    SWITCH (
        TRUE (),
        ISBLANK ( Gap ), BLANK (),
        Gap >= 0, "On or above target",
        Gap >= -0.05, "Within 5% of target",
        "More than 5% below target"
    )
```

The thresholds are examples. Agree them with the KPI's owner, write them down, and use the same ones everywhere the KPI appears.

## Building it: card visual or KPI visual

Power BI has two built-in visuals for this, and they suit different cards.

### The card visual

The current **card visual** can show several values in one visual, and each card can carry:

- **Reference labels:** secondary values, such as the target or the change on last year.
- **Details:** such as the percentage to target.
- **Images from your data:** including a small SVG trend line.
- **Conditional formatting:** of font, background and border colour, based on a measure.

Use it when you want the value, the target gap and the year-on-year change together, laid out your way. Put **Revenue** as the value, and **Revenue vs Target %** and **Revenue YoY %** as reference labels, and show **Revenue Status** as text.

### The KPI visual

The **KPI** visual shows a value, a target and a trend axis in one compact element. It needs:

- a **value** measure;
- a **trend axis**, such as month;
- a **target**.

Set **Direction** to **High is good** or **Low is good**, because for waiting time or cost, lower is better. Sort by the trend axis before you turn a visual into a KPI, because the KPI visual has no sort option of its own. The trend line appears only if the trend axis column is continuous with no blanks.

> [!TIP]
> Use the KPI visual for a quick status tile, and the card visual when readers need the numbers behind the status. A page that mixes the two for the same KPI makes readers compare two designs instead of two numbers.

## Make it readable for everyone

Colour is the usual way to show "good" or "bad", and it fails for many readers. Microsoft's accessibility guidance for Power BI reports says:

- **Contrast.** Text needs a contrast ratio of at least **4.5:1** against its background.
- **Colour pairs to avoid.** These are hard for many people to tell apart: green and red, green and brown, blue and purple, green and blue, light green and yellow, blue and grey, green and grey, and green and black.
- **Checking.** Use a colour-blindness simulator on your report before you publish.

So never let colour carry the meaning alone:

- **Say it in words.** The **Revenue Status** text measure does this.
- **Add a direction.** Use a sign and an arrow or icon that changes shape, not just colour.
- **Keep status colours for status.** If everything on the page is green and red, nothing stands out.

## Show the period and the freshness

Two small labels prevent a large share of misreadings:

- **The period.** Put "March 2026, month to date" on or next to the card, driven by the date filter, so it can't go stale.
- **Data as of.** Show when the data was last refreshed. Stale numbers presented as current are worse than no numbers.

Put the KPI's definition in the visual header tooltip or the measure's description, so a reader can check what's counted without asking.

## Checklist

- The card shows value, target, trend and period, not just a number.
- Target and prior-period measures return a blank, not zero, when there's nothing to compare with.
- The status is stated in words, and doesn't depend on colour alone.
- Text contrast is at least 4.5:1, and the report has been checked with a colour-blindness simulator.
- **Direction** is set correctly for KPIs where lower is better.
- The definition and refresh time are one hover away.

The steps follow Microsoft's documented behaviour for the card and KPI visuals, DAX time intelligence and accessible report design. The five-element card structure and the status thresholds are our own recommendations.

## Sources

- [Create a card visual in Power BI (Microsoft Learn)](https://learn.microsoft.com/power-bi/visuals/power-bi-visualization-card)
- [Create key performance indicator (KPI) visualizations (Microsoft Learn)](https://learn.microsoft.com/power-bi/visuals/power-bi-visualization-kpi)
- [Design Power BI reports for accessibility (Microsoft Learn)](https://learn.microsoft.com/power-bi/create-reports/desktop-accessibility-creating-reports)
- [Set and use date tables in Power BI Desktop (Microsoft Learn)](https://learn.microsoft.com/power-bi/transform-model/desktop-date-tables)
