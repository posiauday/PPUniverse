# Market Landscape

Research only. No product decision, pricing, catalogue, or architecture is
approved by this document. See `README.md` for scope and the standing caveats.

Evidence classification and claim IDs (`CLM-###`) refer to `claims-register.csv`.
Every asset below is labeled by `AssetType` per `03-canvas-vs-pcf.md`'s
terminology rule — Canvas component, PCF code component, or complete app
template are not interchangeable.

## Canvas YAML component libraries

### PowerAppsUI (powerappsui.com)
- **Asset type:** Canvas components, plus a small number of screen/template
  patterns. Explicitly **not** PCF for its shipped catalogue (CLM-004).
- **Delivery mechanism:** copy-paste YAML, imported via Power Apps Studio's
  "Import from code" (component-library-free — the components are native Canvas
  controls, not packaged into a Canvas component library artifact).
- **Catalogue claim:** homepage highlights 27 components + 4 templates (CLM-001);
  the full catalogue page lists 35 entries total — 34 active Canvas + 1 PCF entry
  (coming soon) + templates and coming-soon items mixed in (CLM-002). See
  `02-competitor-evidence.md` for the itemized list.
- **Design system:** no single named design system; individual components
  reference Material Design / Material Design 3, and one (Navigation Menu) is
  described as shadcn/ui-inspired (CLM-005). Not consistently Fluent-aligned.
- **Licensing:** MIT, vendor states no attribution required (CLM-003) — see
  `08-licensing-and-trademarks.md` for the verification caveat.
- **Pricing:** free (CLM-003, CLM-004).
- **Adoption evidence:** none located beyond the vendor's own site. No public
  GitHub repository for the component source was found during this research, so
  no star count or independent activity signal exists.
- **Maintenance signals:** a "changelog" page exists on the site
  (`powerappsui.com/changelog`, found via search but not independently fetched in
  this pass) suggesting ongoing updates; not independently dated here.
- **Quality evidence:** none found — no visible tests, no accessibility
  statement, no performance claims on the pages fetched.
- **Limitations / not verified:** team size beyond the named solo founder (CLM-007);
  a claimed "DocRouter" product (CLM-008, not found — see `02-competitor-evidence.md`);
  actual code quality, since the component source (YAML) was not independently
  pulled and inspected in bulk.

### PowerLibs (powerlibs.com)
- **Asset type:** Canvas components (YAML copy-paste), plus "full apps."
- **Delivery mechanism:** copy-paste YAML, same general mechanism as PowerAppsUI.
- **Catalogue claim:** pricing page says "180+"; library page says "182" (CLM-009).
  Summing the library page's own visible category counts yields 170 — a
  12-component discrepancy against the page's own headline (CLM-010). This is
  the vendor's own internal inconsistency, not this research's error.
- **Design system:** not established in this pass — not directly researched
  beyond the pricing/library/license pages. Flagged as unverified in
  `04-component-quality-bar.md`.
- **Licensing:** proprietary, not MIT — see `08-licensing-and-trademarks.md` for
  full detail on redistribution and competing-product restrictions (CLM-016).
- **Pricing:** Components $99/yr, Ultra $149/yr (promotional, standing price
  claimed as $199/yr), Lifetime $499 one-time, Team Ultra $199/seat/yr with a
  3-seat minimum (CLM-012 through CLM-015). Full detail in
  `09-pricing-and-adoption.md`.
- **Adoption evidence:** employer logos shown on the homepage (Microsoft, Porsche
  Consulting, Stellantis, McLaren Group, Deutsche Bahn, Safran, Röchling,
  McCormick, Stadler Rail, National Grid, CarMax, EDEKA — CLM-018). **These are
  not procurement or endorsement evidence** — see `09-pricing-and-adoption.md`
  for why this distinction matters and is preserved, not converted into an
  adoption number.
- **Maintenance signals:** active, founder-run (CLM-019), promotional pricing
  observed at retrieval time implies ongoing commercial operation.
- **Quality evidence:** none independently verified — testimonials exist
  (VendorClaim) but no visible test suite, accessibility statement, or
  performance claim was found on the pages fetched.
- **Limitations / not verified:** exact founder legal name/business structure;
  true non-promotional Ultra price; whether the 12-component library/pricing
  discrepancy (CLM-010) reflects a stale category page, a stale pricing headline,
  or genuine miscount.

## PCF control libraries

### Microsoft Power CAT code components (`microsoft/powercat-code-components`)
- **Asset type:** PCF code components exclusively.
- **Delivery mechanism:** GitHub source + built managed solutions via GitHub
  Releases.
