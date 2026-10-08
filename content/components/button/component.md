---
title: "Button"
slug: button
category: buttons-and-actions
summary: "A modern button in four looks, in your brand colour, light or dark. A busy state stops double clicks, and select-again-to-confirm guards actions that can't be undone."
access: OPEN
version: 0.2.0
modernControls: yes
---
## When to use it

Use **lcsButton** wherever people start an action: Save, Submit, Export, Edit. Compared with a plain button, it gives you:

- **Four looks** from one input, `Appearance`: Primary, Secondary, Outline and Subtle.
- **Your brand colour** from one input, `AccentColor`. Hover and pressed colours are worked out from it, so any colour looks right.
- **Light or dark.** Set `Theme` to `"Dark"` on a dark screen: text and borders turn light.
- **Select again to confirm.** Set `RequireConfirm` to `true` for actions that can't be undone. The first select turns the button red and says "Select again to confirm"; `OnClick` runs only if it's selected again within `ConfirmSeconds`, otherwise it goes back to normal. No dialog to build.
- **A busy state.** Set `IsBusy` to `true` while a Patch or flow runs. The button is disabled and says "Working…", so nobody submits twice.
- **A click count** (`ClickCount`) and an **OnClick** event that receives it.
- **Your own label format** through `FormatLabel`, and a `ResetCount()` action.

## Use it

The examples call the button on your screen `MyButton`.

Save a form and show progress while it saves:

```powerfx
// MyButton.IsBusy
locSaving

// MyButton.OnClick
Set(locSaving, true);
IfError(
    Patch(Requests, Defaults(Requests), { Title: txtTitle.Value }),
    Notify("Couldn't save: " & FirstError.Message, NotificationType.Error)
);
Set(locSaving, false)
```

Show the label in capitals with the input function:

```powerfx
// MyButton.FormatLabel
Upper(Text)
```

Check a label before using it, with the output function:

```powerfx
MyButton.IsValidLabel(txtLabel.Value)
```

Guard a delete without a dialog:

```powerfx
// btnDeleteAll.RequireConfirm
true

// btnDeleteAll.Label
"Delete all"

// btnDeleteAll.OnClick
RemoveIf(Requests, Status = "Draft"); Notify("Drafts deleted.", NotificationType.Success)
```

Match your brand, on a dark screen:

```powerfx
// MyButton.AccentColor
ColorValue("#7C3AED")

// MyButton.Theme
"Dark"
```

Start counting again from another control:

```powerfx
MyButton.ResetCount()
```

## Accessibility

- The inner button's **AccessibleLabel** is the `Label`, so screen readers announce what it does. Keep labels short and specific: "Save request", not "Click here".
- It works with the keyboard: Tab to it, then press Enter or Space.
- While busy it's disabled, and its text changes to "Working…", so the state is visible as well as announced.
- While it waits for the confirming select, its text and accessible name change to `ConfirmLabel` and it shows a warning icon, so the state isn't shown by colour alone. Four seconds is the default; give people longer if your users need it.
- Pick an `AccentColor` dark enough for white text (4.5:1). The default blue and most brand blues, purples and greens are.

## Known limits

- **Function properties** (`FormatLabel`, `IsValidLabel`) can only use their own parameters, not variables or the component's other properties. That's how Power Apps works.
- In a component library, a component can't use `AccessAppScope`. This one doesn't need it.
- The confirm wait uses a timer, and Power Apps Studio runs timers only in preview (F5). In the published app it always runs.
- The modern button has no fill colour of its own, so on a dark screen Secondary is drawn as Outline and Subtle as Transparent (Subtle's light hover would hide light text). While busy it's the modern button's own light grey, in both themes.
- `IconName` takes a Fluent icon name, such as `Checkmark`, `Send` or `Edit`. A name the modern button doesn't know shows no icon.

## Change log

- **0.2.0:** `AccentColor` and `Theme`; `RequireConfirm`, `ConfirmLabel`, `ConfirmSeconds` and the `IsArmed` output.
- **0.1.0:** first version; passed the paste-test in Power Apps Studio 3.26094.8.
