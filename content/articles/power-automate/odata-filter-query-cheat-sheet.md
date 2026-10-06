---
title: "OData filter query cheat sheet for SharePoint, Dataverse and SQL Server"
slug: odata-filter-query-cheat-sheet
type: REFERENCE
technology: POWER_AUTOMATE
topic: triggers-and-design
excerpt: "Copy-ready filter queries for Get items (SharePoint), List rows (Dataverse) and Get rows (SQL Server): operators, text, dates, lookups and choices, what each source doesn't support, and the errors that mean your syntax is off."
---
A **Filter Query** makes the data source do the filtering, so the flow fetches only the rows it needs instead of everything followed by a **Filter array**. It's faster, uses fewer requests, and is often the only way to work with large lists. But each connector speaks its own dialect, and a filter that works on Dataverse fails on SharePoint. This page lists what each one accepts.

> [!NOTE]
> Checked against Microsoft Learn on 6 October 2026. Every example uses a column's **internal (logical) name**, not its display name.

## The basics that apply everywhere

| Operator | Meaning | Example |
| --- | --- | --- |
| `eq` / `ne` | equals / not equal | `Status eq 'Approved'` |
| `gt` / `ge` | greater than / or equal | `Amount gt 1000` |
| `lt` / `le` | less than / or equal | `Amount le 50` |
| `and` / `or` | combine conditions | `Status eq 'Open' and Amount gt 1000` |
| `( )` | group conditions | `(Region eq 'East' or Region eq 'West') and Amount gt 0` |

- **Text values go in single quotes:** `Title eq 'Contoso'`. Numbers don't.
- **To match a single quote inside a value, double it:** `LastName eq 'O''Brien'`.
- **To build a filter from dynamic content,** type the fixed parts and insert the token where the value goes: `Title eq '<Title token>'`. Remember the quotes around text tokens.

## SharePoint: Get items and Get files

**Supported:**
- `eq`, `ne`, `lt`, `le`, `gt`, `ge`
- `and`, `or`
- `startswith(Column,'text')`
- `substringof('text',Column)`: "contains", with the arguments the other way round
- `day()`, `month()`, `year()`, `hour()`, `minute()`, `second()` on dates

**Not supported:** `endswith`, `contains`, `tolower`/`toupper`, `trim`, `concat`, `substring` and arithmetic. These fail or are ignored on SharePoint.

| You want | Filter query |
| --- | --- |
| Exact text match | `Location eq 'Midwest'` |
| Starts with | `startswith(Title,'A')` |
| Contains | `substringof('invoice',Title)` |
| Two conditions | `Location eq 'Midwest' and Status eq 'Approved'` |
| A lookup column's value | `Country/Title eq 'New Zealand'` (lookup column `/` the column in the other list) |
| A column with spaces in its name | `Start_x0020_Date gt '2026-10-01'` (spaces become `_x0020_`) |
| Dates from today onwards | `Start_x0020_Date ge '@{formatDateTime(utcNow(),'yyyy-MM-dd')}'` |
| The last 2 days | `Created ge '@{addDays(utcNow(),-2,'yyyy-MM-dd')}'` |

**SharePoint traps:**
- **Use the internal name.** Find it in the list settings: open the column and read the `Field=` part of the URL. Renaming a column doesn't change it, so a column now called "Due date" may still be `Deadline` internally.
- **Multi-value lookup and multi-person columns can't be filtered** with a filter query. Filter those after the fact with **Filter array**.
- **Person columns:** SharePoint's REST service matches users by display name, not email. That's brittle; filter on a lookup ID or after the fact where you can.
- **Big lists:** on a list over 5,000 items, a filter that matches nothing in the *first* 5,000 can return no results. Turn on **Pagination** in the action's settings. **Get items** also returns only **100** items unless you set **Top Count** (up to 5,000) or pagination.

## Dataverse: List rows

Dataverse supports the most.

**Supported:**
- `eq`, `ne`, `gt`, `ge`, `lt`, `le`
- `and`, `or`, `not`, and brackets
- `contains`, `startswith`, `endswith`
- over 60 Dataverse query functions, named with the prefix `Microsoft.Dynamics.CRM.`

