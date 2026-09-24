# Power Apps Component Landscape — Research Package

**Purpose:** consolidate research into Power Apps Canvas components, Canvas
component libraries, PCF code components, competitors, engineering quality,
accessibility, performance, testing, licensing, pricing, and adoption, into a
durable, source-controlled reference.

**Research date:** 2026-09-24.

**Scope:** market landscape, named competitor evidence (PowerAppsUI,
PowerLibs), Microsoft's own free offerings (`PowerApps-Samples`, Creator Kit,
`powercat-code-components`), the Canvas-vs-PCF technical distinction, a draft
(unapproved) component quality bar, accessibility/performance/testing
verification frameworks, licensing and trademark findings, pricing and
adoption evidence, and pain points.

**This is research and documentation only. No implementation is approved by
this package.** No component has been built or prototyped. No product shape,
pricing, architecture, or component catalogue is decided. No requirement ID
has been created. This package exists so the eventual decision — recorded
separately in `docs/open-questions.md` item 60 and `planning/proposed-stories.md`'s
PROP-008 — has real evidence behind it, not so that decision is made here.

## Canvas components, PCF controls, and app templates are not the same thing

This entire package is organized around a hard distinction (`03-canvas-vs-pcf.md`):

1. **Canvas component** — authored in Power Apps Studio with Power Fx,
   distributed as copy-paste YAML or a Canvas component library.
2. **PCF code component** — authored in TypeScript against the Power Apps
   Component Framework's lifecycle API, packaged and distributed as a Power
   Platform solution, subject to administrator review and environment
   enablement.
3. **Complete Canvas app template** — a full app or screen collection, which
   may *contain* Canvas components but is not itself a component library or a
   PCF control.

These have different implementation, testing, installation, security,
support, and distribution requirements. No file in this package uses "Power
Apps component" as an undifferentiated generic term.

## Executive summary

