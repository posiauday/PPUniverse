---
title: "Toast"
slug: toast
category: dialogs-and-feedback
summary: "A coloured message bar for success, info, warning and error, shown from anywhere with one Show action. Add an Undo or View button, and let your app shape the wording."
access: OPEN
version: 0.1.0
modernControls: yes
---
## When to use it

Use **lcsToast** to confirm what just happened ("Request saved"), or to warn about something the user should know, without stopping them. Compared with `Notify`, it:

- sits where you put it and looks like the rest of your app;
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

## Known limits

- It stays until the user closes it, or your app calls `Hide()`. There's no timer inside, so the component stays light; add a Timer on the screen if you want it to close on its own.
- Screen readers don't announce it automatically. For an important error, also move the user's attention to the field at fault.
- Keep messages to one short sentence; long text wraps within the bar's height.

## Change log

- **0.1.0:** first version, for testing in Power Apps Studio.
