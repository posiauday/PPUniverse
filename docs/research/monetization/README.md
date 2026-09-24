# LowCodeStacks Monetization — Research and Architecture Audit

**Purpose:** research how LowCodeStacks could responsibly generate revenue
across 22 possible models (free/paid assets, bundles, templates, technical
content, affiliate links, sponsorships, advertising, marketplace commission,
subscriptions, team/enterprise licences, premium support), then audit the
**current, real** repository architecture against those models.

**Research date:** 2026-09-24.

**This is research and architecture-gap analysis only.** No monetization is
implemented. No advertisement, tracking script, affiliate link, subscription,
pricing, or paid product is added. No checkout is changed. No Stripe Connect
account is created. No licence term is altered. MVP-007 and MVP-011 are not
started. No commercial open question is resolved. `docs/final-decisions.md`
is not modified. No backlog or proposed story is added.

## Executive summary

- **This project's Commerce and Creator domains are genuinely, completely
  unbuilt** — not partially built, not placeholder-with-some-fields.
  `packages/domain/commerce`, `packages/adapters/payments`, and
  `packages/domain/creator` each contain only a `README.md`, no `src/`
  directory, confirmed by direct repository read. Zero source-code
  references to Stripe exist anywhere in the repository. This independently
  confirms `planning/status.md`'s own claim that MVP-007 and MVP-011 are
  "Ready," not "Done" — from real code evidence, not just trusting the
  status file.
- **The free-asset and content foundations are real and solid.** Free
  download (MVP-010), the `Article` model with working `TechArticle`
  JSON-LD and `dateModified` (MVP-017), and — most notably — the
  consent/notification architecture (`ConsentRecord`, `EmailSend`, both
  append-only and already enforced correctly before every optional send)
  are the most subscription/newsletter-monetization-ready pieces of
  infrastructure this audit found anywhere in the platform.
- **There is no feature-flag mechanism anywhere in this codebase, at all.**
  A repository-wide search for `FeatureFlag` and for any feature-flag-check
  function each return exactly one match — the same single placeholder
  line in `docs/06-data-model.md`. Any monetization model that assumes
  "we'll gate it behind a flag" (most notably advertising, which this
  research explicitly recommends staying ad-free-by-default until reversible
  activation exists) is assuming infrastructure that does not exist yet.
- **One real, structural conflict was found, not invented**: this project's
  existing decision that license tiers are per-product grants, not
  subscription plans (`docs/open-questions.md` item 7), directly conflicts
  with a generic subscription/membership revenue model. This research names
  the conflict and does not propose reconciling it.
- **The strongest, most evidence-grounded near-term opportunity found** is
  not a new model — it's **finishing what's already decided**: paid
  first-party assets (Model B/D/E) and marketplace commission with manual
  payouts (Model K/L) are both substantially pre-decided in principle
  (license tiers locked, invited-creator model closed, manual-payout
  position reaffirmed) and blocked mainly by the unbuilt Commerce/Creator
  domains and a small number of named, already-tracked decisions (pricing,
  jurisdictions, the commission rate, open question 51's legal-entity
  question) — not by anything new this research discovered.
- **Advertising and affiliate/sponsorship models are real and researched in
  depth (FTC, AdSense, EthicalAds, Carbon Ads, all primary-sourced), but
  none is close to viable today** — they depend on real traffic this
  platform does not yet generate (no live checkout, no live creator
  pipeline, no published article inventory yet), not on any architecture
  decision this research can accelerate.

## Terminology and evidence discipline

This package treats every claim as one of `OfficialDocumentation`,
`VendorClaim`, `RepositoryEvidence`, `IndependentEvidence`,
`ResearchInference`, or `Unknown` (see `claims-register.csv`). A vendor's
revenue claim is never converted into independent evidence. Competitor
pricing is never converted into a LowCodeStacks pricing recommendation.
Traffic requirements are never converted into expected revenue. Subscriber
counts are never converted into customers. Employer logos are never
converted into organisational procurement. MIT permission is never
conflated with permission to reuse trademarks, documentation, or
third-party dependencies. Technical capability is never conflated with
legal or tax compliance.

## Files in this package

- `README.md` — this file.
- `01-revenue-models.md` — all 22 models researched (A–V), each with who
  pays, prerequisites, operational/support burden, legal implications,
  evidence for/against, and an evidence-only ranking (not a
  recommendation).
- `02-free-and-paid-asset-strategy.md` — MIT/paid-asset licensing analysis
  and a full audit of `Product`/`ProductLicense`/`Entitlement` readiness.
- `03-content-and-blog-strategy.md` — the real `Article` model audited
  field-by-field against what a genuinely useful technical article needs.
- `04-advertising-options.md` — AdSense, EthicalAds, and Carbon Ads,
  primary-sourced, plus an ad-free-default readiness checklist.
- `05-affiliate-and-sponsorship-options.md` — FTC disclosure guidance,
  primary-sourced, and what the architecture would need to model it
  correctly.
- `06-marketplace-commission.md` — commission/payout readiness, respecting
  every existing decision (invited creators, manual payouts, deferred
  automation) unchanged.
- `07-subscription-membership-and-licensing.md` — subscription models, the
  structural conflict with the existing per-product-grant decision, and a
  full newsletter/email-consent-architecture audit.
- `08-legal-tax-privacy-and-disclosures.md` — every legal/tax/employment
  flag this research depends on, none of them answered.
- `09-seo-editorial-and-content-quality.md` — Google's own people-first
  content and E-E-A-T guidance, primary-sourced, applied to this project's
  real `Article` model.
- `10-current-architecture-inventory.md` — the raw, verified evidence: what
  actually exists in the Prisma schema and codebase today, real vs.
  placeholder, throughout.
- `11-architecture-alignment-matrix.md` — one row per capability, the
  required column set, `RecommendationStatus` never `Approved`.
- `12-gap-analysis.md` — gaps classified A through G per this research's
  required method, including the one real conflict found (category G).
- `13-phased-readiness-plan.md` — Phase 0 through 6, entry conditions and
  exit evidence for each, not a schedule.
- `14-open-research-questions.md` — what this audit didn't resolve.
- `sources.md` — full source inventory with retrieval and review dates.
- `claims-register.csv` — every individual claim, classified, sourced, and
  dated (26 rows).

## Research maintenance instructions

- Every commercial/policy claim (ad network requirements, FTC guidance) is
  a dated snapshot — check `claims-register.csv`'s `ReviewBy` column before
  relying on any of them in a future decision.
- Architecture claims are current as of 2026-09-24's direct repository
  read; re-verify against the real schema/code before relying on them if
  meaningful time has passed or if MVP-007/MVP-011/MVP-012/MVP-013 have
  started, since those stories would directly change several "does not
  exist" findings in this package.
- If this package is extended, add new claims to `claims-register.csv` with
  a real `ClaimId` (`MON-###`, continuing the existing sequence), classify
  them honestly, and update `sources.md`.
- The `.claude/skills/monetization-architecture-research/` skill
  (manual-invoke only, `disable-model-invocation: true`) can extend this
  package under the same evidence rules.
- Nothing in this package should be promoted to `docs/final-decisions.md`,
  `planning/mvp-backlog.csv`, or `planning/proposed-stories.md` without
  direct, explicit product-owner instruction, per `CLAUDE.md`'s Decision
  Validation Rule.