- **The broad Canvas component market is already populated.** Two real,
  functioning competitors were found and directly evidenced: PowerAppsUI
  (free, MIT, 35 catalogue entries) and PowerLibs (paid, proprietary, ~170–182
  catalogue entries depending on which of the vendor's own pages you read).
- **Microsoft provides free Canvas and PCF assets already.** `PowerApps-Samples`
  (1,982 stars, most recently active of everything found — last push
  2026-09-03), `powercat-creator-kit` (409 stars, spans Canvas and PCF), and
  `powercat-code-components` (201 stars, PCF-only, the only source in this
  entire research pass with concrete evidence of automated testing — 39
  `*.test.ts` files found by direct code search). All three are MIT-licensed.
- **PowerAppsUI is primarily a Canvas YAML library, not a shipped PCF
  library.** Its own marketing leads with "no PCF required"; its one PCF
  catalogue entry ("PCF LeftNav") is listed as coming soon, not released.
- **PowerLibs is a paid Canvas YAML competitor**, with real commercial
  infrastructure (four pricing tiers, a team plan, a promotional pricing
  cycle) and a license that explicitly prohibits both raw component
  redistribution and building a competing component library.
- **The PCF side of the market is more established than it first appeared.**
  A follow-up pass found `pcf.gallery` — a multi-year-old (confirmed active
  since at least 2019), MVP-operated community directory with at least 63
  pages of listed PCF controls and an existing commercial "Store" channel
  already inviting paid ISV listings (CLM-034 through CLM-036,
  `01-market-landscape.md`). The earlier finding that the community-tool side
  of PCF was thin (`generator-pcf`, `PCF Builder`, both abandoned) was about
  *scaffolding tools*, not about the *component ecosystem itself* — which
  turns out to have real, long-running, credible infrastructure a new
  entrant would be competing against.
- **The strongest possible differentiation appears narrower than "modern
  components."** Both existing competitors already out-catalogue what a new
  entrant could plausibly ship on day one. Neither publishes any
  accessibility, performance, or compatibility evidence — nor does Microsoft's
  own first-party Creator Kit, whose README was read directly and contains no
  accessibility or testing claim at all.
- **Possible differentiation relates to verified quality, Fluent alignment,
  accessibility evidence, performance evidence, compatibility evidence, and
  enterprise/public-sector documentation** — not a larger catalogue, since
  neither existing competitor's catalogue size is realistically beatable on
  day one, and not "modern" as a bare aesthetic claim, since both competitors
  already reference current design trends (Material Design 3, shadcn/ui) to
  varying degrees.
- **This is a `ResearchInference`, not an approved direction.** See
  `10-pain-points-and-opportunities.md` for the pain points that support this
  reading, the strong counterevidence against it, and a genuinely valid
  "no meaningful opportunity" alternative reading that this research did not
  rule out.

## Evidence classification

Every factual claim in this package is classified as exactly one of:
`OfficialDocumentation`, `VendorClaim`, `RepositoryEvidence`,
`IndependentEvidence`, `ResearchInference`, or `Unknown`. See
`claims-register.csv` for the full register and
`04-component-quality-bar.md`'s sibling files for how each classification is
applied in practice. Vendor marketing is never treated as independently
verified fact — a vendor's own claim about itself is `VendorClaim`, not
upgraded to something stronger just because this research read it directly
from the vendor's own page.

## Strongest verified findings

- PowerLibs's own two pages disagree with each other: the pricing page says
  "180+," the library page says "182," and the library page's own visible
  category counts sum to 170 (`claims-register.csv` CLM-009, CLM-010).
- The `pac` CLI is governed by a Microsoft Software License Terms EULA, not
  MIT — a materially different license than every Microsoft sample/reference
  repository checked in this research, all of which are MIT (CLM-020 through
  CLM-024).
- A PCF control that calls an external service directly from client code
  forces Premium licensing on every consuming app (CLM-032) — a real,
  concrete cost with no equivalent in the Canvas-only competitors surveyed.
- No accessibility verification method is publicly documented by any source
  checked in this research — two commercial vendors and three Microsoft
  first-party repositories, six sources total, zero accessibility statements
  found.

## Strongest unresolved questions

See `11-open-research-questions.md` for the full list. The three that most
directly block a future decision:
- Which asset type(s) — Canvas, PCF, templates — is LowCodeStacks actually
  evaluating?
- What would actually prove customer demand, as distinct from
  creator/maintainer interest, for whatever gets built?
- Is the "verified quality is the differentiator" inference correct, or is
  the honest reading that the Canvas market is already adequately served for
  the dominant Maker persona (`docs/02-prd.md`), and any real opportunity is
  much narrower than "build better components" generically?

## Files in this package

- `README.md` — this file.
- `01-market-landscape.md` — every asset type and provider surveyed, organized
  by category.
- `02-competitor-evidence.md` — the full, itemized PowerAppsUI and PowerLibs
  evidence, including the exact discrepancies found.
- `03-canvas-vs-pcf.md` — the technical/operational comparison and the
  terminology rule this whole package is built on.
- `04-component-quality-bar.md` — a draft, unapproved quality matrix for
  Canvas and PCF separately.
- `05-accessibility-verification.md` — the three-layer verification model
  (automated, manual, real-host) and why none of the sources surveyed clear
  even the first layer publicly.
- `06-performance-verification.md` — PCF and Canvas performance concerns and
  what a credible benchmark record would require.
- `07-testing-strategy.md` — a candidate (not approved) verification stack,
  and who/what can actually perform each check.
- `08-licensing-and-trademarks.md` — per-project licensing table, MIT
  notice-preservation obligations, and Microsoft trademark/naming rules.
- `09-pricing-and-adoption.md` — dated pricing snapshots and adoption
  evidence, with explicit non-conversions (logos are not procurement,
  stars are not customers, etc.).
- `10-pain-points-and-opportunities.md` — pain points only, `ResearchInference`
  opportunities, counterevidence, and a valid "no opportunity" reading.
- `11-open-research-questions.md` — unresolved research questions (distinct
  from `docs/open-questions.md`'s product-decision numbering).
- `sources.md` — the full source inventory with retrieval dates and review
  schedules.
- `claims-register.csv` — every individual claim, classified, sourced, and
  dated.

## What Claude Code can and cannot verify

Stated explicitly, since this package's own credibility depends on being
honest about the limits of how it was produced.

**Claude Code (this research's own author) can verify:**
- Repository structure, `LICENSE` files, configuration files, static source
  code, unit tests, manifest consistency, generated packages, lint/type/build
  output.
- Public evidence — a vendor's own published page content, a GitHub/npm/VS
  Code Marketplace API response, an official Microsoft documentation page.
- Documented competitor claims, as claims — i.e., that a page says "180+
  components," not that 180+ components genuinely exist and function.

**Claude Code cannot independently guarantee, and this package does not
claim:**
- Zero defects in anything discussed.
- WCAG conformance for anything discussed — no automated scan, and certainly
  no reading of a vendor's marketing page, establishes this.
- Screen-reader compatibility without real assistive-technology testing by a
  human — nothing in this research package performed that testing.
- Performance in any real tenant or environment — no benchmark in this
  package was executed against a live Power Platform environment; none was
  available to this research.
- Microsoft certification for anything discussed.
- Customer demand for anything discussed — see `11-open-research-questions.md`.
- Legal sufficiency of any licensing or trademark reading in
  `08-licensing-and-trademarks.md` — those are flagged for legal review, not
  settled by this research.
- Commercial success of anything this research might eventually inform.

Any claim requiring evidence this research could not gather stays classified
`Unknown` or `ResearchInference` in `claims-register.csv` — never silently
upgraded to something this package didn't actually verify.

## Research maintenance instructions

- Every commercial figure (pricing, plan names, catalogue counts) is a
  snapshot. Check `claims-register.csv`'s `ReviewBy` column before relying on
  any PowerLibs or PowerAppsUI figure in a future decision — most are dated
  2026-10-24 or 2026-12-24.
- If this package is extended, add new claims to `claims-register.csv` with a
  real `ClaimId`, classify them honestly (do not default to a stronger
  classification than the evidence supports), and update `sources.md`.
- Contradictions between sources (e.g. CLM-009/CLM-010, CLM-017) are recorded
  deliberately, not resolved by picking the more favorable number. Preserve
  this pattern in any future addition.
- The `.claude/skills/component-opportunity-research/` skill (manual-invoke
  only, research-only) can be used to extend this package following the same
  rules it was built under.
- Nothing in this package should be promoted to `docs/final-decisions.md` or
  treated as approved without direct, explicit product-owner instruction, per
  `CLAUDE.md`'s Decision Validation Rule.
