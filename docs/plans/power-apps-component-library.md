# Plan: the Power Apps component library (MVP-049)

**Status:** direction approved by the product owner on 2026-10-08 (`docs/final-decisions.md`, "Power Apps component library: first, copy-paste YAML, free"). The details in this plan (the standard, the pages, the first components) are proposals until signed off. Research behind it: `docs/research/2026-10-08-components-and-offers-by-technology.md`.

## What we're building

A library of **canvas components for Power Apps** that makers copy as YAML and paste into Power Apps Studio. Each component arrives complete, with its design, controls and **custom properties of every kind**. Every component is free for now; a few need sign-in to copy. Each one has a guide, variations, usage examples, comments, a star rating, "Worked in my app", and "Report a problem".

Power Automate, Power BI, Copilot Studio, Dataverse and Power Pages come later, one at a time.

## How makers get a component (verified 2026-10-08)

- **Copy-paste:** Power Apps Studio accepts a component's YAML pasted into the **Components** tab (**New component**, click outside it, then Ctrl+V). The product owner confirmed this works with another library, and that library's YAML has the same top-level shape as Microsoft's source-code schema: `ComponentDefinitions:` → name → `DefinitionType: CanvasComponent`.
- **Pilot passed (2026-10-08, Studio 3.26094.8):** the product owner pasted `lcsButton` with all six property kinds and its test checklist passed. Studio differs from the published schema in two ways, both now enforced in CI (`content/components/README.md`):
  - function properties (InputFunction, OutputFunction) give their return type as `DataType`, not `ReturnType` (otherwise PA1011/PA1003);
  - every parameter needs a `Default`, or the paste fails with no details. Studio also writes `DisplayName` on every property, and so do we.
- **Format:** Microsoft's pa.yaml schema v3.0 ([schema](https://raw.githubusercontent.com/microsoft/PowerApps-Tooling/refs/heads/master/schemas/pa-yaml/v3.0/pa.schema.yaml), [docs](https://learn.microsoft.com/power-apps/maker/canvas-apps/power-apps-yaml)). Its custom property kinds are **Input** and **Output** (data), **InputFunction** and **OutputFunction**, **Event** and **Action** ([component properties](https://learn.microsoft.com/power-apps/maker/canvas-apps/component-properties)). Data types: Text, Number, Boolean, DateAndTime, Screen, Record, Table, Image, VideoOrAudio, Color, Currency.
- **Needs:** the "Enhanced component properties" setting (on by default for new apps), and "Modern controls and themes" when a component uses modern controls.
- **Limits to state on every page:** function properties can't read variables or the component's other properties (only their parameters); a component inside a component library can't use `AccessAppScope`.

## The LowCodeStacks component standard (proposal)

Every component must meet all of these before it's published. CI checks what it can; the product owner's Studio test checks the rest.

1. **Pastes and works without errors** in a current Studio, tested by the product owner (below), with the Studio version and date recorded.
2. **Valid against Microsoft's schema** (CI: `pa.schema.yaml` v3.0).
3. **Every kind of property, where it makes sense:**
   - **Inputs** for content, data (Table or Record with a documented schema), behaviour and design.
   - **Outputs** for state (`Selected`, `Value`, `IsValid`, `IsOpen`…).
   - **Events** for everything the app reacts to (`OnSelect`, `OnChange`, `OnSubmit`…), with parameters.
   - **Actions** the app can call (`Reset()`, `Open()`, `Close()`, `SetValue()`…).
   - **Functions:** an InputFunction where the app should shape output (formatting, labels), and an OutputFunction for pure helpers.
4. **Fully dynamic design:** a `Theme` input (a Record: colours, radius, font, spacing) with light and dark defaults, plus a short list of direct overrides. Nothing hard-coded that a maker could want to change.
5. **Responsive:** sizes come from `Parent` and inputs, never fixed screen positions; it works from 320 px wide.
6. **Accessible:** `AccessibleLabel` on every interactive control (a classic button is named by its `Text` instead, which Studio requires), a sensible `TabIndex` order, a visible focus state, text contrast at least 4.5:1 in both themes, live text announced where content changes, nothing that only works on hover.
7. **Delegation-safe:** components that take data never filter or sort it themselves in a way that hides rows. Paging, sorting and filtering are done by the app through events, or the component documents its limit.
8. **Naming:** component `lcs<Name>`; controls named by type and role (`btnPrimary`, `lblTitle`, `cntHeader`); properties in PascalCase; no abbreviations a maker can't guess.
9. **Blank-safe:** every input the component reads survives a blank value (`Coalesce`, `IsBlank`), so it never errors while the app's data is still loading. The component's own Width and Height come from its inputs only, never from a variable (Studio rejects that; CI checks it).
10. **Colours derived, not fixed:** hover and pressed states come from the maker's colours (`ColorFade(AccentColor, …)`), so any brand colour looks right.
11. **Works in a component library:** no `AccessAppScope`, no `App.` references; everything comes in through inputs and goes out through outputs.
12. **Performance:** few controls, no timers unless the feature needs one.
13. **No premium surprise:** standard controls only, no connectors inside the component, so using it never makes an app premium. Every page states this.
14. **Documented:** every property with type, default and description (from the YAML itself), usage examples, variations, an architecture tree, known limits, and a change log.