- **Catalogue:** one folder per control in the repository root — Breadcrumb,
  Calendar, Card, CommandBar, ContextMenu, DetailsList, DonutChart, Facepile,
  FluentMessageBar, GaugeChart, HorizontalBarChart, Icon, KeyboardShortcuts,
  MaskedTextField, Nav, PeoplePicker, Persona, Picker, Pivot, ProgressIndicator,
  ResizableTextarea, SearchBox, Shimmer, SpinButton, Spinner, StackedBarChart,
  SubwayNav, TagList — roughly 27 distinct controls by directory count (CLM-024).
- **Design system:** Fluent UI, explicitly (CLM-023).
- **Licensing:** MIT (CLM-024).
- **Pricing:** free.
- **Adoption evidence:** 201 GitHub stars, 194 open issues (a real, if
  imperfectly-triaged, usage signal) (CLM-024).
- **Maintenance signals:** last push 2025-06-30 — roughly 14 months stale as of
  this research's date, not abandoned but not under continuous active
  development either (CLM-024).
- **Quality evidence:** a GitHub code search for `*.test.ts` inside this
  repository returned 39 matches — the strongest real evidence found in this
  entire research pass of a credibly-tested PCF library (CLM-024). Not
  independently confirmed that all 39 are meaningful, non-trivial tests.
- **Limitations / not verified:** no public accessibility conformance statement
  found; no performance benchmark found.

### Microsoft Creator Kit (`microsoft/powercat-creator-kit`)
- **Asset type:** spans both Canvas components (Canvas Component Library,
  Fluent Design Theme Editor) and PCF controls (source in the code-components
  repo above), plus starter template apps — genuinely mixed, not a single asset
  type (CLM-023).
- **Design system:** Fluent UI (CLM-023).
- **Licensing:** MIT (CLM-023).
- **Pricing:** free.
- **Adoption evidence:** 409 GitHub stars, 128 open issues (CLM-023).
- **Maintenance signals:** last push 2025-03-10 — roughly 18 months stale as of
  this research's date (CLM-023).
- **Quality evidence:** the repository's own README makes **no mention of
  accessibility, WCAG, or automated testing** (CLM-023, CLM-030) — a real,
  citable absence, not an assumption. This is one of the clearer pain-point
  signals this research found: even Microsoft's own first-party kit does not
  publicly document accessibility verification.
- **Limitations / not verified:** whether accessibility/testing work exists but
  is undocumented in the README specifically, versus genuinely absent.

## Complete Canvas app templates and reference samples

### Microsoft PowerApps-Samples (`microsoft/PowerApps-Samples`)
- **Asset type:** a mix — sample code across Dataverse, model-driven apps,
  Canvas apps, PCF, portals, and AI Builder. Not a component library; a sample
  repository (per the terminology rule in `03-canvas-vs-pcf.md`, do not treat
  this as either a Canvas component library or a PCF control library on its own
  — it contains examples of both, undifferentiated from complete app/solution
  samples).
- **Licensing:** MIT (CLM-022).
- **Adoption evidence:** 1,982 GitHub stars — by a wide margin the most-starred
  Power Platform-related repository found in this research (CLM-022).
- **Maintenance signals:** last push 2026-09-03 — the most recently active
  resource found in this entire research pass (CLM-022).
- **Quality evidence:** not assessed in this pass — the repository is broad
  (spans many asset types) and a component-by-component quality audit was out
  of scope here.

## Community open-source assets

- **`generator-pcf`** (DynamicsNinja) — a scaffolding tool, not a finished
  component library; covered in `02-competitor-evidence.md` only. Dormant since
  2022-10-10 (CLM-025).
- No other actively-maintained community-run Canvas or PCF component *library*
  (as distinct from a scaffolding tool) was located beyond PowerAppsUI and
  PowerLibs in this research pass. This is a negative finding from a bounded
  search, not proof that none exists.

## Commercial assets

PowerLibs is the only paid, subscription-based commercial component library
found in this research. No other commercial competitor was located.

## Cross-cutting observations (ResearchInference)

- The broad Canvas component space already has at least one mature free option
  (PowerAppsUI) and one mature paid option (PowerLibs) with real, if unverified
  beyond vendor claims, adoption signals.
- Microsoft gives away substantial free inventory across both Canvas and PCF
  (Creator Kit, code-components, PowerApps-Samples), all MIT-licensed, with the
  PowerApps-Samples repo being the most actively maintained resource this
  research found overall.
- The one consistent, citable gap across every credible source checked —
  vendor and Microsoft first-party alike — is the near-total absence of public
  accessibility verification evidence. This is the strongest, most-repeated
  signal in this research pass; see `05-accessibility-verification.md` and
  `10-pain-points-and-opportunities.md`.
