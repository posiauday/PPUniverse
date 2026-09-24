# Subscription, Membership, and Licensing Readiness

Research only, not approved. No subscription table, billing flow, or
newsletter category is created. Claim IDs (`MON-###`) refer to
`claims-register.csv`.

## The standing tension this research does not resolve

This project already has a **real, recorded decision** that a license tier
(Personal/Team/Enterprise) is a grant attached to a *purchased product* —
*"not a subscription plan a buyer subscribes to"* (`docs/open-questions.md`
item 7, 2026-09-23 correction). Several models researched below (release-
library membership, tool subscription, premium content membership) are
recurring-access models by nature — **that is a genuine, structural tension
with the existing decision, not a detail to smooth over.** This research
states the tension plainly (see Model G's `Conflicted` classification in
`11-architecture-alignment-matrix.md`) rather than proposing a way around it.

## Models researched, not approved

- **Release-library membership** — ongoing access to a growing catalog for a
  recurring fee, distinct from owning any specific product outright.
- **Premium-tool subscription** — access to a paid tool (Model V,
  `01-revenue-models.md`), billed recurringly.
- **Compatibility-maintenance subscription** — Model J in
  `01-revenue-models.md`, the one subscription-shaped idea this research
  found real, evidence-adjacent support for (the compatibility-evidence
  gap `docs/research/power-apps-components/` already documented across
  every competitor researched).
- **Article/course membership** — recurring access to educational content
  (Model T, `01-revenue-models.md`, in its recurring-access form).
- **Team access / organisation access** — already partially anticipated by
  the existing Team/Enterprise license tiers (item 7), but as *ownership*
  grants, not membership.
- **Annual vs. monthly access; lifetime purchase; continuing updates vs.
  perpetual downloaded rights** — genuinely different commercial shapes,
  each researched below as distinct concepts, not collapsed together.

## Audit: does the architecture distinguish these concepts?

