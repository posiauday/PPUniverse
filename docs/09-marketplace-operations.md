# Marketplace Operations

**Substantially rewritten 2026-09-24** following the first-party-only publishing
decision (`docs/final-decisions.md`, "First-party-only publishing model"). This
document was previously entirely creator/seller-lifecycle-centric; every section
below is either retained (no creator dependency), reworded (first-party terms), or
marked superseded (preserved for historical reference, not erased).

## Product lifecycle (retained, first-party)

Draft, published, suspended, archived. ~~Product lifecycle: draft, submitted,
changes requested, approved, scheduled, published, suspended, archived.~~ The
original lifecycle's middle steps (submitted, changes requested, approved,
scheduled) presupposed a review distinct from authoring (MVP-013's original
scope). Whether any of those steps survive in a first-party form — an internal
self-review gate before publish — is not resolved here; see
`docs/final-decisions.md`, "First-party-only publishing model", section 5, and
`planning/mvp-backlog.csv`'s MVP-013 row (Superseded). Until that's resolved, the
safest stated lifecycle is the four states no one disputes: an administrator
drafts a product, publishes it, may suspend it, and may archive it.

**Implemented 2026-09-26 (MVP-019, `docs/final-decisions.md`, "MVP-019
operations console and audit"): suspend and archive are real, not just
stated.** `ProductStatus` gains `SUSPENDED`/`ARCHIVED`; valid transitions are
`PUBLISHED ⇄ SUSPENDED`, `PUBLISHED → ARCHIVED`, `SUSPENDED → ARCHIVED`, with
`ARCHIVED` terminal (no path back out) and `DRAFT` never a valid source or
destination for either. A reason is required for every transition (NFR-009)
and recorded in the append-only `ProductStatusEvent` audit trail. Suspending
or archiving affects public discoverability only — it never touches an
`Entitlement` row, so existing customers keep whatever access they already
had regardless of a later suspend/archive.

## ~~Creator lifecycle~~ (superseded)

~~Applicant, under review, approved, restricted, suspended, closed.~~
**Superseded 2026-09-24** (`docs/final-decisions.md`, "First-party-only
publishing model"). There is no creator lifecycle — only an authorized
LowCodeStacks administrator publishes. Preserved here as the historical record,
not erased.

## First-party publication checklist (retained, reworded)

Ownership and license; accurate description; screenshots; setup guide;
prerequisites; compatibility; accessibility declaration; included files; support
channel; changelog; refund classification; no secrets/sample personal data; scan
clean; claims evidence; trademark review. ~~Submission checklist~~ **renamed —
none of these items presuppose a third-party submitter; every one is a
first-party product-quality check an administrator satisfies before publishing.**
"Ownership and license" now means LowCodeStacks holds or has cleared the rights
to what it publishes (including any MIT-derived or otherwise licensed
third-party-sourced material it incorporates), not a creator's warranty of their
own submission.

## ~~Moderation decision~~ (superseded, pending resolution)

~~Approve, request changes, reject, suspend or takedown. Capture reason code,
narrative, evidence, reviewer and timestamp. High-risk security or IP cases
require escalation.~~ **Superseded in this form 2026-09-24** — this presupposed
a moderator distinct from the product's own author/submitter, which does not
exist under first-party-only (`docs/final-decisions.md`, "First-party-only
publishing model", section 5). Preserved as the historical record. **What
remains, regardless of this section's fate**: the automated quality gates this
section's decisions used to gatekeep — security/file scanning (MVP-006), licence
and compatibility validation (TD-006, TD-008), and release-immutability
enforcement (MVP-014) — are unaffected and continue to run on every first-party
publish, since none of them ever depended on a third-party creator role to
trigger. Whether a *human* review step (self-review or otherwise) also survives
is the same open question the Product lifecycle section above defers to
MVP-013's resolution.

## Support model (retained, one label pending review)

Every product declares ~~creator-supported~~, platform-supported,
community-supported or unsupported. Publish response expectations as targets
only after operational validation. **The "creator-supported" label's wording is
pending a separate presentation-only review** (`planning/tech-debt/TD-018.md`)
— the underlying `SupportStatus.CREATOR_SUPPORTED` enum value is not changed by
this entry; only its eventual *display* wording is flagged as needing decision.
"Platform-supported," "community-supported," and "unsupported" are unaffected.

## Refund and dispute design (unaffected)

Policy must distinguish digital download, subscription, duplicate payment,
technical incompatibility, misrepresentation and fraud. Provider events and
entitlement effects must remain auditable. Legal review is required before
publication. **No change** — nothing in this section ever depended on a
third-party creator or seller.

## ~~Multi-vendor payouts~~ (superseded)

~~Defer automated split payments until seller volume, tax/legal setup, identity
verification and support operations justify the complexity. MVP may sell
first-party products and manually onboard a limited creator cohort under
approved commercial terms.~~ **Superseded 2026-09-24**
(`docs/final-decisions.md`, "First-party-only publishing model", section 8) —
there is no multi-vendor concern, no seller volume, and no creator cohort to
onboard, manually or otherwise. LowCodeStacks is the sole seller. Preserved here
as the historical record — this was itself a deferral, not a build, so nothing
is un-built by this supersession; open question 8 (which this section's
original deferral partly informed) is separately closed as obsolete
(`docs/open-questions.md`).
