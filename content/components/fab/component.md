---
title: "Floating action button"
slug: fab
category: buttons-and-actions
summary: "The screen's main action, usually Add new, as a floating button: ready with no setup, extended with a label, or opening a speed-dial menu of more actions. Accessible, sized for touch, coloured to match your app."
access: OPEN
version: 0.2.0
modernControls: yes
---
## When to use it

Use **lcsFab** for the one action people come to a screen for, which is usually **adding a new item**: a new request, a new note, a new contact. It floats in a corner, so it's always within reach on a phone. Out of the box it's a **+** labelled "Add new"; you only set what happens on select.

- **Plain:** an icon in a rounded square. Set `Size` to Small, Regular or Large.
- **Extended:** the icon plus a label, when the action needs words ("New request").
- **Speed dial:** set `SpeedDial` to true and give it `Items`; it opens a short menu of related actions. One `OnItemSelect` formula decides what each item does, by its `Key`.
- **Dynamic menus without editing the table:** `HiddenKeys` hides items (such as admin-only actions) and `DisabledKeys` greys them out. `Direction` opens the menu up or down.

## Use it

Put it in a bottom corner, last in the tree view so it's on top, and name it `fabMain`. Anchor it to the corner:

```powerfx
// fabMain.X
Parent.Width - Self.Width - 24

// fabMain.Y
Parent.Height - Self.Height - 24
```

**Add a new item** (the usual case). With a form on another screen:

```powerfx
// fabMain.OnSelect
NewForm(frmRequest);
Navigate(scrEdit)
```

Or add a row straight away and open it:

```powerfx
// fabMain.OnSelect
Set(locNew, Patch(Requests, Defaults(Requests), { Title: "New request" }));
Navigate(scrEdit)
```

Say what's being added, so screen reader users hear it, and show it on wider screens:

```powerfx
// fabMain.Label
"New request"

// fabMain.Extended
App.Width > 640
```

Only let people add when they can:

```powerfx
// fabMain.Disabled
!locCanCreate
```

A speed dial that does something different for each item:

```powerfx
// fabMain.SpeedDial
true

// fabMain.Items
Table(
    {Key: "note", Icon: "Edit", Label: "New note"},
    {Key: "photo", Icon: "Camera", Label: "Take a photo"},
    {Key: "upload", Icon: "Upload", Label: "Upload a file"},
    {Key: "delete", Icon: "Close", Label: "Delete all"}
)

// fabMain.OnItemSelect
Switch(
    Key,
    "note", Navigate(scrNote),
    "photo", Navigate(scrCamera),
    "upload", Navigate(scrUpload),
    "delete", dlgDeleteAll.Open()
)
```

Because `OnItemSelect` checks the `Key`, you can rename or translate the labels without touching it.

Show "Delete all" to admins only, and grey out the photo item when there's no camera:

```powerfx
// fabMain.HiddenKeys
If(!locIsAdmin, "delete", "")

// fabMain.DisabledKeys
If(locOffline, "photo,upload", "")
```

At the top of a screen, open the menu downward:

```powerfx
// fabMain.Direction
"Down"
```

Close the menu from elsewhere, such as when the screen changes:

```powerfx
fabMain.Close()
```

Use its icons in your own app with the output function:

```powerfx
// imgSearch.Image
fabMain.IconSvg("Search", "#0F6CBD")
```

## Accessibility

- The button's accessible name is its `Label`, even when only the icon shows, plus "open menu" or "close menu" with a speed dial. Write the label as the action: "New request", not "Plus".
- Every speed-dial item is a button named after its label. A disabled item can't be selected, and is greyed. The hit areas are classic buttons, whose accessible name is their `Text`; the text is there, in a transparent colour.
- Keep `ContentColor` readable on `AccentColor`: white on the default blue is 5:1.
- Regular (56) and Large (72) sizes are comfortable to tap; prefer Small (40) only on desktop screens.

## Known limits

- With `SpeedDial` on, the component is always as big as the open menu, so the button sits in its bottom-right corner (top-right with `Direction` Down). The empty area is transparent and lets taps through while the menu is closed. Leave room above it.
- Clicking outside the menu closes it only within the component's area; call `Close()` from the screen's other actions if needed.
- Every row of `Items` needs `Key`, `Icon` and `Label` columns.
- **IconSvg** is an output function, so it only uses its two parameters. Colours are hex codes, such as `#FFFFFF`.

## Change log

- **0.2.0:** items have a `Key`, and `OnItemSelect` receives `Key` and `Label`; `HiddenKeys`, `DisabledKeys` and `Direction` inputs; `SelectedKey` output. Sized from its inputs only.
- **0.1.0:** first version, for testing in Power Apps Studio. Written from scratch; Studio's structure for galleries and containers was confirmed with an MIT-licensed sample shared by the product owner (see `NOTICES.md`).
