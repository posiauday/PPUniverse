# Marketplace Commission Readiness

Research only. **This document does not pick a commission rate, does not
implement automated payouts, and does not reverse the recorded deferral of
automated payments.** It respects every existing decision below as
already-settled, not open for re-litigation.

## Existing decisions this research respects, unchanged

- **Invited/vetted creators only** — no open self-serve publishing
  (`docs/open-questions.md` item 2, closed 2026-09-23).
- **Manual founding-cohort payouts** — the standing position, explicitly
  reaffirmed after automated split payouts via a Connect-style integration
  were considered and set aside (`docs/open-questions.md` item 8, closed
  2026-09-23; `docs/09-marketplace-operations.md`'s original deferral
  language: *"Defer automated split payments until seller volume, tax/legal
  setup, identity verification and support operations justify the
  complexity"*).
- **Payout details captured as intent only** — no live Stripe Connect
  onboarding in the creator-application story.
- **Pricing, commission rate, jurisdictions, tax, and refund terms remain
  entirely unresolved** (open questions 3 and 7).

## Future-capability audit (research, not implementation)

| Capability | Status | Evidence |
|---|---|---|
| Commission agreement version | **Not supported.** No versioned-agreement model exists — `AgreementAcceptance` is named in `docs/06-data-model.md` but does not exist as a real model. | `packages/domain/creator/README.md` (MON-020) |
| Creator commission rate | **Not supported, and not decided as a number.** No field anywhere; the rate itself is explicitly unresolved (`docs/open-questions.md` item 7: *"The commission rate remains entirely open and requires explicit financial sign-off"*). | Confirmed absent + existing open question |
| Platform fee | **Not supported.** No field. | Confirmed absent |
| Seller gross / seller net | **Not supported.** No `Order`/`OrderLine`/`PaymentEvent` model exists to derive either from. | MON-017 |
| Payment fee | **Not supported.** Same — no payment-processing record exists at all yet. | MON-017 |
| Refund allocation | **Not supported.** `Refund` is placeholder-only. | MON-017 |
| Chargeback allocation | **Not supported.** Same — no `PaymentEvent` to carry a chargeback signal. | MON-017 |
| Tax withholding | **Not supported.** No tax model exists (`TaxRecord` placeholder-only), and the underlying registration obligations themselves are unresolved (`08-legal-tax-privacy-and-disclosures.md`). | MON-017 |
| Payout statement | **Not supported.** No model for a creator-facing statement of what they're owed/paid. | Confirmed absent |
| Payout threshold | **Not supported.** No field. | Confirmed absent |
| Payout schedule | **Not supported.** No field. | Confirmed absent |
| Manual payout evidence | **Not supported, but architecturally simple to add.** A manual payout (the current, decided approach) just needs an append-only record of "we paid creator X amount Y on date Z, by what method" — this is a much smaller build than any of the automated-payment infrastructure above, since it doesn't require `PaymentEvent`/webhook processing at all. | Design inference, not existing code |
| Payout status | **Not supported.** No field. | Confirmed absent |
| Financial audit trail | **Not supported as a dedicated concept**, though this project's own established append-only pattern (`ConsentRecord`, `DeletionRequestEvent`, `ArticlePublishEvent` — all confirmed genuinely append-only in `10-current-architecture-inventory.md`) is a directly reusable, already-proven convention for whatever payout-audit table is eventually built. | Existing pattern, confirmed real across three separate models |
| Immutable commercial-term snapshot | **Not supported.** No purchase exists to snapshot terms at, and no snapshot mechanism exists anywhere in the schema (same gap `02-free-and-paid-asset-strategy.md` found for licence terms generally). | Confirmed absent |
| Future provider transaction IDs | **Not supported.** No `PaymentEvent.providerEventId`-equivalent field exists yet (though the *idempotency pattern* — a unique provider-event-ID constraint — is already a named critical constraint in `docs/06-data-model.md`'s "Critical constraints" section, so the *design intent* for this exists even though the model doesn't). | `docs/06-data-model.md` |
| Migration path from manual to automated payouts | **Not designed.** No schema exists for either state yet, so there is nothing to migrate between today — this is a forward-looking design question for whenever automated payouts are ever un-deferred, not a current gap. | N/A |

## What this means, stated plainly

**The commission/payout system, as a whole, does not exist in any form
today** — not the automated version (explicitly deferred) and not the
manual version (decided, but genuinely unbuilt). The one meaningfully
smaller, more tractable piece is **manual payout evidence** — an append-only
record of a manual payment, following this project's own already-proven
append-only pattern. Everything else on this list (commission rate,
platform fee, tax withholding, financial audit trail at scale) either
requires a business decision this research does not make (the rate itself)
or depends on infrastructure (`Order`/`PaymentEvent`) that doesn't exist
because MVP-007 hasn't started.

## Explicit statement required by this research's own instruction

No commission rate is picked. No automated payout is implemented. The
existing deferral (`docs/09-marketplace-operations.md`, reaffirmed
2026-09-23) is not reversed by anything in this document.