| Concept | Status | Evidence |
|---|---|---|
| Ownership of an already-purchased asset | **Not supported for paid assets** (no purchase mechanism exists at all — `MON-017`); supported today only for the free case (`Entitlement.source = FREE_POLICY`). | `entitlements.prisma:19-21` (MON-018) |
| Continuing access to new releases | **Not supported.** `Entitlement` is scoped to `[userId, productId]`, not to a specific release — there is no "entitled through version N, not version N+1" concept to even distinguish continuing-access from one-time-access. | MON-018 |
| Support access | **Partially.** `SupportPolicy` declares a support *model* (creator/platform/community/unsupported) but has no time-bound entitlement concept. | `evidence.prisma:94-104` |
| Tool access | **Not supported.** No tool-access model exists (no paid tool exists at all yet — Model V is unbuilt). | Confirmed absent |
| Membership access | **Not supported.** No membership concept distinct from per-product `Entitlement` exists anywhere. | Confirmed absent |
| Seat count | **Not supported.** No field on any model for a seat count, even though Team/Enterprise tiers are named and locked. | `evidence.prisma:46-58` (tier names only, no seat mechanics) |
| Organisation scope | **Not supported.** No `Organization`/`OrganizationMember`-driven entitlement path exists — `docs/06-data-model.md` names `Organization`/`OrganizationMember` under Identity, but whether they connect to `Entitlement` at all was not confirmed as built (not found in the architecture inventory's Entitlement fields). | `entitlements.prisma:29-50` (no org-scoping field present) |
| Subscription status | **Not supported.** `Subscription`/`SubscriptionItem` do not exist as real models. | MON-018 |
| Subscription cancellation | **Not supported.** Same — nothing to cancel. | Same |
| Post-cancellation rights | **Not supported, and not decided as a policy either.** This is exactly the kind of ambiguity PowerLibs's own marketing-vs-license inconsistency illustrates in practice (`docs/research/power-apps-components/02-competitor-evidence.md`, CLM-017) — a real, concrete cautionary example of what happens when this isn't pinned down precisely. | Cross-reference to prior research package |

## The "yours forever" risk, named explicitly

**This research's own instruction requires recording this risk plainly, and
this project already has a directly relevant precedent from a prior research
pass to point to, not just a hypothetical.** PowerLibs's own marketing page
says *"everything you unlock stays usable even after you cancel"* while its
own license page's actual text is narrower — only Base-tier components
survive cancellation, Ultra-tier ones do not
(`docs/research/power-apps-components/claims-register.csv`, CLM-017).
**Marketing copy and licence enforcement describing different rights is a
real, observed failure mode in this exact market, not a theoretical risk.**
If LowCodeStacks ever offers any recurring-access model, this research's
finding is: the commercial copy and the enforced entitlement logic must
describe the *same* rights, checked against each other explicitly before
launch — not assumed to agree because they were written by the same team.

## Newsletter and email readiness

Audited against the real, working notification/consent architecture
(`10-current-architecture-inventory.md`), since a newsletter-based
monetization model (Models N, O in `01-revenue-models.md`) depends directly
on it.

| Capability | Status | Evidence |
|---|---|---|
| Editorial newsletter | **Not supported as a distinct message type.** Only two `EmailMessageType` values exist today, both transactional (`SIGNIN_LINK`, `DELETION_REQUEST_SUBMITTED`) — no optional/marketing message type is implemented yet, even though the consent *category* for it (`MARKETING_EMAIL`) already exists. | `notifications.prisma`; `packages/domain/notifications/src/message-types.ts` (MON-023) |
| Article alerts | **Not supported as a distinct category** — would need its own `EmailMessageType` value and likely its own consent granularity (see below). | Confirmed absent |
| New free-asset alerts | Same — not supported as a distinct category. | Confirmed absent |
| New paid-asset alerts | Same. | Confirmed absent |
| Creator updates | Same. | Confirmed absent |
| Marketplace announcements | Same. | Confirmed absent |
| Sponsored newsletter disclosure | **Not supported.** No field anywhere for this — ties directly to the same disclosure-architecture gap named in `05-affiliate-and-sponsorship-options.md`. | Confirmed absent |
| Separate consent per category | **Not supported today.** `ConsentCategory` has exactly two values: `TERMS_OF_SERVICE` and `MARKETING_EMAIL` — **one single optional/marketing category**, not per-newsletter-type granularity (article alerts vs. new-asset alerts vs. marketplace announcements would all collapse into the same opt-in today). | MON-023 |
| Unsubscribe per category | **Not supported, for the same reason** — the existing unsubscribe token is hardcoded to the single `MARKETING_EMAIL` category at the token-verification level. | `packages/domain/notifications/src/unsubscribe-token.ts` |
| Global unsubscribe | **Effectively supported today**, precisely because there's only one marketing category to unsubscribe from — this is almost accidental (a consequence of there being nothing more granular yet), not a deliberately-built "global unsubscribe" feature distinct from category unsubscribe. | Same |
| Consent evidence | **Supported, real, and working.** `ConsentRecord` is append-only, with `recordedAt` establishing the timeline. This is genuinely solid infrastructure to build on. | `privacy.prisma:72-86` |
| Suppression | **Partially.** A `granted:false` `ConsentRecord` row effectively suppresses future sends (checked fresh on every `sendOptional` call — MON-023's underlying mechanism), but there's no separate "suppression list" concept beyond consent state itself (e.g., a hard-bounce suppression, distinct from an opt-out, is not modeled). | `notification-service.ts:31-79` |
| Send audit history | **Supported, real, and working.** `EmailSend` records every send attempt with status (`SENT`/`FAILED`/`SKIPPED_NO_CONSENT`), append-only. | `notifications.prisma:31-44` |
| Related article/product attribution | **Not supported.** `EmailSend` has no relation to a specific `Article`/`Product` that triggered the send. | Confirmed absent |
| Campaign identifier | **Not supported.** No field. | Confirmed absent |
| UTM-style campaign attribution | **Not supported**, and would also depend on `AnalyticsEvent`, which does not exist at all (MON-022). | MON-022 |
| No emails without appropriate consent | **Already enforced, real, and tested** for the one category that exists — `sendOptional` checks `ConsentRecord` fresh before every send. This is the single strongest piece of existing infrastructure this whole document found. | `notification-service.ts:31-79` |

**Net finding**: the *foundation* (append-only consent, append-only send
audit, consent-checked-before-send enforcement) is real, working, and
well-built — genuinely the most subscription/membership-ready piece of
architecture this research found anywhere in the platform. The gap is
entirely in *granularity*: one marketing category needs to become several,
and message types need to expand from two transactional values to a real
set of optional/marketing types. This is a bounded, well-understood
extension of working infrastructure — not a from-scratch build, unlike
Commerce or Creator.

## Explicit statement required by this research's own instruction

No subscription table is created. No billing flow is created. No newsletter
category is added to the running system. This document audits readiness
only.
