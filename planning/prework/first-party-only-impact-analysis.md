# First-Party-Only Impact Analysis

**Read-only. Nothing in this document is implemented, and nothing here changes
backlog state, `docs/final-decisions.md`, or any production code.** Per the
product-owner instruction authorizing this analysis (2026-09-24,
"PRODUCT-OWNER DECISION — FIRST-PARTY-ONLY PUBLISHING MODEL"), this reports
the complete impact of reversing the earlier third-party-creator decision, so
the follow-up documentation/decision pass has a real, verified map to work
from instead of discovering gaps one at a time.

## A note on how this analysis was produced

The reference inventory was gathered two ways: a broad, automated repository
search (an isolated Explore agent), and direct verification by this session
against the live working tree. **The automated search's isolated worktree
was stale for several files this session has edited today** — it reported
`docs/final-decisions.md` and `planning/proposed-stories.md` as not existing
at all, and `docs/open-questions.md` as having only 23 items (no item 51),
none of which is true. Those specific claims are corrected below using
direct reads against the real, current repository. The automated search's
findings from files **not** touched this session (BRD, PRD, TRD, IA, UX
design system, data model, API contracts, security doc,
marketplace-operations, SEO doc, test strategy, devops runbook, GitHub
planning templates, `schemas/product-metadata.schema.json`,
`packages/domain/*/README.md`) are treated as reliable — cross-checked
against this session's own earlier direct reads of several of the same
files (`docs/02-prd.md`, `docs/07-api-contracts.md`,
`docs/09-marketplace-operations.md`) with no discrepancy found. This caveat
matters because it changes how much weight to put on "zero occurrences"
claims specifically — every such claim below was independently re-verified,
not taken on the automated search's word alone.

## Decision being superseded

**`docs/final-decisions.md`, "2026-09-23 — Open question 2: invited and
vetted third-party creators"** (and its companion entry, "2026-09-23 —
Automated split payouts considered and set aside"). That decision closed
`docs/open-questions.md` item 2 as: *"invited and vetted third-party
creators. Not an open self-serve marketplace at MVP. Flow: apply → moderator
review → approved to publish."* Its four binding constraints (identity/
profile/support/agreement capture; payout-intent-only; server-enforced
approval; immutable audit events for rejection/suspension/revocation) are
the specific things the new first-party-only model removes the need for.

This analysis does not rewrite that entry — per instruction, no
`docs/final-decisions.md` change happens in this pass. It is named here so
the follow-up decision-recording pass knows exactly which entry to
supersede (not erase).

## Impacted requirements

| Requirement | Current text | Impact |
|---|---|---|
| **FR-008** | *"Creator application captures identity, public profile, payout readiness, support commitment and agreement acceptance."* (`docs/02-prd.md`) | **Cannot survive as written.** There is no creator application under first-party-only. This requirement needs retirement or a complete rewrite — see "Recommended backlog treatment" below. |
| **FR-009** | *"Creator portal supports drafts, media, documentation, pricing, licenses, compatibility, releases and submission."* (`docs/02-prd.md`) | **Needs wording change, not retirement.** The underlying capability (an authoring surface for drafts/media/docs/pricing/licenses/compatibility/releases) is still needed — for first-party ADMIN authoring, not a "creator portal." The capability survives; the actor and the word "portal"/"creator" in its description do not. |
| **FR-010** | *"Moderation supports queue, evidence, comments, decision reason, resubmission, suspension and takedown."* (`docs/02-prd.md`) | **Needs scope reconsideration.** Under first-party-only, there is no external submitter to moderate against. This either becomes an internal quality-review gate (first-party content reviewing itself before publish) or is narrowed to the new suggestion-inbox concept (§ Suggestion capability below) — a real, unresolved fork, not assumed resolved here. |
| **FR-003** (product page content) | Names "creator" as one of the fields a product page shows (`docs/02-prd.md`). | **Needs wording change.** A product's "creator" byline becomes "published by LowCodeStacks" (or is simply removed as a distinct field, since there is only one publisher) rather than a per-product varying attribution. |

