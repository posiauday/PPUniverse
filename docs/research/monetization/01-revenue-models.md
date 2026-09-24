# Revenue Models

Research only. No model is recommended for approval. Models are ranked only
by evidence strength, architectural readiness, dependency risk,
reversibility, and unresolved legal/business decisions — never by
projected revenue, which this research does not fabricate for any model.

Cross-reference: `10-current-architecture-inventory.md` for what actually
exists in the repository today; `11-architecture-alignment-matrix.md` for
the capability-by-capability detail; `08-legal-tax-privacy-and-disclosures.md`
for every legal/tax/employment flag named below.

## A. Free MIT components as acquisition assets

- **Who pays:** no one directly.
- **What receives payment:** nothing — this is a funnel/credibility asset,
  not a revenue line itself.
- **Transaction type:** none.
- **Customer value:** genuinely useful free inventory that builds trust and
  traffic ahead of any paid offering — the same role Microsoft's own
  MIT-licensed sample repositories play for the Power Platform ecosystem
  (`docs/research/power-apps-components/01-market-landscape.md`).
- **Prerequisites:** real, working catalog/download infrastructure (already
  substantially built — MVP-003 through MVP-006, MVP-010).
- **Operational burden:** low per-asset, but scales with catalog size
  (maintenance, compatibility updates).
- **Support burden:** low-to-moderate; free doesn't mean support-free.
- **Legal/tax/privacy implications:** MIT notice-preservation obligations
  (see `02-free-and-paid-asset-strategy.md`); no payment/tax surface at all.
- **Architecture capabilities required:** the free-download path already
  exists (MVP-010). Licence/notice metadata per asset is the real gap — see
  `02-free-and-paid-asset-strategy.md`.
- **Evidence for:** this project's own MVP release-acceptance criterion
  already requires "one free... product complete the end-to-end path"
  (`docs/02-prd.md`) — free inventory is already load-bearing for the MVP
  itself, independent of any monetization question.
- **Evidence against:** none found — this is the lowest-risk model
  researched.
- **Unresolved owner decisions:** none blocking; this is closest to already
  decided by the existing MVP scope.

## B. Paid original components

- **Who pays:** end users (Makers/Architects, per `docs/02-prd.md` personas).
- **What receives payment:** a specific, originally-authored component
  product.
- **Transaction type:** one-time purchase (per `docs/06-data-model.md`'s
  existing `LicenseDefinition`/`ProductLicense` model, license tiers are
  grants attached to a purchased product, not subscriptions — already
  decided, `docs/open-questions.md` item 7).
- **Customer value:** a finished, higher-quality asset than free
  alternatives — the differentiation angle this project's own
  `docs/research/power-apps-components/` package already researched at
  length and found genuinely unproven as a demand driver for a *generic*
  "modern components" positioning (see that package's own conclusion).
- **Prerequisites:** MVP-007 (Checkout) — not started; pricing model (open
  question 7, partially resolved — tiers locked, exact pricing open);
  creators who can actually author original components (MVP-011, not
  started).
- **Operational burden:** moderation review, compatibility maintenance over
  time.
- **Support burden:** real — a paying customer expects support the way a
  free download doesn't necessarily.
- **Legal/tax/privacy implications:** full checkout/tax/refund stack (open
  question 3, unresolved); `docs/09-marketplace-operations.md`'s existing
  refund-policy legal-review flag applies directly.
- **Architecture capabilities required:** checkout, real `Price`/`Order`
  models — audited in `02-free-and-paid-asset-strategy.md` and
  `10-current-architecture-inventory.md`.
- **Evidence for:** PowerLibs (a real, apparently-sustained commercial
  competitor selling exactly this — `docs/research/power-apps-components/02-competitor-evidence.md`)
  proves a market exists for *paid* Power Platform components generically.
- **Evidence against:** the same research found no evidence LowCodeStacks
  specifically, or "verified quality" as a differentiator, would win share
  against that existing competitor — see the PROP-008 decision
  (`docs/final-decisions.md`) for the full reasoning, which remains relevant
  context here even though that decision was about a generator/library, not
  paid components generically.
- **Unresolved owner decisions:** exact pricing (open question 7); MVP-007
  and MVP-011 both not started.

## C. Paid component bundles

- **Who pays:** end users.
- **What receives payment:** a curated set of products sold together.
- **Transaction type:** one-time purchase, at a bundle price presumably
  below the sum of individual prices (a common pattern, not yet modeled
  here).
- **Customer value:** convenience/discount for buying related assets
  together.
- **Prerequisites:** everything Model B needs, plus a `Bundle`-equivalent
  concept the current schema (per `docs/06-data-model.md`) does not name at
  all — a genuine gap, not just an unbuilt feature.
- **Operational burden:** moderate — bundle composition needs maintaining as
  individual products change/retire.
- **Support burden:** same as B, compounded by needing to resolve which
  bundled product a support request is actually about.
- **Legal/tax/privacy implications:** same as B; bundle pricing/refund
  interaction (does refunding one bundled item unwind the whole bundle
  price?) is a real, unresolved design question, not just a legal one.
- **Architecture capabilities required:** a real schema concept for "a
  purchase that grants entitlement to N products," not present today per
  `docs/06-data-model.md`'s Commerce section (`Order`/`OrderLine` implies
  one line per product, not an explicit bundle abstraction — confirmed
  against real schema in `10-current-architecture-inventory.md`).
