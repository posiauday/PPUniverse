---
title: "Date and time picker"
slug: date-time-picker
category: inputs-and-forms
summary: "One date, a date and a time, or a date range, with quick picks, the earliest and latest dates, weekends and holidays blocked with a clear message, a working-days helper and the time zone. Built on the modern date picker."
access: OPEN
version: 0.1.0
modernControls: yes
---
## When to use it

Use **lcsDatePicker** whenever your app asks for a date: a due date, an appointment, a leave request. The modern date picker picks one date and nothing else. This component adds what makers keep rebuilding:

- **Three modes from one input**, `Mode`: `Date`, `DateTime` (a date and a time from a list in 15-minute steps) and `Range` (a start and an end date);
- **Quick picks** above the field: Today, Tomorrow and In a week, or for a range This week, Next 7 days and Last 30 days;
- **The earliest and latest dates** (`MinDate`, `MaxDate`), and **blocked days**: weekends with `BlockWeekends`, holidays with a `BlockedDates` table, each with a clear message;
- **Outputs your app reads**: `Value` (with its time), `EndValue`, `Days` and `IsValid`, and `OnChange(Start, End)`, which passes the new values;
- **A working-days helper**, `WorkingDays(Start, End)`;
- **The time zone** in the hint, such as "Times are in your time zone (UTC-6)", so nobody guesses;
- a label, a hint, a required marker, your `AccentColor` and a `Dark` theme, like the Text field.

## Use it

The examples call it `dtpDue` on your screen.

A due date that must be a weekday, from today on:

```powerfx
// dtpDue.MinDate
Today()

// dtpDue.BlockWeekends
true

// btnSave.OnSelect
If(dtpDue.IsValid, Patch(Tasks, ThisItem, { DueDate: dtpDue.Value }))
```

An appointment with a time, every 30 minutes, on a 24-hour clock:

```powerfx
// dtpVisit.Mode
"DateTime"

// dtpVisit.TimeStep
30

// dtpVisit.Use24Hour
true
```

A leave request: a range, holidays blocked, and the working days shown:

```powerfx
// dtpLeave.Mode
"Range"

// dtpLeave.BlockedDates
ForAll(Holidays, Date)

// lblWorkingDays.Text
dtpLeave.WorkingDays(dtpLeave.Value, dtpLeave.EndValue) & " working days"
```

Load a record's dates into it:

```powerfx
dtpLeave.SetDates(ThisItem.Start, ThisItem.End)
```

React when the dates change:

```powerfx
// dtpLeave.OnChange
Set(locRange, { From: Start, To: End })
```

## Accessibility

- Each date box and the time list is named by the label ("Leave, start date", "Visit, time"), so screen reader users know which is which.
- Errors appear after the user changes the field, start with ⚠ and turn the box red, so they don't rely on colour alone.
- The calendar and the time list are Microsoft's modern controls, with their own keyboard support: arrows move between days, Enter picks one.

## Known limits

- The modern date picker can only grey out dates before `MinDate` and after `MaxDate`. Weekends and `BlockedDates` can still be clicked, then show an error, so the field never accepts them.
- `WorkingDays` counts Monday to Friday only. It's an output function, so it can't read `BlockedDates`; subtract holidays in your app if you need them.
- Dates show in the date picker's format, such as Jan 15, 2026. The time list follows `Use24Hour`.
- `Value` in DateTime mode is in the user's time zone. Save it as it is, and Dataverse or SharePoint store it correctly.

## Change log

- **0.1.0:** first version: Date, DateTime and Range; quick picks; earliest and latest dates; weekends and blocked dates; `WorkingDays`; the time zone; `SetDates` and `Reset`.
