# Pain Points and Opportunities

Research only. **This is a record of pain points, not a proposed product
list.** Every possible opportunity below is explicitly classified
`ResearchInference` — a reasoned inference from the evidence gathered, not a
verified fact and not a recommendation. Counterevidence and a genuinely valid
"no meaningful opportunity" reading are both included, deliberately, rather
than manufacturing a case for building something.

## Pain points supported by this research's evidence

- **Makers repeatedly recreate common interface patterns.** The existence of
  two independent, reasonably-catalogued competitors (PowerAppsUI, 35 entries;
  PowerLibs, ~170–182 entries) targeting overlapping component categories
  (buttons, modals, date pickers, navigation, cards) is itself evidence that
  this recreation problem is real and commercially validated twice over, in
  two different business models (free/MIT vs. paid/proprietary).
- **Canvas YAML is easy to distribute but difficult to verify systematically.**
  Neither competitor published any accessibility, performance, or automated
  testing evidence. This isn't a gap in this research's search — it's a
  structural property of the YAML/copy-paste distribution mechanism itself,
  which has no natural place to attach a test suite or CI badge the way a
  package-manager-distributed artifact would.
- **Formal accessibility evidence is often not publicly visible** — not just
  from the two commercial competitors, but from Microsoft's own first-party
  `powercat-creator-kit`, whose README (read directly) makes no accessibility
  or testing claim at all (CLM-023, CLM-030). This is the single strongest,
  most consistently repeated finding across every source this research
  checked.
- **PCF distribution creates administrator and security-review friction**
  (CLM-031) that Canvas YAML distribution structurally avoids — directly
  reflected in PowerAppsUI's own marketing choice to lead with "no PCF
  required" as a selling point (CLM-004).
- **PCF support burden is higher than Canvas YAML**, per the comparison in
  `03-canvas-vs-pcf.md` — a compiled TypeScript defect requires a rebuild and
  redeploy; a Canvas formula defect can usually be fixed by a maker directly
  editing the visible formula.
- **External-service PCF controls can affect licensing** (CLM-032) — a real,
  concrete cost most buyers evaluating a PCF component would need disclosed,
  and which nothing in either competitor's public materials addresses (neither
  vendor's shipped catalogue is PCF-heavy enough for this to have surfaced in
  their marketing).
- **Competitor design languages are not consistently Fluent-aligned.**
  PowerAppsUI references Material Design 3 and shadcn/ui in different
  components on the same site (CLM-005) — not a single coherent design system,
  despite targeting a Microsoft product whose own first-party design language
  is Fluent UI (confirmed for Creator Kit and `powercat-code-components`,
  CLM-023, CLM-024).
- **Performance claims frequently lack reproducible benchmarks.** Neither
  competitor published a single performance number, benchmark, or dataset-size
  claim (`06-performance-verification.md`).
- **Component compatibility is difficult for buyers to compare.** Neither
  competitor publishes a structured compatibility record (platform area,
  minimum release wave, evidence status) — the exact kind of structured
  evidence LowCodeStacks's own existing `CompatibilityRecord` model
  (`docs/06-data-model.md`) already represents for other asset types on this
  platform, which neither Canvas-component competitor offers for their own
  catalogue.
- **Marketplace buyers lack standard quality evidence.** A direct consequence
  of the accessibility, performance, and compatibility gaps above, taken
  together.
- **Versioning and update behavior differ by asset type.** Canvas YAML has no
  inherent update mechanism (a maker must manually re-copy new YAML); PCF has
  real, solution-based versioning. A marketplace mixing both asset types would
  need to handle this difference explicitly, not treat them uniformly.
- **Licensing terms differ materially across providers.** PowerAppsUI: MIT, no
  restriction found. PowerLibs: proprietary, explicit anti-redistribution and
  anti-competing-product clauses (CLM-016). Microsoft's own repos: MIT with
  trademark caveats layered on top (CLM-033). A buyer comparing these three
  models is comparing genuinely different legal positions, not equivalent
  products with different price tags.
- **Raw redistribution may be prohibited even when commercial app use is
  allowed.** PowerLibs's license (CLM-016) is the clearest example — permitted
  to sell an app that *uses* the components, explicitly forbidden to
  redistribute the components themselves. This distinction would matter a
  great deal if LowCodeStacks ever considered listing or bundling any
  third-party-sourced component inventory.
