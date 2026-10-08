# Power Apps component library (MVP-049)

Copy-paste canvas components, written here, reviewed in a pull request, checked in CI, and imported as **drafts**. The product owner paste-tests each one in a Power Apps developer environment, records the Studio version in `/admin/components`, and publishes it. See `docs/plans/power-apps-component-library.md`.

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
