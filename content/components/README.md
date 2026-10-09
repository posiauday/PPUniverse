# Power Apps component library (MVP-049)

Copy-paste canvas components, written here, reviewed in a pull request, checked in CI, and imported as **drafts**. The product owner paste-tests each one in a Power Apps developer environment, records the Studio version in `/admin/components` (its **Copy YAML** button copies the draft), and publishes it. Until then a draft can be marked **Coming soon**, which shows its card and a teaser page with a blurred picture and nothing to copy. The whole library is switched on and off in `/admin/settings`. See `docs/plans/power-apps-component-library.md`.

## Layout

```
content/components/<slug>/component.md      front matter + the guide
content/components/<slug>/component.yaml    the paste-ready YAML
content/components/<slug>/variations.yaml   optional named presets
```

The folder name is the slug.

## component.md

```
---
title: "Button"
slug: button
category: buttons-and-actions
summary: "One or two sentences: what it does and why it's better than the built-in control."
access: OPEN              # OPEN (anyone can copy) or MEMBERS (free, needs sign-in)
version: 1.0.0
modernControls: yes       # yes if it uses modern controls
---
## When to use it
## Use it
## Accessibility
## Known limits
## Change log
```

- **category:** `buttons-and-actions`, `inputs-and-forms`, `dialogs-and-feedback`, `navigation-and-layout`, `data-display` or `states`.
- **The guide** starts at `##`. The page already shows the preview, variations, what it needs, the properties (from the YAML) and the paste steps, so the guide covers using it: examples in Power Fx, accessibility, limits and the change log.

## component.yaml

Microsoft's pa.yaml schema v3.0, exactly as Studio accepts it in the **Components** tab:

```
ComponentDefinitions:
  lcsName:
    DefinitionType: CanvasComponent
    CustomProperties: ...
    Properties: ...
    Children: ...
```

- One component per file, and nothing else in the file.
- Named `lcs` + PascalCase. Properties in PascalCase.
- Every custom property has a description (10 characters or more). Every input has a default. Every parameter has a description.
- **Function properties (InputFunction, OutputFunction) give their return type as `DataType`, not `ReturnType`.** Microsoft's published schema says `ReturnType`, but Power Apps Studio rejects it on paste ("PA1011: The keyword 'DataType' is required"; found by the lcsButton paste-test, 2026-10-08). Events and actions keep `ReturnType: None`. The CI check follows Studio.
- **Every parameter has a `Default`** (such as `Default: =""`), and every property a `DisplayName`, the way Studio writes them in **View code**. A parameter without a default makes the paste fail with no details (paste-tests, 2026-10-08).

## Controls Studio accepts (verified in Studio 3.26094.8, 2026-10-08)

From pastes that worked in the product owner's developer environment. Use these names and versions; Studio offers to update older ones on paste.