| You want | Filter rows |
| --- | --- |
| Active rows only | `statecode eq 0` |
| A choice value | `statuscode eq 1` (choices filter by their **number**, not their label) |
| Contains text | `contains(name,'contoso')` |
| Doesn't contain | `not contains(name,'test')` |
| Rows created since a date | `createdon ge 2026-01-01T00:00:00Z` (dates aren't in quotes) |
| Rows created in the last 7 days | `Microsoft.Dynamics.CRM.LastXDays(PropertyName='createdon',PropertyValue=7)` |
| A number range | `Microsoft.Dynamics.CRM.Between(PropertyName='numberofemployees',PropertyValues=["5","2000"])` |
| By a lookup's ID | `_parentcustomerid_value eq 00000000-0000-0000-0000-000000000000` (the `_<lookup>_value` property; the ID isn't in quotes) |
| By a column on the related row | `primarycontactid/fullname eq 'Ana Silva'` |
| Rows with a related row matching | `Account_Tasks/any(t:t/statecode eq 0)` |

**Dataverse traps:**
- **Type only the expression.** Don't include `$filter=`; the action adds it.
- **Use logical names** (`createdon`, `cr123_duedate`), not display names. You'll find them in the table's column properties.
- **Encode special characters in values:** `+` → `%2B`, `&` → `%26`, `#` → `%23`. For example, `contains(name,'+123')` must be written `contains(name,'%2B123')`.
- **No leading wildcards.** `startswith(name,'%value')` isn't supported.
- **Text filters ignore case.**
- **Too many conditions:** a query can have at most **500** conditions; more gives **TooManyConditionsInQuery**. Use `Microsoft.Dynamics.CRM.In(...)` for long lists of values.

## SQL Server: Get rows (V2)

Get rows takes an OData filter such as `stringColumn eq 'string' or numberColumn lt 123`, plus `$orderby` and aggregation (`$apply`).

| You want | Filter query |
| --- | --- |
| Exact match | `Status eq 'Open'` |
| Number comparison | `Quantity lt 10` |
| Combined | `Status eq 'Open' and Quantity lt 10` |

**SQL Server traps:**
- **Date filters are unreliable** through Get rows, especially over the on-premises gateway. If a date filter errors, try one of these instead:
  - **Execute a SQL query (V2)** with parameters. It's **not supported** for on-premises SQL Server or connections through a gateway.
  - A **view** that exposes the date you need.
  - A **stored procedure**.
- **Complex filters hit a limit:** *"OData query syntax tree has exceeded nodes count limit of '100'."* Simplify the conditions, for example use a range instead of many `or` values.

## Errors that mean "fix your filter"

| Symptom | Usual cause |
| --- | --- |
| The action fails on a SharePoint column you can see in the list | You used the display name; use the internal name |
| An error that the filter or expression isn't valid | A missing quote, quotes around a Dataverse date or ID, `$filter=` typed into **Filter rows**, or a function the source doesn't support (such as `endswith` on SharePoint) |
| *"There is an unterminated literal …"* | An unescaped single quote inside a value: double it |
| No results, no error, on a big SharePoint list | Matching items aren't in the first 5,000: turn on pagination |
| **TooManyConditionsInQuery** (Dataverse) | More than 500 conditions: use `In` |
| *"OData query syntax tree has exceeded nodes count limit of '100'"* (SQL Server) | Too many conditions: simplify them |

## Sources

- Microsoft Learn: [Working with Get items and Get files: filter queries](https://learn.microsoft.com/sharepoint/dev/business-apps/power-automate/guidance/working-with-get-items-and-get-files#filter-queries)
- Microsoft Learn: [OData query operators in SharePoint REST](https://learn.microsoft.com/sharepoint/dev/sp-add-ins/use-odata-query-operations-in-sharepoint-rest-requests)
- Microsoft Learn: [Use lists of rows in flows (Dataverse)](https://learn.microsoft.com/power-automate/dataverse/list-rows)
- Microsoft Learn: [Filter rows by using OData (Dataverse)](https://learn.microsoft.com/power-apps/developer/data-platform/webapi/query/filter-rows)
- Microsoft Learn: [SQL Server connector reference](https://learn.microsoft.com/connectors/sql/)
- Microsoft Learn: [Filter and copy data with Power Automate](https://learn.microsoft.com/power-automate/odata-filters)
