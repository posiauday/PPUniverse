---
title: "Toast"
slug: toast
category: dialogs-and-feedback
summary: "A coloured message bar for success, info, warning and error, shown from anywhere with one Show action. It closes itself, queues messages so none are lost, takes an Undo or View button, and comes in light or dark."
access: OPEN
version: 0.2.0
modernControls: yes
---
## When to use it

Use **lcsToast** to confirm what just happened ("Request saved"), or to warn about something the user should know, without stopping them. Compared with `Notify`, it:

- sits where you put it and looks like the rest of your app, light or dark, with your brand colour on Info messages;
- **closes itself** after `Duration` seconds (6 by default; 0 keeps it until it's closed);
- **queues** messages that arrive while one shows, so a quick second `Show` doesn't wipe out the first. The bar says how many more are waiting, and `QueueCount` tells your app;
- can carry a button, such as **Undo** or **View**, with an **OnAction** event;
- tells your app its state (`IsOpen`, `CurrentKind`);
- lets one formula (`FormatMessage`) shape every message.

## Use it

Put it near the top of the screen, last in the tree view so it's on top, and name it `tstMain`.

Show a message from anywhere:

```powerfx
// btnSave.OnSelect
Patch(Requests, Defaults(Requests), { Title: txtTitle.Value });
tstMain.Show("Request saved.", "Success")
```

The four kinds:

```powerfx
tstMain.Show("Saved.", "Success");
tstMain.Show("Sync runs every hour.", "Info");
tstMain.Show("You're offline. Changes will sync later.", "Warning");
tstMain.Show("Couldn't save. Try again.", "Error")
```

Offer Undo:

```powerfx
// tstMain.ActionText
"Undo"

// tstMain.OnAction
Remove(Requests, locLastSaved)
```

Keep a message until it's closed, such as one with an action people need time for:

```powerfx
// tstMain.Duration
0
```

Show errors from IfError:

```powerfx
IfError(
    Patch(Requests, Defaults(Requests), { Title: txtTitle.Value }),
    tstMain.Show("Couldn't save: " & FirstError.Message, "Error")
)
```

## Accessibility

- Each kind has its own symbol (✓, i, !, ✕) as well as its colour, so it doesn't rely on colour alone. Text colours meet 4.5:1 contrast on their backgrounds.
- The close button is labelled "Close message" for screen readers.
- Messages with a button need time to reach it: set `Duration` to 10 or more, or 0, whenever `ActionText` is set (WCAG 2.2.1, timing adjustable). The variations do.

## Known limits

- It closes itself with a timer, and Power Apps Studio runs timers only in preview (F5). In the published app it always runs.
- The queue lives inside the component, so each copy of it on a screen has its own. `Hide()` closes the toast and empties its queue.
- Screen readers don't announce it automatically. For an important error, also move the user's attention to the field at fault.
- Keep messages to one short sentence; long text wraps within the bar's height.

## Change log

- **0.2.0:** `Duration` (closes itself), a queue with `QueueCount`, `AccentColor` for Info messages, and `Theme`.
- **0.1.0:** first version, for testing in Power Apps Studio.
