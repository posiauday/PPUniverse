---
title: "Floating action button"
slug: fab
category: buttons-and-actions
summary: "The screen's main action as a floating button: round, extended with a label, or opening a speed-dial menu of more actions. Accessible, sized for touch, and coloured to match your app."
access: OPEN
version: 0.1.0
modernControls: yes
---
## When to use it

Use **lcsFab** for the one action people come to a screen for: a new request, a new note, a photo. It floats in a corner, so it's always within reach on a phone.

- **Plain:** an icon in a rounded square. Set `Size` to Small, Regular or Large.
- **Extended:** the icon plus a label, when the action needs words ("New request").
- **Speed dial:** set `SpeedDial` to true and give it `Items`; it opens a short menu of related actions.

## Use it

Put it in a bottom corner, last in the tree view so it's on top, and name it `fabMain`. Anchor it to the corner:

```powerfx
// fabMain.X
Parent.Width - Self.Width - 24

// fabMain.Y
Parent.Height - Self.Height - 24
```

A plain button:

```powerfx
// fabMain.OnSelect
NewForm(frmRequest);
Navigate(scrEdit)
```

A speed dial that does something different for each item:

```powerfx
// fabMain.SpeedDial
true

// fabMain.Items
Table(
    {Icon: "Edit", Label: "New note"},
    {Icon: "Camera", Label: "Take a photo"},
    {Icon: "Upload", Label: "Upload a file"}
)

// fabMain.OnItemSelect
Switch(
    Item,
    "New note", Navigate(scrNote),
    "Take a photo", Navigate(scrCamera),
    "Upload a file", Navigate(scrUpload)
)
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
- Every speed-dial item is a button named after its label.
- Keep `ContentColor` readable on `AccentColor`: white on the default blue is 5:1.
- Regular (56) and Large (72) sizes are comfortable to tap; prefer Small (40) only on desktop screens.

## Known limits

- With the menu open, the component grows upward and to the left to fit the items, so leave room above it.
- Clicking outside the menu closes it only within the component's area; call `Close()` from the screen's other actions if needed.
- **IconSvg** is an output function, so it only uses its two parameters. Colours are hex codes, such as `#FFFFFF`.

## Change log

- **0.1.0:** first version, for testing in Power Apps Studio. Written from scratch; Studio's structure for galleries and containers was confirmed with an MIT-licensed sample shared by the product owner (see `NOTICES.md`).