## Testing (the product owner)

I write the YAML and the docs; I can't run Studio. Before a component can be published, the product owner:
1. Pastes it into a test app in their free **Power Apps Developer Plan** environment (never a production tenant).
2. Runs its short **test checklist** (paste, each input, each output, each event, each action, light and dark themes, keyboard, a narrow screen).
3. Marks it **Tested** in the admin with the Studio version and date. Untested components can't be published.

## The site (proposal; designed on the canvas first, 3 concepts, for sign-off)

- **`/components`:** the library, with search and filters (category, what it needs), a card per component (preview image, name, property counts, rating, "worked" count, and a "sign-in" mark on members-only items).
- **A component page:**
  - preview images in light and dark, captured in Studio during testing;
  - **Copy YAML** (members-only items ask for sign-in) and the paste steps;
  - a "what this needs" label: modern controls on or not, no premium, tested-on version, last updated;
  - the properties table, grouped by kind;
  - usage examples and variations;
  - the guide;
  - the change log;
  - ratings, "Worked in my app", comments, and "Report a problem".
- **Reader feedback** (decided): comments (the same moderated comments as guides), a 1 to 5 star rating (signed in, one per person, changeable), "Worked in my app" (signed in, with their Studio version), and "Report a problem" (private, like guides).
- **Search:** component pages are public and indexable (`SoftwareSourceCode` structured data to be checked against Google's current support before use). The YAML itself is copied, not shown in full, on members-only items.

## Build order (vertical slices)

1. **Pilot (now):** one component, `lcsButton`, using all six property kinds, for the product owner to paste-test. It proves the format before anything is built on it.
2. **Content pipeline:** `content/components/<slug>/` with `component.yaml` (the paste-ready YAML), `component.md` (front matter and the guide) and variation YAML files. CI validates against Microsoft's schema and our standard (naming, accessibility properties, documented properties). An import step creates drafts, as with guides.
3. **Data and admin:** component records, "Tested" (version and date), members-only flag, publish.
4. **Pages:** `/components` and the component page (designed and signed off first).
5. **Feedback:** ratings, "Worked in my app", comments on components, "Report a problem".
6. **The first components** (below), each tested by the product owner.

The existing marketplace (products, releases, files, checkout) stays as it is for downloadable and paid items later; this library is a separate, simpler content type.

## First components (proposal)

The everyday pieces that are hard to get right. Each comes with variations.

1. **Button**, with all variants, icon, busy state, and all property kinds (the pilot grows into this).
2. **Text field**: label, hint, validation with an error message, character count, required.
3. **Dialog**: confirm, alert, form-in-dialog, with Open and Close actions and focus handling.
4. **Toast / notification**: success, warning, error, with a timeout and actions.
5. **Navigation shell**: header and side menu, collapsible, responsive, driven by a Table.
6. **Data table**: columns from a Table input, sorting and paging through events (delegation-safe), selection output, empty and loading states.
7. **Tabs and segmented control.**
8. **Empty, loading and error states.**

Competitors' lists (for coverage, not to copy) include charts, timelines, steppers, chips, date pickers, breadcrumbs, file upload and KPI cards. Those are candidates for later waves.

## Decided since (2026-10-08)

- **Sign-in only, first set** (the product owner can change any of these in the admin, and show or hide any component): open to everyone: Button, Text field, Tabs and segmented control, Toast, Empty/loading/error states. Sign-in to copy: Dialog, Navigation shell, Data table, and screen templates later. The larger, more valuable pieces earn an account; the everyday ones bring people in.
- **Previews are interactive web replicas** built for the site, with a **property playground**: change inputs, see outputs update live, fire events (shown in an event log), call actions, try functions, with the matching Power Fx formula shown for each. Each page says it is a web replica and Studio may look slightly different.

## Open questions

1. Sign-off on the standard above, then the 3 design concepts for the component page.
