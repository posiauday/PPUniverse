# Gap Analysis

Research only. Classified per this research's own required categories.
**No proposal to implement every possible revenue model is made here.**
Reversible readiness is preferred throughout over speculative architecture;
no field is proposed "just in case" without naming the actual future
requirement it would serve.

## A. Needed for the current approved MVP

None of the gaps found in this research are needed for the currently
approved MVP scope (`docs/02-prd.md`'s "MVP release acceptance": free and
paid product end-to-end, creator submit/approve, purchase/download, refund,
accessibility, restore/incident readiness, legal pages). The paid-product
half of that acceptance criterion already depends on MVP-007, which is a
**pre-existing MVP dependency**, not something this monetization research
introduces — this research did not find or create any *new* MVP-blocking
requirement.

## B. Needed only if a future revenue model is approved

The large majority of gaps found. Examples, cross-referenced to
`11-architecture-alignment-matrix.md`:
- One-time checkout (Commerce domain) — needed for B, C, D, E, H, T.
- Commission calculation and manual-payout records — needed for K, L.
- Affiliate/sponsorship disclosure architecture — needed for N, O, P.
- Newsletter category granularity — needed for N (newsletter form), G.
- Licence versioning and immutable purchase snapshots — needed for any real
  paid sale (B, D, E, H).
- Creator warranty/attestation and moderator licence-review evidence —
  needed for any real paid, creator-authored sale.
- Feature-flag infrastructure — needed for any *reversible, staged*
  activation of anything (ads specifically named in this research, but the
  gap is general-purpose).

## C. Helpful but not required

- Asset-type taxonomy refinement (component vs. template vs. governance
  pack) — the underlying `Category.assetType` enum already exists; this is
  a bounded extension, not a blocking gap, useful mainly if Models D/E are
  pursued.
- Article structured troubleshooting fields (symptom/cause/procedure as
  distinct fields rather than prose within `body`) — genuinely improves
  content quality and machine-readability, but the *prose* version already
  works today without any schema change, per `03-content-and-blog-strategy.md`'s
  own "what can be represented using current fields" finding.
- `TechArticle`/`Product` JSON-LD refinements beyond what already exists —
  the foundation (`dateModified`, structured type) is already solid;
  further refinement is incremental, not foundational.

## D. Already supported

- Free product download, end-to-end (MVP-010).
- License tier *definitions* (Personal/Team/Enterprise) and their
  attachment to a product (`ProductLicense`), though not their pricing or
  grant mechanics.
- Consent capture and enforcement for the one existing marketing category
  (`ConsentRecord`, checked fresh before every optional send).
- Send-audit history (`EmailSend`, append-only).
- Article publishing with real SEO/sitemap/JSON-LD infrastructure,
  including deny-by-default indexing and status-filtered sitemap inclusion.
- The append-only audit pattern itself, proven across three independent
  models (`ConsentRecord`, `DeletionRequestEvent`, `ArticlePublishEvent`) —
  a reusable convention for any future payout or disclosure-history table,
  not something to reinvent.

## E. Blocked by commercial/legal decision

- Checkout, pricing, and tax — blocked on open questions 3 and 7.
- Commission rate — blocked on open question 7's explicit requirement for
  financial sign-off.
- Automated payouts — blocked on an existing, deliberate deferral
  (`docs/open-questions.md` item 8), not reversed by this research.
- Any real affiliate/sponsorship/advertising *activity* (as distinct from
  the architecture to support it) — blocked on disclosure-compliance
  readiness and, for advertising specifically, on real traffic thresholds
  neither currently met (no live checkout, no live creator pipeline, no
  published article inventory yet to generate traffic from).
- Any real paid, creator-authored sale — blocked on MVP-011 (creator
  identity, not yet started) and the legal-entity/outside-employment
  questions named in open question 51.

## F. Not supported by evidence

- **GitHub Sponsors (Model S)** as currently viable — LowCodeStacks is not
  an open-source project, a structural precondition this research found no
  indication is planned.
- **A paid generator/configurator tool (part of Model V)** — the PROP-008
  research already found this specific shape unproven and not pursued
  (`docs/final-decisions.md`); this finding transfers directly, not a fresh
  claim.
- **Immediate advertising activation** — real, cited traffic thresholds
  (EthicalAds's 50k+ monthly pageviews, MON-004; Carbon's curated-network
  capacity constraint, MON-006) are not close to met by a platform with no
  live checkout, no live creator pipeline, and (per `03-content-and-blog-strategy.md`)
  no published article inventory yet either.

## G. Conflicts with an existing decision

- **Optional subscriptions/membership (Model G)**, as a generic recurring-
  access-to-catalog model, directly conflicts with the existing decision
  that license tiers are per-product grants, not subscription plans
  (`docs/open-questions.md` item 7). This is the one gap in this entire
  research pass classified `Conflicted` rather than merely `NotSupported` —
  see `11-architecture-alignment-matrix.md` and
  `07-subscription-membership-and-licensing.md` for the full treatment.
  **This research does not propose reconciling or reopening that decision**
  — it names the conflict so a future evaluator doesn't layer a
  subscription model on top of a per-product-grant decision without
  noticing the two don't currently agree.

## What this research explicitly declines to propose

Consistent with this research's own instruction: **no proposal to implement
every possible revenue model researched in `01-revenue-models.md`.**
Reversible, additive changes (schema extensions to existing, working models
— `ConsentCategory`, `EmailMessageType`, `Article` fields) are preferred
throughout over large, speculative new domains (Commerce, Creator, feature
flags, analytics) that would need to be justified by an actual approved
revenue model first, not built ahead of one "just in case."
