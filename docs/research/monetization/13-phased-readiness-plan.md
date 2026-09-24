# Phased Readiness Plan

**Research only. This is not an approved roadmap.** Every phase below states
what would be needed to *consider* moving to it, not a commitment to do so,
and not a schedule.

## Phase 0 — current platform, no monetization change

- **Entry conditions:** none — this is the current state.
- **Architecture already available:** free download (MVP-010), article
  publishing with real SEO infrastructure (MVP-017), consent/notification
  foundation (MVP-018/MVP-020), the append-only audit pattern proven three
  times over.
- **Missing capability:** everything monetization-specific, per
  `12-gap-analysis.md`.
- **Legal/business decisions required:** none, to stay in Phase 0.
- **Measurement needed:** none.
- **Exit evidence:** a direct product-owner decision to pursue any
  specific model researched in `01-revenue-models.md`.
- **What must not be built early:** anything in Phases 1–6 below, absent
  that decision.

## Phase 1 — content and free assets

- **Entry conditions:** a decision to invest in technical content
  (`03-content-and-blog-strategy.md`) and/or expand free MIT-licensed
  inventory (Model A), as acquisition/credibility assets — not yet
  monetized directly.
- **Architecture already available:** the `Article` model, real SEO/sitemap
  infrastructure, free-entitlement flow.
- **Missing capability:** MIT-notice-preservation fields per listing
  (`02-free-and-paid-asset-strategy.md`); article structured-troubleshooting
  fields (helpful, not required, per `12-gap-analysis.md` category C);
  author/reviewer identity if a real editorial byline strategy is pursued.
- **Legal/business decisions required:** none blocking (MIT compliance is a
  discipline to apply, not a decision to make); editorial identity/E-E-A-T
  strategy is an editorial choice, not a legal gate.
- **Measurement needed:** real traffic and engagement data — this project
  has none yet (no `AnalyticsEvent` model exists, MON-022), which is itself
  worth noting as something this phase would need to establish before
  later phases (especially advertising, Phase 5) can be evaluated with real
  numbers rather than guesses.
- **Exit evidence:** enough published content and free inventory to have
  real traffic to build later phases on.
- **What must not be built early:** checkout, commission logic, ads,
  affiliate links, subscriptions — none of these are needed to publish
  content or expand free inventory.

## Phase 2 — paid first-party assets

- **Entry conditions:** MVP-007 (Checkout) built; pricing decided (open
  question 7); jurisdiction/tax registration resolved (open question 3);
  first-party-authored paid products ready (no creator pipeline needed yet
  if LowCodeStacks itself authors the first paid assets).
- **Architecture already available:** `Product`/`ProductLicense`/
  `LicenseDefinition` (tier definitions); the append-only pattern to build
  a payment/order audit trail from.
- **Missing capability:** the entire Commerce domain (Price, Order,
  CheckoutSession, PaymentEvent, Refund) — the largest single gap in this
  research; licence versioning and immutable purchase snapshots.
- **Legal/business decisions required:** pricing, tax registration, refund
  policy legal review (already flagged as required by
  `docs/09-marketplace-operations.md` before this research ran).
- **Measurement needed:** conversion/refund-rate data, once real — none
  exists yet.
- **Exit evidence:** at least one real paid product completing the full
  purchase→entitlement→download path (the same milestone `docs/02-prd.md`'s
  own MVP release-acceptance criterion already names, independent of any
  monetization-strategy question).
- **What must not be built early:** creator-facing commission logic,
  third-party marketplace listings, subscriptions, advertising — Phase 2 is
  first-party only.

## Phase 3 — invited creator marketplace with manual payouts

- **Entry conditions:** MVP-011 (Creator application) built; Phase 2's
  Commerce domain exists and works; legal-entity/outside-employment
  question resolved (open question 51) — **this specific flag blocks real
  money changing hands with a third-party creator**, not just architecture
  readiness.
- **Architecture already available (once Phase 2 lands):** Commerce
  domain, append-only audit pattern for a manual-payout record.
  license-definition tiers.
- **Missing capability:** `CreatorProfile`, `CreatorApplication`,
  `AgreementAcceptance`, `ProductSubmission`, `ModerationReview` — the
  entire Creator domain (confirmed genuinely unbuilt, MON-020); creator
  licence warranty/attestation; moderator licence-review evidence; manual
  payout records.
- **Legal/business decisions required:** commission rate (explicit
  financial sign-off required per open question 7); creator agreement text
  (flagged, not drafted, in `08-legal-tax-privacy-and-disclosures.md`);
  legal entity and outside-employment clearance (open question 51).
- **Measurement needed:** whether the founding creator cohort's assets
  actually sell — real commerce data this platform won't have until Phase
  2 exists.