- **Evidence for:** a common, well-understood commerce pattern generally;
  PowerLibs's own tiered plans (`docs/research/power-apps-components/02-competitor-evidence.md`)
  are a bundle-like structure (a subscription bundling catalog access), not
  a literal precedent for one-time bundles specifically.
- **Evidence against:** none specific found; simply unbuilt and unproven for
  this platform.
- **Unresolved owner decisions:** whether bundling is wanted at all; not
  currently on any roadmap.

## D. Complete paid Canvas app templates

- **Who pays:** end users, likely a different buyer profile than a
  component buyer (someone wanting a working app faster, not a building
  block).
- **What receives payment:** a full app/screen collection.
- **Transaction type:** one-time purchase, same commerce prerequisites as B.
- **Customer value:** faster time-to-working-app than assembling components.
- **Prerequisites:** same checkout/pricing gates as B; also a real
  distinction in the taxonomy between "component" and "template" as asset
  types — `docs/06-data-model.md`'s `Product`/`Category`/`Tag` model would
  need to actually enforce or at least represent this distinction cleanly
  (confirmed against real schema in `10-current-architecture-inventory.md`).
- **Operational burden:** likely higher per-asset than a single component —
  more surface area to review, test, and keep compatible.
- **Support burden:** likely higher — a full app has more that can go wrong
  for a buyer's specific environment.
- **Legal/tax/privacy implications:** same as B.
- **Architecture capabilities required:** same commerce gates as B; the
  asset-type distinction is the specific new piece.
- **Evidence for:** `docs/research/power-apps-components/03-canvas-vs-pcf.md`
  already establishes "complete Canvas app template" as a genuinely
  different asset type from a component library, with different
  installation/support/testing needs — this project's own prior research
  already did the groundwork distinguishing this model from B/C.
- **Evidence against:** no competitor-specific evidence gathered in this
  pass (out of scope — this research audited component competitors, not
  template marketplaces specifically).
- **Unresolved owner decisions:** whether templates are in scope for MVP at
  all; `docs/02-prd.md`'s FR-002 already names "asset type" as a filter
  axis, suggesting templates were anticipated conceptually, but no template-specific
  story exists in `planning/mvp-backlog.csv`.

## E. Paid non-PCF architecture/governance packs

