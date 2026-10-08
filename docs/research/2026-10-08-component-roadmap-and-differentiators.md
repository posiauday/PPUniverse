# Component roadmap and differentiators (research, 2026-10-08)

**Question (product owner, 2026-10-08):** which components should the library offer, and what must each have that nobody else offers, with a premium look, "otherwise there's no use, competitors already give it for free"?

**Status:** research and a recommendation. Nothing here is decided until the product owner approves it (`docs/final-decisions.md`). Builds on `docs/research/power-apps-components/` (especially `10-pain-points-and-opportunities.md`).

## 1. What already exists (checked 2026-10-08)

| Source | Cost and licence | What it offers | Depth, from its own pages |
| --- | --- | --- | --- |
| **PowerApps UI** (powerappsui.com) | Free, MIT (component code) | 35 components (34 canvas YAML, 1 PCF): Calendar Pro (delegable date window), Deadline (working days and holidays), Accordion list, File and Photo upload, Send-email dialog, Activity timeline, Bar list, Sidebar (20 properties), Loading screen, Stepper, Segmented control, Line/Bar/Pie charts, Heatmap, Navigation menu, KPI cards, FAB with speed dial, Notification badge, Bottom navigation, Chips, Date picker with range, Table, Loading overlay, Dialog, Breadcrumbs; "coming soon": search bar, slider, bottom/side sheet, snackbar, top app bar | Deep. Example: its Dialog has Alert/Confirmation/Form types, a Buttons table, a validated input, 7 icons, light/dark, close icon and backdrop blur. Patterns: show/hide through a variable the maker sets; one event plus a `SelectedButton` output; `App.Width` and an HtmlViewer for blur. Accessibility and Studio-version testing aren't stated |
| **PowerLibs** (powerlibs.com) | Paid ($99/year), a few free; licence forbids redistribution and competing libraries | 182 components in 22 categories: accordions, animations, app shells, badges, 14 buttons, calendars, cards, data display, drawers, dropdowns, galleries/carousels, 14 modals, navigation bars, sidebars, speed dial, steppers, tabs, toasts, tooltips, toggles, 17 input fields with validation, uploads (drag-and-drop, photo picker, signature pad) | Broad; detail behind the paywall |
| **Microsoft Creator Kit** | Free | Fluent UI code components (PCF): Breadcrumb, Calendar, CommandBar, ContextMenu, DetailsList, Dialog, Facepile, Nav, Panel, PeoplePicker, Picker, Pivot, ProgressIndicator, SearchBox, Shimmer, SpinButton, SubwayNav, TagList, charts and more | Needs a managed solution and **code components allowed by an admin** in each environment; several are Preview or Experimental |
| **Built-in modern controls** | Included | Button, Text, Text input, Number input, Date picker, Combo box, Dropdown, Radio, Checkbox, Toggle, Slider, Tab list, Table (preview), Badge, Avatar, Progress bar, Spinner, Info button, Link, Icon, Form | Fluent 2; fewer styling properties than classic; renamed properties in the 2026 updates |
| **tchinnin/powerapps-canvas-code-library** | Free, MIT | 8 snippets (toolbar, featured button, dialogs, gallery table, indicator tile, multi-steps, search box) | Small, 20 stars |

## 2. What makers ask for and struggle with (evidence)