- **Exit evidence:** the founding cohort successfully manually paid at
  least once, with a real, auditable payout record.
- **What must not be built early:** automated payouts (Phase 6), a
  self-serve creator signup path (already decided against — invited/vetted
  only).

## Phase 4 — affiliate/sponsorship experiments

- **Entry conditions:** real content traffic exists (from Phase 1);
  disclosure architecture built (`05-affiliate-and-sponsorship-options.md`).
- **Architecture already available:** the `Article` model to attach
  disclosure metadata to, once that metadata exists (it doesn't yet).
- **Missing capability:** disclosure-type field, affiliate-link marking,
  sponsor metadata, `rel="sponsored"` rendering, editorial-reviewer sign-off
  on disclosure compliance.
- **Legal/business decisions required:** which affiliate programs (if any)
  are relevant to this audience (not researched in this pass); whether
  LowCodeStacks wants to be in the business of soliciting sponsors at all
  (a real business-identity question, `01-revenue-models.md` Model O).
- **Measurement needed:** real click-through/conversion data on any
  affiliate link, once any exist.
- **Exit evidence:** at least one disclosed affiliate or sponsored
  placement running compliantly, with no FTC-disclosure gap.
- **What must not be built early:** undisclosed placements, ranking
  influenced by payment (explicitly prohibited by this research's own
  required principle, `05-affiliate-and-sponsorship-options.md`).

## Phase 5 — advertising after verified traffic and policy readiness

- **Entry conditions:** real, measured traffic meeting or approaching
  network thresholds (EthicalAds's stated 50k+ monthly pageviews, MON-004;
  Carbon's curated-capacity constraint, MON-006); feature-flag
  infrastructure built (does not exist at all today, MON-021); CSP
  allow-listing process established; ad-free-default architecture built
  (`04-advertising-options.md`'s full readiness list).
- **Architecture already available:** the per-page-type eligibility
  *pattern* (`category-indexing.ts`) to extend, once ad-specific logic is
  actually built.
- **Missing capability:** essentially everything in
  `04-advertising-options.md`'s readiness table — feature flags, placement
  identifiers, exclusion-zone enforcement, layout-shift prevention,
  ad-blocker-safe failure, house-ad fallback.
- **Legal/business decisions required:** which network (if any); consent
  requirements if ad personalization (as opposed to purely contextual ads)
  is ever considered, jurisdiction-dependent.
- **Measurement needed:** real traffic numbers against real network
  thresholds — this research explicitly does not fabricate a revenue
  projection for this phase, or any phase.
- **Exit evidence:** N/A — this phase's own entry conditions are already
  the exit evidence for Phase 1 having succeeded at building real traffic.
- **What must not be built early:** any ad slot, script, or tracking
  mechanism before the feature-flag and CSP infrastructure exists to make
  it reversible — building ad UI before the kill-switch exists is
  explicitly the wrong order.

## Phase 6 — subscriptions or automated payouts only after explicit approval

- **Entry conditions:** an explicit, direct product-owner decision
  reconciling Model G's conflict with the existing per-product-grant
  license-tier decision (open question 7) — **this phase cannot start
  without that reconciliation, not just architecture readiness**; and,
  separately, an explicit decision to reverse the standing automated-payout
  deferral (open question 8) if that path is ever pursued.
- **Architecture already available:** the append-only pattern; `Entitlement`
  as a starting point to extend, though its current unique-per-product
  (not per-release, not time-bound) shape would need real redesign, not
  just extension, for a subscription.
- **Missing capability:** `Subscription`/`SubscriptionItem` entirely;
  automated payment-provider integration (Stripe Connect or equivalent) if
  pursued; the entire "post-cancellation rights" design this research
  flags as a real risk (`07-subscription-membership-and-licensing.md`'s
  PowerLibs precedent).
- **Legal/business decisions required:** the two explicit reconciliations
  named above — the largest legal/business gate of any phase in this plan.
- **Measurement needed:** whichever prior phase generates the recurring-
  revenue-demand signal that would justify reopening the per-product-grant
  decision in the first place — none exists yet.
- **Exit evidence:** N/A — this is the final phase in this plan.
- **What must not be built early:** any subscription billing or automated
  payout code before both explicit reconciliations exist — this is the
  single most gated phase in the entire plan, deliberately.

## What this plan is not

Not a schedule. Not a commitment to reach any phase. Not a sequence that
skips phases when convenient — Phase 3 (creator marketplace) genuinely
depends on Phase 2 (checkout) existing first, for example, not because this
research prefers that order aesthetically, but because `Entitlement.source`
would need real paid sources (`ORDER_LINE`, not just `FREE_POLICY`) to exist
before any creator commission has anything to calculate from.
