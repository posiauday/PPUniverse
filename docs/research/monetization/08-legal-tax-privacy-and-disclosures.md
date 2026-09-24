# Legal, Tax, Privacy, and Employment Flags

Research only. **This document does not answer any of the questions it
raises.** It identifies where a monetization-adjacent architecture decision
depends on a legal, tax, or business decision this research is not
authorized to make, and marks each as blocking or not.

## Flags

| Flag | Detail | Status |
|---|---|---|
| **Legal entity** | Whether LowCodeStacks operates under a formal legal entity (and which kind) is unresolved. Open question 51 (`docs/open-questions.md`, added 2026-09-23 per the product-owner decision on open question 2) already names this specifically as an unanswered dependency for MVP-011. Any real revenue-collecting model (paid assets, commission, sponsorship, subscriptions) almost certainly needs an entity in place before money actually changes hands, even if the *architecture* to model it can be built earlier. | **Blocks production launch of any revenue-collecting model.** Does not block continued research or architecture design. |
| **Outside-employment / conflict-of-interest clearance** | Same open question 51 — whether the product owner's own outside-employment situation permits operating a commercial venture here is unresolved and explicitly out of this research's scope to answer. | **Blocks production launch.** Does not block research. |
| **Trademark clearance** | Open question 1 (`docs/open-questions.md`) — "LowCodeStacks" is partially resolved (name/domain decided) but trademark clearance itself (a CIPO search and opinion) has not been performed. Relevant here specifically for anything involving sponsor logos, "compatible with X" marketing claims, or any co-branding. | **Does not block research.** Relevant before any sponsor/affiliate/co-branding activity that would put LowCodeStacks's own name in a commercial relationship with another brand. |
| **GST/sales-tax registration (Canada)** | Open question 3 already records that Stripe Tax *calculates* tax but does not *remit* it — registration obligations remain separately unresolved, per this project's own existing decision record. | **Blocks any real paid-transaction launch** (already recorded as such prior to this research). Does not block architecture design. |
| **US sales-tax obligations** | Same open question 3 — US launch scope is recorded, tax registration obligations are not resolved. | **Blocks any real paid-transaction launch.** Does not block architecture design. |
| **Creator agreements** | This project already has a real decision on creator terms (manual payouts, invited/vetted creators — open questions 2 and 8) but the actual *legal agreement text* a creator would sign is not written or reviewed. Directly relevant to any commission/payout model researched in `06-marketplace-commission.md`. | **Blocks production launch of any creator-payment flow.** Does not block architecture design (the existing `CreatorApplication`/`AgreementAcceptance` models already anticipate an agreement, per `docs/06-data-model.md`). |
| **Refund policy** | `docs/09-marketplace-operations.md`'s own "Refund and dispute design" section already states *"Legal review is required before publication"* — an existing, standing flag, not a new finding. | **Blocks production launch of any paid-asset model.** Does not block architecture design. |
| **Privacy and consent** | This project has real, working infrastructure (MVP-020: `ConsentRecord`, `PolicyVersion`, append-only). Whether it needs a *new* consent category for advertising, affiliate tracking, or sponsored-content personalization is an architecture question this research can inform (see `04-advertising-options.md`), but whether such tracking is *permitted at all* in the launch jurisdictions is a legal question. | **Does not block architecture design.** Blocks activation of any tracking-dependent monetization (behavioral ad targeting specifically, more than contextual ads or plain sponsorship). |
| **Advertising consent** | Whether ad personalization (as opposed to purely contextual advertising, like EthicalAds's own developer-audience-contextual model) requires opt-in consent depends on jurisdiction (e.g., a GDPR-style requirement would apply if the EU is ever in scope — currently explicitly out of scope per open question 3's narrowing to Canada/US). | **Does not block research.** Would block EU expansion specifically if pursued later, more than it blocks the currently-scoped Canada/US launch. |
| **Affiliate disclosure compliance** | Not a business decision to make — this is a compliance *requirement*, already researched directly in `05-affiliate-and-sponsorship-options.md` (MON-013 through MON-016). Recorded here because the *operator* (LowCodeStacks itself, per MON-016) bears responsibility, which is a governance fact worth flagging alongside the other legal flags, not just in the affiliate-specific file. | **Blocks any real affiliate/sponsored-content activity**, not research or architecture design. |
| **Sponsored-content disclosure** | Same as above — a compliance requirement, not a business decision, but blocking for the same reason. | **Blocks any real sponsored-content activity.** |
| **Consumer-protection obligations** | Broader than tax/refund specifically — e.g., clear pricing display, cancellation rights for any future subscription. Not researched in depth in this pass beyond what `docs/09-marketplace-operations.md` and open question 3 already flag. | **Unknown** — not researched deeply enough in this pass to classify precisely; flagged in `14-open-research-questions.md`. |
| **Payout reporting** | If manual payouts to creators ever begin (per the existing decision — open question 8), tax reporting obligations to those creators (e.g., a 1099-equivalent in the US) are a real, unresolved question. | **Blocks production launch of any real payout**, not the architecture that would record payout history. |
| **Business banking** | Whether a business bank account exists to actually receive/hold platform revenue is outside this research's visibility entirely — genuinely unknown, not researched. | **Unknown.** |
| **Accounting currency** | Related to open question 3's jurisdiction scope (Canada/US) but not resolved by it — which currency is the platform's own "home" ledger currency for commission/revenue accounting is a separate, unanswered question. | **Unknown.** Does not block architecture design (Price/Order models can be currency-aware without this being resolved first). |
| **Record-retention obligations** | This project already has a real, existing gap on this exact topic — NFR-010 (data retention/deletion by data class) is recorded as an open gap unrelated to monetization specifically (`planning/status.md`'s "Open tech debt" list). Monetization records (payout history, tax-relevant transaction records) would likely have *longer* legal retention requirements than ordinary user data, which is worth flagging as a monetization-specific wrinkle on an already-known gap. | **Does not block architecture design or research.** Blocks a defensible production retention policy once real money is involved. |

## What this document explicitly does not do

- Does not answer whether LowCodeStacks has or needs a legal entity.
- Does not answer the outside-employment/conflict-of-interest question.
- Does not perform trademark clearance.
- Does not determine tax registration obligations in any jurisdiction.
- Does not draft or review any creator agreement, refund policy, or
  disclosure policy text.
- Does not claim legal compliance, tax compliance, or ad-network approval
  for anything researched elsewhere in this package.

Every flag above is either already an existing, recorded open question in
this project's own governance (`docs/open-questions.md`, `docs/09-marketplace-operations.md`)
or a new flag raised by this research and explicitly not resolved here.
