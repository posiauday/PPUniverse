---
title: "Dialog"
slug: dialog
category: dialogs-and-feedback
summary: "A confirm or alert dialog over a dimmed screen. Open it from any button with one action, and react to Confirm or Cancel with events, instead of juggling visibility variables."
access: MEMBERS
version: 0.1.0
modernControls: yes
---
## When to use it

Use **lcsDialog** to ask before something that can't be undone ("Delete this request?"), to warn about unsaved changes, or to tell the user something they must read. It replaces the usual pattern of a group of controls, a rectangle and a visibility variable on every screen:

- **Open()** and **Close()** actions, so any button can show it;
- **OnConfirm** and **OnCancel** events for what happens next;
- **IsOpen** and **Result** outputs if you need them elsewhere.

## Use it

1. Insert it on the screen and name it `dlgDelete`.
2. Set its **Width** to `Parent.Width` and **Height** to `Parent.Height`, and keep it **last in the tree view**, so it sits on top of everything.

Open it from a button:

```powerfx
// btnDelete.OnSelect
dlgDelete.Open()
```

Do the work when the user confirms:

```powerfx
// dlgDelete.OnConfirm
Remove(Requests, galRequests.Selected);
Notify("Request deleted.", NotificationType.Success)
```

Use the selected item in the text:

```powerfx
// dlgDelete.Title
"Delete " & galRequests.Selected.Title & "?"
```

For an alert with one button, set `CancelText` to empty text.

## Accessibility

- Name the confirm button after the action ("Delete", "Leave"), never "OK" or "Yes": screen reader users hear the button without the question.
- Keyboard users can Tab to the buttons and press Enter or Space.
- While it's open, the dimmed layer covers the screen, so the controls behind it can't be clicked by mistake.

## Known limits

- Power Apps components can't move keyboard focus into themselves, so focus doesn't jump to the dialog when it opens. Keep the dialog short, with the buttons right under the message.
- The dialog only covers the component's own area, so size it to the screen as above and keep it last in the tree view.
- The message wraps within a fixed height. Keep it to one or two sentences.

## Change log

- **0.1.0:** first version, for testing in Power Apps Studio.
