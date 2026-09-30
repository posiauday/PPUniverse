# Competitor Evidence

Research only. Claim IDs (`CLM-###`) refer to `claims-register.csv`. Short
quotes below are limited to the clauses necessary to establish a legal or
commercial fact — full pages are not reproduced.

## PowerAppsUI (powerappsui.com)

**Asset type:** Canvas components and screen/template patterns. Not PCF for its
shipped catalogue.

**Positioning.** Homepage hero, quoted verbatim: *"Production-ready components,
templates, and patterns for Power Apps developers — built with Power Fx, no PCF
required."* (CLM-004) The "no PCF required" framing is a direct, explicit
positioning choice — it markets *avoiding* PCF as a feature, not a limitation.

**Catalogue.** The homepage highlights **27 Components** and **4 Templates**
(CLM-001). The full catalogue page (`/components`) lists **35 entries**
(CLM-002):

- 27 active Canvas components (Calendar Pro, Deadline, Accordion List, File
  Upload, Send Email, Activity Timeline, Bar List, Photo Upload, Sidebar,
  Loading Screen, Stepper, Segmented Control, Line Chart, Navigation Menu, SVG
  Bar Chart, KPI Cards, Floating Action Button, Notification Badge, Bottom
  Navigation Bar, Chips Component, Date Picker, Table, Loading Overlay, Dialog
  Component, Breadcrumbs, Pie Chart, Heatmap)
- 7 "coming soon" Canvas entries (Event Form, Material Design Search Bar,
  Material Design Slider, Bottom Sheet, Side Sheet, Snackbar/Toast, Top App
  Bar)
- 1 PCF entry — **"PCF LeftNav (Canvas App)"** — the only non-Canvas asset in
  the catalogue, and the one shown in the "coming soon" section, not shipped
  (CLM-006). This is worth stating plainly: **a self-described "no PCF
  required" component library's own future roadmap includes exactly one PCF
  item, and it is unreleased.**

**Design system.** No single named design system is claimed. Individual
components reference **Material Design 3** (Bottom Navigation Bar, Chips
Component, Date Picker, several coming-soon items) and one component
(Navigation Menu) is explicitly described as **shadcn/ui-inspired** (CLM-005).
This is a mixed, not internally consistent, visual language — not
Fluent-aligned, despite targeting a Microsoft product.

**Licensing.** *"Every component, layout, and template is free and open source
under the MIT license"* and usable *"in unlimited personal and commercial
projects with no attribution required"* (CLM-003). See
`08-licensing-and-trademarks.md` for the verification caveat — no linked GitHub
repository with a canonical `LICENSE` file was located to independently confirm
this against the actual MIT text, which does normally require notice
preservation.

**DocRouter.** Searched directly — the homepage, the full components catalogue,
and the About/services page. **No mention of a product called "DocRouter" was
found anywhere** (CLM-008). This is recorded as `Unknown`, not filled in with a
plausible guess, per the research instruction's explicit requirement.

**Origin/team.** Run by a named solo individual, **Rodas Yonass**, described on
the site as *"Solo builder · Power Platform developer"*, maintaining the site
as an open-source side project (CLM-007). No team, company structure, or
funding disclosed. This matters for sustainability: a free, MIT-licensed,
single-maintainer project has no committed continuity guarantee.

**Adoption/reputation signals.** None found beyond the vendor's own site — no
public GitHub repository for the component source was located, so no star
count, issue activity, or other independent signal exists to evaluate.

## PowerLibs (powerlibs.com)

**Asset type:** Canvas components (YAML copy-paste), plus "full apps."

**Catalogue and the count discrepancy.** The pricing page's headline claims
**"180+ Power Apps components"**; the library page's own headline claims
**"182"** (CLM-009) — two different specific numbers on two pages of the same
site. Summing every category count actually visible on the library page:

| Category | Count | Category | Count |
|---|---|---|---|
| Accordions | 7 | Navigation Bars | 5 |
| Animations | 9 | Sidebars | 7 |
| App Shells | 6 | Speed Dial | 5 |
| Badge | 7 | Steppers | 5 |
| Buttons | 14 | Tabs | 8 |
| Calendars | 3 | Toast | 5 |
| Cards | 10 | Tooltips | 5 |
| Data Display | 7 | Toggles | 9 |
| Drawer | 6 | Input Fields | 17 |
| Dropdowns | 8 | Uploads | 6 |
| Gallery | 7 | | |