- **No time picker**, and the date picker picks one date only; a time picker has been an open idea since 2018 ([Dynamics community](https://community.dynamics.com/blogs/post/?postid=7c94a7da-0532-4beb-b70d-ca98b5953cf6), [Microsoft Learn](https://learn.microsoft.com/power-apps/maker/canvas-apps/controls/control-date-picker)).
- **People picking**: the modern combo box shows only the first few directory users; the Creator Kit picker reads the Users table, not the directory ([Matthew Devaney wishlist](https://www.matthewdevaney.com/top-10-power-apps-features-wishlist/)).
- **Gallery pagination**: no first/previous/next/last; makers rebuild it with formulas ([Power Platform Community](https://community.powerplatform.com/galleries/gallery-posts/?postid=0a513b96-e549-4c20-ac23-c430f2121cbd)).
- **Tree view**: none out of the box; workarounds with nested galleries ([Canviz](https://canviz.com/power-apps-tree-control/)).
- **Kanban**: frequently asked in the community; mostly answered with PCF or custom pages.
- **Component libraries break apps** when an input is renamed or retyped; copied components drift; no updates in Power Apps Mobile ([Microsoft Learn](https://learn.microsoft.com/power-apps/maker/canvas-apps/component-library), [Collab365](https://collab365.com/blog/a-beginners-guide-to-power-apps-components)).
- **Modern controls are still settling** (property renames in 2026, fixes still coming to Form, Dropdown, Gallery), so YAML written for older versions fails ([Microsoft](https://learn.microsoft.com/power-apps/maker/canvas-apps/controls/modern-controls/modern-control-updates)).
- **Code components (PCF) need admin approval**, which many organisations don't give (earlier research, `03-canvas-vs-pcf.md`).

## 3. Internal debate

**Option A: out-catalogue them** (match PowerApps UI's 35, then grow). *Against:* PowerLibs already has 182; a free catalogue race is unwinnable and spreads quality thin.

**Option B: fewer components, each clearly the best.** *For:* a maker picks one dialog, not five; being the best answer for the components every app needs wins search and word of mouth. *Against:* the earlier research found "verified quality" alone unproven as a reason people switch.

**Option C: whole screens and patterns** (list + detail + edit with states). *For:* LowCodeStacks is a learning site; screens show the components working together and link to guides. *Against:* more to test; best after the parts exist.

**Option D: fill the gaps nobody covers well** (time and date-range picker, directory people picker, pagination, tree view, Kanban). *For:* real, repeated demand with weak free answers. *Against:* hardest builds.

**Where we landed:** **B + D first, C next, never A.** Every component must beat the best free equivalent on visible features, not just on quality claims; and the gap components are where we can be the only good answer.

## 4. What makes every LowCodeStacks component different (library-wide)

Each of these is something the competitors' pages don't show; the first four are visible on every component page.

1. **Try every property before you copy.** A live web replica with a playground for inputs, outputs, events (with an event log), actions and functions, and the Power Fx shown for each. Competitors show a static preview or a light/dark toggle.
2. **Controlled from your app with actions.** `Open()`, `Close()`, `Reset()`, `SelectTab()`… instead of visibility variables you have to manage, and **events that pass what happened** (`OnItemSelect(Key, Label)`, `OnButtonSelect(Action, InputText)`) instead of an event plus an output to read afterwards.
3. **Paste-tested, with proof.** Each version is pasted into Power Apps Studio and its checklist run before publishing; the Studio version and date are on the page, and CI checks the YAML against the properties Studio actually accepts. When a component changes, the change log says so and inputs are never renamed in place.
4. **Accessible by design.** Every interactive part has a screen-reader name, keyboard use is tested, colours meet 4.5:1, and states never rely on colour alone. Competitors don't state accessibility.
5. **Works in a component library and on mobile.** No app scope and no `App.` references, so it can live in an organisation's component library.
6. **Your brand, light or dark, from two inputs.** `AccentColor` and `Theme`; hover and pressed colours derive from the accent, so any brand looks right.
7. **Dynamic without editing tables.** Keys plus `HiddenKeys` / `DisabledKeys` for role- or state-based options (as in the FAB).
8. **Every visible word is an input**, so apps can be translated.
9. **Delegation-safe data components.** Paging, sorting and searching are events your app answers against the data source, so nothing is silently cut at 500 or 2,000 rows.
10. **Linked to a guide** on the same site that teaches the pattern.

## 5. The components, in build order

"Best free today" is the strongest free equivalent we found. **Only here** is what LowCodeStacks adds.

### Wave 1: the everyday set (built; bring each up to this bar before publishing)

| Component | Best free today | Only here (must have before publishing) |
| --- | --- | --- |
| **Button** | Built-in modern button | Busy state that blocks double clicks; click count; `FormatLabel` hook; `IsValidLabel` helper; variants from one input. **Add:** `Theme`, `AccentColor` with derived hover, optional confirm-before-run (`RequireConfirm` + `OnConfirm`) |
| **Text field** | Built-in text input; PowerLibs fields (paid) | Label, hint, required, count, `Validate` hook, `IsValid`, `ErrorMessage` from the server, errors after the user leaves, three looks, theme. **Add:** input masks for common formats (email, phone, postal code) as a `Format` input with built-in checks |
| **Dialog** | PowerApps UI Dialog (types, buttons table, validated input, icons, theme) | **Upgrade needed (ours is behind today).** Types (alert, confirm, form, danger), a `Buttons` table with keys, a validated input, icons; plus `Open()`/`Close()` actions, `OnButtonSelect(Action, InputText)` passing the answer, "type DELETE to confirm" for destructive actions, no `App.` references |
| **Toast** | PowerApps UI snackbar (coming soon) | `Show(Message, Kind)`, four kinds with symbols, action button, `FormatMessage`. **Add:** auto-dismiss (`Duration`) and a small queue so two messages don't overwrite each other |
| **Tabs / segmented control** | Built-in tab list; PowerApps UI segmented control | `SelectTab()` action, `OnChange(Tab)`, `ItemsFromText`, four looks. **Add:** badges (counts) per tab, `HiddenKeys`/`DisabledKeys` |
| **Empty, loading, error states** | Creator Kit Shimmer (PCF) | One panel for three states, `StateFor()` helper, `OnAction(State)`. **Add:** skeleton rows for loading, and a "no results for your search" variant |
| **Floating action button** | PowerApps UI FAB | Add-new by default, keys, `OnItemSelect(Key, Label)`, hide/disable by key, direction, actions, accessible names, own icons, `IconSvg` helper. **Done.** |

### Wave 2: the gaps (where we can be the only good answer)

| Component | Best free today | Only here |
| --- | --- | --- |
| **Date and time picker** (date, time, date-time, range) | PowerApps UI date picker (with range); no time picker anywhere free | Time and date-time in one component (15-minute steps, 12/24 h), ranges with presets (Today, This week, Last 30 days), min/max and blocked days (weekends, holidays table), working-day maths reused from a helper, time-zone label |
| **People picker (directory)** | Built-in combo box (shows few users); Creator Kit picker (Users table, PCF) | Your app does the directory search (`OnSearch(Text)` → Office 365 Users), so it reaches every user with no connector inside the component; chips with photos, multi-select limits, "me" shortcut, recent people |
| **Pagination** | Community formulas | First/previous/next/last, page numbers, page-size picker, "1–20 of 312"; `OnPageChange(Page, PageSize)` for delegable `FirstN/Skip`-style loading |
| **Data table** (sign-in) | PowerApps UI Table; Creator Kit DetailsList (PCF) | Columns from a table input, sorting and paging as events (delegation-safe), row selection and bulk actions, row actions menu, sticky header, density, empty/loading states built in, keyboard row navigation |
| **Navigation shell** (sign-in) | PowerApps UI Sidebar; Creator Kit Nav (PCF) | Responsive: side menu on desktop, bottom bar on phones, from one items table; role-based items with `HiddenKeys`; badges; current screen from your app; collapse state as an output |
| **Tree view** | None free in YAML | One flat gallery (no nesting), expand/collapse, lazy children through `OnExpand(Key)`, selection, keyboard arrows |
| **Stepper / wizard** | PowerApps UI Stepper | Step validation through a `CanLeaveStep(Step)` hook, so users can't skip required steps; progress and summary; `GoToStep()` action |

### Wave 3: patterns and premium

- **Kanban board** (sign-in): columns from a table, move by buttons and keyboard (no drag in canvas), WIP limits, `OnMove(Key, ToColumn)`.
- **Screen templates** (sign-in): list + detail + edit, approval request, settings page, each built from the components above with a guide.
- **Charts** only if Microsoft's built-in options stay limited; PowerApps UI already covers line, bar, pie and heatmap for free, so these are low priority.

### Not building

- Plain wrappers of built-in controls (checkbox, toggle, slider, badge, avatar, spinner) unless they add a real behaviour.
- Anything needing a connector inside the component; the app makes the call and passes results in.
- Effects that depend on HtmlViewer CSS (blur), which add weight and can fail in some players.

## 6. What changes right away

1. **Dialog 0.2.0** to the bar above before it's published (today it's behind the best free one).
2. Add `Theme` and `AccentColor` with derived colours to Button, Toast, Tabs and States (Text field and FAB have them).
3. Toast auto-dismiss and queue; Tabs badges and keys; States skeleton.
4. Then Wave 2 in order: Date and time picker, People picker, Pagination, Data table, Navigation shell, Tree view, Stepper.

## 7. Decisions for the product owner

1. Approve the direction: **fewer, best-in-class components plus the gap components; screens next; no catalogue race.**
2. Approve the ten library-wide differentiators in section 4 as part of the component standard.
3. Approve the Wave 2 order, or reorder it.
4. Sign-in to copy: Data table, Navigation shell, Kanban and screen templates (already decided for the first three); add the People picker?

## Sources

- PowerApps UI: [components](https://www.powerappsui.com/components), [Dialog](https://www.powerappsui.com/components/dialog), [licence](https://www.powerappsui.com/license)
- PowerLibs: [library](https://www.powerlibs.com/library), [licence](https://www.powerlibs.com/license)
- Microsoft: [Creator Kit components](https://learn.microsoft.com/power-platform/guidance/creator-kit/components), [modern control updates](https://learn.microsoft.com/power-apps/maker/canvas-apps/controls/modern-controls/modern-control-updates), [component library](https://learn.microsoft.com/power-apps/maker/canvas-apps/component-library), [date picker](https://learn.microsoft.com/power-apps/maker/canvas-apps/controls/control-date-picker)
- [tchinnin/powerapps-canvas-code-library](https://github.com/tchinnin/powerapps-canvas-code-library)
- Community: [time picker gap](https://community.dynamics.com/blogs/post/?postid=7c94a7da-0532-4beb-b70d-ca98b5953cf6), [Devaney wishlist](https://www.matthewdevaney.com/top-10-power-apps-features-wishlist/), [gallery pagination](https://community.powerplatform.com/galleries/gallery-posts/?postid=0a513b96-e549-4c20-ac23-c430f2121cbd), [tree view](https://canviz.com/power-apps-tree-control/), [component library guide](https://collab365.com/blog/a-beginners-guide-to-power-apps-components)
