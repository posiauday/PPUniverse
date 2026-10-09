---
title: "Navigation shell"
slug: navigation-shell
category: navigation-and-layout
summary: "Your app's main menu: a side menu on wide screens that collapses to icons, and a bottom bar on phones, from one table. Badges, items hidden or disabled by role, the current screen marked, who is signed in, an animated light and dark switch, and outputs that place your content beside it."
access: MEMBERS
version: 0.1.0
modernControls: yes
---
## When to use it

Use **lcsNavShell** as the main menu of an app with several screens. Building one by hand means a gallery per screen size, a variable for the collapse state and the same formulas copied onto every screen. This component gives you:

- **One table for the menu.** Each item has a `Key` (your own id), a `Label`, an `Icon` (a Fluent icon name, such as `Home`) and a `Badge` (text such as `3`, or blank).
- **A side menu on wide screens** with your app's name and a button that collapses it to icons. Collapsed, each icon shows its name on hover, and its badge as a dot with the count.
- **A bottom bar on phones,** with an icon and a short label per item. It switches by itself below the width you choose (`BottomBarBelow`, 640 by default).
- **The current screen, from your app.** Set `CurrentKey` and the menu marks that item, with a bar and a filled icon.
- **Items for some people only:** hide items by key (`HiddenKeys`), or show them but don't allow them (`DisabledKeys`).
- **Who is signed in,** at the bottom of the side menu: their picture (or initials), name and a line such as their role. Selecting it runs `OnUserSelect()`.
- **A light and dark switch** beside it: a sun that turns into a moon, animated (it doesn't move for people who've asked for reduced motion). It switches the menu and runs `OnThemeChange(NewTheme)`, so your app can follow.
- **Outputs that place it and your content,** so the content moves over when the menu collapses or becomes a bottom bar.
- Your `AccentColor`, and a `Dark` theme.

## Use it

The examples call it `navMain`. Put it on each screen (or copy it), and give it the screen's size:

```powerfx
// navMain.ScreenWidth
Parent.Width

// navMain.ScreenHeight
Parent.Height
```

Place the menu from its own outputs:

```powerfx
// navMain.X, Y, Width and Height
navMain.ShellX
navMain.ShellY
navMain.ShellWidth
navMain.ShellHeight
```

Put your screen's content in a container and place it the same way:

```powerfx
// conContent.X, Y, Width and Height
navMain.ContentX
navMain.ContentY
navMain.ContentWidth
navMain.ContentHeight
```

Your menu:

```powerfx
// navMain.Items
Table(
    { Key: "home", Label: "Home", Icon: "Home", Badge: "" },
    { Key: "orders", Label: "Orders", Icon: "Cart", Badge: Text(CountRows(Filter(Orders, Status = "New"))) },
    { Key: "customers", Label: "Customers", Icon: "People", Badge: "" },
    { Key: "reports", Label: "Reports", Icon: "Document", Badge: "" },
    { Key: "settings", Label: "Settings", Icon: "Settings", Badge: "" }
)
```

Go to the screen the user picks:

```powerfx
// navMain.OnNavigate
Navigate(
    Switch(ItemKey, "orders", OrdersScreen, "customers", CustomersScreen, "reports", ReportsScreen, "settings", SettingsScreen, HomeScreen),
    ScreenTransition.None
)
```

Mark the screen the user is on. On each screen, set its own key:

```powerfx
// navMain.CurrentKey, on OrdersScreen
"orders"
```

Show Reports to managers only, and keep Settings for admins:

```powerfx
// navMain.HiddenKeys
If(gblUser.IsManager, "", "reports")

// navMain.DisabledKeys
If(gblUser.IsAdmin, "", "settings")
```

Show who is signed in, and open their profile:

```powerfx
// navMain.UserName, UserDetail and UserImage
User().FullName
User().Email
User().Image

// navMain.OnUserSelect
Navigate(ProfileScreen)
```

Keep your whole app in step with the light and dark switch:

```powerfx
// navMain.OnThemeChange
Set(gblTheme, NewTheme)

// navMain.Theme, and anything else that follows the theme
gblTheme

// Screen1.Fill
If(gblTheme = "Dark", RGBA(27, 27, 27, 1), RGBA(255, 255, 255, 1))
```

Remember the collapse state across screens:

```powerfx
// navMain.OnToggle
Set(gblMenuCollapsed, Collapsed)

// navMain.StartCollapsed
gblMenuCollapsed
```

## Accessibility

- Each item is one button, named by its label and badge ("Orders, 3"). The current item is marked by a bar, a filled icon and bold text, so colour is never the only signal.
- Disabled items stay in the menu but can't be selected, and screen readers say they're unavailable.
- The collapse button says what it does ("Collapse the menu", "Expand the menu"), and so does the theme button ("Switch to dark theme"). All of these phrases are inputs, for your language.
- The avatar is a button named by the person's name and detail.
- The sun and moon animation lasts half a second and doesn't run for people who've asked their device for reduced motion.
- Collapsed, each icon shows its label on hover. Choose clear icons.
- Badges are white on your `AccentColor`. Pick an accent dark enough for white text (the default meets WCAG AA).

## Known limits

- The menu is one level. Group related screens under one item and use **Tabs** on that screen.
- The bottom bar shows the first `MaxBottomItems` items (5 by default). Put the ones people use most first.
- Icons are names from Power Apps' own set of about 180 (the same set as the classic icons), as the modern button and Icon controls use them: `Home`, `People`, `Settings`, `Cart`, `Document`, `Folder`, `Mail`, `Calendar` and so on. A name outside the set shows no icon, so pick from the Icon list in Studio.
- A canvas component can't place itself, so set its X, Y, Width and Height from the outputs, as shown above. If you leave its Width at 240, the collapsed menu still draws 64 pixels wide, but the rest of its box stays over your screen.
- The theme button changes the menu's own theme at once. To change it from your app as well, set `Theme` from your own variable and set that variable in `OnThemeChange`.
- The bottom bar has no room for the avatar or the theme button; put them on a settings screen on phones.
- On each screen it's a separate copy. Keep the menu the same everywhere with a global table (`gblMenu`) in `App.Formulas`, and set `Items` to it.

## Change log

- **0.1.0:** first version: side menu that collapses to icons, bottom bar on phones, badges, `HiddenKeys` and `DisabledKeys`, `CurrentKey`, placement outputs, `OnNavigate` and `OnToggle`, `SetCollapsed()`; who is signed in (`OnUserSelect`) and an animated light and dark switch (`OnThemeChange`, `CurrentTheme`).
