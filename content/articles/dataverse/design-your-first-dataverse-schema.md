---
title: "Design your first Dataverse schema"
slug: design-your-first-dataverse-schema
type: TUTORIAL
technology: DATAVERSE
topic: tables-and-schema
excerpt: "Table names you can't change, an ownership setting you can't undo, and a lookup that reveals names to people who shouldn't see them. The decisions to get right before you create your first Dataverse table, worked through on a real example."
---
Dataverse makes creating a table look easy, and it is. What it doesn't make obvious is that several choices you make in the first five minutes can't be changed later. This tutorial works through a small schema and points out each decision that's permanent, so you make it on purpose.

The example is an equipment loan service: staff borrow laptops, cameras and projectors, and the team tracks who has what.

## Step 1: start in a solution, with your own publisher

Before creating any table, create a **solution** with your own **publisher**. The publisher's customization prefix becomes part of the internal name of every table, column and relationship you create. For example, a prefix of `eql` makes a table called **Loan** into `eql_loan`.

If you create tables outside a solution, they go into the default solution, whose prefix is a random string such as `cr8a3`. Microsoft's guidance is to use a custom publisher and solution for anything you'll deploy.

> [!WARNING]
> Table and column names can't be changed after creation, apart from display names. Pick the publisher and its prefix first; they'll be in every name for the life of the solution.

## Step 2: find the tables

Write down the nouns in the process, and decide which are things you'll store:

| Table | One row is | Example |
| --- | --- | --- |
| **Equipment** | One physical item | Laptop LT-0042 |
| **Equipment Type** | A kind of item | Laptop, Camera, Projector |
| **Loan** | One item lent to one person for one period | LT-0042 to Priya, 3 to 10 March |

People are already in Dataverse as the **User** table, and external borrowers would be **Contact** rows. Reuse standard tables where they fit, rather than building your own copies.

## Step 3: choose ownership, once

When you create each table you choose its ownership:

- **User or team owned:** each row has an owner, and security roles can grant access at the User, Business Unit, Parent: Child Business Unit or Organization level. Choose this for rows that belong to someone, such as **Loan**.
- **Organization owned:** rows have no owner, and privileges are simply granted or denied. Choose this for shared reference data, such as **Equipment Type**.

This choice can't be changed after the table is created. If there's any chance some people should see only some rows, choose user or team owned.

## Step 4: set the primary name column

Every table has a **primary name column**, the text shown when a row appears in a lookup. Make it something meaningful, such as `LT-0042 – Dell Latitude` for **Equipment**.

> [!WARNING]
> When a row has a lookup to another row, Dataverse returns that related row's primary name to anyone who can read the first row, even if they can't open the related row itself. Never put sensitive information in a primary name column.

## Step 5: choose column types deliberately

- **Choice** for short, fixed lists that rarely change, such as **Loan Status**: Requested, On loan, Returned, Overdue.
- **Lookup** for anything that's really another table or that business users will maintain, such as **Equipment Type**. If you'd want to add a description, a manager or an "active" flag to the values, it's a table, not a choice.
- **A date-only column with the "Date only" behaviour** for dates without a time, such as **Due date**. With the default "User local" behaviour, a date can still shift to the day before or after for people in other time zones. Set the behaviour when you create the column.
- **Whole number** or **Decimal** for quantities, and **Currency** for money.

## Step 6: add relationships

Adding a lookup column creates a **one-to-many** relationship. In this schema:

- **Equipment Type** to **Equipment**: one type, many items.
- **Equipment** to **Loan**: one item, many loans over time.
- **User** to **Loan**: one borrower, many loans.

For each relationship, decide what happens when the parent row is deleted, assigned or shared. That's the relationship's **cascading behaviour**. For **Equipment** to **Loan**, you almost certainly want to *restrict* deletion: an item with loan history shouldn't vanish and take its history with it.

Use a **many-to-many** relationship only when both sides are genuinely peers with no data about the link itself. If the link has its own facts, such as dates, status or quantity, it's a table (as **Loan** is), not a many-to-many relationship.

## Step 7: protect uniqueness with an alternate key

Each item has an asset tag, such as LT-0042, that must be unique. Define an **alternate key** on **Asset Tag**. Dataverse then refuses a second row with the same value, and integrations can find rows by asset tag instead of by GUID.

A few limits to know:

- **Key column types.** A key can use whole number, decimal, single line of text, date and time, lookup or choice columns.
- **Up to 10 keys per table.**
- **Blank values aren't checked.** Uniqueness isn't enforced for blank values, so make the key column required.
- **Special characters break updates.** If key values contain characters such as `/`, `#` or `&`, updates and upserts through the API that use the key won't work.

## Step 8: put rules in the data layer

Rules that must always hold belong in Dataverse, not just in one app:

- **Required columns** for what every row must have.
- **Business rules** for simple conditions. For example: if **Status** is On loan, **Due date** is required.
- **Calculated columns** for derived values, such as days overdue.

That way, a flow or a second app can't skip the rule.

## Checklist

- A solution with your own publisher prefix exists before the first table.
- Each table's ownership was chosen deliberately: user or team owned for anything that belongs to someone.
- Primary names are meaningful and contain nothing sensitive.
- Values that need their own attributes are lookups to tables, not choices.
- Each relationship has its cascading behaviour set on purpose.
- Business identifiers have a required column and an alternate key.

The steps follow Microsoft's documented behaviour for Dataverse tables, columns, relationships, alternate keys and solutions. The example schema is our own.

## Sources

- [Table definitions in Microsoft Dataverse (Microsoft Learn)](https://learn.microsoft.com/power-apps/developer/data-platform/entity-metadata)
- [Use a solution to customize (Microsoft Learn)](https://learn.microsoft.com/power-platform/alm/use-solutions-for-your-customizations)
- [Create a relationship between tables (Microsoft Learn)](https://learn.microsoft.com/power-apps/maker/data-platform/data-platform-entity-lookup)
- [Define alternate keys to reference rows (Microsoft Learn)](https://learn.microsoft.com/power-apps/maker/data-platform/define-alternate-keys-reference-records)
- [Security concepts in Microsoft Dataverse: table and record ownership (Microsoft Learn)](https://learn.microsoft.com/power-platform/admin/wp-security-cds)