## Impacted stories

| Story | Current dependency chain | Impact |
|---|---|---|
| **MVP-011** — Creator application, P0, FR-008, `Backlog` (see correction below), depends on MVP-002 | Directly built to implement the now-reversed decision. | **Cannot proceed as scoped.** See "Recommended backlog treatment." |
| **MVP-012** — Product and release editor, P0, FR-009, `Backlog`, depends on `MVP-006;MVP-011` | Its dependency list names MVP-011 explicitly. | **Its dependency needs revision** (see downstream question 3 below) — the *capability* (an authoring surface) is still needed, gated by MVP-006 (Done) and ADMIN authorization (already established, MVP-002), not by a creator-application story that no longer exists. |
| **MVP-013** — Submission review queue, P0, FR-010, `Backlog`, depends on MVP-012 | Named "submission review queue" — implies reviewing someone else's submission. | **Scope question, not automatically resolved** — see downstream question 4. |
| **MVP-014** — Immutable published releases, P0, FR-011, `Backlog`, depends on MVP-013 | Depends on MVP-013 only for sequencing, not for creator-specific logic — release immutability applies to first-party releases exactly the same way. | **Likely unaffected in substance**, only in its position in a revised dependency chain if MVP-013 is rescoped or removed. |
| **MVP-019** — Operations console and audit, P0, FR-015, `Backlog`, depends on MVP-013 | FR-015 already names "users, creators, taxonomies, products, orders, refunds, entitlements, reviews, content, feature flags and audit logs" as admin-manageable — "creators" in that list becomes moot (no creators to manage), the rest is unaffected. | **Minor wording impact only** — its actual scope (admin console, audit) barely changes. |
| **MVP-024** — Support case workflow, P1, FR-018, `Backlog`, depends on MVP-019 | Not creator-specific in its own acceptance criteria ("Case links to user/product/order/version"). | **Unaffected.** |
| **MVP-025** — Launch gate, P0, depends on "All P0" | Depends transitively on the whole chain above. | **Indirectly affected** only insofar as the P0 chain above needs to be resequenced. |

**Correction to my own prior turn**: I described MVP-011 as `"Ready"` when
recommending it last turn, and `planning/mvp-backlog.csv`'s own row currently
reads `MVP-011,Creator,Creator application,P0,Backlog,FR-008,...` —
**`Backlog`, not `Ready`**, as of this session's current file state (verified
directly, not from the automated search). `planning/status.md`'s own
"Board" table (line 26) separately lists MVP-011 under "Ready" with count 2
alongside MVP-007. This is an existing, pre-existing inconsistency between
`planning/mvp-backlog.csv`'s per-row `Status` column and `planning/status.md`'s
own board summary — worth flagging as a found discrepancy in its own right,
independent of the first-party-only question, since `CLAUDE.md` names
`planning/mvp-backlog.csv` as the canonical status record.

## Impacted dependencies