| Control | YAML | Notes |
| --- | --- | --- |
| Modern button | `ModernButton@1.0.0` | `Appearance: =ButtonAppearance.Primary`, `Icon`, `Layout`, `DisplayMode`. Pagination also uses the icons `ChevronLeft`, `ChevronRight`, `ArrowPrevious` and `ArrowNext`, and 40-pixel-wide buttons, **not yet paste-tested by us**. The Navigation shell also uses `Align`, `PaddingLeft`, `VerticalAlign`, `PaddingTop`, `IconStyle` (`IconStyle.Filled` for the current item) and `Appearance: =ButtonAppearance.Transparent` over a highlight (Microsoft Learn's current page), **not yet paste-tested by us** |
| Modern text | `ModernText@1.0.0` | `Text@0.0.51` is upgraded to this by Studio |
| Modern text input | `ModernTextInput@1.0.0` | The People picker also uses `Type: =TextInputType.Search` and `TriggerOutput: =TriggerOutput.Delayed` (Microsoft Learn's current page), **not yet paste-tested by us** |
| Container | `GroupContainer@1.5.0` with `Variant: ManualLayout` | `Fill`, `DropShadow`, `RadiusTopLeft`… and its own `Children`. The Data table also uses `BorderColor` and `BorderThickness` on it for its cards, **not yet paste-tested by us** |
| Gallery | `Gallery@2.15.0` with `Variant: Vertical` | `Items`, `TemplateSize`, `TemplatePadding`, `ShowScrollbar`; `ThisItem` in its children. The People picker and Pagination also use `WrapCount` and `AccessibleLabel` (Pagination: seven buttons in one row), **not yet paste-tested by us** |
| Classic button | `Classic/Button@2.2.0` | useful as a transparent hit area. **No `AccessibleLabel`** (PA2108): its accessible name is its `Text`, so set the label there with transparent `Color`, `HoverColor`, `PressedColor` and `DisabledColor`. CI checks this. |
| Image | `Image@2.2.3` | an SVG data URI works as `Image`. The Data table draws its progress bars this way, putting a colour input into the SVG with `Mid(JSON(Color), 2, 7)` (`JSON` gives `"#rrggbbaa"`), **not yet paste-tested by us** |
| Rectangle | `Rectangle@2.3.0` | |
| Date picker | `ModernDatePicker@1.0.0` | **Not yet paste-tested by us.** The Date and time picker uses `DefaultDate`, `StartDate`, `EndDate`, `StartOfWeek`, `Format: =DatePickerFormat.LongAbbreviated`, `Appearance`, `BasePaletteColor`, `ValidationState`, `SelectedDate` and `OnChange` (Microsoft Learn's current page). |
| Dropdown | `ModernDropdown@1.0.0` | **Not yet paste-tested by us.** `Items`, `Default` (a value in Items), `Selected.Value`, `Appearance`, `BasePaletteColor`, `OnChange`. |
| Checkbox | `ModernCheckbox@1.0.0` | **Not yet paste-tested by us, and its YAML name is our best reading** (Microsoft Learn documents the control, `Checked`, `Label`, `OnCheck`, `OnUncheck`, `BasePaletteColor`, `AccessibleLabel`, but gives no YAML example). The Data table uses it for row selection. |
| Tab list | `ModernTabList@1.0.0` | **Not yet paste-tested by us.** `Items` (a table of text), `Default` (one of them), `Appearance: =TabListAppearance.Subtle`, `Alignment`, `OnChange`, read with `Selected.Value`. Used by Tabs and by the Data table's Table/Cards/List switch. |
| Timer | `Timer@2.1.0` | **Not yet paste-tested by us** (used in another MIT-licensed library's component). Button 0.2.0 and Toast 0.2.0 use it with `Visible: =false`. Studio runs timers only in preview (F5). |

**Never size a component from a variable:** Studio reported `locOpen` as an error in the component's own Height and Width, even with an `OnReset` that sets it (lcsFab paste-test, 2026-10-08). Size the component from its inputs only. Outputs that read variables work (lcsButton's ClickCount). Also verified: `OnReset` as a component property; Color, Record and Table inputs with defaults. Not used here: `AccessAppScope` (it ties a component to one app, and component libraries can't use it).

**Placing a component from its own outputs** (the Navigation shell: the instance's X, Y, Width and Height set to `navMain.ShellX`, `ShellY`, `ShellWidth` and `ShellHeight`, which read a variable inside it) is **not yet paste-tested by us**. It is the instance that reads the outputs, not the component's own size, so it should differ from the case above; the paste-test checklist gives the fallback.

**Long formulas** (the Tree view's rows: `Ungroup` of a table of tables built level by level, sorted with `Sort` by a text path; `Last(FirstN(...))` for the nth row) and a **`Record` output** (`SelectedNode`) are **not yet paste-tested by us**.

**An `InputFunction` returning a Boolean, called inside the component** (the Stepper's `CanLeaveStep(Step)`, also inside `Filter(Sequence(...), ...)` in an action) is **not yet paste-tested by us**. The Button's `FormatLabel` (an `InputFunction` returning text, with a `Default`) pastes; this is the same shape.

## variations.yaml

```
- name: Outline
  description: A visible but quiet action.
  settings:
    Appearance: ="Outline"
```

`settings` only set the component's **inputs**, with Power Fx formulas.

## Checks

CI runs `packages/adapters/content/src/component-files.test.ts`: every folder must parse, pass Microsoft's schema (`packages/adapters/content/schema/pa.schema.v3.0.yaml`) and the rules above, and use a unique slug and component name.

## Import

Drafts import automatically on each production release. By hand:

```
DATABASE_URL=... ARTICLE_AUTHOR_EMAIL=<an ADMIN's email> pnpm --filter @ppu/adapter-content components:import
```

- A new slug is created as a draft.
- An existing **draft** is updated from its files. If its YAML changed, its test record is cleared, so it has to be paste-tested again.
- A **published** component is never changed by the import.
- If any folder is invalid, nothing is imported.

## The live preview

Each component's page shows an interactive web replica, registered by component name in `apps/web/app/components/ComponentWorkbench.tsx` (`REPLICAS`). A component without one shows its page without the live preview until it has one.
