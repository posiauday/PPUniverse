# Final Decisions

Binding, business/technical decisions issued directly by the product owner that resolve items `docs/open-questions.md` previously left open, or that narrow/clarify `CLAUDE.md`'s suggested baseline into a specific, final choice. Per `docs/00-document-index.md`, this document sits below `CLAUDE.md` and above BRD/PRD/TRD/ADRs/Backlog in source-of-truth priority: **CLAUDE.md → Final Decisions → BRD → PRD → TRD → ADRs → Backlog.** Where a decision here is more specific than BRD/PRD/TRD language, this document controls for implementation purposes without requiring those higher-governance documents to be rewritten first — they should be brought into alignment opportunistically, not blocked on.

Each entry is dated and records what it resolves. Entries are never silently edited — a changed decision gets a new dated entry that supersedes the prior one, with the prior one struck through, not deleted (matches ADR practice).

## 2026-09-17 — MVP scope and architecture constitution

Issued directly by the product owner in chat, consolidating and finalizing several previously-open items.

### MVP scope (final)
The MVP is a **Power Platform Marketplace only**, covering exactly:
- Power Apps Components
- Power Apps Templates
- Power Automate Templates
- Power BI Templates
- Architecture Blueprints
- Governance Assets
- Creator Marketplace (creator onboarding, submission, moderation, storefront)

