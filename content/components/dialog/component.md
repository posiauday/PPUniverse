---
title: "Dialog"
slug: dialog
category: dialogs-and-feedback
summary: "Confirm, alert, form or danger dialogs from one component. Up to three buttons from a table, a validated text box, type-to-confirm for destructive actions, and actions to open and close it: no visibility variables to manage."
access: MEMBERS
version: 0.2.0
modernControls: yes
---
## When to use it

Use **lcsDialog** whenever your app needs an answer before it continues:

- **Confirm:** "Delete this request?" with Cancel and Delete.
- **Alert:** something the user must read, with one button.
- **Form:** a short answer, such as a reason for rejecting, with your own check.
- **Danger:** for actions that can't be undone, the user types a word (DELETE) before the button unlocks, and it turns red.

What it does that others don't:

- **Your app opens and closes it with actions**: `dlgDelete.Open()`. No `Visible` variable to set and reset.
- **The answer comes with the event**: `OnButtonSelect(Key, InputText)` receives which button and what was typed.
- **Minimal setup**: set `Kind` and the same `Buttons` table adapts (Alert hides the cancel key; Danger turns the confirm key red).
- **Works in component libraries**: it never reads `App.` values, so it can live in your organisation's library.

## Use it

1. Insert it and name it `dlgDelete`.
2. Set its **Width** to `Parent.Width` and **Height** to `Parent.Height`, and keep it **last in the tree view** so it's on top.

Open it:

```powerfx
// btnDelete.OnSelect
dlgDelete.Open()
```

Act on the answer:

```powerfx
// dlgDelete.OnButtonSelect
If(Key = "confirm", Remove(Requests, galRequests.Selected); Notify("Request deleted.", NotificationType.Success))
```

Show the item in the question:

```powerfx
// dlgDelete.Title
"Delete " & galRequests.Selected.Title & "?"
```

**A form dialog** that asks for a reason and checks it:

```powerfx
// dlgReject.Kind
"Form"

// dlgReject.InputLabel
"Reason for rejecting"

// dlgReject.ValidateInput
If(Len(Text) < 10, "Give a reason of at least 10 characters.", "")

// dlgReject.Buttons
Table({Key: "cancel", Label: "Cancel", Style: "Secondary"}, {Key: "reject", Label: "Reject", Style: "Primary"})

// dlgReject.OnButtonSelect
If(Key = "reject", Patch(Requests, galRequests.Selected, {Status: {Value: "Rejected"}, Reason: InputText}))
```

**A danger dialog** for something that can't be undone:

```powerfx
// dlgDeleteAll.Kind
"Danger"

// dlgDeleteAll.Title
"Delete all 48 requests?"
```

**Three buttons**, such as leaving with unsaved changes:

```powerfx
// dlgLeave.Buttons
Table(
    {Key: "discard", Label: "Don't save", Style: "Subtle"},
    {Key: "cancel", Label: "Cancel", Style: "Secondary"},
    {Key: "save", Label: "Save", Style: "Primary"}
)

// dlgLeave.OnButtonSelect
Switch(Key, "save", SubmitForm(frmRequest); Back(), "discard", ResetForm(frmRequest); Back())
```

## Accessibility

- Every button is named by its label; name the action ("Delete", "Reject"), never "OK" or "Yes", because screen reader users may hear the button without the question.
- The text box is labelled, and its error starts with ⚠ so it doesn't rely on colour.
- The primary button stays disabled until a Form or Danger dialog is filled in correctly, so nobody confirms by accident.
- With `ShowClose` off, only the buttons close it: use this for decisions that must be answered.

## Known limits

- Power Apps components can't move keyboard focus into themselves when they open, so focus stays where it was. Keep the dialog short, with the buttons right under the message.
- It covers only its own area: size it to the screen as above.
- Up to three buttons. Button labels should be one or two words.

## Change log

- **0.2.0:** four kinds (Confirm, Alert, Form, Danger with type-to-confirm); a `Buttons` table with keys and styles; `OnButtonSelect(Key, InputText)`; `ValidateInput`; icons; `ShowClose` with tap-outside; `OnDismiss`; `AccentColor` and `Theme`; the dialog grows to fit its message.
- **0.1.0:** first version.
