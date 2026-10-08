---
title: "Button"
slug: button
category: buttons-and-actions
summary: "A modern button with four looks, an icon, and a busy state that stops double clicks. It counts clicks, lets your app format its label, and shows every kind of custom property."
access: OPEN
version: 0.1.0
modernControls: yes
---
## When to use it

Use **lcsButton** wherever people start an action: Save, Submit, Export, Edit. Compared with a plain button, it gives you:

- **Four looks** from one input, `Appearance`: Primary, Secondary, Outline and Subtle.
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

Start counting again from another control:

```powerfx
MyButton.ResetCount()
```

## Accessibility

- The inner button's **AccessibleLabel** is the `Label`, so screen readers announce what it does. Keep labels short and specific: "Save request", not "Click here".
- It works with the keyboard: Tab to it, then press Enter or Space.
- While busy it's disabled, and its text changes to "Working…", so the state is visible as well as announced.

## Known limits

- **Function properties** (`FormatLabel`, `IsValidLabel`) can only use their own parameters, not variables or the component's other properties. That's how Power Apps works.
- In a component library, a component can't use `AccessAppScope`. This one doesn't need it.
- `IconName` takes a Fluent icon name, such as `Checkmark`, `Send` or `Edit`. A name the modern button doesn't know shows no icon.

## Change log

- **0.1.0:** first version, for testing in Power Apps Studio.