**Explicitly excluded** (confirms and sharpens `docs/01-brd.md` §6 "Out of scope"): Forums, Community (beyond what's needed for reviews/creator identity), Courses, Certifications, AI Architect (any AI-assisted solution-design feature), Tenant Analytics (any tenant-wide scanning/analytics product), Agents (any autonomous-agent feature), Social Features (feeds, follows, messaging), Mobile Apps (native). `docs/01-brd.md`'s existing exclusion list (forums, courses, certifications, hackathons, tenant-wide scanners, AI solution architect, native mobile apps, etc.) already matches this closely — checked against the current backlog (`planning/mvp-backlog.csv`) and PRD (`docs/02-prd.md`) on 2026-09-17: no story or requirement currently in scope violates this list. Any future story proposing one of these must be rejected or escalated as an explicit scope-expansion decision, not quietly built.

### Architecture (final)
Modular Monolith. Confirms `docs/adr/004-technology-decision-record.md`'s existing decisions and adds/resolves the following:

| Concern | Final decision | Status vs. prior ADR-004 |
|---|---|---|
| Monorepo tooling | Turborepo + **pnpm only** (no other package manager) | Already decided; "pnpm only" now explicit |
| Web framework | Next.js + TypeScript | Already decided |
| Database | PostgreSQL — **portable**, hosted on Supabase for now but the app must not depend on Supabase-specific features (PostgREST, `auth.uid()`/JWT claims, edge functions, etc.) | Already decided (Postgres); "portable, not Supabase-locked" now explicit — see RLS note below |
| ORM | Prisma 7 | Already decided |
| Auth | Auth.js, **Magic Link only** for MVP | Already decided and built (MVP-002) |
| UI | Tailwind CSS + shadcn/ui | ADR-004 said "Radix UI primitives + Tailwind CSS" — shadcn/ui *is* Radix + Tailwind, packaged as copy-in components rather than a library dependency. Not a conflict, just more specific. **Not yet installed** — apps/web currently has only minimal hand-written CSS (`apps/web/app/globals.css`, MVP-002 baseline). Adopt starting with the next UI-heavy story (MVP-003 Catalog); no retrofit of MVP-002's two small pages required, but do not add more hand-written CSS beyond what already exists. |
| API style | REST + OpenAPI compatibility | New — not yet implemented. No OpenAPI spec exists yet for MVP-002/006's routes. Adopt starting with the next story that adds meaningful API surface; backfilling MVP-002/006's existing routes into the spec is acceptable to do incrementally rather than blocking on it retroactively. |
| Testing | Vitest (done) + **Playwright** for E2E | Playwright not yet configured (`CLAUDE.md` already flagged this as pending). Set up when the first story needs a real browser journey to test (likely MVP-003 or later, once there's a UI worth E2E-testing). |
| Storage | **Cloudflare R2** (production), **MinIO** (development) | ADR-004 left the vendor open (open question 5, partially). MinIO already implemented and working (MVP-006, S3-compatible `StorageAdapter`). R2 is S3-API-compatible, so the existing `S3StorageAdapter` needs no code change — only production config (endpoint, credentials) when that environment exists. **Resolves `docs/open-questions.md` item 5's storage-vendor portion.** |
| Payments | Stripe | Already decided (ADR-004), not yet built (MVP-007/008) |
| Email | **Resend** | ADR-004 left the vendor open. **Resolves `docs/open-questions.md` item 19.** Not yet built (MVP-018); `ConsoleEmailAdapter` remains the dev/test implementation until then. |
| Observability | **Sentry** (error monitoring) + **PostHog** (product analytics) | ADR-004 left error-monitoring vendor open; PostHog is new. Not yet built (MVP-022). |
| Malware scanning | **ClamAV** for development (already implemented, MVP-006), **asynchronous production scanning service** to follow later | Confirms MVP-006's dev implementation as correct and directly validates `planning/tech-debt/TD-004.md`'s finding (synchronous in-request scanning is explicitly a dev-only interim state, not the intended production shape) — TD-004 stays open until the async production service and its owning story exist. |
| Row Level Security | **Approved and must be implemented** (PostgreSQL RLS, portable — not Supabase-specific `auth.uid()`/PostgREST policies) | **Resolves `docs/open-questions.md` item 16 and `planning/tech-debt/TD-003.md`.** See the RLS implementation note below for the concrete approach taken and why. |

#### RLS implementation note
The app connects to Postgres via a direct connection string through Prisma (never through Supabase's PostgREST/`supabase-js`/anon-key path), so the standard Supabase RLS pattern (`auth.uid()` reading a PostgREST JWT claim) does not apply and would violate the "not dependent on Supabase-specific features" portability requirement above. Given no legitimate PostgREST/anon/authenticated access path exists or is planned, the correct and simplest implementation is: **enable RLS on every table with zero policies defined** — standard PostgreSQL enforces default-deny for any role without `BYPASSRLS`/ownership once RLS is enabled, using only standard `ALTER TABLE ... ENABLE ROW LEVEL SECURITY` DDL (fully portable, no Supabase-specific syntax). The application's own Postgres role (table owner) is unaffected, since Postgres table owners bypass RLS by default. This closes exactly the exposure `planning/tech-debt/TD-003.md` and Supabase's advisor flagged (anon-key/PostgREST access to every row) without requiring a session-variable-passing mechanism through Prisma, since the app never needs the restricted roles to have any access at all. **Caveat for later**: if a future production database role for the app itself is deliberately scoped to *not* be the table owner (principle of least privilege), that role will need explicit `GRANT`s or its own permissive policies — not yet relevant since the production hosting/role decision is still open (`docs/open-questions.md` item 5, hosting portion).

### Process (final)
- **Branching**: never work directly on `main`. Use a `develop` branch for integration and feature branches for individual stories, merged via PR. **Correction needed**: this session pushed two commits (MVP-002, MVP-006 work) directly to `main` before this decision was issued — those commits are not being reverted (the work is correct and verified), but a `develop` branch is being created from that point forward and this session is switching to the feature-branch model for all subsequent work, per this decision.
- **AI-session collision avoidance**: before starting any new work, check `planning/status.md`'s "Last updated" line, `git log`, and open pull requests to detect unpushed/uncommitted work from another session before proceeding. This directly addresses a real near-miss this session encountered (MVP-006 was found already fully implemented by a separate, already-ended session with no coordination — see `planning/progress-report.md`'s MVP-006 provenance note).
- **Definition of Done additions** (beyond what `CLAUDE.md` already states): never trust client-side authorization or payment-success pages (server must independently verify); never bypass file scanning. Both are already true of MVP-002/MVP-006's existing implementation (see their security reviews in `planning/progress-report.md`) — recorded here as an explicit, permanent rule for all future stories, not a retroactive finding.

### Source-of-truth priority (final)
`CLAUDE.md` → **Final Decisions (this document)** → BRD → PRD → TRD → ADRs → Backlog. Recorded in `docs/00-document-index.md`.

## 2026-09-18 — License tiers locked; frontend state-management order; REST confirmed

Issued directly by the product owner in chat, via a relayed handoff document (originating from another AI session/tool). Persisted here after independent verification against existing tracking — one item was explicitly re-confirmed with the product owner before being recorded as final, since the relayed document presented it as already-locked when this repo's own tracking still showed it open (see the confirmation note below).

### Marketplace licensing (final — resolves `docs/open-questions.md` item 7's tier structure)
Three license families, confirmed final by the product owner after this session flagged the discrepancy (the relayed document presented this as already-decided; `docs/open-questions.md` item 7 still listed it open, so it was not accepted without direct confirmation):
- **Personal** — single user, individual use.
- **Team** — small team usage, shared organizational use.
- **Enterprise** — organization-wide use, custom commercial agreements possible.

Exact pricing, seat limits, and contract terms are explicitly **not** locked by this decision and may still evolve — only the three-tier structure itself is final. Every product must still define License Type, Version, Compatibility, and Support Policy before publication (already a BRD business rule, `docs/01-brd.md` §7). Maps onto the existing `LicenseDefinition`/`ProductLicense` entities in `docs/06-data-model.md` (not yet built — MVP-005/MVP-007's scope) rather than requiring a data-model change now.

### Frontend state management (final, new — not previously decided)
Preference order, most-local-first: **1. Server Components → 2. Local React state → 3. TanStack Query → 4. Zustand (only if the first three genuinely don't fit)**. Not yet exercised by any built story (MVP-002/006 have no meaningful client-side state); applies starting with the next story that needs it.

### API style (confirmed, sharpened)
REST only — no GraphQL. Consistent with and sharpens this document's 2026-09-17 entry ("REST + OpenAPI compatibility"), which didn't explicitly rule out GraphQL; now explicit.

### Note on relayed decisions
This entry originated from a document the product owner received from a separate AI tool (referred to as "Copilot" in this session) and pasted in for recording. Per this session's standing practice, nothing from a relayed document is treated as authoritative without checking it against this repo's actual tracked state first — the license-tier item is the concrete example: it would have silently contradicted `docs/open-questions.md` if accepted at face value. Future sessions should apply the same check to anything arriving via a relayed document rather than trusting its "LOCKED"/"approved" framing on its own.

## 2026-09-21 — Product compatibility model (closes open question 6, part 1)

**Source: direct product-owner instruction, given in chat on 2026-09-21.** Recorded here so this document, not the chat message or any handoff, is the approval source from this point on.

### Approved compatibility model
A product may have one or more compatibility entries. Every entry carries:
- **Platform Area** — one of: Power Apps, Power Automate, Power BI, Dataverse, Power Pages, Copilot Studio, Microsoft Fabric. Architecture and Governance are marketplace *categories*, not Power Platform runtime areas, and are **not** compatibility platform areas unless a later product-owner decision explicitly approves that. The compatibility areas are independent of the six locked asset categories; approving them does not add product categories.
- **Minimum Supported Release Wave** — structured as **Release Year** plus **Release Wave Number**, never one uncontrolled display string. Shown to users as e.g. "2025 release wave 2". There is no hardcoded per-year list, so a new year never needs a migration. Validation: the year is within a reasonable supported range, the wave is 1 or 2, and a release wave cannot exist without a platform area. Meaning: the *earliest* release wave for which the product **claims** compatibility — never presented as proof that it works with every later release.
- **Compatibility Notes** (when applicable) — concise, factual, sanitized text for additional requirements and limitations not modeled as structured flags (e.g. requires Dataverse; premium connectors; Power BI Pro; Fabric capacity; on-premises data gateway; environment-maker permissions; commercial-cloud-only testing; sovereign-cloud not verified; model-driven app; custom connector). These examples must **not** become boolean columns in MVP-005; a future story may introduce structured requirement flags once real marketplace inventory shows which requirements need filtering.
- **Evidence Status** — exactly three approved states:
  - **Tested** — compatibility was tested using a documented environment or repeatable verification process.
  - **Creator Declared** — the creator supplied the claim, but the marketplace has not independently verified it.
  - **Not Verified** — no sufficient verification evidence is available.
- **Evidence Summary** and **Last Verified Date** — both required when the status is Tested; the date is recorded when compatibility has been tested or reviewed. Evidence text must never expose private test-environment details, credentials, tenant identifiers, customer information, or internal operational data.

### Claims that must not be made
Compatibility is never presented as a guarantee without evidence. The labels "Microsoft Certified", "Microsoft Approved", "Officially Supported" and "Marketplace Verified" must not be displayed unless a separate documented process and explicit product-owner approval exist for that specific claim.

### Product-page presentation
An accessible compatibility matrix (or equivalent semantic section) with columns Platform Area, Minimum Release Wave, Evidence Status, Last Verified, Notes (an unverified entry reads "Not independently verified" under Last Verified). Status is never conveyed by color alone; labels are visible text; semantic headings and table markup; readable on mobile (any horizontal scroll region is keyboard-accessible and labeled); meaningful empty/unavailable states; nothing essential inside hover-only tooltips.

### Empty and legacy data
No compatibility data is invented and no `Product` rows are seeded. A product with no compatibility entries shows exactly: "Compatibility information has not yet been provided." The schema is additive and backward compatible with existing `Product` rows; no destructive migration.

### Filtering
The structured Platform Area and Release Year/Wave fields must support future filtering, but MVP-005 builds **no** filtering UI. Filtering stays owned by MVP-004 and any approved follow-up; completed MVP-004 behavior is not reopened without an explicitly approved extension. MVP-005 may expose the repository/query fields future filters need.

### Explicitly excluded from MVP-005
No structured fields for: Dataverse/premium-connector/gateway/Fabric requirements, environment type, commercial/sovereign/government cloud, required Power Platform license, required administrator role, connector-specific, browser or operating-system compatibility (all remain free text in Compatibility Notes). And no pricing, taxes, currencies, refund rules, team seat limits, enterprise contract terms, checkout, product analytics, collections, or creator-profile routes.

### Engineering defaults applied within the latitude the instruction delegated
Not product decisions; recorded so they are visible and reversible:
- "Reasonable supported range" for the release year: the database enforces a deliberately wide static bound (2019–2100, so no per-year migration), and application-level validation is tighter (2019 through current calendar year + 2). 2019 is the earliest Microsoft release-wave year and was chosen as the floor; adjust if the product owner prefers otherwise.
- At most one compatibility entry per (product, platform area): "minimum supported" is a single value per area, so a second entry for the same area would contradict it. Dropping this uniqueness later is a safe change; adding it after duplicates exist would not be.
- Notes and evidence summaries are capped at 500 characters.

### What this does and does not close
- **Open question 6, part 1 (supported versions / compatibility model): CLOSED.**
- **Part 2 (evidence method): the evidence-status vocabulary and Tested's required fields are approved above, but who may assign each status and what review a moderator performs are not decided** — that workflow belongs to MVP-012/013 and remains open.