- **Documentation, upgrade notes, and residual limitations are inconsistent.**
  Neither competitor's pages, as fetched in this research, stated known
  limitations, upgrade paths, or a maintenance policy in the terms
  `04-component-quality-bar.md`'s draft matrix describes.

## Possible opportunities (ResearchInference only — none verified, none decided)

- **ResearchInference:** if a real gap exists, the evidence gathered here
  points toward *verified quality evidence* (accessibility, performance,
  compatibility, tested-in-real-host claims) as the more defensible
  differentiation angle than raw catalogue size — since both existing
  competitors already have a larger catalogue (35 and ~170–182 respectively)
  than any new entrant could plausibly ship on day one, but **neither
  publishes any of the evidence types this research's own quality-bar and
  accessibility-verification documents describe.**
- **ResearchInference:** Fluent-alignment specifically is a plausible
  differentiator, since neither commercial competitor is consistently
  Fluent-aligned despite targeting a Microsoft product whose own first-party
  kits are.
- **ResearchInference:** an enterprise/public-sector documentation angle
  (explicit compatibility evidence, explicit licensing clarity, explicit
  accessibility scope statements) is plausible given this project's own buyer
  personas already include an "Architect" persona who explicitly wants
  "compatibility, security, licensing, ALM and support evidence" before
  anything else (`docs/02-prd.md`) — a persona neither competitor's public
  materials appear to be written for.

## Strong counterevidence

- **Both existing competitors already have real, if partly unverified,
  traction.** PowerLibs shows real commercial operation (multiple pricing
  tiers, a promotional cycle, a team plan) and PowerAppsUI shows sustained
  single-maintainer investment (35 catalogued entries, an active changelog
  page found via search). Neither is a dead or failed market entry — a new
  entrant would be competing against two live, functioning products, not an
  empty market.
- **The PCF side isn't empty either, on closer look.** `pcf.gallery`
  (CLM-034 through CLM-036) is a multi-year, MVP-operated community directory
  with hundreds of listed controls and an existing commercial "Store" channel
  already soliciting paid ISV listings. Any PCF-focused differentiation would
  be competing against established reach and community trust here too, not
  filling an obviously empty PCF-ecosystem gap.
- **The "verified quality" differentiation angle is unproven, not just
  undelivered.** No evidence in this research shows that Power Apps
  makers/buyers actually demand or would pay for accessibility/performance
  evidence over a larger free catalogue — this is inferred from a buyer
  persona already in this project's own PRD, not from any external market
  signal (survey, forum discussion, purchase behavior) found by this
  research.
- **Building and maintaining genuinely verified quality evidence (real
  screen-reader testing, real host testing, real benchmarks) is exactly the
  work neither existing competitor has done, at any price point** — which
  cuts two ways: it could be a real gap, or it could be a real gap *because it
  is not commercially viable to sustain*, given even Microsoft's own
  first-party kits (with presumably far more resources than either surveyed
  competitor) don't publicly document it either.
- **PCF's structural friction (admin review, higher support burden) is not a
  gap to fill — it's a real cost any PCF-based differentiation would inherit**,
  which both existing Canvas-only competitors have simply avoided by not
  building PCF assets at all (PowerAppsUI's one PCF catalogue entry is
  unreleased).

## A valid "no meaningful opportunity" reading

It is entirely possible that the honest conclusion is: the Canvas component
space already has an adequate free option (PowerAppsUI) and an adequate paid
option (PowerLibs) for the maker persona's actual need — *"a fast, copy-ready
component with setup instructions"* (`docs/02-prd.md`'s own Maker persona
definition) — and that the gaps this research found (accessibility,
performance, compatibility evidence) matter primarily to the *Architect*
persona, a smaller and differently-motivated buyer who may not be the dominant
share of actual Power Apps component consumers. If that is true, the real
differentiation opportunity is narrow — perhaps limited to a specific
under-served niche (a component category, an industry vertical, or a specific
quality dimension) rather than a broad "better components" positioning. This
research did not gather evidence to confirm or rule out this narrower reading
either way; see `11-open-research-questions.md`.