- **Who pays:** end users, likely enterprise/Architect-persona buyers
  specifically (`docs/02-prd.md`'s Architect persona: wants "compatibility,
  security, licensing, ALM and support evidence").
- **What receives payment:** documentation/governance artifacts (reference
  architectures, ALM playbooks, security review templates) rather than
  runnable code.
- **Transaction type:** one-time purchase, same commerce gates as B.
- **Customer value:** this is the one model most directly aligned with a
  gap `docs/research/power-apps-components/` already found evidence for —
  no competitor researched there published structured
  compatibility/governance evidence at all.
- **Prerequisites:** same commerce gates as B; content authoring (likely
  first-party, at least initially, since no creator pipeline exists yet).
- **Operational burden:** lower than component maintenance (no code to keep
  compatible with platform updates in the same way).
- **Support burden:** lower — documentation doesn't "break" the way code
  does.
- **Legal/tax/privacy implications:** same commerce gates as B.
- **Architecture capabilities required:** same as B/D, plus this is closer
  to the `Article`/content model (`docs/06-data-model.md`'s Engagement and
  content section) than the `Product` model — whether it's sold as a
  "product" (via Commerce) or distributed as premium *content* (a different
  access-control question entirely) is itself an unresolved architecture
  question worth naming, not assuming.
- **Evidence for:** the Architect-persona gap named above; this project's
  own existing content infrastructure (MVP-017) is closer to ready for this
  than Commerce is for paid components.
- **Evidence against:** no external competitor or demand evidence gathered
  for this specific model in this pass.
- **Unresolved owner decisions:** whether this is modeled as a `Product`
  (commerce) or a content-access tier (subscription/membership, Model G) —
  a real fork this research flags rather than resolves.

## F. One-time purchases

Not a separate model — this is the transaction *shape* underlying B, C, D,
and E above, already the only transaction shape this project's license-tier
decision anticipates (`docs/open-questions.md` item 7: "a license tier is a
grant attached to a purchased product... not a subscription plan"). Recorded
here only because the instruction's own model list names it explicitly;
folded into the models above rather than repeated.

## G. Optional subscriptions or memberships

- **Who pays:** end users wanting ongoing access rather than one-time
  ownership.
- **What receives payment:** continued access to a growing catalog, tool, or
  content set — not a specific product.
- **Transaction type:** recurring billing.
- **Customer value:** lower upfront cost, access to new releases without
  repurchasing.
- **Prerequisites:** everything B needs, plus real recurring-billing
  infrastructure (`Subscription`/`SubscriptionItem`, named in
  `docs/06-data-model.md` but status in real schema needs confirming —
  `10-current-architecture-inventory.md`).
- **Operational burden:** ongoing — a subscription implies an ongoing
  promise (new content/releases), not a one-time delivery.
- **Support burden:** includes billing-support burden (failed renewals,
  cancellation requests) beyond product support.
- **Legal/tax/privacy implications:** the highest of any model researched —
  recurring billing has its own consumer-protection rules (clear
  cancellation rights, "Unknown" per `08-legal-tax-privacy-and-disclosures.md`)
  distinct from one-time-purchase rules.
- **Architecture capabilities required:** see `07-subscription-membership-and-licensing.md`
  in full — this is the most architecturally demanding model on the list
  after automated payouts.
- **Evidence for:** PowerLibs's own pricing model (`docs/research/power-apps-components/02-competitor-evidence.md`)
  is exactly this — annual plans dominate its actual revenue structure,
  real evidence subscriptions work in this specific market.
- **Evidence against:** this project's own explicit, already-recorded
  decision (`docs/open-questions.md` item 7) is that license tiers are
  per-product grants, *not* subscription plans — a real, standing tension
  this research flags rather than resolves. Pursuing G as currently
  researched would require either reconciling with or reopening that
  decision, not silently layering a subscription model on top of a
  per-product-grant decision that predates it.
- **Unresolved owner decisions:** direct conflict with an existing decision
  — flagged as `Conflicted` in `11-architecture-alignment-matrix.md`, not
  glossed over.

## H. Team and enterprise licences

- **Who pays:** organizations, not individuals.
- **What receives payment:** a multi-seat or org-wide grant.
- **Transaction type:** likely one-time or annual, per-seat or flat — not
  yet decided.
- **Customer value:** legal purchasing on behalf of a team (this project's
  own "Team buyer" persona, `docs/02-prd.md`: "wants legal purchasing, team
  entitlement and update confidence").
- **Prerequisites:** everything B needs, plus multi-seat entitlement logic
  this project's current `Entitlement` model (per `docs/06-data-model.md`)
  does not obviously support today — confirmed against real schema in
  `10-current-architecture-inventory.md`.
- **Operational burden:** moderate — invoicing/contact-sales flows for
  enterprise buyers are typically more manual than self-serve checkout.
- **Support burden:** typically higher-touch per customer, offset by higher
  per-customer revenue.
- **Legal/tax/privacy implications:** same commerce gates as B, plus
  possible contract/invoicing requirements beyond Stripe Checkout's default
  self-serve flow.
- **Architecture capabilities required:** multi-seat entitlement (Team and
  Enterprise are already *named* license tiers per `docs/open-questions.md`
  item 7, but the seat-count/organization-scope mechanics to actually grant
  and enforce them are not yet confirmed as built).
- **Evidence for:** the license tiers themselves are already a locked
  decision (Personal/Team/Enterprise, `docs/open-questions.md` item 7) —
  this model is partially pre-decided in principle, unlike G.
- **Evidence against:** none found; simply unbuilt.
- **Unresolved owner decisions:** exact pricing per tier (same open question
  7 gap as B); whether enterprise is self-serve or contact-sales.

## I. Premium support and maintenance

- **Who pays:** buyers wanting a support SLA beyond the default.
- **What receives payment:** a support commitment, not a product.
- **Transaction type:** likely recurring (a support period), or bundled into
  a higher license tier.
- **Customer value:** predictable support response for business-critical use.
- **Prerequisites:** this project already has a real `SupportPolicy` model
  and a stated support taxonomy (`docs/09-marketplace-operations.md`:
  "creator-supported, platform-supported, community-supported, or
  unsupported") — the *concept* exists; whether it's monetizable as its own
  line item is unbuilt.
- **Operational burden:** real, ongoing — this is a service commitment, not
  a one-time delivery.
- **Support burden:** is the product, by definition.
- **Legal/tax/privacy implications:** SLA terms would need actual legal
  definition (response-time commitments are a real contractual promise).
- **Architecture capabilities required:** a support-period/entitlement
  concept — see `07-subscription-membership-and-licensing.md`'s
  distinction between "support access" and "update access," which this
  research treats as separate concepts, not one collapsed field.
- **Evidence for:** the Architect persona (`docs/02-prd.md`) explicitly
  names support evidence as a purchase-decision factor.
- **Evidence against:** none found; genuinely unbuilt, and the operational
  burden (real, ongoing response-time commitments) is a real cost this
  research doesn't minimize.
- **Unresolved owner decisions:** whether platform-level (not per-creator)
  premium support is even something LowCodeStacks itself would offer, given
  `docs/09-marketplace-operations.md`'s support model is currently framed
  per-product/per-creator, not as a platform-wide paid tier.

## J. Compatibility-update subscriptions

- **Who pays:** buyers of a specific product wanting continued compatibility
  as the Power Platform itself updates.
- **What receives payment:** ongoing maintenance work on an already-purchased
  asset.
- **Transaction type:** recurring, tied to a specific prior purchase (not a
  standalone subscription the way G is).
- **Customer value:** avoids the asset silently going stale as Power
  Platform releases change.
- **Prerequisites:** this project already models `CompatibilityRecord` with
  a "last verified date" and structured release-wave tracking
  (`docs/06-data-model.md`) — the *evidence* concept exists; charging for
  keeping it current does not.
- **Operational burden:** real, ongoing creator/platform work to actually
  re-verify compatibility on a cadence.
- **Support burden:** moderate — mostly about honoring the re-verification
  cadence, not reactive support.
- **Legal/tax/privacy implications:** same recurring-billing complexity as G,
  scoped down to a narrower promise (only compatibility maintenance, not
  general subscription access).
- **Architecture capabilities required:** ties the existing
  `CompatibilityRecord` model to a billing/entitlement concept — a
  genuinely novel combination not built anywhere in this repository today.
- **Evidence for:** the compatibility-evidence gap
  `docs/research/power-apps-components/` already found across every
  competitor researched (no one publishes real compatibility evidence) —
  if LowCodeStacks builds real compatibility tracking (which it already
  has, uniquely among everything researched), monetizing its maintenance is
  a coherent, evidence-adjacent idea, not a generic subscription pitch.
- **Evidence against:** no direct precedent found for this exact model
  (compatibility-maintenance-as-a-subscription) anywhere in the competitor
  research.
- **Unresolved owner decisions:** whether this is worth the operational
  commitment it implies (a real promise to keep re-verifying, not just
  collecting a recurring fee).

## K. Creator marketplace commission

Already substantially decided in principle by this project's own governance
— see `06-marketplace-commission.md` for the full, dedicated treatment. Not
repeated in full here; summary: commission *rate* is unresolved (open
question 7), payout model is manual-only for now (open question 8, not
re-opened by this research), and MVP-007/MVP-011 are both prerequisites, not
started.

## L. Manual founding-cohort payouts

The current, standing, already-decided position (`docs/open-questions.md`
item 8) — not a new model this research is proposing, a fact this research
respects and does not reopen. See `06-marketplace-commission.md`.

## M. Future automated marketplace payouts

Explicitly deferred by an existing decision (`docs/09-marketplace-operations.md`'s
"Defer automated split payments..." and `docs/open-questions.md` item 8's
2026-09-23 reaffirmation) — this research does not reverse that deferral,
per direct instruction. See `06-marketplace-commission.md` for what
migration-readiness would eventually require, researched but not
implemented.

## N. Affiliate links in technical content

- **Who pays:** the affiliate program/merchant, on a referred-purchase basis.
- **What receives payment:** LowCodeStacks, per qualifying referred action.
- **Transaction type:** commission on a third-party transaction, not a
  LowCodeStacks transaction at all.
- **Customer value:** none directly — this monetizes the *reader's*
  purchase decision elsewhere, which is exactly why FTC disclosure rules
  (MON-013 through MON-016, `05-affiliate-and-sponsorship-options.md`) exist.
- **Prerequisites:** real technical content with genuine traffic (Model
  the content strategy in `03-content-and-blog-strategy.md` needs to exist
  first); a disclosure architecture (`05-affiliate-and-sponsorship-options.md`).
- **Operational burden:** low per-link, but disclosure compliance is a real,
  ongoing operational discipline, not a one-time setup.
- **Support burden:** minimal — LowCodeStacks isn't the seller of record.
- **Legal/tax/privacy implications:** FTC disclosure (already researched in
  depth); affiliate income tax treatment (flagged, not resolved, in
  `08-legal-tax-privacy-and-disclosures.md`).
- **Architecture capabilities required:** affiliate-link marking, disclosure
  rendering — see `05-affiliate-and-sponsorship-options.md`.
- **Evidence for:** a well-established model across the technical-content
  web generally (not competitor-specific evidence gathered here — this
  research audited Power Platform component competitors, not affiliate
  content sites).
- **Evidence against:** requires real traffic first — a chicken-and-egg
  problem with Model A/E (free/content assets) needing to succeed before
  this has any base to work from.
- **Unresolved owner decisions:** which affiliate programs, if any, would
  even be relevant to a Power Platform technical audience — not researched
  in this pass (flagged in `14-open-research-questions.md`).

## O. Sponsored articles and newsletters

- **Who pays:** a sponsor.
- **What receives payment:** LowCodeStacks, for a placement/mention.
- **Transaction type:** direct payment, likely negotiated, not
  self-serve.
- **Customer value:** none directly to the reader; the disclosure
  requirement exists precisely to keep this honest.
- **Prerequisites:** real audience/traffic (same chicken-and-egg as N);
  sponsor-disclosure architecture (`05-affiliate-and-sponsorship-options.md`).
- **Operational burden:** sales/relationship effort to find sponsors — a
  real, ongoing business-development cost this research does not minimize.
- **Support burden:** low, contained to the sponsor relationship itself.
- **Legal/tax/privacy implications:** same FTC disclosure requirements as N,
  arguably more directly applicable since this is a direct payment
  relationship, not a referral commission.
- **Architecture capabilities required:** same as N/`05-affiliate-and-sponsorship-options.md`.
- **Evidence for:** a standard model for technical newsletters/blogs
  generally.
- **Evidence against:** same traffic prerequisite as N; no Power-Platform-specific
  sponsor demand evidence was gathered in this pass.
- **Unresolved owner decisions:** whether LowCodeStacks wants to be in the
  business of soliciting sponsors at all — a real business-identity
  question, not just an architecture one.

## P. Direct developer-tool sponsorships

Functionally the same as O, narrowed to developer-tool vendors specifically
(the audience LowCodeStacks would actually reach). Not researched as a
separate model beyond noting the narrower targeting; same prerequisites and
flags as O.

## Q. Developer-focused contextual advertisements (EthicalAds, Carbon Ads)

Researched in full in `04-advertising-options.md` (MON-004 through MON-006).
Summary: both require real traffic (EthicalAds states a 50k+ monthly
pageview preference, MON-004) and network acceptance (Carbon is curated,
5–7 day review, MON-006) — neither is available on day one regardless of any
architecture readiness.

## R. Generic display advertisements (Google AdSense)

Researched in full in `04-advertising-options.md` (MON-001 through MON-003).
Summary: broadest reach, least developer-audience-native, real prohibited-behavior
constraints (no artificial clicks, no misleading placement) that any
implementation must respect by design, not just by policy.

## S. GitHub Sponsors or open-source sponsorship

- **Who pays:** individuals or organizations sponsoring LowCodeStacks (or a
  specific open-source component of it) directly.
- **What receives payment:** the project/maintainer, not a specific product.
- **Transaction type:** recurring or one-time, via GitHub's own platform.
- **Customer value:** none directly — this is patronage, not a purchase.
- **Prerequisites:** eligibility requires contributing to an open source
  project and operating in a supported region (MON-008) — LowCodeStacks
  itself is not currently an open-source project (the repository is
  private, per this session's own git context), which is a real,
  concrete gap this model would need resolved first, not just an
  architecture question.
- **Operational burden:** low.
- **Support burden:** none beyond normal community engagement.
- **Legal/tax/privacy implications:** personal-account sponsorships carry no
  GitHub fee (100% to the recipient); organization-account sponsorships
  carry up to a 6% fee (MON-007) — a real, cited cost difference depending
  on who sponsors.
- **Architecture capabilities required:** essentially none — this is an
  external platform, not something LowCodeStacks's own architecture needs
  to support beyond a link/badge.
- **Evidence for:** a well-established, low-friction model for open-source
  projects specifically.
- **Evidence against:** LowCodeStacks is not currently open source — this
  is the single largest evidence-against finding for this specific model,
  not a minor caveat.
- **Unresolved owner decisions:** whether any part of LowCodeStacks (e.g., a
  specific free component set, distinct from the platform itself) would
  ever be open-sourced — not researched or assumed here.

## T. Training, workshops, or educational products

- **Who pays:** individuals or organizations wanting structured learning.
- **What receives payment:** a course/workshop product, not a component.
- **Transaction type:** one-time purchase or scheduled-event registration.
- **Customer value:** structured learning beyond ad-hoc articles.
- **Prerequisites:** same commerce gates as B, plus content production
  effort well beyond a single article.
- **Operational burden:** high — live workshops in particular require
  real scheduling/delivery capacity.
- **Support burden:** moderate, time-bound to the course/workshop period.
- **Legal/tax/privacy implications:** same commerce gates as B; live-event
  logistics if workshops are delivered synchronously (not researched in
  this pass).
- **Architecture capabilities required:** closer to Model E than B —
  content/access-control more than product/commerce, with the same
  Product-vs-Content-access fork flagged there.
- **Evidence for:** a common, proven pattern in developer education
  generally.
- **Evidence against:** none specific found; this is the most
  effort-intensive model on the list relative to this project's current
  team/resourcing, which this research does not know but flags as a real
  practical constraint regardless.
- **Unresolved owner decisions:** whether LowCodeStacks's own positioning is
  a marketplace/content site or also an education provider — a real scope
  question, not just an architecture one.

## U. Consulting or implementation lead generation

- **Who pays:** organizations wanting implementation help, paying (likely)
  LowCodeStacks or a referred creator, not for a specific research finding
  itself.
- **What receives payment:** a services engagement, entirely outside this
  platform's existing Commerce model (which is asset-sale-shaped, not
  services-shaped).
- **Transaction type:** negotiated services contract, not a marketplace
  transaction.
- **Customer value:** hands-on help beyond self-serve assets.
- **Prerequisites:** a lead-capture mechanism (a form), and — critically —
  **clear separation from the marketplace purchase flow**, per this
  research's own instruction (section 14). Mixing "buy this component" and
  "hire us to build your app" in the same commerce surface would confuse
  both the product and the legal shape of the transaction.
- **Operational burden:** high — this is real services delivery, not a
  product sale.
- **Support burden:** contained to the engagement itself, separate from
  product support.
- **Legal/tax/privacy implications:** services contracts are a different
  legal shape than product sales entirely — not researched in depth here
  (flagged in `14-open-research-questions.md`).
- **Architecture capabilities required:** minimal — mainly a lead form and
  clear UI/route separation from checkout.
- **Evidence for:** a common pattern for marketplace-adjacent businesses.
- **Evidence against:** none specific found; the main risk is scope
  creep into services delivery, which is a different business than the one
  this project's `CLAUDE.md` "Product objective" actually charters
  ("a focused marketplace and content platform... not a complete social
  network or tenant-scanning SaaS" — services delivery isn't named at all,
  worth flagging as adjacent-but-different scope).
- **Unresolved owner decisions:** whether LowCodeStacks wants to be in
  services at all, distinct from marketplace/content.

## V. Paid tools such as configurators, validators, or generators

- **Who pays:** end users wanting a tool, not a content asset.
- **What receives payment:** the tool itself (subscription or one-time).
- **Transaction type:** either, depending on tool shape.
- **Customer value:** depends entirely on the specific tool's usefulness —
  this project already has a directly relevant, recent, evidence-based
  finding here: the PROP-008 research (`docs/research/power-apps-components/`)
  found that a *generator* specifically had weak differentiation against
  Microsoft's own free tooling. **This finding transfers directly to any
  "paid generator" variant of Model V** — it is not a new question, it is
  the same question this project already researched and decided against
  pursuing (`docs/final-decisions.md`, "PROP-008... not pursued").
- **Prerequisites:** same commerce gates as B, plus the tool itself would
  need to be built (real product-engineering effort, not just a commerce
  question).
- **Operational burden:** ongoing tool maintenance, same category of cost
  PROP-008's research already flagged as a real sustainability risk (every
  credible precedent in that research was a single-operator effort; one
  popular one was abandoned anyway).
- **Support burden:** moderate-to-high — a tool that breaks blocks a user's
  actual work, a higher-stakes support relationship than a static asset.
- **Legal/tax/privacy implications:** same commerce gates as B.
- **Architecture capabilities required:** entirely tool-specific; not
  generalizable.
- **Evidence for:** none beyond the generic "tools can be sold" pattern.
- **Evidence against:** the PROP-008 research's own findings, directly on
  point for a generator-shaped tool specifically; a validator or
  configurator (checking existing assets rather than generating new ones)
  was not specifically researched and might have a different risk profile,
  but this research does not assume that without evidence.
- **Unresolved owner decisions:** whether any specific tool is worth
  building — no specific tool has been evaluated beyond the
  generator case already decided against.

## Ranking, by evidence strength and readiness only (not a recommendation)

Ordered by how much real evidence + architectural readiness + reversibility
this research found, most to least — **presented as a research finding
about the evidence itself, not a business recommendation**:

1. **A (free MIT assets)** — already effectively decided by the existing MVP
   scope; lowest risk, most reversible, best evidence.
2. **B/D/E (paid one-time assets — components, templates, governance packs)**
   — real competitor precedent (B), a real found gap (E), clear commerce
   prerequisites that are named, not vague.
3. **K/L (marketplace commission, manual payouts)** — already substantially
   decided in principle; the remaining gaps are execution, not open
   questions this research needs to resolve.
4. **N/O/P (affiliate/sponsorship)** — real, well-understood compliance
   requirements now fully researched; blocked mainly by needing real
   traffic first (a content-strategy dependency, not an architecture one).
5. **Q/R (advertising)** — real, researched network requirements; blocked by
   both traffic thresholds and the same content-strategy dependency as
   affiliate/sponsorship.
6. **H/I/J (team licences, support, compatibility subscriptions)** — real,
   evidence-adjacent ideas (especially J, which ties to a genuine
   competitor gap this project already found) but architecturally unbuilt
   and not yet decided as business directions.
7. **C (bundles), T (training)** — plausible, unbuilt, no specific
   competitor evidence gathered.
8. **G (subscriptions/membership)** — real competitor precedent (PowerLibs)
   but **conflicts with an existing recorded decision** (license tiers are
   per-product grants, not subscription plans) — cannot proceed without
   first reconciling or reopening that decision.
9. **U (consulting/services)** — plausible but scope-adjacent to, not
   clearly within, this project's own chartered product objective.
10. **V (paid tools)** — the PROP-008 research already found the most
    obvious version of this (a generator) not worth pursuing; any other
    tool would need its own fresh evidence, not inherited optimism.
11. **S (GitHub Sponsors)** — blocked by a structural precondition
    (LowCodeStacks would need to be open source) this research did not find
    any indication is planned or wanted.
12. **M (automated payouts)** — explicitly, deliberately deferred by
    existing decision; not reversed here.
