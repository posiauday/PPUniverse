# Free and Paid Asset Strategy

Research only. No schema is changed by this document. Every capability
below is audited against the real Prisma schema
(`10-current-architecture-inventory.md`), not `docs/06-data-model.md`'s
placeholder list alone.

## MIT and paid-asset analysis

Recorded accurately, per this research's own instruction:

- MIT permits commercial use, modification, distribution, sublicensing, and
  sale, **when the applicable copyright and permission notices are
  preserved** — this is a real, binding condition, not a formality (the same
  finding this project's own `docs/research/power-apps-components/08-licensing-and-trademarks.md`
  already established in detail for Microsoft's MIT-licensed sample repos).
- MIT does **not** automatically license trademarks, logos, website design,
  documentation, or unrelated assets — a component's code being MIT doesn't
  mean its author's name, brand, or accompanying docs are free to reuse
  without their own separate permission.
- Third-party dependencies carried by an MIT-licensed asset need their own
  licence review — an MIT top-level licence does not launder whatever the
  asset depends on.
- Free MIT assets and paid original assets can coexist on the same
  marketplace, if rights and notices are correctly separated per listing —
  this is an operational/data-modeling discipline, not a legal
  impossibility.
- LowCodeStacks must not represent an MIT-derived asset as exclusively owned
  where that would be misleading to a buyer.
- A listing must identify its licence and any bundled third-party notices.
- A creator must have actual authority to license every uploaded file — this
  is a warranty/attestation question, not just a licence-field question (see
  below).

## Audit: does the current architecture support this?

| Capability | Status | Evidence |
|---|---|---|
| Licence per product | **Partially.** `ProductLicense` exists and links a `Product` to a `LicenseDefinition` (the three locked tiers). | `evidence.prisma:60-71` (MON-019) |
| Licence version per product/release | **Not supported.** `LicenseDefinition` has no version field; `ProductLicense` has no version field. | `evidence.prisma:46-71` |
| Third-party notices | **Not supported.** No field anywhere for bundled dependency notices. | Confirmed absent by direct schema read |
| Dependency notices | **Not supported.** Same as above. | Same |
| Author copyright statement | **Not supported as a distinct field.** `Product` has no copyright-holder field distinct from the creator relationship itself (and `CreatorProfile` doesn't exist yet at all — MON-020). | `catalog.prisma:39-60`; `packages/domain/creator/README.md` |
| Provenance/source repository | **Not supported.** No field for "where did this originally come from" (relevant specifically for an MIT-derived asset). | Confirmed absent |
| Modification disclosure | **Not supported.** No field for "this is a modified version of X." | Confirmed absent |
| Redistributable vs. non-redistributable | **Not supported.** No such distinction anywhere in `Product`/`ProductLicense`. | Confirmed absent |
| Commercial-use permission | **Implicit only**, via which `LicenseDefinition` tier is attached — not an explicit, separate flag. | `evidence.prisma:46-58` |
| Sublicensing permission | **Not supported.** No field. | Confirmed absent |
| Attribution/notice package | **Not supported.** No mechanism to attach a downloadable notice bundle to a product. | Confirmed absent |
| Immutable licence snapshot attached to each purchase | **Not supported — and cannot be, since purchases don't exist yet.** `Entitlement` has no snapshot of licence terms at grant time; it only references `productId`/`userId`, not a point-in-time copy of what was purchased. | `entitlements.prisma:29-50` (MON-018) |
| Downloadable NOTICE/LICENSE files | **Not supported.** No file-attachment mechanism for this exists distinct from the product's own release files. | Confirmed absent |
| Creator warranty/attestation | **Not supported.** No field or workflow step capturing "I attest I have the right to license this." `AgreementAcceptance` (named in `docs/06-data-model.md`) does not exist as a real model (MON-020). | `packages/domain/creator/README.md` |
| Moderator licence review evidence | **Not supported.** `ModerationReview` does not exist as a real model (MON-020) — there is no structured record of a moderator having checked licence claims at all, only the general `docs/09-marketplace-operations.md` submission-checklist text ("ownership and license") as a process description, not an enforced data structure. | `packages/domain/creator/README.md`; `docs/09-marketplace-operations.md` |

**Net finding**: the *tier* concept (Personal/Team/Enterprise) is real and
already decided; almost everything around *provenance, notices, and
attestation* that would make "free MIT + paid original, correctly
separated" actually trustworthy is unbuilt. This is a genuine gap between
"we sell licensed things" (partially true today) and "we can prove what
licence terms actually apply, and that the creator had the right to grant
them" (not true today).

## Free-versus-paid readiness — Product, ProductLicense, Price, Order, Entitlement

| Capability | Status | Evidence |
|---|---|---|
| Free download | **Supported, working today.** `Entitlement.source = FREE_POLICY` is the only source value that exists, and MVP-010 already implements this end-to-end. | `entitlements.prisma:19-21` (MON-018) |
| Paid one-time purchase | **Not supported.** No `Price`, `Order`, `CheckoutSession`, or `PaymentEvent` model exists at all. | MON-017 |
| Product-specific Personal/Team/Enterprise licence grants | **Partially.** The tier *definitions* exist (`LicenseDefinition`) and can be attached per product (`ProductLicense`), but nothing prices or grants them — `ProductLicense` has no price field, and `Entitlement`'s only source is free. | `evidence.prisma:46-71`; `entitlements.prisma:19-21` |
| Different price per product per licence tier | **Not supported.** No `Price` model exists at all. | MON-017 |
| Free-to-paid product relationship | **Not supported.** No concept of "this free product has a paid upgrade" anywhere. | Confirmed absent |
| Bundles containing multiple products | **Not supported.** No `Bundle`-equivalent model. | Confirmed absent |
| Perpetual entitlement | **Partially.** `Entitlement` has no expiry field at all today — it's perpetual by omission, not by explicit design choice, since only the free-forever case exists. Whether a *paid* entitlement should default to perpetual or time-limited is undecided. | `entitlements.prisma:29-50` |
| Time-limited update access | **Not supported.** No field distinguishing "owns the asset" from "eligible for new versions." | Confirmed absent |
| Version eligibility | **Not supported.** `Entitlement` is unique per `[userId, productId]`, **not per release** — it has no concept of "entitled through version N" at all. | `entitlements.prisma:29-50` (MON-018) |
| Paid upgrade | **Not supported.** No upgrade-path concept exists. | Confirmed absent |
| Introductory price | **Not supported.** No `Price` model to have a promotional variant of. | MON-017 |
| Promotional price | **Not supported.** Same. | MON-017 |
| Coupon or discount | **Not supported.** `Coupon` does not exist. | MON-017 |
| Enterprise contact-sales path | **Not supported.** No lead-capture or contact-sales flow exists anywhere in `apps/web/app/`. | Confirmed absent (`10-current-architecture-inventory.md`'s route inventory) |
| Support period | **Partially.** `SupportPolicy` exists (creator-supported/platform-supported/community-supported/unsupported, per `docs/09-marketplace-operations.md`) but has no time-bound "period" concept — it's a support *model* declaration, not a support *entitlement window*. | `evidence.prisma:94-104` |
| Maintenance entitlement | **Not supported** as distinct from ordinary entitlement. See Model J in `01-revenue-models.md`. | Confirmed absent |
| Refund impact on entitlement | **Not applicable yet** — no refund model exists (`Refund` is placeholder-only), so there's nothing for a refund to impact today. | MON-017 |
| Chargeback impact on entitlement | **Not applicable yet.** Same reasoning. | MON-017 |
| Licence snapshot at purchase time | **Not supported — and there's no purchase to snapshot yet.** See the immutable-snapshot row above. | MON-018 |
| Product retirement without breaking existing entitlements | **Partially plausible by design, not proven.** `Entitlement`'s FK to `Product` is `Cascade` (per the schema), meaning **deleting a `Product` row would currently cascade-delete every `Entitlement` referencing it** — the opposite of "retirement without breaking entitlements." A real product-retirement flow (soft-delete/archive `Product`, never hard-delete once entitlements exist) is not built or enforced today. | `entitlements.prisma` FK definitions |

## Explicit separation required by this research's own instruction

This research keeps these five concepts distinct throughout, and finds the
current architecture does **not** yet distinguish most of them either —
they collapse into "the one thing that exists" (a free, perpetual,
unversioned `Entitlement`) because nothing else has been built yet:

- **Licence grant** (which tier, what rights) — partially modeled (`ProductLicense`).
- **Price** (what it costs) — not modeled at all.
- **Billing model** (one-time vs. recurring) — not modeled at all.
- **Subscription** (an ongoing relationship) — not modeled at all.
- **Support entitlement** (access to help) — a policy declaration exists
  (`SupportPolicy`), a time-bound entitlement to it does not.
- **Update entitlement** (access to new versions) — not modeled at all;
  `Entitlement` isn't even release-scoped today.

**Personal/Team/Enterprise are not collapsed into subscription plans
anywhere in this document or elsewhere in this package**, consistent with
the already-decided distinction in `docs/open-questions.md` item 7.
