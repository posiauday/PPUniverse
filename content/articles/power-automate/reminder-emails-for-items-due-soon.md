---
title: "Reminder emails for items due soon: a daily flow that gets dates right"
slug: reminder-emails-for-items-due-soon
type: PATTERN
technology: POWER_AUTOMATE
topic: triggers-and-design
excerpt: "Send a reminder a set number of days before a SharePoint due date. A daily scheduled flow that works in your time zone, filters the list efficiently, avoids double-sending, and can send one digest per person instead of a flood of emails."
---
"Email the owner three days before the due date" sounds simple, and it nearly is. The usual problems are **time zones** (reminders a day early or late), **filters** that miss items, and **duplicates**. This pattern handles all three.

> [!NOTE]
> Checked against Microsoft Learn on 6 October 2026.

## Just want a personal reminder?

For a reminder **only for yourself**, you don't need to build anything. Open the list and select **Automate → Set a reminder**, choose the date column, and set how many days in advance. It isn't available in GCC, GCC High, DoD or other sovereign clouds. Build the flow below when other people need the reminders, or you want control over the wording and timing.

## The flow at a glance

1. **Recurrence**, once a day at 08:00 **in your time zone**.
2. **Work out the target date** ("today + 3") in your time zone.
3. **Get items** with a filter that narrows the list to a small window around that date.
4. **Filter array** down to the items due exactly on the target date and not yet reminded.
5. For each one: **send the email**, then **mark it as reminded**.

## Step 1: Schedule it in your time zone

Add the **Recurrence** trigger: interval **1**, frequency **Day**. In its advanced settings:
- set **Time zone** to your own, for example *(UTC+10:00) Canberra, Melbourne, Sydney*;
- set **At these hours** to `8` and **At these minutes** to `0`.

> [!WARNING]
> Without a time zone, the schedule runs in **UTC**, and a flow meant for 08:00 in Sydney runs in the evening. If it runs earlier than you expect, also check the **Start time**.

## Step 2: Work out the dates in your time zone

`utcNow()` is always UTC. Convert it first, then add the days. Add a **Compose** called `Target_date`:

```text
formatDateTime(addDays(convertTimeZone(utcNow(), 'UTC', 'AUS Eastern Standard Time'), 3), 'yyyy-MM-dd')
```

Use your own Windows time zone name, such as `Eastern Standard Time`, `GMT Standard Time` or `India Standard Time`.

## Step 3: Get a small window of items

Date values can come back from SharePoint in UTC, which can shift a date by a day near midnight. So filter on a window **a day either side** of the target, and do the exact match in step 4. In **Get items → Filter Query** (with `DueDate` as the column's *internal* name):

```text
DueDate ge '@{formatDateTime(addDays(outputs('Target_date'), -1), 'yyyy-MM-dd')}' and DueDate le '@{formatDateTime(addDays(outputs('Target_date'), 1), 'yyyy-MM-dd')}' and ReminderSent ne 1
```

- Filtering in **Get items** keeps the flow fast and stays clear of the 5,000-item threshold. Index the `DueDate` column if the list is large.
- More date and column examples: [OData filter query cheat sheet](/learn/odata-filter-query-cheat-sheet).

## Step 4: Keep only the right date

Add **Filter array** on the **Get items** value, in advanced mode:

```text
@equals(formatDateTime(convertTimeZone(item()?['DueDate'], 'UTC', 'AUS Eastern Standard Time'), 'yyyy-MM-dd'), outputs('Target_date'))
```

Now every item matches **your** calendar day, whatever SharePoint stored.

## Step 5: Send, then mark it

For each item in the filtered list:
1. **Send an email (V2)** to the item's owner, with the title, the due date (converted to your time zone for display) and a **link** to the item.
2. **Update item**: set the **ReminderSent** column to **Yes**. Create it as a Yes/No column with the default **No**, so new items are included in the filter.

Why mark it? Power Automate is designed to run actions **at least once**, so in rare cases an action can repeat. A flow that checks a "sent" flag is safe to run twice, and it also stops a re-run of a failed day from emailing everyone again. Clear the flag if the due date changes.

## Option: one digest per person

Ten items for one person shouldn't mean ten emails. Instead of a loop that emails per item:
1. **Select** the owners' emails from the filtered items, then remove duplicates with `union(body('Select'), body('Select'))`.
2. **Apply to each** owner:
   - **Filter array** their items;
   - **Create HTML table** with title, due date and link;
   - send **one** email containing the table;
   - mark those items as reminded.

## Checklist

- [ ] Recurrence has a **time zone** and a fixed hour.
- [ ] Dates are converted with `convertTimeZone` before comparing.
- [ ] **Get items** filters to a small window on an indexed column.
- [ ] A **ReminderSent** flag prevents repeats, and the email links to the item.
- [ ] Tested with an item due exactly on the target date, and one due a day either side.

## Sources

- Microsoft Learn: [Run a cloud flow on a schedule: time zone and start time](https://learn.microsoft.com/power-automate/run-scheduled-tasks)
- Microsoft Learn: [Convert a time zone](https://learn.microsoft.com/power-automate/convert-time-zone)
- Microsoft Learn: [Expression cookbook: dates and times](https://learn.microsoft.com/power-automate/expression-cookbook#date-and-time)
- Microsoft Learn: [SharePoint "Set a reminder" flows](https://learn.microsoft.com/power-automate/create-sharepoint-reminder-flows)
- Microsoft Learn: [Troubleshoot triggers: runs ahead of schedule, and actions that run more than once](https://learn.microsoft.com/troubleshoot/power-platform/power-automate/flow-run-issues/triggers-troubleshoot)
- Microsoft Learn: [Working with Get items and Get files](https://learn.microsoft.com/sharepoint/dev/business-apps/power-automate/guidance/working-with-get-items-and-get-files)
