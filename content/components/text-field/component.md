---
title: "Text field"
slug: text-field
category: inputs-and-forms
summary: "A text box with its label, hint, required marker, character count and error message built in. Built-in checks for email, phone, number, web address, and postal and ZIP codes, or your own with one formula; read IsValid before you save."
access: OPEN
version: 0.3.0
modernControls: yes
---
## When to use it

Use **lcsTextField** for any text your app asks for: a name, an email, a reference number, a comment. A plain text input leaves the label, the hint, the error and the "is it valid?" logic to you, on every screen. This component does it once:

- a **label** that screen readers read with the box, and a `*` when it's **required**;
- a **hint** under the box, replaced by the **error** when there is one;
- a **character count** when you set `MaxLength`;
- **built-in format checks** from one input, `Format`: `Email`, `Phone`, `Number`, `Url`, `PostalCodeCA` (A1A 1A1) or `ZipCodeUS` (12345 or 12345-6789), each with a clear message;
- an **IsValid** output to check before you save;
- three **looks** (Outline, Filled, FilledLight), your **AccentColor** for the focus line, and a **Dark** theme.

Errors only show after the user has left the box, so nobody sees "required" before they've typed.

## Use it

The examples call the field on your screen `txtEmail`.

Check an email address with no formula at all:

```powerfx
// txtEmail.Format
"Email"
```

For a rule of your own, use the input function. Return an error message, or empty text when it's fine. It runs after the `Format` check:

```powerfx
// txtEmail.Validate
If(EndsWith(Text, "@example.com") || IsBlank(Text), "", "Use your work email address.")
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
- The error turns the box red (`ValidationState.Error`) **and** shows text starting with ⚠, so it doesn't rely on colour alone.
- Keep `Placeholder` for examples only. It disappears as soon as the user types, so it can't replace the label.

## Known limits

- **Validate** can only use its `Text` parameter, not variables or other controls. That's how Power Apps input functions work. Put checks that need other data (such as "is this email taken?") in your app, and pass the result in through `ErrorMessage`.
- The error shows after the user leaves the box (the text input's `OnChange` fires on blur).
- For several lines, set `Multiline` to true and make the component taller.
- `Format` checks the text; it doesn't reformat it as people type (a Power Apps text input can't). An empty box passes the format check; turn on `Required` to ask for one.
- Phone numbers vary a lot by country, so `Phone` only checks for 7 to 20 digits, spaces and `+ ( ) -`. Use `Validate` for a stricter rule.

## Change log

- **0.3.0:** `Format`, with built-in checks for Email, Phone, Number, Url, PostalCodeCA and ZipCodeUS.
- **0.2.0:** a cleaner design: an outlined, rounded, 40 px box with padding and more space around it; `Look`, `AccentColor` and `Theme` inputs; errors start with ⚠.
- **0.1.0:** first version, pasted and tested in Power Apps Studio 3.26094.8.