- **MVP-012 → MVP-011**: needs to become **MVP-012 → MVP-006** (file
  pipeline, already Done) plus an ADMIN-authorization precondition that
  already exists structurally (the same deny-by-default, re-queried-per-request
  role pattern already used for `/admin/deletion-requests` and
  `/admin/content/*`, per this session's own earlier work on MVP-017/MVP-020).
  No new engineering dependency is introduced by this change — if anything,
  the dependency chain gets *shorter*.
- **MVP-013 → MVP-012**: unaffected mechanically (still needs an editor to
  exist before there's anything to review), but the *nature* of what's
  reviewed changes (see downstream question 4).
- **The wave sequencing in `docs/13-implementation-readiness-plan.md`**
  (Section 8, "Story execution sequence") names MVP-011 in Wave 3 and
  references "creator application" as a Wave-4 precondition for MVP-012 —
  this planning document's own sequencing table would need a revision pass
  once the backlog treatment is decided, not assumed here.

## Impacted open questions

Verified directly against the current `docs/open-questions.md` (153 lines,
60 items — not 23, correcting the automated search's stale finding):

| Item | Current text (summary) | Impact |
|---|---|---|
| **2** | *"CLOSED... Invited and vetted third-party creators..."* | **This is the decision being reversed.** Per instruction, `docs/open-questions.md` gets a new closure recording the reversal in the follow-up pass — not rewritten in this read-only analysis. |
| **7** | License tiers locked (Personal/Team/Enterprise); *"a creator can price the same product's Personal/Team/Enterprise grants differently... The commission rate remains entirely open..."* | **Partially moot, partially still relevant** — per the instruction's own framing, confirmed by this analysis: the *tier* concept and *first-party pricing* still matter (item 7 stays open for that); the "a creator can price... differently" framing and "commission rate" framing become moot (there is no creator to price independently, and no commission on a first-party sale to a customer — though see the "commercial consequences" caveat below on whether "commission" ever meant anything broader). **Not closed or rewritten here**, per instruction section 6's explicit "do not close or rewrite these questions until the impact analysis shows their remaining scope" — this row is that showing. |
| **8** | *"NOT APPROVED... Automated split payouts... The standing position is unchanged: manual payouts for a founding cohort..."* | **Becomes obsolete**, exactly as the instruction anticipated — this question exists entirely to arbitrate *creator* payout terms, and there is no creator to pay out to under first-party-only. **Not closed here**, per the same explicit instruction. |
| **24** | Whether `/creators/[handle]` and `Collection`/`CollectionItem` pages get built; notes *"creator identity and creator-profile ownership are assigned to MVP-011."* | **The `/creators/[handle]` half becomes moot** (no public creator page to resolve) — the `Collection`/`CollectionItem` half is unrelated to creators and stays exactly as open as before. |
| **26** | FR-003 disposition: *"Creator → MVP-011 (identity and profile ownership...)."* | **The creator-ownership disposition becomes moot.** The other four dispositions in this same item (price → MVP-007, screenshots/demo, prerequisites/setup, accessibility statement, changelog/version-history → the PROP-001 through PROP-004 proposals) are unaffected — none of them depend on a creator role, only on `ProductMedia`/documentation/accessibility-statement/changelog fields that any first-party product would also need. |
| **28** | TD-008/MVP-013 open items: reviewed-date display wording, what counts as a "material" change, *"administrator authority over compatibility evidence"*, whether a moderator may withdraw a review. | **Mostly unaffected** — these are about the `CompatibilityRecord` evidence workflow, which survives (an ADMIN-authored product still needs compatibility evidence, still has a declared-vs-reviewed distinction — see the enum finding below). The phrase "administrator authority over compatibility evidence" already anticipates admin-authored evidence, suggesting this item was already written with an eye toward exactly this kind of first-party path being possible. |
| **51** | *"OPEN — recorded, not answered... MVP-011 (Creator application) additionally depends on a legal entity existing and on the product owner's employment conflict-of-interest position being confirmed..."* | **Becomes moot for MVP-011 specifically**, since MVP-011 as scoped no longer exists to be gated. Whether the underlying legal-entity/conflict-of-interest question still matters for a first-party commercial launch generally (i.e., independent of any creator story) is a real question this analysis does not resolve — flagged, not assumed answered, since first-party sales still involve real money and the same legal-entity question could still apply to *that*, just not via MVP-011 specifically. |

## Impacted proposed schemas and roles

**Data model** (`docs/06-data-model.md`, "## Creator and marketplace"
section, quoted exactly): *"CreatorProfile, CreatorApplication,
AgreementAcceptance, ProductSubmission, ModerationReview, ModerationComment,
TakedownCase, SupportPolicy."*

None of these except `SupportPolicy` exist in the real Prisma schema today
— confirmed directly: `packages/domain/creator/` contains only a
placeholder `README.md` (*"Creator domain rules (CreatorProfile,
CreatorApplication, AgreementAcceptance, ProductSubmission, SupportPolicy)
per `docs/06-data-model.md`. Structural placeholder only. Owning story:
MVP-011."*), no `src/` directory, and `packages/adapters/creator/` does not
exist at all. **This means the schema-level impact of this reversal is
zero migration work** — nothing needs to be dropped or altered, because
nothing beyond `SupportPolicy` was ever built. This is the single most
consequential finding for how *easy* this pivot is: it lands entirely in
documentation and planning artifacts, not in a schema rollback.

**A genuinely new finding, not found by the automated search**: two enum
values **are** real, shipped, and in production use today, and they use
"creator" as part of their identifier and public-facing label:

- `CompatibilityEvidenceStatus.CREATOR_DECLARED` (`packages/db/prisma/schema/evidence.prisma:29-34`),
  displayed verbatim as **"Creator Declared"** on real, live product pages
  (`packages/domain/catalog/src/compatibility.ts:54`) — this is MVP-005/TD-008's
  already-built, already-tested, already-CI-verified compatibility-evidence
  badge.
- `SupportStatus.CREATOR_SUPPORTED` (`evidence.prisma:37-41`), displayed as
  **"Creator-supported"** (`packages/domain/catalog/src/support.ts:6`).
- `schemas/product-metadata.schema.json`'s `support` enum also lists
  `"creator"` as a literal allowed value (line 47).

**These do not need to change mechanically** — an ADMIN-authored product
can still meaningfully have "self-declared" vs. "independently reviewed"
compatibility evidence (the same author-vs.-reviewer distinction, just both
roles now sit inside LowCodeStacks rather than one being external). But the
**public-facing label wording** ("Creator Declared," "Creator-supported")
would read oddly on a platform with no creators, and per this instruction's
own rule against silently renaming while retaining old wording, this is
flagged as a real, concrete follow-up item — **not resolved or changed
here**. Renaming the enum *values* themselves would be a real migration
(Postgres cannot drop an enum value without a table rebuild, same
constraint TD-008's own migration comment already documents) and is
explicitly out of scope for this read-only pass; renaming only the
*display label* (the TypeScript string map) is comparatively low-risk if
ever approved, since it touches no schema.

**Roles**: `docs/13-implementation-readiness-plan.md`'s authorization plan
(Section 5) names a role set of *"Guest, Member, Creator, Moderator,
SupportAgent, Admin"* with an example of a user holding *"Member + Creator"*
simultaneously. Under first-party-only, the `Creator` role has no purpose —
only `ADMIN` (already built and in production use, MVP-017/MVP-020) would
author/publish. Whether `Moderator` survives depends on the same MVP-013
fork named above. This role list exists only in planning documentation
today — no `UserRole` enum value for `CREATOR` was found in the real
Prisma schema (`identity.prisma`), consistent with the "schema-level impact
is zero" finding above.

## Capabilities removed

Per the instruction's explicit "commercial consequences" list, matched
against what this analysis actually found to exist (documentation-only,
confirmed above) versus what was never built:

- Creator application, agreement acceptance, and identity/profile capture
  as a distinct flow (documentation-only — nothing to remove from code).
- Public creator profile/page (`/creators/[handle]`, named in
  `docs/04-information-architecture.md`'s route list — never built, no
  route exists in `apps/web/app/`).
- Third-party product submission and creator-facing moderation queue as
  currently scoped (documentation-only).
- Marketplace commission, creator earnings, seller balances, payout
  thresholds/schedules, creator tax collection, Stripe Connect for
  creators, seller agreements/onboarding, creator-specific pricing
  controls, creator suspension/revocation as a *third-party* concept,
  creator support commitments, multi-seller dispute handling — **all of
  these were already unbuilt** (confirmed by this session's own separate
  monetization architecture audit, `docs/research/monetization/10-current-architecture-inventory.md`:
  `packages/domain/commerce` and `packages/adapters/payments` are
  README-only; no `Order`/`PaymentEvent`/`Refund` model exists at all).
  **Nothing here required un-building anything either.**

## Capabilities retained

- **First-party product authoring**: create/edit products, upload files,
  manage releases/versions, set license options, set prices (once pricing
  is approved), record compatibility evidence, submit for internal
  quality review if that step is kept, publish/unpublish/retire, maintain
  documentation/screenshots/changelogs — this is FR-009's actual
  substance, just performed by ADMIN rather than by an external Creator
  role. This is **exactly MVP-012's scope**, unchanged in substance.
- **The existing `ADMIN` role and its established authorization pattern**
  (deny-by-default, re-queried server-side per request, no application
  code path grants it automatically) — already real, already built
  (MVP-017, MVP-020), already the correct mechanism for first-party
  authoring. No new role infrastructure is needed.
- **`SupportPolicy`** (`evidence.prisma:94-104`) — already real, already
  built, and still meaningful: a first-party product still declares a
  support model, even if "creator-supported" specifically no longer makes
  sense as a *label* (see the enum-wording finding above); "platform-
  supported," "community-supported," and "unsupported" remain fully valid
  regardless of authorship model.
- **`CompatibilityRecord` and its evidence-status workflow** — fully
  retained in substance (see enum finding above).
- **Moderation as a general concept** — survives in some form; its exact
  target (first-party self-review vs. the new suggestion inbox) is the one
  genuinely open fork this analysis does not resolve (downstream question
  4).

## Recommended backlog treatment for MVP-011

**Not decided here — this is a recommendation for review, per the
instruction's own explicit "recommended backlog treatment" ask, not a
change made unilaterally.** Of the four options offered (Cancelled,
Superseded, Removed from MVP scope, Replaced by a separately proposed
suggestion story), the evidence in this analysis points toward
**Superseded** as the most accurate single label, for a specific reason:
"Cancelled" or "Removed" would imply the underlying *need* (some kind of
external-facing intake for third-party contributions) disappeared entirely
— but it didn't; it was replaced by the suggestion-workflow concept
(section 4 of the instruction, researched separately below), which is a
real, narrower successor, not an absence. "Superseded by the suggestion
capability, once that capability is itself approved and scoped" is the most
precise, defensible characterization this analysis can offer — **stated as
a recommendation, not applied to `planning/mvp-backlog.csv` in this pass.**

## Proposed suggestion capability (research level only — not approved)

The instruction's own candidate categories and fields are reproduced here
for continuity, not expanded on speculatively, since approving exact
fields/statuses is explicitly out of scope for this pass:

- **Categories to evaluate**: Canvas component, PCF control, app template,
  Power Automate toolkit, Power BI asset, architecture/governance pack,
  tutorial, troubleshooting article, existing-product improvement,
  compatibility request, accessibility improvement, bug report,
  integration request.
- **Minimum fields to evaluate**: title, category, problem to solve,
  description, example use case, optional reference URL, optional contact
  email, consent to be contacted.
- **Safest initial boundary** (a real constraint worth preserving into any
  future approval, not just a suggestion): text and optional URLs only; no
  file uploads; no source-code submissions; no confidential information;
  no client/employer materials; no ownership transfer; no compensation
  promise. This boundary is architecturally cheap — it avoids needing the
  entire MVP-006 quarantine/scan pipeline for suggestion intake, since no
  file ever enters the system through this path.
- **Candidate lifecycle to evaluate** (not approved enum values): SUBMITTED,
  UNDER_REVIEW, PLANNED, DECLINED, DUPLICATE, COMPLETED.

**One relevant, real architectural fact worth recording here**: this
session's own separate monetization audit
(`docs/research/monetization/10-current-architecture-inventory.md`)
already found the notification/consent architecture (`ConsentRecord`,
`EmailSend`, both real, working, append-only) to be the most-ready piece
of infrastructure in the platform for exactly this kind of "capture an
optional contact and a consent-to-be-contacted flag" pattern — a
suggestion form's "consent to be contacted" field would fit naturally
against that existing `ConsentCategory` pattern rather than needing new
consent infrastructure from scratch, *if* this capability is ever approved.
This is an observation for a future scoping pass, not a design decision.

## Downstream impact — the ten required questions, answered directly

1. **Which creator/seller capabilities disappear?** Every third-party-facing
   one: application/agreement/identity capture, public creator profile,
   creator-facing submission and moderation queue as currently scoped,
   commission, payouts (manual or automated), seller onboarding/agreements,
   creator-specific pricing controls, creator suspension/revocation as a
   third-party concept, creator support commitments, multi-seller dispute
   handling. All of it was documentation-only, so nothing needs to be torn
   out of running code or the database.

2. **Which first-party product-authoring capabilities remain necessary?**
   Everything FR-009 already named, reassigned to ADMIN: create/edit
   products, file upload (via the already-built MVP-006 pipeline),
   release/version management, license-option setting, pricing (once
   approved), compatibility-evidence recording, an internal quality-review
   step if kept, publish/unpublish/retire, and documentation/screenshots/
   changelog maintenance. This is MVP-012's scope, substantively unchanged.

3. **Does MVP-012 still require MVP-011 as a dependency?** No. Its real
   dependency becomes MVP-006 (Done) plus the already-existing ADMIN
   authorization pattern (no new story required for that part) — if
   anything, MVP-012 becomes *more* immediately actionable than it was
   under the creator model, not less, since it no longer waits on a
   multi-step external-application flow.

4. **Does MVP-013 still require a creator-submission queue, or should it
   become first-party publication review?** This is the one genuinely
   open fork this analysis surfaces rather than resolves. Two real
   readings exist: (a) it becomes a lightweight internal QA/self-review
   gate before an ADMIN-authored product publishes, structurally similar
   to a second-pair-of-eyes check; or (b) it is retired entirely, on the
   reasoning that an ADMIN publishing their own product doesn't need a
   formal "moderation queue" distinct from just... publishing carefully.
   A third possibility — it becomes the review surface for the new
   *suggestion* inbox (§ above) instead of for products — is also
   plausible given the instruction's own framing. **This analysis does
   not pick one; it is the clearest single decision the follow-up pass
   needs to make.**

5. **Does the creator-application review-surface gap disappear?** Yes.
   This session earlier flagged (in an unrelated status-check turn) a gap
   where nothing in the backlog owned building the creator-application
   *review* surface distinct from MVP-013's product-submission review —
   that gap was specifically about a mismatch between the Q2 creator
   lifecycle (applicant → under review → approved...) and MVP-013's scope.
   With no creator lifecycle, that specific mismatch has nothing left to
   be a mismatch *about* — it disappears along with the lifecycle it was
   describing a gap in.

6. **Which open questions become irrelevant?** Item 8 (creator commercial
   terms/payout model) becomes obsolete outright. Item 51 (MVP-011's
   legal-entity/conflict-of-interest gate) becomes moot *for MVP-011
   specifically*, though the underlying legal-entity question may still
   matter for first-party commercial launch generally — not the same as
   fully irrelevant. Item 24's `/creators/[handle]` half and item 26's
   creator-ownership disposition become moot; the rest of both items
   (Collections; price/screenshots/prerequisites/accessibility-statement/
   changelog dispositions) are unaffected. Item 7 is narrowed, not
   eliminated — first-party pricing still needs resolving.

7. **Which database models or planned models are no longer needed?**
   `CreatorProfile`, `CreatorApplication`, `AgreementAcceptance`,
   `ProductSubmission` — none were ever built, so "no longer needed" here
   means "no longer worth building," not "needs removal." `ModerationReview`/
   `ModerationComment`/`TakedownCase` depend on question 4's resolution —
   if MVP-013 becomes first-party self-review, a much lighter model than
   originally scoped might suffice (or none at all, if publish-directly is
   the chosen path); if it becomes the suggestion-review surface, a
   differently-shaped model applies. `SupportPolicy` and
   `CompatibilityRecord` are unaffected and stay exactly as built.

8. **Which requirements need wording changes?** FR-008 needs full
   retirement or rewrite (it cannot describe a first-party model as
   written). FR-009 needs "creator portal" reworded to first-party/admin
   authoring language, substance otherwise unchanged. FR-010 needs its
   scope clarified per question 4's resolution. FR-003's "creator" field
   needs rewording to reflect single-publisher attribution (or removal of
   the field entirely, since "who published this" has only one possible
   answer on a first-party platform).

9. **Which traceability rows need updates?** `planning/requirement-traceability.csv`'s
   FR-008 row (currently `MVP-011,E2E creator application,TBD`) needs
   updating once FR-008 itself is reworded/retired. FR-003's row (which
   names "MVP-011 (creator ownership)" as part of its traceability chain)
   needs the creator-ownership reference removed or reworded to reflect
   single-publisher attribution — the rest of that row (MVP-005, MVP-007
   for price, the PROP-001 through PROP-005 proposals) is unaffected.

10. **What becomes newly unblocked?** This is the most consequential
    finding of this entire analysis: **MVP-012 (Product and release
    editor)** — previously blocked on MVP-011's entire creator-application
    flow — becomes reachable as soon as its dependency is formally revised
    to MVP-006 (already Done) plus ADMIN authorization (already built).
    That in turn makes **MVP-013, MVP-014** reachable sooner than the
    original wave sequencing implied, once question 4's fork is resolved.
    **MVP-007 (Checkout)** is unaffected in its own remaining blockers
    (open questions 3 and 7 still need answers, now scoped to first-party
    pricing/tax only, with the creator-payout half of question 7's
    framing moot) but benefits from a simpler mental model — one seller,
    not a multi-vendor split-payment system, which is exactly the
    complexity `docs/09-marketplace-operations.md`'s original deferral
    language was already trying to avoid taking on early.

## Documentation updates that would be required after approval

Not performed in this pass — listed so the follow-up documentation PR has
an exact, pre-verified scope rather than needing its own discovery pass:

- `docs/02-prd.md`: FR-008 retired/rewritten; FR-009's "creator portal"
  reworded; FR-010's scope clarified per question 4; FR-003's creator field
  reworded; the "Creator" persona (line 7) either removed or reworded to
  reflect a "Suggester" persona if the suggestion capability is approved;
  core journey 3 (*"Creator applies, verifies profile, submits product and
  release..."*) rewritten to describe first-party authoring.
- `docs/01-brd.md`: stakeholder list's "creators/sellers" entry; MVP-scope
  bullet's "creator onboarding"; assumptions bullet about "manual creator
  payouts."
- `docs/03-trd.md`: the domain-boundary list naming "Creator" as one of
  twelve bounded domains — needs reconsideration (retire the domain, or
  rename/refocus it around first-party authoring + suggestions).
- `docs/04-information-architecture.md`: nav entries, `/creators/[handle]`
  and `/creator/*` route entries, "creator dashboard"/"creator application"
  page-inventory entries — all removed or replaced with first-party admin
  equivalents.
- `docs/05-ux-design-system.md`: the "creator badge" core component —
  removed or repurposed (e.g., a "published by LowCodeStacks" indicator, if
  any indicator is still wanted).
- `docs/06-data-model.md`: the "Creator and marketplace" section header and
  entity list rewritten to reflect only what's actually still needed
  (`SupportPolicy`, plus whatever question 4 resolves for moderation/review,
  plus the new suggestion model if approved).
- `docs/07-api-contracts.md`: the entire "## Creator" section
  (`POST /api/creator/applications` etc.) replaced with first-party admin
  authoring endpoints (already implied by MVP-012's real scope) and, if
  approved, a suggestion-intake endpoint.
- `docs/08-security-privacy-compliance.md`: "creator privilege escalation"
  threat, "creator agreement, IP warranty" trust/legal requirement,
  "creator beta" test-gate language — reconsidered for a first-party-only
  threat model (arguably a *smaller* threat surface, worth noting
  explicitly since it's a real security-posture simplification, not just a
  wording change).
- `docs/09-marketplace-operations.md`: the entire document is creator-
  lifecycle-centric and needs substantial rewriting — "Creator lifecycle,"
  "Submission checklist," "Moderation decision," "Support model," and
  "Multi-vendor payouts" sections all assume a third-party creator/seller
  model throughout.
- `docs/10-seo-content-growth.md`: "creator" as an indexable page type and
  "creator-attributed acquisition" metric — reworded or removed.
- `docs/11-test-strategy.md`: "creator submission" as a required E2E
  journey — reworded to first-party authoring flow.
- `docs/12-devops-runbook.md`: "creator workflow" in the P2 incident-severity
  example, "compromised creator account" in the runbook list — reworded
  (a compromised ADMIN account is a materially different, arguably more
  severe, incident class worth its own explicit runbook entry, not just a
  find-and-replace).
- `docs/13-implementation-readiness-plan.md`: the role list (Section 5),
  the wave-sequencing table (Section 8), and the `packages/domain/creator`
  folder reference (Section 3) — all need revision.
- `planning/mvp-backlog.csv`, `planning/backlog.csv`,
  `planning/requirement-traceability.csv`: MVP-011's row and FR-008's
  traceability row, per the recommended treatment above (not applied yet).
- `planning/github/01-epics.md`, `02-features.md`, `03-user-stories.md`,
  `04-bug-template.md`, `05-labels.md`: EPIC-07/FEAT-011/STORY-011a and
  every "creator" role reference in these planning templates.
- `packages/domain/creator/README.md`: retired (or repurposed for the
  suggestion capability, if approved) — this is the one placeholder file
  that would actually get touched, and only because it's a placeholder,
  not because anything real needs unwinding.
- `packages/domain/moderation/README.md`: revised per question 4's
  resolution.
- `schemas/product-metadata.schema.json`: the `support` enum's `"creator"`
  value — reconsidered alongside the `CREATOR_SUPPORTED`/`CREATOR_DECLARED`
  display-label question above.
- `.claude/skills/marketplace-review/SKILL.md`: its description ("Use for
  creator submissions and release moderation...") reworded per question
  4's resolution.

## Exact files that would change in the follow-up documentation PR

Consolidated list, for direct use when that PR is scoped:

```
docs/01-brd.md
docs/02-prd.md
docs/03-trd.md
docs/04-information-architecture.md
docs/05-ux-design-system.md
docs/06-data-model.md
docs/07-api-contracts.md
docs/08-security-privacy-compliance.md
docs/09-marketplace-operations.md
docs/10-seo-content-growth.md
docs/11-test-strategy.md
docs/12-devops-runbook.md
docs/13-implementation-readiness-plan.md
docs/open-questions.md               (items 2, 7, 8, 24, 26, 51 — close/narrow, not erase)
docs/final-decisions.md              (new dated entry recording the reversal; the superseded entry stays, not rewritten)
planning/mvp-backlog.csv             (MVP-011's row, per the reviewed recommendation)
planning/backlog.csv                 (mirrors the same change)
planning/requirement-traceability.csv (FR-008 and FR-003 rows)
planning/proposed-stories.md         (the "Creator → MVP-011" ownership line under "Items assigned to existing approved stories")
planning/status.md                   (the "next story recommendation" section, which currently names MVP-011 as a gated Ready candidate)
planning/github/01-epics.md
planning/github/02-features.md
planning/github/03-user-stories.md
planning/github/04-bug-template.md
planning/github/05-labels.md
packages/domain/creator/README.md
packages/domain/moderation/README.md (pending question 4's resolution)
packages/domain/catalog/src/compatibility.ts   (display-label wording only, pending a separate decision — not a data-model change)
packages/domain/catalog/src/support.ts         (same)
schemas/product-metadata.schema.json           (pending the same label decision)
.claude/skills/marketplace-review/SKILL.md
```

## What this analysis explicitly did not do

No backlog status was changed. No file listed above was modified. No open
question was closed or rewritten. `docs/final-decisions.md` was not
touched. No suggestion-capability schema, UI, or workflow was implemented
or even fully specified — only the candidate categories/fields/lifecycle
already given in the authorizing instruction are reproduced, with one
architectural observation about existing consent infrastructure added,
nothing more. No production code changed.