**Total: 170** — a **12-component shortfall** against the page's own "182"
headline (CLM-010). This is the vendor's own internal inconsistency, arrived at
by simple arithmetic on the vendor's own published numbers, not an allegation
this research is making independently.

**Free tier.** The free components page states *"Copy any of the 14 free
components"* and lists exactly 14 named components (Bottom Sheet, Form Drawer,
Floating Action Button, Dropdown Menu, Accordion, Modal, Toast Notification,
Input, Toggle, Primary Button, Outline Button, Tab Bar, Sidebar Wide, Dynamic
Form Card) (CLM-011).

**Pricing** (all figures CLM-012 through CLM-015, retrieved 2026-09-24 — treat
as a dated snapshot, review by 2026-10-24):

| Plan | Price | Notes |
|---|---|---|
| Components | $99/year | 180+ components, full apps, YAML copy-paste, Form Builder, Logo Generator, SVG Library, PowerFX Toolkit, Custom Components, Community Library |
| Ultra | $149/year | Marked as reduced from $199/year, labeled a "September sale" (promotional — the $199 standing price is itself an unverified vendor claim). Adds AI Tools integration (Claude, Cursor, Copilot) |
| Lifetime | $499 one-time | All current and future components/tools, permanently |
| Team Ultra Access | $199/seat/year, 3-seat minimum | Full Ultra per member, private team library, admin dashboard |

**Licensing — redistribution and competing products.** Quoted directly from the
license page (CLM-016):

> *"Don't distribute PowerLibs components or anything based on them as separate
> items. They must always be part of a larger End Product."*

> *"You cannot build a tool, software product, or component library that is
> considered a direct competitor to PowerLibs or offers similar functionality,
> features, or services."*

Building a client application that *incorporates* PowerLibs components is
explicitly permitted and may be sold; redistributing the raw components, or
building anything resembling a competing component library, is explicitly
prohibited. **This second restriction is directly relevant to LowCodeStacks
strategically**: if LowCodeStacks ever evaluated selling or redistributing
PowerLibs-sourced components on its own marketplace, this clause would forbid
it outright — not a licensing detail to overlook.

**Marketing vs. license text on cancellation.** The pricing page states,
broadly: *"Everything you unlock stays usable even after you cancel. Subscribers
keep every component released during their subscription."* The license page's
own text is narrower (CLM-017):

> *"Cancelling your Ultra subscription is not a license termination. You retain
> perpetual access to your Base Components (Components Pack). You only lose
> access to Ultra Components and Ultra features."*

Read together, the marketing framing ("everything you unlock") and the license's
own carve-out (Base tier only survives cancellation; Ultra-tier access does not)
are not identical claims. This is `ResearchInference` — a direct comparison of
two of the vendor's own pages — not an allegation of bad faith, and not
independently legally assessed.

**Adoption signals.** No specific user/customer count is published (checked the
homepage directly). Employer logos are displayed: Microsoft, Porsche Consulting,
Stellantis, McLaren Group, Deutsche Bahn, Safran, Röchling, McCormick, Stadler
Rail, National Grid, CarMax, EDEKA (CLM-018). **Per this research's explicit
instruction, these logos are not converted into adoption or procurement
evidence** — a logo on a vendor's marketing page most plausibly indicates one or
more individual employees are personal subscribers, not that the named
organization purchased or endorsed the product. Testimonials found via search
are first-party, unverified quotes (VendorClaim), not independently audited
reviews.

**Origin/team.** Founder-led, referred to as "Dennis" on-site; an external
Buttondown newsletter post ("Introducing PowerLibs: my biggest project yet")
attributes the project to **Dennis Doer** (CLM-019). Full legal name/business
structure beyond this is not confirmed. Same sustainability caveat as
PowerAppsUI: single-maintainer commercial project.

## Summary comparison

| | PowerAppsUI | PowerLibs |
|---|---|---|
| Asset type | Canvas (99%) + 1 unreleased PCF item | Canvas |
| Catalogue (as claimed) | 27–35 (homepage vs. full catalogue) | 180+/182 (two different headline numbers) |
| Catalogue (independently summed) | 35, directly counted, consistent | 170, vs. 182 claimed — 12-item gap |
| Design system | Mixed (Material Design 3, shadcn-inspired) | Not independently assessed |
| License | MIT, free | Proprietary, paid, redistribution + competing-product restrictions |
| Price | Free | $99–$499/yr or one-time; $199/seat/yr team |
| Origin | Solo maintainer | Founder-led, apparently a small commercial operation |
| Adoption evidence | None independent | Employer logos (not procurement evidence) |
| Quality/accessibility evidence | None found | None found |
