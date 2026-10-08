---
title: "Text field"
slug: text-field
category: inputs-and-forms
summary: "A text box with its label, hint, required marker, character count and error message built in. Add your own check with one formula, and read IsValid before you save."
access: OPEN
version: 0.1.0
modernControls: yes
---
## When to use it

Use **lcsTextField** for any text your app asks for: a name, an email, a reference number, a comment. A plain text input leaves the label, the hint, the error and the "is it valid?" logic to you, on every screen. This component does it once:

- a **label** that screen readers read with the box, and a `*` when it's **required**;
- a **hint** under the box, replaced by the **error** when there is one;
- a **character count** when you set `MaxLength`;
- an **IsValid** output to check before you save.

Errors only show after the user has left the box, so nobody sees "required" before they've typed.

## Use it

The examples call the field on your screen `txtEmail`.

Check the format with the input function. Return an error message, or empty text when it's fine:

```powerfx
// txtEmail.Validate
If(
    IsMatch(Text, Match.Email) || IsBlank(Text),
    "",
    "Enter an email like name@example.com."
)
```

Only save when every field is valid:

```powerfx
// btnSave.DisplayMode
If(txtName.IsValid && txtEmail.IsValid, DisplayMode.Edit, DisplayMode.Disabled)

// btnSave.OnSelect
Patch(Contacts, Defaults(Contacts), { Name: txtName.Value, Email: txtEmail.Value })
```

Show an error from the server, then clear it when the user edits:

```powerfx
// txtEmail.ErrorMessage
locEmailTaken

// txtEmail.OnChange
Set(locEmailTaken, "")
```

Start again after saving:

```powerfx
txtName.Reset();
txtEmail.Reset()
```

In an edit screen, load the current value:

```powerfx
// txtName.DefaultValue
galContacts.Selected.Name
```

## Accessibility

- The box's accessible name is the label, plus "required" and the current error, so a screen reader user hears all three.
- The error turns the box red (`ValidationState.Error`) **and** shows text, so it doesn't rely on colour alone.
- Keep `Placeholder` for examples only. It disappears as soon as the user types, so it can't replace the label.

## Known limits

- **Validate** can only use its `Text` parameter, not variables or other controls. That's how Power Apps input functions work. Put checks that need other data (such as "is this email taken?") in your app, and pass the result in through `ErrorMessage`.
- The error shows after the user leaves the box (the text input's `OnChange` fires on blur).
- For several lines, set `Multiline` to true and make the component taller.

## Change log

- **0.1.0:** first version, for testing in Power Apps Studio.
