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
| Testing | Vitest (done) + **Playwright** for E2E + **axe-core** and **@axe-core/playwright** for automated accessibility checks (added 2026-09-21, MVP-023 decision Q41) | Playwright not yet configured (`CLAUDE.md` already flagged this as pending). Set up when the first story needs a real browser journey to test (likely MVP-003 or later, once there's a UI worth E2E-testing). |
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

> **Partly superseded on 2026-09-21 by the entry "Product-owner responses to MVP-005 open items; MVP-021 authorization" below.** The evidence-status vocabulary in this entry (Tested / Creator Declared / Not Verified) is replaced for current marketplace publication by **Creator Declared** and **Marketplace Reviewed**, and **Tested is reserved**. Read that entry before applying anything from the "Evidence Status" or "Product-page presentation" parts of this one. Everything else here (platform areas, structured release wave, notes, prohibited labels, empty-state wording, exclusions) stands.

### Approved compatibility model
A product may have one or more compatibility entries. Every entry carries:
- **Platform Area** — one of: Power Apps, Power Automate, Power BI, Dataverse, Power Pages, Copilot Studio, Microsoft Fabric. Architecture and Governance are marketplace *categories*, not Power Platform runtime areas, and are **not** compatibility platform areas unless a later product-owner decision explicitly approves that. The compatibility areas are independent of the six locked asset categories; approving them does not add product categories.
- **Minimum Supported Release Wave** — structured as **Release Year** plus **Release Wave Number**, never one uncontrolled display string. Shown to users as e.g. "2025 release wave 2". There is no hardcoded per-year list, so a new year never needs a migration. Validation: the year is within a reasonable supported range, the wave is 1 or 2, and a release wave cannot exist without a platform area. Meaning: the *earliest* release wave for which the product **claims** compatibility — never presented as proof that it works with every later release.
- **Compatibility Notes** (when applicable) — concise, factual, sanitized text for additional requirements and limitations not modeled as structured flags (e.g. requires Dataverse; premium connectors; Power BI Pro; Fabric capacity; on-premises data gateway; environment-maker permissions; commercial-cloud-only testing; sovereign-cloud not verified; model-driven app; custom connector). These examples must **not** become boolean columns in MVP-005; a future story may introduce structured requirement flags once real marketplace inventory shows which requirements need filtering.
- **Evidence Status** — exactly three approved states:
  - **Tested** — compatibility was tested using a documented environment or repeatable verification process. *(2026-09-21: reserved and unavailable for assignment; the future Tested program is deferred — see section B of the later entry.)*
  - **Creator Declared** — ~~the creator supplied the claim, but the marketplace has not independently verified it.~~ *(2026-09-21: definition superseded by section B of the later entry.)*
  - **Not Verified** — no sufficient verification evidence is available. *(2026-09-21: not addressed by the statuses decision in section B of the later entry — open question 27.)*
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

### Implementation record (MVP-005, 2026-09-21) — engineering choices for product-owner review
The model above was implemented as approved. The following are choices made *within* it, not product decisions; each is reversible and listed so they can be reviewed or overridden:
- **Wording that was not specified.** The product owner supplied exact wording only for the compatibility empty state and the "Not independently verified" label. The other empty states — "License information has not yet been provided.", "Version information has not yet been provided.", "Support information has not yet been provided." — follow the same pattern but are this story's own wording. So are the sentence explaining that the minimum release wave is a claim rather than proof, and the "What the evidence statuses mean" heading. The three evidence-status definitions are the approved text, verbatim.
- **Evidence summary placement.** The summary is shown beneath the status label inside the Evidence Status cell rather than as a sixth column, so the matrix keeps exactly the five approved columns.
- **Version.** Modeled as a minimal `Release` record (version string + publish time), not a product field, because FR-011 makes versions release-scoped. The page shows the newest *published* release; unpublished releases are never shown. Immutability, files and changelog remain MVP-012/014.
- **Support.** Uses the four statuses already documented in `docs/09-marketplace-operations.md` (Creator-supported, Platform-supported, Community-supported, Unsupported), with a channel required unless the product is Unsupported. No response-time targets are modeled (open question 12).
- **License.** The three locked tiers (Personal, Team, Enterprise) are seeded as reference data, sanctioned by `docs/13-implementation-readiness-plan.md`; a product lists one or more. No pricing, seat limits or contract terms are modeled (open question 7).
- **Support channel links.** A channel is rendered as a link only if it is a plain `http(s)` URL with no embedded credentials; anything else (including `javascript:`, `mailto:` and free text) is shown as plain text.
- **Private-data protection is display-time only for now.** Invisible and spoofing characters are stripped and markup is escaped, but write-time rejection of tenant identifiers, credentials and similar content is not built because no write path exists yet — see `planning/tech-debt/TD-006.md`.


## 2026-09-21 — Product-owner responses to MVP-005 open items; MVP-021 authorization

**Source: direct product-owner instruction, given in chat on 2026-09-21.** Recorded here so this document is the approval source. These decisions are not to be reopened unless the product owner explicitly changes them.

### A. Product-page wording — APPROVED AS WRITTEN
The wording proposed in the MVP-005 implementation record is approved: the license, version and support empty-state sentences; the release-wave explanation; the compatibility legend heading; and the compatibility evidence explanations. **This closes the wording review** raised in "Implementation record (MVP-005)" above.

Requirements that continue to bind all product-page wording:
- Factual and neutral. Never imply certification, guarantee, Microsoft approval, independent testing or official endorsement.
- Never invent missing product information. Empty states say clearly that the information has not been provided.
- Essential information is never communicated by colour alone.
- Any future *material* wording change is recorded as a content or product decision.

Where this approval and section B conflict on the evidence-status vocabulary or definitions, **B controls** (later and more specific on that topic). The conflicts are listed under "Conflicts and gaps flagged" below.

### B. Evidence status — who may assign "Tested" (closes open question 6, part 2 for the current MVP)
**"Tested" is NOT approved for general creator or moderator assignment at this stage.** For the current MVP:
- Creators assign or submit compatibility as **Creator Declared**.
- Moderators may change the publication state to **Marketplace Reviewed** after reviewing the claim.
- Creators cannot assign Marketplace Reviewed. Moderators cannot assign Tested.
- The platform must not automatically infer Tested. Existing data must not be migrated to Tested.
- No user-facing "Tested" badge or filter is introduced.

**Approved statuses for current marketplace publication (only these two):**
1. **Creator Declared** — the compatibility information was supplied by the creator and has not been independently certified by the marketplace.
2. **Marketplace Reviewed** — a moderator reviewed the submitted compatibility statement for completeness, plausibility, prohibited claims and publication readiness.

**Marketplace Reviewed does not mean:** independently tested; certified; guaranteed; Microsoft approved; Microsoft certified; officially supported; verified compatible.

**Existing `TESTED` enum value:** do not remove it destructively (not during MVP-021). Treat it as **reserved and unavailable for normal assignment**. Do not display it unless valid historical data already exists and its provenance is documented. Technical debt is created to reconcile it (TD-008).

**The future "Tested" program is DEFERRED, NOT APPROVED.** Before Tested can be used, a product-owner decision must define: who performs testing; the required test procedure; required environment information; evidence retention; retesting frequency; expiration rules; the version and release-wave relationship; moderator responsibilities; public wording; and liability and disclaimer language.

### Conflicts and gaps flagged while recording B (not resolved here — open questions 27 and 28)
*(Later the same day, items 2, 4 and 5 below were resolved by the entry "Product-owner decisions for MVP-021": Not Verified is legacy/reserved and not assignable; Marketplace Reviewed is a per-claim evidence status; a reviewed-at timestamp is approved. Items 1 and 3 remain and are reconciled by TD-008.)*
1. **The merged MVP-005 implements the earlier vocabulary.** The database enum is `TESTED`, `CREATOR_DECLARED`, `NOT_VERIFIED` with no `MARKETPLACE_REVIEWED`; `validateCompatibilityEntry` accepts `TESTED`; the on-page legend defines Tested, Creator Declared and Not Verified. No product or compatibility data exists yet, so nothing user-visible is wrong today, but the legend would show "Tested" as soon as any compatibility row exists. Reconciliation is **TD-008**, outside MVP-021's scope, and does not change MVP-005's Done status.
2. **"Not Verified" is not addressed by B.** The earlier approval defined it as "no sufficient verification evidence is available"; B lists only Creator Declared and Marketplace Reviewed as approved for current publication. Whether Not Verified remains valid is undecided. It is treated as neither removed nor newly approved.
3. **"Creator Declared" now has two wordings.** Earlier: "The creator supplied the claim, but the marketplace has not independently verified it." B: "...has not been independently certified by the marketplace." B is later and controls when the legend is reconciled.
4. **"Publication state" vs "evidence status".** B says moderators "change the publication state to Marketplace Reviewed". It is recorded here as a per-compatibility-entry *evidence status* (B lists it among the "approved statuses"), not as `Product.status` (DRAFT/PUBLISHED). To be confirmed.
5. **No reviewed date or reviewer display is defined.** Marketplace Reviewed is not verification, so the "Last Verified" column cannot show a date for it. Until decided, no reviewed date is displayed.

### C. Remaining FR-003 product-detail items — dispositions
**Do not expand MVP-005 or MVP-021 to implement the remaining FR-003 items.** They need explicit ownership in future backlog stories.

| Item | Disposition |
|---|---|
| Creator | Assigned to **MVP-011** (Creator applications) for creator identity and creator-profile *ownership*. Public creator-page routing remains unresolved under open question 24 and must not be built unless approved. |
| Screenshots | Future **Product Media and Screenshots** story (proposed). |
| Demo | Same proposed story. A demo may be a supported external link or an approved media type; the allowed format needs a later decision. |
| Price | Assigned to **MVP-007** (Checkout), together with the pricing, currency, tax and refund decisions required first. No offers in structured data before price is modeled and approved. |
| Prerequisites | Future **Product Documentation and Prerequisites** story (proposed). |
| Setup instructions | Same proposed story. |
| Accessibility statement | Future **Product Accessibility Disclosure** story (proposed). MVP-023 owns *platform* accessibility validation, not creator-product accessibility declarations, unless its approved scope explicitly says otherwise. |
| Changelog | Future **Product Releases and Changelog** story (proposed). |
| Version history | Same proposed story. |
| Related assets | **Deferred** until enough real inventory exists and a recommendation or relationship rule is approved. No fabricated relationships and no behavioral recommendations. |

Proposals are recorded in `planning/proposed-stories.md` with status **Proposed** — not approved, not Ready, and not counted on the board — until the product owner directly approves each one. Open question 26 carries this disposition.

### MVP-021 authorization and scope
MVP-021 is authorized to proceed to its pre-work analysis and remains limited to **FR-017**: canonical URLs, page metadata, Open Graph metadata, Twitter social-preview metadata, sitemap, robots directives, and structured data only where valid. No application code is written until the pre-work analysis has been delivered.

### Site base URL: `NEXT_PUBLIC_SITE_URL` (approved variable name)
The canonical public site origin is a web/SEO concern and **must not reuse `NEXTAUTH_URL`**, which is authentication-specific.
- Require an absolute **HTTPS** URL in production. Permit localhost HTTP only in development and test.
- Normalize the value to avoid duplicate trailing-slash behavior.
- Never infer the production domain. Never hardcode a production domain while the product name and domain remain unresolved (open question 1).
- Add it to `turbo.json` `globalPassThroughEnv`, and add a documented placeholder to `apps/web/.env.example`.
- If it is missing in production, **fail safely** rather than emit incorrect canonical URLs.
- It is a public origin, not a credential; no secret is exposed through it.

### Structured data (schema.org) for MVP-021
- **Product** structured data only on published product-detail pages, only where the available data validly supports it, and only with fields backed by real published data (for example name, description, url, category, and version or release information when accurately modeled).
- **Never include:** offers, price, priceCurrency, aggregateRating, review, a brand implying Microsoft ownership, certification, endorsement, availability, seller, creator identity (unless approved public creator data exists for that purpose), or compatibility claims that cannot be represented accurately.
- Home and category-listing pages: do not force Product. Use WebSite, WebPage, CollectionPage or BreadcrumbList only when the page content and available data validly support the type. The selected types and rationale are recorded in the pre-work analysis before implementation.
- **JSON-LD security:** generate from typed, server-controlled objects; serialize with `JSON.stringify` (or the repository-approved equivalent); escape `<` as `\u003c` before inserting into a script element; never concatenate untrusted strings into JSON-LD; never use raw creator-supplied HTML; add tests proving malicious product text cannot terminate the script element.

### Indexing boundary for MVP-021
- **Indexable:** the home page, published category-listing pages, published product-detail pages.
- **Noindex or excluded:** search pages; sign-in and authentication pages; account pages; creator-administration and admin pages; API routes; draft, suspended and unpublished products; internal preview routes; error pages where applicable.
- **The sitemap contains only:** indexable static public pages, real seeded categories intended for public indexing, and real `PUBLISHED` products. Never DRAFT, suspended, archived, rejected or fabricated products.
- No fake inventory is seeded for sitemap testing. Tests may create isolated product records and clean up only what they created. Seeded categories are never deleted or mutated as test cleanup.


## 2026-09-21 — Product-owner decisions for MVP-021 (empty categories, canonical policy, Product JSON-LD, evidence-status correction)

**Source: direct product-owner instruction, given in chat on 2026-09-21.** This message is the explicit approval; earlier recommendations and handoff text are not the approval source. These decisions close open questions 29, 30 and 31 and update open question 28. Not to be reopened unless the product owner explicitly changes them.

### Q29 — Empty category indexing (closes open question 29)
A category with **zero PUBLISHED products must not be indexed and must not appear in `sitemap.xml`.**
- The category page stays publicly reachable and emits `noindex, follow`. It does **not** return 404 merely because it is empty.
- Only PUBLISHED products count. DRAFT, suspended, rejected, archived and otherwise unpublished products never make a category non-empty.
- No products are fabricated to make a category indexable.
- Once a category has at least one PUBLISHED product it may become indexable and appear in the sitemap.
- Indexability is **derived from current published inventory**, not maintained through a manually edited flag, unless an approved requirement later introduces one.

### Q30 — Category canonical and pagination policy (closes open question 30)
| URL | Behavior |
|---|---|
| Base — `/categories/power-apps` | `index, follow`; self-canonical to the base URL; eligible for the sitemap when it has at least one PUBLISHED product |
| Paginated — `?page=2` | `index, follow` when the page exists and contains PUBLISHED products; self-canonical to the exact valid URL including `page=N`; **not** canonicalized back to page 1; `page=1` is normalized to the base URL; invalid, zero, negative, non-numeric or out-of-range `page` values must never produce an indexable duplicate; paginated URLs join the sitemap only if there is a clear, tested need to enumerate them — otherwise the base category page only |
| Search — `?q=button` | `noindex, follow`; canonical to the clean base URL; excluded from the sitemap |
| Sort-only — `?sort=newest` | `noindex, follow`; canonical to the clean base URL; excluded from the sitemap |
| Filter variants | `noindex, follow` (unless a future SEO landing-page story explicitly approves indexable filter combinations); canonical to the clean base URL; excluded from the sitemap |
| Mixed — pagination with search, sort or filter | `noindex, follow`; canonical to the clean base URL; excluded from the sitemap |

**Ownership:** the previously delivered MVP-004 metadata behavior (which canonicalized every variant to the base URL) is updated **only where required** to implement this policy. This is an **intentional corrective SEO change owned by MVP-021, not a reopening of MVP-004.** MVP-004's search and filtering functionality is not modified.

**Required regression tests:** base category URL; `page=1` normalization; valid `page=N` self-canonical; `q`; `sort`; filter parameters; mixed parameters; empty category; out-of-range pagination.

**Engineering interpretations within the approved policy** (not stated by the product owner; reversible): any query parameter other than a single valid `page` — including `pageSize`, unrecognized or tracking parameters, and repeated parameters — marks the URL as a variant (`noindex, follow`, base canonical); the mere presence of `sort` (any value) is a sort variant; `?page=1` is `index, follow` with the base canonical; an empty category emits a self-canonical to its base URL; the page-range check uses the default page size.

### Q31 — Product JSON-LD (closes open question 31)
**Ship Product JSON-LD now**; do not defer it until pricing is modeled. It provides accurate machine-readable product information and **must not imply eligibility for any rich-result treatment.**
- **Only fields backed by real PUBLISHED product data.** Permitted: `@context`, `@type`, `name`, `description`, `url`, `category`, release/version information when accurately modeled, and `image` only when a real approved public product image exists.
- **Never included:** `offers`, `price`, `priceCurrency`, `availability`, `aggregateRating`, reviews, fabricated images, `seller`, unsupported creator identity, Microsoft as brand, Microsoft endorsement, certification, guaranteed compatibility, marketplace-verification claims, or any field whose value is missing or unresolved. **Unavailable properties are omitted entirely** — no empty objects, no placeholders.
- **Security:** built from typed server-side data; serialized with `JSON.stringify`; every `<` escaped as `\u003c` before it enters the script element; creator-provided values are never concatenated into script markup; a test must show malicious product text cannot terminate the script element or create another HTML element.
- **Documented, as required:** Product JSON-LD is emitted **without Offer data**; price and Offer data **must not be added** until pricing, currency, tax and checkout decisions are approved and implemented; **no rich-result eligibility claim is made.** (For reference: Google's Product snippet documentation requires `name` plus one of `review`, `aggregateRating` or `offers`, so this markup is not expected to be eligible.)

**Engineering interpretations** (reversible): version is expressed as a schema.org `additionalProperty` (`PropertyValue` named "Version") only when a published release exists, because `version` is not a Product property; `image` is omitted because no approved public product image exists; the JSON-LD is omitted entirely when the site origin is unavailable.

### Q28 and TD-008 — compatibility-evidence correction (updates open question 28)
- **TD-008 is not folded into MVP-021.** It is a separate, small corrective change that **must land before MVP-012 permits creators or administrators to write compatibility evidence** through the product editor. MVP-021 may read and represent existing valid product data for metadata, but does not own compatibility write behavior. TD-008 is not marked complete by MVP-021.
- **Approved assignable statuses:** Creator Declared; Marketplace Reviewed. (Marketplace Reviewed is a per-claim evidence status.)
- **"Not Verified" is not an assignable persisted status** and is not a third creator or moderator choice. Unreviewed compatibility information is represented as Creator Declared; absent information shows the approved empty state and no Not Verified record is created. Any existing Not Verified enum or database value is **legacy or reserved**: not removed destructively during MVP-021, not silently converted (provenance is inspected first), with cleanup and migration requirements recorded in TD-008.
- **Reviewed timestamp:** add or retain a nullable reviewed-at timestamp on compatibility claims, named per repository convention. It is null for Creator Declared claims; set **only** when a claim transitions to Marketplace Reviewed; assigned only by the trusted server-side moderation workflow and **never accepted from a creator or ordinary client request**; if a Marketplace Reviewed claim is materially changed by its creator, the future write workflow returns it to Creator Declared and clears the timestamp unless an approved moderation design says otherwise; never fabricated for existing records. A moderator identity or review reference may be *proposed* in TD-008 but is not added without reviewing the existing moderation schema and approved scope.
- TD-008 must define: the current schema inconsistency; the approved statuses; state-transition rules; reviewed-timestamp behavior; handling of legacy or reserved Not Verified values; authorization requirements; the migration and backward-compatibility approach; required tests; and the dependency on MVP-012 and MVP-013.
- **Resolves** items 2, 4 and 5 of "Conflicts and gaps flagged while recording B" in the earlier 2026-09-21 entry (Not Verified; per-claim status; reviewed date). Items 1 and 3 (built vocabulary; Creator Declared wording) are reconciled by TD-008.

### MVP-021 implementation authorization and scope guard
The pre-work analysis is approved to proceed using these decisions. Implement **only** MVP-021 and the small corrective SEO behavior explicitly assigned to it above. **Not** to be implemented: TD-008, MVP-012, MVP-013, pricing, Offer structured data, PostHog analytics, creator-profile routes, collections, fabricated inventory, new compatibility-writing workflows, search-engine landing pages for filtered combinations.

`NEXT_PUBLIC_SITE_URL` remains the dedicated public site-origin variable under the rules in the earlier 2026-09-21 entry. It is added to `turbo.json` `globalPassThroughEnv`, `apps/web/.env.example`, and — "where applicable" — the central environment validation used by the web application. **No central environment-validation module exists** in `apps/web` (each `lib/*.ts` reads its own variables), so `apps/web/lib/site-url.ts` is the single validation point for this variable.

Branch handling: these decisions are recorded on the existing `feature/mvp-021-seo-metadata` branch and travel in the MVP-021 pull request; no decision-only branch is created, and nothing is merged locally.


### Implementation record (MVP-021, 2026-09-21) — choices and verified facts for product-owner review
The approved decisions above were implemented as written. Recorded here so they are visible and reversible; none is a new product decision.
- **Deny-by-default robots.** The root layout is `noindex, nofollow`; the home page, indexable category pages and published product pages opt in. API, account and sign-in responses also carry `X-Robots-Tag: noindex, nofollow`. `robots.txt` is `Allow: /` and `Disallow: /api/` plus an absolute `Sitemap:` line when the origin is valid; it does not list `/signin`, `/account`, `/search`, or any admin/creator/preview path (a blocked URL can never have its `noindex` read, and a public file would advertise hidden paths).
- **Social tags:** Open Graph `type=website`, `site_name`, `locale=en_US`, `url`; Twitter `card=summary`. No image — none is approved. The site name is the existing working name held in one constant (open question 1).
- **Sitemap:** the home page, categories with at least one PUBLISHED product (base URLs only), and PUBLISHED products; no `lastmod`; capped at 50,000 URLs (a sitemap index is a follow-up).
- **Site origin, verified against a production build:** the variable is read at **runtime** by server code — a build made with no value picked up one supplied at `next start`. (An earlier note in the pre-work analysis, that Next.js might inline it at build time, is corrected.) A missing or invalid value fails safe: pages keep serving without canonical or JSON-LD, `robots.txt` has no `Sitemap:` line, the sitemap is a valid empty document, and `seo.site_url_invalid` is logged with only the reason — a couple of lines per process, never one per request.
- **Product JSON-LD** emits `name`, `description`, `url`, `category` and, when a published release exists, a "Version" `additionalProperty`. It is omitted when the origin is unavailable. No Offer data, no rich-result eligibility claim.
- **One raw-HTML sink.** The JSON-LD component is the only use of `dangerouslySetInnerHTML` in the codebase; a source-scan test enforces that, and an HTML-parser test proves malicious product text cannot terminate the script element or create another element.
- **Found, not fixed:** BUG-002 — a repeated `q` parameter returns HTTP 500 on `/search` and category pages (MVP-004 code; the authorization forbids changing MVP-004's search behavior). See open question 32.
- **Resolves** BUG-001 (relative canonicals and indexable sign-in/account pages) when MVP-021 is Done.

## 2026-09-21 — Product-owner decisions for MVP-023 (manual and automated accessibility gate; NFR-001 and NFR-008)

**Source:** direct product-owner instruction ("DIRECT PRODUCT-OWNER DECISIONS FOR MVP-023"), given in-session on 2026-09-21. It is the approval source for Q32, Q33–Q37 and Q39–Q42 below, and for those only. The MVP-023 pre-work analysis, the Copilot handoff and any agent recommendation are not approvals. Q38 stays open. Anything not decided here stays open. The pre-work analysis (`planning/prework/MVP-023-prework-analysis.md`) is accepted as the basis for implementation; authorization is limited to the scope below.

### Q33 — Browser matrix (closes part of open question 22)
- The blocking accessibility gate runs on three Playwright engine projects: **chromium**, **firefox** and **webkit**. Edge is covered by Chromium; no separate branded Edge channel is added to the blocking gate. WebKit is included because it is the only engine on iOS, and excluding it would leave the largest mobile surface unverified. (Correction, 2026-09-21: the original instruction said "four engines"; that was a counting error and the three named engines are the decision — see "Product-owner response to the MVP-023 stop-gate confirmation", item 2.)
- The blocking gate uses Playwright's **pinned bundled browser builds**. `@playwright/test` is pinned exactly (no caret or tilde range). No "latest", moving or branded-channel build may gate a merge; such runs are allowed only as non-blocking, clearly labelled exploratory checks. Reason: a merge gate must be reproducible, so a browser auto-update can never turn a green PR red without a code or version change.
- The exact pinned versions are recorded in the accessibility documentation.

### Q34 — Breakpoints (closes part of open question 22)
- Tested widths: **320** (WCAG 2.2 reflow check), **375** (mobile), **768** (tablet), **1280** (desktop). The repository's Tailwind breakpoints (640, 1024) remain the underlying design contract; the four widths are the tested sample either side of those boundaries.
- The matrix is not expanded in MVP-023. A defect that appears only at another width is recorded as a bug and a matrix change is proposed separately.
- Every gated page is checked for horizontal overflow at 320 px.

### Q35 — Gate definition
- A story cannot be marked Done if (1) automated accessibility tests fail, or (2) manual review identifies a **critical** WCAG 2.2 A/AA violation.
- **Critical**, approved as written: any WCAG 2.2 Level A or AA failure that prevents, blocks or substantially impedes a user from completing a step in a core user journey. Illustrative, not exhaustive: a keyboard trap; no visible focus indicator on an interactive control; an operable control unreachable by keyboard; a required form field with no programmatic label; an error that is not programmatically associated or announced; a dialog that does not trap and restore focus; a navigation or heading structure that makes the page unusable with assistive technology; content lost or clipped at 320 px reflow.
- **Severity rubric for accessibility defects:** P1 blocks a core-journey step outright; P2 substantially impedes a core-journey step (a workaround exists but is poor); P3 is a noticeable accessibility defect outside a core-journey step; P4 is best-practice or advisory only, not a WCAG A/AA failure. **P1 and P2 block Done. P3 and P4 do not block and must be recorded as bugs.**
- **axe rules:** rules tagged wcag2a, wcag2aa, wcag21a, wcag21aa and wcag22aa are **blocking**. Rules tagged best-practice are **advisory**: reported in the PR output, never failing the build.
- **Claims:** the platform must not be described as "WCAG compliant", "accessible", "certified", "audited" or "conformant" anywhere — code, docs, UI, metadata or commit messages. State only what was tested, by what method, on what date.

### Q36 — Test data policy
- No fabricated marketplace inventory, ever — not in seeds, fixtures, screenshots, or documentation examples that could be mistaken for real listings.
- Accessibility tests that need rows create their own, inside the test, using a reserved identifier prefix that is obviously non-production. Cleanup deletes only rows matching that prefix, and only rows the test created. Seeded categories are read-only to tests: never created, renamed, mutated or deleted.
- A pre-flight guard refuses destructive test setup against any database that is not local or CI. If the guard cannot positively identify the target as local or CI it refuses. A test that cannot run because the guard refused must FAIL or SKIP loudly, never silently pass.

### Q32 — BUG-002 (repeated `q` parameter returns HTTP 500)
- Out of scope for MVP-023; not fixed in this story.
- Approved as its own small corrective story, recorded as **PROP-006** in `planning/proposed-stories.md` with status **Proposed**: requirement FR-002, priority P3, reference BUG-002; scope — `normalizeQuery` handles repeated or array query parameters safely on `/search` and category routes, with no other search-behavior change; sequencing — after MVP-023 and before any story that expands search. It stays Proposed until scheduled and is not started under this authorization.
- If the accessibility harness crawls a URL shape that triggers BUG-002, that shape is excluded from the gate and noted; the underlying code is not fixed in this story.

### Q37 — Baseline findings BUG-003 to BUG-008
- **Fix the WCAG 2.2 A/AA failures inside MVP-023. No allowlist.** A gate created with known A/AA failures pre-suppressed is accessibility debt with a green tick on top.
- **Estimate moves from 8 to 13 points**; the reason is recorded in the backlog and progress report.
- **In scope for corrective work:** the Search button focus-indicator contrast (measured 1.06:1); the search input border contrast (measured 1.35:1, needs 3:1); the search input placeholder contrast (measured 3.46:1, needs 4.5:1); the h1-to-h3 heading skip on category and search pages; the missing main landmark on the framework default 404; sign-in error handling (the error identifies the field at fault, is programmatically associated with it, and focus moves to a sensible target instead of the document body); session revoke (focus is not lost and the outcome is announced to assistive technology); unique, descriptive page titles on sign-in, account and 404.
- **Out of scope (advisory; record as bugs and leave):** the unstyled appearance of the sign-in and account pages (a visual-design gap, not a WCAG A/AA failure — those pages are not redesigned here); axe best-practice findings; any P3 or P4 defect found during implementation.
- **Discipline:** each fix is a separate, minimal, individually described commit whose message names the bug ID and the WCAG success criterion. No refactoring, restructuring, layout change, renaming or tidying of anything adjacent. These fixes are the **only** permitted modifications to completed MVP-002/003/004/005/021/022 behavior; anything more needs a new decision. Each fix ships with a regression test that fails before the fix. If a baseline item turns out to need a structural change to a delivered story, stop, record it and ask.

### Q38 — Manual review and assistive technology (REMAINS OPEN)
- Not decided; it needs a human and none is assigned. **Binding interim position:** screen-reader compatibility is UNVERIFIED — no screen reader has been run. Nothing may state, imply or record that screen-reader testing was performed, passed or is covered by the gate. The automated gate covers axe-detectable issues plus scripted keyboard and focus checks in Chromium, Firefox and WebKit; that is its stated limit.
- The accessibility documentation carries an explicit, prominent **"Not verified"** section listing screen readers (NVDA, JAWS, VoiceOver), voice control, switch access, magnification, and any browser/AT pairing.
- Still needed (open question 38): who performs manual review (product owner, a named reviewer or a contractor); cadence (per UI story or per release); which AT/browser pairs are in scope.
- **Recorded proposal, NOT approved:** NVDA + Firefox (Windows) and VoiceOver + Safari (Apple), reviewed per release.
- MVP-023 builds the manual-review checklist and process document, with reviewer, cadence and AT matrix as clearly marked TBD fields. No reviewer or schedule is invented.

### Q39 — CI blocking and time budget (closes open question 20)
- The accessibility suite is a **separate job in parallel** with the existing test job, not appended to it.
- It is **required for merge** once the Q37 baseline fixes have landed within this same story; it must not be marked required while known A/AA failures remain, since that would block all work on a known-red gate. Sequence: land the fixes and the harness together in this PR, then make it required.
- **Budget:** target 5–8 minutes, hard ceiling 10 minutes wall-clock in parallel. Measured wall-clock time is reported in the PR description. If the measurement exceeds 10 minutes the gate is not weakened (no dropping browsers, widths or rules): stop, report, and propose options — sharding, trimming redundant page/width combinations, or moving full-matrix runs to a scheduled job with a reduced required set on PRs. That is a new decision, not an implementation choice.
- The TRD's pull-request check list is updated to include the accessibility job.
- **Flakiness:** a flaky accessibility test is a defect. No blanket retries. One retry at most, for known network or boot flake only, and any retry must be visible in the output.

### Q40 — Authenticated routes are in scope
- `/account` and `/account/sessions` are in scope for the gate (`/account` does not exist as a page in the repository — see "Conflicts and gaps found").
- Test authentication uses the real, server-enforced path with **database-created test sessions**. No product backdoor, test-only bypass route, "skip auth in test" flag, or relaxed authorization branch in application code. Test users and sessions are created and torn down by the test under the Q36 reserved-prefix rules. If authenticated coverage appears to require loosening an authorization check, stop and ask.

### Q41 — Tooling confirmation
- Approved accessibility testing stack: **Playwright (`@playwright/test`)** for E2E and browser automation; **`axe-core`**; **`@axe-core/playwright`**. Unit and integration testing remains Vitest.
- ADR-004's status changes from Proposed to Accepted, dated 2026-09-21, noting this instruction as the approval source. **Scope (2026-09-21 response, item 4): the Accepted status covers only the testing-stack rows; no other ADR row is approved by it.** Exact versions are pinned (no ranges) and recorded in the accessibility documentation and the ADR. The licence of each package is verified at the installed version and recorded (not carried forward from the instruction). All three are devDependencies and must not ship in the application bundle; this is confirmed after install.
- The testing row in the 2026-09-17 decisions table (above) now names axe-core and `@axe-core/playwright` alongside Playwright.

### Q42 — NFR-008 ownership (closes open question 22)
- With Q33 and Q34 decided, **MVP-023 owns NFR-008**. It documents the supported-browser and responsive-breakpoint matrices in a durable location (accessibility documentation and/or the TRD), demonstrates that the suite exercises them, maps NFR-008 to MVP-023 with test evidence in `planning/requirement-traceability.csv`, and closes open question 22 with a reference to this decision.
- Coverage is stated precisely: the matrix is exercised for accessibility and rendering checks. It is **not** a general cross-browser functional regression suite, and the documentation must not overstate it.

### Scope, estimate and implementation guard
- **MVP-023 = NFR-001 + NFR-008; revised estimate 13 points (from 8).** In scope: (1) the Playwright + axe harness, pinned, three engines, four widths; (2) reusable accessibility helpers and a documented page inventory; (3) coverage of implemented journeys only, verified against the repository — home, category, product detail, search, sign-in, account, account/sessions, 404; (4) a separate CI job, required within this PR's sequence, with measured timing reported; (5) the Q37 corrective fixes, each a minimal commit with a regression test; (6) the manual-review checklist and process document with reviewer, cadence and AT matrix as TBD; (7) the documented browser and breakpoint matrices; (8) an explicit, prominent "Not verified" limitations section.
- **Do not implement:** stories MVP-007, 010, 011, 012, 013, 017, 018, 020; items TD-008, BUG-002, TD-004, TD-005, TD-006, TD-009, TD-010; pricing; Offer or price structured data; product analytics or PostHog (FR-016); creator-profile routes; collections routes; compatibility-evidence workflow or vocabulary changes; search-behavior changes; product-detail feature additions; PROP-001 to PROP-005. Also not: promoting `develop` to `main`; modifying completed MVP-002/003/004/005/021/022 behavior except the Q37 fixes; redesigning or restyling sign-in or account; a test-only authentication bypass; fabricated marketplace inventory; any Microsoft endorsement, certification, approval or verification claim; any claim of WCAG conformance, an accessibility audit, or screen-reader support; closing any open question this instruction did not explicitly close.
- **Process:** continue on `feature/mvp-023-accessibility-gate`; decisions are recorded on that branch (no decisions-only branch or PR); one real PR via `gh pr create`; never work on `main`; never merge locally; merge only via `gh pr merge`. A stop-gate confirmation (git state, page inventory, pinned versions and licences, ordered Q37 commit list, conflicts) is posted before the first code commit; if it lists any conflict, work stops until the product owner answers.
- **Done only when** all tests pass; CI is green; database-gated tests are confirmed PASSED from the CI log (not the status tick); the accessibility job is green, required, within budget and its measured runtime reported; every Q37 A/AA fix has landed with a regression test; documentation (including the "Not verified" section) and traceability for NFR-001 and NFR-008 are updated; and the security and accessibility reviews are complete.

### Conflicts and gaps found while recording (2026-09-21) — all five answered the same day (see the stop-gate response below)
1. **No enforcement mechanism exists for "required for merge" (Q39).** `gh api` shows neither `develop` nor `main` has branch protection, and the repository has no rulesets, so no CI job is currently a required check. Open question 17 (branch protection and required status checks) is still open and this instruction did not close it. Making the accessibility job required through GitHub would create protection rules and would also decide part of question 17. Not done; the product owner is asked how to proceed.
2. **"Four engines" versus three named (Q33).** Playwright ships exactly chromium, firefox and webkit; the three named are implemented. Confirmation requested.
3. **`/account` is not a route.** `apps/web/app` has `account/sessions` only; no `account/page.tsx`, and no redirect. `/account` will not be gated as a page (it renders the 404, covered by the 404 checks). Adding an `/account` page would be a new feature and is not done.
4. **ADR-004 status scope (Q41).** Flipping the ADR's status to Accepted is recorded as the Q41 approval; it does not approve, change or close anything else, and vendor/business items the ADR lists as open stay governed by this file and `docs/open-questions.md`.
5. **Where the BUG-002 proposal lives (Q32).** `planning/mvp-backlog.csv` and `planning/backlog.csv` have no "Proposed" status (their statuses are Backlog, Ready, In Progress, QA, Blocked, Done), and `planning/proposed-stories.md` is the register for Proposed items. PROP-006 is recorded there, not in the two CSVs.

## 2026-09-21 — Product-owner response to the MVP-023 stop-gate confirmation

**Source:** direct product-owner instruction ("PRODUCT-OWNER RESPONSE TO MVP-023 STOP-GATE CONFIRMATION"), 2026-09-21. It answers the five conflicts the stop-gate confirmation raised, plus two further points, and authorizes implementation. Nothing not answered here is decided. Question 38 remains open.

### 1. Required-for-merge mechanism — Option B, enforced (narrows open question 17; does not close it)
- **Sequencing (binding).** No repository setting is applied until the accessibility job has run green at least once in the MVP-023 pull request, because GitHub can only require a check name it has already observed. Order: implement H1, F1–F10 and G1–G3 → push, open the PR and let CI run → confirm both jobs green and read the logs → only then create the branch-protection rule → report in the PR that the rule was created, with the exact check names used.
- **Rule set to create** (nothing else is enabled; no organization-level or repository-level rulesets; `main` is not touched):

  | Setting | Value |
  |---|---|
  | Repository | `posiauday/PPUniverse` |
  | Branch | `develop` only |
  | Require a pull request | Yes |
  | Required approvals | 0 |
  | Required status checks | Both: the existing job's display name ("Format, lint, typecheck, test, build") and the new accessibility job's display name. Names are used exactly as GitHub displays them after the run; if either differs from these, the actual name is reported and no job is renamed to match this record. |
  | Require branches up to date before merging | No |
  | Enforce for administrators | No |
  | Block force pushes | Yes |
  | Block branch deletion | Yes |
- If creating the rule fails, or the available settings do not match the above, stop and report; do not substitute a different configuration.
- **Open question 17 is narrowed, not closed.** This closes required status checks and force-push and deletion protection on `develop` (once applied). It does not close protection of `main`, reviewer and approval rules, or any ruleset strategy; question 17 stays OPEN with that remainder. Tech-debt record TD-011 tracks the unprotected `main` and the absent reviewer rules.

### 2. Engine count — three engines (corrects a counting error in Q33)
- Chromium, Firefox and WebKit. "Four engines" in Q33 was a counting error; the named list was correct. Recorded here so it is not later mistaken for a scope reduction: no engine was removed. Edge is covered by Chromium and no branded Edge channel is added.

### 3. `/account` is not a page
- Confirmed: `/account` is covered as a 404 check only. No `/account` page, redirect or route stub is created; that would be a new feature inside an accessibility story. The documentation notes that if `/account` becomes a real page in a future story, that story must add it to the gate.

### 4. ADR-004 status — Accepted, with a scope note
- ADR-004's status becomes Accepted, dated 2026-09-21, with a note that this approval covers **only the testing-stack rows** — Playwright, axe-core and `@axe-core/playwright`, at the pinned versions — and that no other row in the ADR is approved by it. Any other row needs its own decision. (This narrows the Q41 wording above.)

### 5. BUG-002 proposal location
- Confirmed: PROP-006 in `planning/proposed-stories.md` (FR-002, P3, unscheduled, not started). No "Proposed" status is invented in the backlog CSVs, and it is not started under this authorization.

### 6. New files in delivered areas — acceptable under Q37
- Permitted: a new `not-found.tsx` (F5); a new route-segment layout for the sign-in metadata (F8); one small client wrapper holding a persistent status region (F7). They are additive and framework-idiomatic; converting the sign-in page away from a client component, or restructuring the sessions page, would be the structural changes Q37 forbids.
- Constraints on each: minimal and single-purpose; no change to existing rendering, layout, styling, copy or behavior beyond what the named success criterion requires; no renaming, moving or refactoring of adjacent code; it ships with its regression test, proven failing before the fix; the new file is listed in the PR description with its bug ID and criterion. If any fix begins to require changes beyond its own new file plus a minimal edit at the call site, stop and ask.

### 7. Interpretations — all three confirmed
- (a) The harness lives in a private workspace package `packages/e2e` with root scripts `test:e2e` and `test:a11y`. Only the Commands section of `CLAUDE.md` is updated, factually; its rules, Definition of Done and every other section are not edited. After install, confirm that no accessibility tooling reaches the application bundle.
- (b) The unstyled appearance of the sign-in and account pages becomes a new advisory bug record. Those pages are not fixed, restyled or redesigned in this story.
- (c) BUG-004, BUG-006, BUG-007 and BUG-008 are fixed because Q37 named them in scope, **not** because Q35 would block on a P3. Future stories apply Q35's threshold, not this story's fix list.

### Additional requirements
- **Timing.** Browser and dependency install time is reported separately from test-execution time. Playwright browser binaries are cached in CI if that can be done without weakening the reproducibility of the pinned versions. The Q39 rule stands: if the measured total exceeds the 10-minute ceiling, stop and propose options (sharding, trimming redundant page/width combinations, splitting the full matrix to a scheduled run); engines, widths and rules are not dropped to fit.
- **Auth interception.** Intercepting the auth API inside the test, to reach the sign-in "send failed" and "sent" states, is test-side only and acceptable. It must not introduce any product-side test mode, bypass, env-gated branch or relaxed authorization, and the PR description states that explicitly.
- **Q38.** The "Not verified" documentation section is a named completion item, not an afterthought. It lists screen readers (NVDA, JAWS, VoiceOver), voice control, switch access and magnification as not tested, and must not be softened. No claim of screen-reader support, WCAG compliance, conformance, accessibility, audit or certification appears anywhere — code, docs, UI, metadata or commit messages.

### Authorization to proceed
- Proceed in this order: H1, then F1 through F10, then G1, G2, G3, on `feature/mvp-023-accessibility-gate`. The docs-only commits are pushed together with the first code commit; one real PR via `gh pr create`; never work on `main`; never merge locally.
- Stage explicit paths only; inspect `git diff --cached --stat` for line-ending noise before every commit; run the formatter before committing; restore `apps/web/next-env.d.ts` if the dev server alters it; build any literal backslash-u sequence from character codes, assert on the produced bytes and verify after writing.
- Before the first commit, re-verify that `origin/develop` is still `73ba6a4` and that no new PR has appeared (done 2026-09-21: unchanged, none open).

### Do not implement (restated)
- Stories MVP-007, 010, 011, 012, 013, 017, 018, 020. Debt TD-004, 005, 006, 008, 009, 010. Items BUG-002 and PROP-001 to PROP-006. Features: pricing; Offer or price structured data; analytics (FR-016); creator routes; collections routes; compatibility workflow or vocabulary changes; search-behavior changes; product-detail additions.
- Also: promoting `develop` to `main`; redesigning or restyling sign-in or account; a test-only auth bypass or any weakening of server-enforced authorization; fabricated marketplace inventory; Microsoft endorsement, certification or verification claims; closing any open question not closed above (17 is narrowed, not closed; 38 stays open). If the work appears to require any of these, stop and ask.

### Completion rule (restated)
MVP-023 is not Done until: all tests pass; CI is green; database-gated tests are confirmed PASSED by reading the CI log, not the status tick (colour codes appear as literal `^[[..m` text, so log filters must match that form; skip count is 0, or every skip is explained and approved); the accessibility job is green, required per item 1, and its measured runtime is within the 10-minute ceiling and reported in the PR with install time reported separately; every Q37 fix (F1–F10) has landed with a regression test proven failing before the fix; documentation is updated, including the browser and breakpoint matrices and the "Not verified" section; traceability is updated for NFR-001 and NFR-008; and the security and accessibility reviews are complete. Merge only via `gh pr merge`, and only after the branch-protection rule in item 1 has been created. Never merge locally.

### Implementation record (MVP-023, 2026-09-21) — facts and findings for product-owner review

Nothing here is a decision. It records what was built, what was measured, and one finding that needs a decision.

- **Built** (PR #6, `feature/mvp-023-accessibility-gate`): the private workspace package `packages/e2e` (Playwright 1.63.0, `@axe-core/playwright` 4.13.0, `axe-core` 4.13.0, exact pins; licences Apache-2.0, MPL-2.0, MPL-2.0 read from the installed packages); chromium, firefox and webkit projects at 320, 375, 768 and 1280 px; a 16-state page inventory verified against `apps/web/app`; a route-coverage guard with negative controls; the ten Q37 fixes as separate commits, each with a regression test shown failing against the unfixed production build first; a separate parallel CI job; `docs/14-accessibility-testing.md` with the matrices, the manual-review checklist (reviewer, cadence and pairs TBD) and the prominent "Not verified" section.
- **Engine builds** recorded from the run (Playwright 1.63.0's bundled browsers): chromium 153.0.8010.12, firefox 155.0, webkit 26.6.
- **Measured** (computed style and, independently, painted pixels; identical in all three engines): focus ring 18.13:1 (was 1.06:1); search input border 7.48:1 (was 1.35:1); placeholder 7.48:1 (was 3.45:1).
- **Manual verification performed by the agent, not a human review:** real Tab presses on every state; the recorded Tab order of all 16 states matches the reading and visual order and no positive `tabindex` exists; sign-in error path, session revoke, page titles and contrast re-measured as above. **No screen reader was run** and no human manual review was done (open question 38 stays open).
- **First CI run** (run 35665652208): the existing job passed (527 tests, 0 skipped, including every integration suite); the accessibility job's test step took 4m28s and the whole job 6m18s including a cold browser install (dependencies 6 s, browsers plus system dependencies 46 s with a cache miss, migrations 2 s, build 27 s). 417 of 420 checks passed; all 192 axe scans were clean; there are no advisory findings on any real page. axe listed `color-contrast` as "needs manual review" (could not decide) for the compatibility table on the product page at 320 and 375 px, as in the baseline. **Three Chromium tests failed** for a reason unrelated to accessibility (next bullet).
- **Finding that stops the story (BUG-012, P1; open question 43).** The three failures were HTTP 500s from Postgres "too many clients" (Prisma P2037). In a production build `packages/db/src/index.ts` (MVP-002) creates a new Prisma client and connection pool on every query: reproduced locally, 40 sequential queries leave 41 open connections in production mode and 1 in development. That is a production reliability defect, and fixing it changes MVP-002 behavior, which the MVP-023 authorization reserves. MVP-023 is therefore Blocked. Recommendation: approve the one-line fix inside MVP-023 as a separate minimal commit with a regression test that fails first (open question 43, option A).
- **Engine finding.** In WebKit the Tab key does not visit links (the engine default, as in Safari). The harness probes this per engine, measures each link's focus indicator by moving focus to it, and reports link reachability by keyboard as **not verified** in WebKit; it is verified in Chromium and Firefox.
- **Tooling finding.** With `@ppu/e2e` in the workspace, pnpm resolved Next.js's *optional* `@playwright/test` peer and linked Playwright into the web app's production dependency tree, contrary to Q41 (dev-only). A `pnpm.overrides` entry did not remove it; a root `.pnpmfile.cjs` does. Verified: the app's production tree has neither Playwright nor axe, and the production build output has no reference to either. Recorded as TD-012.
- **Recorded, not fixed, per Q37:** BUG-009 (sign-in and account pages unstyled; advisory), BUG-010 (session-revoke failure path still loses focus), BUG-011 (sign-in stays in its sending state if the request throws).
- **Engineering choices made within the latitude given** (for review): `retries: 0` everywhere (a flaky test is a defect); 3 CI workers (the repository is public, so the runner has 4 vCPUs); the application under test is a production build served by `next start` on port 3100; Tab walks start from an invisible focus sentinel at the top of the document so an earlier interaction cannot change where a walk begins; the harness never imports application code (the site name is duplicated in `packages/e2e/src/site.ts` on purpose).
- **Not yet done, by decision:** the branch-protection rule on `develop` is created only after the accessibility job has run green in the pull request; it has not been created. Open question 17 stays open as narrowed.
- **Update (2026-09-21): BUG-012 reproduces and the proposed fix works.** CI run 2 (35666983338, docs-only head 9cd68c5): the same signature. 417 of 420 passed, 3 Chromium failures (an unknown category slug and an unknown product slug returned 500 instead of 404; a session revoke failed), 0 skipped, 0 retries; Firefox and WebKit passed every test; the server log again shows TooManyConnections (8 lines). Whole job 5m57s, test execution 4m14s. The Playwright browser cache is saved only by a successful job, so both runs so far had a cold cache. Proposed fix validated in a throwaway git worktree (never committed, not on the feature branch): one condition in packages/db/src/index.ts (cache the client on globalThis in every environment) plus a unit test (packages/db/src/client-cache.test.ts). The test fails without the fix in production mode (and passes in development and test), and passes with it; with the fix, 40 sequential queries in production mode hold 1 open connection (was 41); and the full accessibility suite against a production build with the fix: 420 passed, 0 failed, 0 skipped, 0 retries (140 per engine) in 7.0m on a local Windows run with 3 workers; TooManyConnections lines in the server log: 0. Option A of open question 43 is therefore ready to apply as one separate commit once approved; it has not been applied to the feature branch.

## 2026-09-21 — Product-owner decision: BUG-012 and MVP-023 sign-off

**Source:** direct product-owner instruction ("PRODUCT-OWNER DECISION — BUG-012 AND MVP-023 SIGN-OFF"), 2026-09-21. It closes open question 43 and sets the order of the remaining MVP-023 steps.

### BUG-012 — Option A (closes open question 43)
- Apply the validated one-condition fix in `@ppu/db`. It is an approved change to delivered code under Q37 and the **only** `@ppu/db` change permitted in this story.
- Before committing, the pull-request description states which the patch is: (i) a correction to connection lifecycle or release behavior, which is a root fix; or (ii) a raise of a connection limit or pool ceiling, which is a mitigation. If (ii), a tech-debt record for the underlying leak is created and BUG-012 says so plainly. A mitigation is never described as a fix.
- Commit discipline: one minimal commit referencing BUG-012; no refactoring, renaming or tidying of adjacent `@ppu/db` code; a regression test if the condition is unit-testable (if it is not, the commit message and BUG-012 say why); and confirmation that the change does not alter RLS behavior, authorization, credential handling, or any connection string or secret surface.

### Sequence — not reordered
1. Apply the patch, commit, push to `feature/mvp-023-accessibility-gate`.
2. Let CI run and wait for it. The local 420 of 420 result is not acted on.
3. Read **both** CI job logs in full and confirm: the accessibility suite is green on chromium, firefox and webkit; no `TooManyConnections` in the server log; database-gated suites report PASSED, not skipped (colour codes render as literal `^[[..m`, so filters must match that form); skip count 0 or every skip explained; 0 retries.
4. Report the measured accessibility runtime, with install time separate, against the 10-minute ceiling. If it is over, stop and propose options; do not drop engines, widths or rules.
5. Only then create the `develop` branch-protection rule, using the exact check names as GitHub displays them, and report the names used.
6. Then complete the security review (which must cover the `@ppu/db` change) and the accessibility review.
7. Then mark Done, then merge with `gh pr merge`, never locally.

If CI is not green after the patch, stop and report. The suite configuration, worker count, retries and timeouts are not iterated on to force a pass.

### Accessibility review sign-off
- **Not signed off yet.** Sign-off is authorized only after step 3 passes.
- When recorded it states **scope and method, not conformance**: what (automated axe with the `wcag2a`, `wcag2aa`, `wcag21a`, `wcag21aa` and `wcag22aa` tags, plus scripted keyboard, focus and contrast checks); where (the enumerated page and state list, at 320, 375, 768 and 1280 px); engines (chromium, firefox and webkit at the pinned versions); the date and tool versions; and what was **not** done: screen readers (NVDA, JAWS, VoiceOver), voice control, switch access and magnification, all listed as not tested.
- Prohibited in the sign-off and everywhere else: "WCAG compliant", "conformant", "accessible", "audited", "certified", and any claim of screen-reader support.
- **Open question 38 stays OPEN.** This sign-off does not close it.

### Unchanged
- The do-not-implement list stands: MVP-007, 010, 011, 012, 013, 017, 018, 020; TD-004, 005, 006, 008, 009, 010; BUG-002; PROP-001 to PROP-006; pricing; Offer structured data; analytics; creator and collections routes; compatibility workflow; search-behavior changes; promoting `develop` to `main`; redesigning sign-in or account.
- The completion rule stands in full: not Done until tests pass, CI is green, database-gated tests are confirmed PASSED by reading the log, the accessibility job is green and required and within budget with its runtime reported, every F1–F10 fix has landed with a regression test, documentation including the "Not verified" section is updated, NFR-001 and NFR-008 traceability is updated, and both reviews are complete.
- Open question 17 remains narrowed (not closed).

## 2026-09-21 — MVP-023 reviews, branch protection, and Done (closes NFR-001, NFR-008)

**Source:** direct product-owner instruction ("Product-owner decision — BUG-013 and signin-sent"), step 5–7 of its sequence, carried out after CI run 6 (`5dedfba`) came back green.

### Branch protection created (closes the remainder of decision 1, MVP-023 stop-gate response)
Applied via the GitHub API on 2026-09-21, after run 6's accessibility job ran green (required — GitHub can only require a check name it has observed), exactly the rule decided earlier and no more:

| Setting | Applied |
|---|---|
| Repository | `posiauday/PPUniverse` |
| Branch | `develop` only — `main` confirmed still unprotected, no rulesets exist |
| Required status checks (exact names, read from run 6's check-runs) | `Format, lint, typecheck, test, build` and `Accessibility (axe + Playwright)` |
| Strict (branches must be up to date) | No |
| Required pull-request reviews | Yes, 0 approvals |
| Enforce for administrators | No |
| Force pushes | Blocked |
| Deletions | Blocked |

This closes the required-status-check and force-push/deletion portion of open question 17 for `develop`. `main` protection, reviewer/approval rules and any ruleset strategy remain open (TD-011).

### CI run 6 (`5dedfba`) — both logs read in full
- **Existing job:** green. 547 tests passed, **0 skipped**, 0 failed; every integration suite executed with a check mark and a count: catalog 37, session 3, file-scan 3, S3 4, ClamAV 2. Dependency audit clean.
- **Accessibility job:** green. **420 of 420** passed — 140 per engine on chromium, firefox and webkit — **0 skipped, 0 retries**. **0** `TooManyConnections` lines in the server log (BUG-012's fix holds). All axe scans clean on real pages; the one advisory `heading-order` finding is from the negative-control spec itself (labelled "advisory-only"), not a real page; `color-contrast` on the product page's compatibility table at 320/375px is unchanged and flagged "needs manual review", as before.
- **Timing**, install separate: dependencies 7s; browsers + system dependencies 36s; migrations 1s; build 22s; **test execution 3m 21s**; **whole job 5m 05s** (ceiling 10 minutes, target 5–8; the browser cache saved for the first time on this run, since every earlier run had failed before reaching that point — future runs should see a hit).

### Security review
Scope: every file this PR changes (`git diff origin/develop...HEAD`) — 9 application files (harness excluded, see below), the CI workflow, the pnpm resolution hook, and the private harness package itself.

- **No API route, auth configuration, adapter or domain file is touched.** Confirmed by path (`apps/web/app/api`, `apps/web/lib/auth`, `packages/adapters`, `packages/domain` — none appear in the diff).
- **No injection sinks introduced.** Scanned every added line for `dangerouslySetInnerHTML`, `innerHTML`, `eval`, `new Function`, `document.write`: none. `SessionsHeading.tsx`'s title-repair code uses `textContent` only, never HTML parsing.
- **No secret-like strings, credentials, tokens or connection details** in any added line (scanned; the only matches are inside comments explaining the change, e.g. naming `DATABASE_URL` and `NEXTAUTH_SECRET` as concepts, not values).
- **BUG-012 (`packages/db/src/index.ts`):** confirmed unchanged — row-level security (database-side, no client code sets a role or session setting), authorization, and credential handling (`DATABASE_URL` is read and passed to the adapter exactly as before). One stated, accepted consequence: the client is now cached in production too, so a rotated database credential needs a process restart (already noted when the fix was approved).
- **BUG-013 (`SessionsHeading.tsx`):** a DOM-only mitigation, no data flow, no new endpoint, no new dependency; the node it creates is explicitly marked and only ever removed by code that checks that same mark.
- **Accessibility tooling is dev-only, confirmed again on this build:** the production `.next` output and the app's production dependency tree contain no reference to `axe-core`, `@axe-core/playwright`, `@playwright/test` or `playwright-core`. `.pnpmfile.cjs` (the mechanism that keeps it that way) changes no other package's resolution.
- **CI workflow (`.github/workflows/ci.yml`):** the new job uses no secrets, requests no elevated permissions, and runs against its own throwaway Postgres service container exactly like the existing job.
- No findings. No follow-up items beyond the ones already recorded (TD-011, TD-012, TD-013).

### Accessibility review sign-off
**Scope and method, not conformance — no claim of "WCAG compliant", "conformant", "accessible", "audited", "certified", or screen-reader support is made here or anywhere else in this story's records.**

- **What:** automated axe-core, rules tagged `wcag2a`, `wcag2aa`, `wcag21a`, `wcag21aa` and `wcag22aa` (blocking) plus `best-practice` (advisory, reported only); scripted real-key-press keyboard traversal with computed and painted focus-indicator contrast measurement; computed and painted border and placeholder contrast; heading-outline and horizontal-overflow checks.
- **Where:** the 16-state page inventory in `packages/e2e/src/pages.ts` (home; category populated/empty; product full/minimal evidence; search no-query/results/no-results; sign-in idle/validation-error/send-failed/sent; account sessions/after-revoke; 404 for an unknown URL and for `/account`), each at 320, 375, 768 and 1280 px.
- **Engines and versions:** Playwright 1.63.0's pinned, bundled builds — chromium 153.0.8010.12, firefox 155.0, webkit 26.6.
- **Date:** 2026-09-21. Result: 420 of 420 automated checks passing (CI run 6, `5dedfba`); ten WCAG A/AA fixes (F1–F10) landed with regression tests shown failing first; one additional fix (BUG-013) for a defect found during implementation, landed with a unit-tested mitigation and an honest account of a race that could not be reproduced deterministically for an end-to-end regression test.
- **NOT tested:** screen readers (NVDA, JAWS, VoiceOver), voice control, switch access, magnification, or any browser/assistive-technology pairing. No human manual review was performed.
- **Known open, carried past this sign-off:** BUG-013 is a mitigation, not a root-cause fix (TD-013); BUG-014 (`signin-sent`, one non-recurring observation) is monitored, not fixed, and does not block; open question 38 (who performs manual/AT review, cadence, pairs) is unanswered.

This sign-off satisfies the MVP-023 completion rule's accessibility-review requirement for what was authorized: automated coverage plus the specific, evidenced fixes decided in this story. It does not certify, and must not be read as certifying, anything beyond that.

## 2026-09-22 — Secret scan false positive: this repository's first suppression

Direct product-owner instruction, "Secret scan false positive." Rejected a squash-merge (would destroy this story's deliberate F1–F10 commit granularity, and might not clear the finding anyway since a squashed diff reflects only the final tree) and a git-history rewrite (rewrites SHAs on an open PR, disproportionate to a false positive). Approved: a narrowly-scoped `.gitleaksignore`, keyed to exact fingerprints only, plus redaction of the verbatim quotes that had been reintroducing the pattern in documentation.

**What was flagged and why it is not a secret:** gitleaks' `generic-api-key` rule matched a module-scope string constant in the MVP-023 accessibility harness's sign-in click-diagnostics test code (`packages/e2e/src/signin-click-diagnostics.ts`) — the name of a `window` property the test tracer uses to carry evidence between the test and the page it drives. It never touches a credential, environment variable, or external call, and is dev-only test-harness state, never shipped in the application bundle. Confirmed triggered by an identifier the constant used to be named (a single all-caps word matching the rule's own keyword heuristic), not by the value: two structurally identical declarations elsewhere in the same file family, holding shorter strings, were never flagged. The identifier has since been renamed.

**Why the rename alone could not resolve it:** gitleaks (via `gitleaks/gitleaks-action@v2`, for `pull_request` events) derives its scan range from GitHub's `GET /pulls/{pull_number}/commits` REST API — `baseRef` = that list's first commit, `headRef` = its last — not from any git ref or `github.sha`. That API is known to lag slightly behind a just-landed push (confirmed against the action's own source, `src/gitleaks.js`); this repository's checkout already uses `fetch-depth: 0` (full history), so the lag is the action's range-derivation method, not a checkout or workflow defect. A rename in the latest commit cannot retroactively change what an already-merged historical commit's own diff contains, and gitleaks scans that diff history, not the working tree.

**Verification performed before suppressing anything:**
- Installed gitleaks 8.24.3 locally (the exact version this repository's CI pins) and ran it over the branch's full true commit range (the PR's actual first commit through the actual current head, not just the range CI's lagging API call had seen) — found **5** findings, all the same rule, all the identical entropy value (3.784942 — the same 21-character string every time), none a real credential. Two of the five were not yet visible in any CI run: the rename commit's own doc-comment, and its own progress-report entry, had each quoted the flagged declaration verbatim while explaining it — regenerating the same finding in the very commit meant to fix it.
- Redacted every verbatim quote of the flagged declaration in `planning/progress-report.md` and the renamed constant's own doc-comment, describing the construct instead of reproducing it, with each redacted entry stating why.
- Added `.gitleaksignore` at the repository root: five entries, each the exact fingerprint gitleaks itself printed (never hand-constructed), each preceded by a comment naming what the value is and why it is not a secret. No path glob, no rule disable, no entropy-threshold change, no inline `gitleaks:allow` comment, no `--no-git`/filesystem-mode flag anywhere.
- Re-ran gitleaks locally with the file in place: zero findings (5 suppressed, exactly the 5 enumerated — no collateral suppression).
- **Negative control:** in an isolated scratch repository (never committed to this project), confirmed gitleaks still detects a properly-formed dummy secret with the real `.gitleaksignore` present — the scanner remains fully functional, not silenced.

**Precedent, stated explicitly because it matters more than this one finding:** this is the first time this repository has suppressed a secret-scan finding. Any future suppression requires its own separate decision; adding a `.gitleaksignore` entry is not routine maintenance. `.gitleaksignore` itself carries an equivalent statement at its top.

Whether `Secret scan` should become a required status check (it is not, today) is added to the existing shelved gate-policy question (`planning/bugs/BUG-014.md`) without being answered by this decision.

## 2026-09-22 — MVP-023: final security and accessibility review, Done, merge (closes NFR-001, NFR-008)

Direct product-owner instruction, "BUG-014 recurrence," section 5. Run 16 (`aed24d8`, the round-2 BUG-014 instrumentation) is green on both required checks and on `Secret scan`: 423/423 accessibility tests passed (0 skipped, 0 retries), self-check passing in all three engines, every DB-gated integration suite (`clamav-scan-adapter`, `s3-storage-adapter`, `file-scan-repository`, `session-repository`, `catalog-repository`) ran for real and passed, `Secret scan` clean. BUG-014's signature did not recur on this run — the most rigorously instrumented one yet (observer-liveness, navigation, and native-submit evidence, none of it exercised, because there was nothing to observe).

### Security review

Scope: every file changed since the last completed security review (CI run 6, `5dedfba`) — the diagnostics/instrumentation work across runs 7 through 16, `.gitleaksignore`, and the two named product-code fixes.

- **`@ppu/db` connection handling (BUG-012, `packages/db/src/index.ts`), re-read against its current content, not re-asserted from memory:** `globalThis.__ppuPrisma` is cached unconditionally, in every environment — the earlier `NODE_ENV !== "production"` guard that skipped caching in production (creating a fresh `PrismaClient` and connection pool on every property access, exhausting Postgres) is gone. **This is a root fix, not a mitigation**: it does not work around connection exhaustion, it removes the code path that created a new pool per access. RLS is untouched (no `SET ROLE`/session-variable code exists in this file; RLS is enforced database-side, unaffected by client caching). Authorization is untouched (this file only obtains a client; it performs no auth checks). Credential handling is unchanged: `DATABASE_URL` is read from `process.env` and passed directly to `PrismaPg`'s adapter constructor, never logged or persisted.
- **`SessionsHeading` title fallback (BUG-013, `apps/web/app/account/sessions/SessionsHeading.tsx`), re-read against its current content:** both writes to a `<title>` element use `.textContent` exclusively (`created.textContent = decision.text`, `existing.textContent = decision.text`) — no `.innerHTML`, no HTML parsing anywhere in the component. No DOM injection surface. The text written is either `EXPECTED_TITLE` (a compile-time constant built from `SITE_NAME`) or copied from the framework's own existing `<title>` element — never derived from a URL parameter, user input, or any untrusted source. The component's own comment still correctly labels this a mitigation, not a root fix (the underlying `router.refresh()` timing gap is tracked as TD-013, unresolved).
- **The diagnostics/e2e package, re-confirmed structurally, not by a fresh full production build this round** (the last full-build confirmation is CI run 6's security review, above; the enforcing mechanism has not changed since and was re-checked directly): `packages/e2e/package.json` is `"private": true`. `.pnpmfile.cjs` still strips Next.js's optional `@playwright/test` peer declaration, unchanged. `apps/web`'s `app/`, `lib/` and `next.config.*` contain zero references to `@ppu/e2e` or `packages/e2e` (grepped directly). No test mode, bypass, or environment-gated relaxation exists anywhere in product code (unchanged from decision Q40/the stop-gate response, re-confirmed by the same absence of any such reference).
- **`.gitleaksignore`, read directly:** exactly 5 entries, each a full 40-character commit-SHA fingerprint followed by `:path:rule:line` — no wildcard, no path glob, no rule-ID-only exclusion. No gitleaks config file, rule set, or entropy threshold was touched anywhere in the repository. Real-secret detection is not weakened: proven directly, not assumed, by the negative control recorded in the "Secret scan false positive" decision above (a properly-formed dummy secret was still caught with this exact `.gitleaksignore` present, in an isolated scratch repository).
- No injection sinks, no new secret-like strings outside what's already covered above, no new dependency, no new API route or auth-configuration change anywhere in this diff span.
- No findings. No new follow-up items beyond what is already tracked (TD-011, TD-012, TD-013, and BUG-014 itself, staying open).

### Accessibility review sign-off

**Scope and method, not conformance — no claim of "WCAG compliant", "conformant", "accessible", "audited", "certified", or screen-reader support is made here or anywhere else in this story's records.**

- **What:** automated axe-core, rules tagged `wcag2a`, `wcag2aa`, `wcag21a`, `wcag21aa` and `wcag22aa` (blocking) plus `best-practice` (advisory, reported only); scripted real-key-press keyboard traversal with computed and painted focus-indicator contrast measurement; computed and painted border and placeholder contrast; heading-outline and horizontal-overflow checks.
- **Where:** the 16-state page inventory in `packages/e2e/src/pages.ts` (home; category populated/empty; product full/minimal evidence; search no-query/results/no-results; sign-in idle/validation-error/send-failed/sent; account sessions/after-revoke; 404 for an unknown URL and for `/account`), each at 320, 375, 768 and 1280 px.
- **Engines and versions:** Playwright 1.63.0's pinned, bundled builds — chromium, firefox, webkit, confirmed by CI run 16 (`aed24d8`).
- **Date:** 2026-09-22. Result: 423 of 423 automated checks passing (CI run 16, `aed24d8`); ten WCAG A/AA fixes (F1–F10) landed with regression tests shown failing first, plus two additional fixes for defects found during implementation (BUG-012, a root fix; BUG-013, a unit-tested mitigation with an honest account of an end-to-end race that could not be reproduced deterministically).
- **NOT tested:** screen readers (NVDA, JAWS, VoiceOver), voice control, switch access, magnification, or any browser/assistive-technology pairing. No human manual review was performed.
- **Known open, carried past this sign-off:** BUG-013 is a mitigation, not a root-cause fix, with a residual framework-timing gap on other `router.refresh()` routes beyond the one instance it closes (TD-013). BUG-014 (intermittent Firefox @320px sign-in-submit signature) is **open, non-reproducing, monitor-only**, with two rounds of evidence-backed investigation on record (`planning/bugs/BUG-014.md`): confirmed not a test-side node-identity or connectivity defect; the most recent, most rigorously instrumented run (16) did not reproduce it at all. Root cause remains unproven. Open question 38 (who performs manual/AT review, cadence, pairs) is unanswered.

This sign-off satisfies the MVP-023 completion rule's accessibility-review requirement for what was authorized: automated coverage plus the specific, evidenced fixes decided in this story. It does not certify, and must not be read as certifying, anything beyond that.

### Done and merge

`planning/mvp-backlog.csv` and `planning/backlog.csv` have shown MVP-023 as `Done` since 2026-09-21 (a decision made before the run-8-through-16 investigation this document records) — noted here because the CLAUDE.md completion gate (tests passing, documentation and traceability updated, security review completed) is only genuinely satisfied as of THIS entry, not as of the earlier marking. The status value itself does not need to change, because it is now accurate; the gap between when it was marked and when it became true is recorded here rather than left silent.

Merged via `gh pr merge` (not locally, not squashed) once this entry and the corresponding `progress-report.md` entry were written.

## 2026-09-22 — MVP-010 (FR-005, Free entitlement flow): open questions 44 and 45

Direct product-owner instruction, "MVP-010 open questions 44 and 45." Closes both questions raised in `planning/prework/MVP-010-prework-analysis.md` and authorizes implementation for the scope stated there and in this entry, nothing else.

### Q44 — sign-in requirement: the proposed default is approved
Require sign-in for all free downloads in MVP-010. **The per-product "requires sign-in" policy field is deferred, not omitted** — it is a real future story, not a cut feature, because building it now means building a second identity model alongside it: anonymous ownership, email capture, abuse controls, and a claim-on-registration path, not a schema column. **Do not add the field now, disabled or otherwise; do not add an unused policy flag.** Universal sign-in is stated plainly as this MVP's position, not the intended end state, so a future reader does not mistake it for a permanent product decision.

### Q45 — entitlement scope and lifecycle: approved, with an amendment
**Approved as proposed:** product-scoped (not release-scoped), permanent-until-revoked.

**Amended on `revokedAt`:** the nullable column is included **and enforced at read time** — a download is denied when `revokedAt` is non-null. No code path in this story ever sets it; that is stated plainly in the schema comment and the implementation, not left implicit. Rationale to record: an unenforced reserved column invites a future revocation feature that ships without the check being wired in; enforcing the read-time condition now costs one comparison and means product suspension behaves correctly the moment any future write path sets the column — nothing about revocation itself needs to be re-derived later.

### Stale README
Approved: correct `packages/domain/entitlements/README.md`'s ownership line as part of this story — a one-line correction inside the area MVP-010 is filling in, not a broader documentation pass.

### Required in the implementation
- **Authorization, server-side, deny-by-default:** the product must be `PUBLISHED` and free at request time, checked server-side; a client-supplied price, free flag or product state is never trusted; entitlement is denied for draft, suspended, archived or rejected products; download is denied when `revokedAt` is non-null.
- **Idempotency:** a unique constraint on `(userId, productId)` prevents duplicate entitlements from repeated requests; `Download` stays append-only (one row per download event), a materially different cardinality from `Entitlement`, not merged into it.
- **Data minimisation:** the `Download` record captures only what audit needs. No IP address, user agent, or personal data beyond what an already-approved decision covers. Anything that looks like it needs one is recorded as a new open question, not added.
- **Schema:** hand-written migration, reversible, non-destructive; `ENABLE ROW LEVEL SECURITY` on every new table, in the same migration that creates it, per the established convention — not deferred to a follow-up.
- **Accessibility gate:** any new UI surface is added to the enumerated page/state list in `packages/e2e`, exercised at 320/375/768/1280 across all three engines; the route-coverage spec is not satisfied by adding a real, user-facing page to an exclusion list; empty, loading, denied and already-entitled states are all included, not only the success path.
- **Telemetry:** `@ppu/telemetry` structured logs only. No product analytics — FR-016 stays deferred.

### Do not implement (restated for this story)
Signed download delivery or any part of FR-007 — that is MVP-009's, and it is blocked by the absent `ReleaseFile` model (see the pre-work analysis). **If the work appears to require connecting `FileScan` to a `Release` or `Product`, stop and ask — that is a backlog change, not an implementation choice.** Also excluded, restated unchanged from the pre-work authorization: MVP-007, 008, 009, 011, 012, 013, 017, 018, 020; TD-004, 005, 006, 008, 009, 010; BUG-002; PROP-001 to PROP-006; pricing; Offer structured data; analytics; creator and collections routes; compatibility workflow; search-behaviour changes; promoting `develop` to `main`; the per-product sign-in policy field (Q44). No modification to completed MVP-001/002/003/004/005/006/021/022/023 behaviour. No gate check weakened, skipped, quarantined or conditionally excluded. The accessibility self-check stays permanent and unconditional. BUG-014 stays open, monitor-only, permanently instrumented — not touched under this authorization.

### Process
Implementation authorized on `feature/mvp-010-free-entitlement`, for the scope above and nothing else. One real PR via `gh pr create` when ready; never `main`, never a local merge, never squashed. Disk protocol stands: free space reported before any local run, under 2GB stops rather than runs. Completion rule unchanged (tests pass; all required checks green on the head being merged; DB-gated suites confirmed PASSED by reading the log, not the status tick; skip count 0 or explained; 0 retries; docs and traceability updated; security and accessibility reviews complete). A new product decision surfacing mid-implementation is recorded with a safest reversible default and stops for approval — not resolved unilaterally.

## 2026-09-22 — MVP-010: security and accessibility review, Done, merge (closes FR-005)

PR #8 (`feature/mvp-010-free-entitlement`). Run 1 (`77abff0`) failed Accessibility on two real test-isolation bugs (not the implementation itself) — `planning/progress-report.md` has the full account. Run 2 (`e1d5dcf`, the merged head) is green on all three jobs: 477/477 accessibility tests passed, self-check passing in all three engines, 0 skipped, 0 retries; `Format, lint, typecheck, test, build` green with the new `@ppu/adapter-entitlements` integration suite (5/5, including the concurrent-grant race-safety test) confirmed passing for real by reading the log; `Secret scan` clean.

### Security review

Every claim below re-verified directly against the actual committed code on the merged head, not re-asserted from the implementation plan.

- **Authorization, server-side, deny-by-default:** `route.ts` never reads a request body — confirmed by direct inspection, no `request.json()`/`await request` anywhere in the file. The product's `PUBLISHED` status is re-read from the database on every request (`findPublishedProductBySlug`) and independently re-checked (`isProductEligibleForFreeEntitlement`); nothing about eligibility is ever accepted from the client. A `DRAFT` product and a nonexistent one both return the same `404`, so the endpoint never leaks which unpublished products exist.
- **`revokedAt` enforcement:** `isDownloadAllowed` is called before `recordDownload` on every request, returning `403 ENTITLEMENT_REVOKED` if it is ever non-null. No code path in this story sets it, and the code says so in three places (schema comment, domain function comment, route comment) so a future reader is not misled into thinking revocation is implemented.
- **Idempotency, proven twice over:** the unique constraint (`entitlements_userId_productId_key`) is live in the migration (confirmed: `ENABLE ROW LEVEL SECURITY` and the constraint both present, read directly). `grantOrReuseEntitlement`'s race-safety was proven against a real database with a genuine concurrent-request integration test, not assumed. Run 1 additionally proved, the hard way, that idempotency has to be deliberate everywhere it's needed — the test fixture's own `grantEntitlement` helper wasn't idempotent and broke in CI; the production repository's *was*, from the first commit, and never broke.
- **Data minimisation:** `Download` stores exactly `entitlementId`, `userId`, `productId`, `requestedAt`, `createdAt` — confirmed against the schema file directly. No IP address, no user agent, nothing beyond audit necessity.
- **RLS:** both new tables (`entitlements`, `downloads`) have `ENABLE ROW LEVEL SECURITY` in the same migration that creates them — confirmed by reading the migration file directly, lines 75–76.
- **No product analytics, no new secret/credential surface:** confirmed — the only telemetry is `@ppu/telemetry`'s structured `logger.info` calls (`entitlement.granted`, `entitlement.download_recorded`); nothing touches `Sentry`/`PostHog`/any analytics adapter.
- **FR-007 boundary held:** no `ReleaseFile`, no `SignedDownloadGrant`, no file-serving code anywhere in this diff — confirmed by the file list in the PR; the only new product-facing surface is the entitlement grant and its UI.
- **Production build confirmed clean of test tooling:** re-verified — `pnpm build`'s output contains no reference to `playwright` or `axe-core`, matching the established invariant.
- No findings.

### Accessibility review sign-off

**Scope and method, not conformance — no claim of "WCAG compliant", "conformant", "accessible", "audited", "certified", or screen-reader support is made here or anywhere else in this story's records.**

- **What:** the same automated axe-core (`wcag2a`/`wcag2aa`/`wcag21a`/`wcag21aa`/`wcag22aa` blocking, `best-practice` advisory) plus scripted real-key-press keyboard traversal with focus-indicator contrast measurement that MVP-023 established — no new method introduced.
- **Where, new in this story:** three states added to the existing page inventory — `product-free-idle` (signed in, not yet entitled), `product-free-entitled` (signed in, already entitled), `product-free-granted` (signed in, immediately after granting) — each at 320/375/768/1280px, in chromium/firefox/webkit, run 2 confirmed 0 failures across all of them.
- **Guest coverage:** the sign-in prompt a signed-out visitor sees needed no new state — `product-full`/`product-minimal` (already `auth: "guest"`) render it as part of their existing coverage.
- **Date:** 2026-09-22. Result: 477/477 automated checks passing (CI run 2, `e1d5dcf`, merge to follow).
- **NOT tested:** screen readers, voice control, switch access, magnification, human manual review — unchanged from MVP-023's standing position; this story adds no new claim about any of them.
- **Known open, carried forward, unaffected by this story:** BUG-013's residual framework-timing gap; BUG-014, open, non-reproducing, monitor-only, permanently instrumented.

### Done and merge

`planning/mvp-backlog.csv`/`planning/backlog.csv`: MVP-010 moves In Progress → Done. Merged via `gh pr merge` (not locally, not squashed).

## 2026-09-22 — MVP-020 open questions 46, 47 and 48

Issued directly by the product owner in chat ("PRODUCT-OWNER DECISION — MVP-020 OPEN QUESTIONS 46, 47, 48"), resolving `docs/open-questions.md` items 46-48 and authorizing implementation on `feature/mvp-020-consent-deletion`. Full pre-work analysis: `planning/prework/MVP-020-prework-analysis.md`.

### Question 46 — deletion versus append-only: direction approved, question stays open

The pre-work analysis's proposed per-data-class model is **approved as the recorded direction for the future erasure story, not as a binding implementation decision**: identity data (`User`, `Account`, `Session`) → **pseudonymise**; commerce/audit-adjacent data (`Entitlement`, `Download`) → **retain** under a stated lawful basis; the consent/deletion audit trail itself → **always retain**. **Question 46 stays OPEN** — it cannot be finalized before question 47, because a jurisdiction decision may require erasure where pseudonymisation is currently proposed. This dependency is recorded explicitly so the direction is never mistaken for a settled decision by a future reader.

**Decided now, because it is schema in this story:** `Restrict`/`NO ACTION` on the `userId` (and `actorUserId`) foreign keys of `PolicyVersion`, `ConsentRecord`, `DeletionRequest` and `DeletionRequestEvent` is **approved**. The divergence from `Entitlement.userId`'s existing `Cascade` (MVP-010) is deliberate and correct: a cascade would let a future user-deletion destroy the very records that prove what was consented to and what was requested. The divergence and its reason are recorded in the migration comment and here — it must not later be "corrected" for consistency with MVP-010's table. Consequence, not a task: a future erasure implementation will have to handle these FKs explicitly rather than relying on cascade; that is the intended outcome.

### Question 47 — jurisdiction: interim default approved

**Approved:** a single configurable operational-target value, stored as data, not tied to any named regime. **Question 47 stays OPEN**, blocked on open question 3 (initial countries/currencies/tax/refunds) and open question 5 (hosting region/data residency).

Constraints, binding on the implementation: no regime name (GDPR, PIPEDA, CCPA or any other) appears anywhere — code, schema, enum values, column names, comments, UI, docs, metadata or commit messages; no timeline is hardcoded; the value is described only as an operational target, never as a legal or statutory deadline; nothing in the UI states or implies a legal entitlement, right, or guaranteed timeframe.

**Consent categories `TERMS_OF_SERVICE` and `MARKETING_EMAIL` are approved as the MVP set.** Excluding an analytics category is correct — the feature does not exist, and a consent record for a capability that cannot run would be meaningless. The pre-work analysis's note on the cost of adding a category later (one enum value plus new rows, no redesign) stands.

### Question 48 — admin role: option (a), with constraints

**Approved: add `ADMIN` to the existing `UserRole` enum.** This is an explicit, one-time authorization to modify MVP-002's schema, **limited to adding the enum value and nothing else** — no change to existing role semantics, existing rows, defaults, or any other part of that story's schema.

**Rejected: option (b), an allowlist or any other interim authorization mechanism.** A second authorization path would need its own storage, checks and audit trail, and every future admin surface would have to choose between two sources of truth — a larger and more permanent change than one additive enum value.

**Not chosen, for the record: deferring the admin surface and shipping only the user-facing half.** Rejected because a deletion request nobody can action is a workflow with no exit, and the operator would have no view of pending requests at all.

**Required constraints on the implementation:**
1. **No application path grants `ADMIN`.** No endpoint, form, admin action, seed, environment variable, or code path — in application or test code — assigns it. Granting is a manual operational act performed directly against the database by the operator.
2. The grant mechanism is stated plainly in documentation (what the operator runs, and that it is recorded) — no tooling for it is built in this story.
3. Tests needing an admin create one directly in the database under the reserved-prefix pattern, cleaned up as their own rows only. No test-only bypass, no role-elevation helper shipped in application code.
4. Every admin surface is deny-by-default, checking the role server-side; a `MEMBER` receives the same response as an unauthenticated request, with no information disclosed about the surface's existence.
5. Every admin transition on a deletion request records actor, timestamp and a reason, per `CLAUDE.md`.
6. `ADMIN` is coarse-grained by design at MVP. Finer-grained permissions are deferred; adding `ADMIN` implies no other admin capability elsewhere in the product.

### Unchanged (restated)

Scope boundary holds: no erasure execution, no retention jobs, no data export, no cookie/analytics consent, no legal copy authored by the agent — placeholders only, clearly marked. All new tables: hand-written reversible migration, `ENABLE ROW LEVEL SECURITY` with statements in the migration, append-only, no `UPDATE` path. New UI surfaces — user-facing and admin — join the enumerated page/state list in `packages/e2e` at 320/375/768/1280 across all three engines, including empty, loading, error, denied, pending and already-requested states; the route-coverage spec is never satisfied with an exclusion entry for a real page. Do-not-implement list stands (restated in the pre-work analysis and below). No gate check weakened, skipped, quarantined or conditionally excluded; the accessibility self-check stays permanent and unconditional; BUG-014 stays open, monitor-only, permanently instrumented. No compliance claim of any kind, anywhere. Completion rule unchanged (tests pass; all required checks green on the head being merged; DB-gated suites confirmed PASSED by reading the log; skip count 0 or explained; 0 retries; docs and traceability updated; security and accessibility reviews complete). Merge via `gh pr merge` only, never locally, never squashed.

### Process

Implementation authorized on `feature/mvp-020-consent-deletion` for exactly the scope this entry and the pre-work analysis describe. If a new product decision surfaces mid-implementation, it is recorded with a safest reversible default and implementation stops for approval — not resolved unilaterally.

## 2026-09-23 — MVP-020: security and accessibility review, Done, merge (closes FR-004)

PR #9 (`feature/mvp-020-consent-deletion`). First CI run (`35809637645`) is green on all three jobs on the first attempt: `Secret scan` (7s), `Format, lint, typecheck, test, build` (2m11s, 205/205 `@ppu/web` tests plus every other package's suite reading "passed" with no "failed" anywhere in the log — read directly, not inferred from the status tick), `Accessibility` (7m50s, **603 passed, 0 failed, 0 flaky**, test execution 375s — within the 5–8 minute target, under the 10-minute ceiling).

### Security review

Every claim below re-verified directly against the actual committed code on the PR head, not re-asserted from the implementation plan.

- **Deny-by-default, server-enforced authorization on every route:** `POST /api/account/consent`, `POST /api/account/deletion-requests` and `DELETE /api/account/deletion-requests/[id]` all check `session?.user?.id` first and return `401` otherwise — confirmed by direct inspection. None of the three ever reads a target user id from the request body; every write uses `session.user.id` exclusively — confirmed: `grep`ping each route file for `userId` shows only `session.user.id` assignments, never a body-sourced value.
- **The admin route is the one genuinely new authorization surface, and it is deny-by-default with no information disclosure:** `POST /api/admin/deletion-requests/[id]` re-queries `role` from the database via `prisma.user.findUnique` on every request — confirmed directly; it never reads `session.user.role` (which does not exist — `auth.ts`'s session callback is unmodified by this story, confirmed by `git diff` showing no changes to that file). No session and an authenticated non-admin both hit the same `deny()` closure, returning the byte-identical `{ code: "NOT_FOUND", message: "Not found." }` body at `404` — proven, not just asserted, by a dedicated route test (`route.test.ts`, 5/5 passing) that exercises both paths and checks the response bodies independently.
- **No application code path grants `ADMIN`:** confirmed by `grep -rn "role.*ADMIN\|ADMIN.*role" apps/web` finding only read-side checks (`actor?.role !== "ADMIN"`) and the one test-infrastructure creation of an admin fixture user in `packages/e2e/src/seed.ts` (explicitly sanctioned by decision 48, constraint 3, and not application code). No seed script, migration, or route ever writes `role: "ADMIN"` in `apps/web` or `packages/adapters`.
- **Append-only, proven not assumed:** `grep -n "\.update(\|\.updateMany(\|\.upsert(" packages/adapters/privacy/src/privacy-repository.ts` returns nothing — zero mutation calls against `ConsentRecord`, `DeletionRequest` or `DeletionRequestEvent` anywhere in the repository. `createDeletionRequest` writes the request and its `SUBMITTED` event atomically inside one `$transaction`, so a request can never exist without at least one event.
- **RLS on all four new tables:** confirmed by reading `20260922020000_add_privacy/migration.sql` directly — four `ENABLE ROW LEVEL SECURITY` statements, one per table, in the same migration that creates them.
- **`Restrict` FKs, proven against a real database:** confirmed in the migration SQL (`ON DELETE RESTRICT` on every `userId`/`actorUserId`/`deletionRequestId`/`policyVersionId` reference) and proven twice over — once by a local integration test, and independently by the real CI Postgres log itself, which shows the deliberately-triggered violation firing exactly as designed: `ERROR: update or delete on table "users" violates foreign key constraint "consent_records_userId_fkey"` (CI run `35809637645`, `Format, lint, typecheck, test, build` job, `Stop containers` step) — the database's own enforcement, not just the application's expectation of it.
- **Data minimisation:** `ConsentRecord` stores `userId`, `category`, `granted`, `policyVersionId`, `recordedAt` — no IP address, no user agent. `DeletionRequestEvent` stores `actorUserId`, `toState`, `reason`, `occurredAt` — confirmed against the schema directly.
- **No PII beyond an opaque user id in telemetry:** `logger.info` calls in the four routes pass `userId`, `category`, `granted`, `policyVersionId`, `deletionRequestId`, `toState`, `actorUserId` — never `reason` (the one free-text field in this story), never an email address. Confirmed by reading every `logger.info` call site directly.
- **No operative legal text anywhere:** `PolicyVersion` has no text column (confirmed against the schema); the seed migration's `version` value is literally `"placeholder-pending-product-owner-review"`, and the UI (`page.tsx`) renders only the version identifier and date, never document content.
- **No compliance claim of any kind:** `grep -rin "gdpr\|pipeda\|ccpa\|compliant\|compliance\|certified\|certification" apps/web/app/account/privacy apps/web/app/admin packages/domain/privacy packages/adapters/privacy packages/db/prisma/schema/privacy.prisma` returns exactly one match — `privacy.prisma`'s own module comment stating that no such regime name appears anywhere in that file, i.e. a negation, not a claim. No code, UI copy, or schema anywhere in this story names or claims any regulatory regime.
- No findings.

### Accessibility review sign-off

**Scope and method, not conformance — no claim of "WCAG compliant", "conformant", "accessible", "audited", "certified", or screen-reader support is made here or anywhere else in this story's records.**

- **What:** the same automated axe-core (blocking WCAG 2/2.1/2.2 A/AA tags, advisory best-practice) plus scripted real-key-press keyboard traversal with focus-indicator contrast measurement MVP-023 established — no new method.
- **Where, new in this story:** seven states — `privacy-empty`, `privacy-pending-request` (also covers "already-requested" — the UI has no separate error path for it), `privacy-denied`, `privacy-loading`, `privacy-error`, `admin-deletion-requests-populated`, `admin-deletion-requests-denied` — each at 320/375/768/1280px, in chromium/firefox/webkit. All passed in the real CI run (`603 passed, 0 failed, 0 flaky`).
- **A new authenticated identity, proven, not assumed:** `admin-deletion-requests-populated` required a second, database-created `ADMIN` fixture identity and a `signedInAsAdmin` fixture; the "page titles are descriptive and distinct" and route-coverage checks were extended to sign in as that identity for admin-auth states, and both passed in CI.
- **Date:** 2026-09-23. Result: 603/603 automated checks passing (CI run `35809637645`, `feature/mvp-020-consent-deletion`, PR #9).
- **NOT tested:** screen readers, voice control, switch access, magnification, human manual review — unchanged from MVP-023's standing position.
- **Known open, carried forward, unaffected by this story:** BUG-013's residual framework-timing gap; BUG-014, open, non-reproducing, monitor-only, permanently instrumented.

### Done and merge

`planning/mvp-backlog.csv`/`planning/backlog.csv`: MVP-020 moves QA → Done. Merged via `gh pr merge` (not locally, not squashed). Open questions 46 and 47 stay formally open, unaffected by this Done marking — only question 48 was closed by this story's authorization.

## 2026-09-22 — MVP-018 open question 49

Issued directly by the product owner in chat ("PRODUCT-OWNER DECISION — MVP-018 OPEN QUESTION 49"), resolving `docs/open-questions.md` item 49 and authorizing implementation on `feature/mvp-018-email`. Full pre-work analysis: `planning/prework/MVP-018-prework-analysis.md`.

### Decision: option (a), SUBMITTED only

**Approved to send: a deletion-request acknowledgement on the `SUBMITTED` state only.** Every other transition is **not** approved in this story:
- `UNDER_REVIEW` — admin workflow churn, no user value.
- `WITHDRAWN` — user-initiated; the UI already confirms it at the point of action.
- `APPROVED` and `COMPLETED` — **withheld on a truthfulness ground, not a wording one.** MVP-020 executes no erasure; a message stating a deletion was approved or completed would describe an action the system does not perform. These become sendable only once a real erasure capability exists and open questions 46 and 47 (deletion-versus-append-only per data class; jurisdiction) are settled.
- `DENIED` — **recorded as a known gap, not an omission.** A user whose request is refused currently receives no signal at all. Excluded here because the refusal copy needs product-owner authorship, not because it lacks value. A future item.

### Authorization to modify MVP-020

**Explicitly authorized, and the only permitted change to completed story code under this authorization:** add the acknowledgement send to `POST /api/account/deletion-requests` (MVP-020), at the point of successful submission. Binding constraints:
1. One call at the point of successful submission — no refactoring, renaming, restructuring or tidying of adjacent code.
2. The send occurs **after** the request and its `SUBMITTED` event row are durably committed — never inside the transaction.
3. A send failure must not fail the request, roll it back, or change its state — the record is authoritative, the email is a courtesy. The failure is recorded via telemetry only; the route still returns success to the caller.
4. No retry — consistent with the story's single-attempt model (question 7).
5. No new state, column or flag on `DeletionRequest` to track send status. (Confirmed not needed: `EmailSend`, already proposed for the sign-in migration, is the send-outcome record — it does not require a `DeletionRequest` schema change.)
6. Minimal commit, referencing MVP-018 and question 49.

### Message constraints

**Classification: transactional.** Not gated by `MARKETING_EMAIL` consent — it is an account-security notice about a request the user themselves made, and must send regardless of marketing preference.

The copy states only that the request was received and will be reviewed. It must **not** state or imply: that data has been deleted or will be deleted, a timeframe, a legal right or entitlement, any regulatory regime, or any compliance claim. Sent only to the verified account address on record (never a client-supplied destination); no personal data beyond what identifies the request. **The copy is placeholder text for product-owner review** — generated wording is never treated as final, the same standing rule already applied to `PolicyVersion` (MVP-020).

### Rest of the story: approved as analysed, without amendment

- Migrate the existing sign-in email onto a real `ResendEmailAdapter` now; no second parallel sending path.
- No new preference table; `sendOptional` enforces MVP-020's existing `ConsentRecord` at send time, server-side, never from a client-supplied flag.
- Production sending stays blocked on the unresolved product-name/domain question (item 1); build and test without one.
- Synchronous send in the request path; record the tech-debt item; do not build a queue.
- Stateless, signed, single-purpose, scoped, expiring unsubscribe token; `GET` has zero side effects; cannot enumerate addresses, alter any other preference, or reveal whether an address is registered.
- No real email from CI or tests; console fallback when no vendor key is configured.
- Single attempt, outcome recorded, no retry.

Secret handling: `RESEND_API_KEY` and `EMAIL_UNSUBSCRIBE_SECRET` are environment-only, never committed, never logged, never a real value in an example file; added to `turbo.json`'s `globalPassThroughEnv` and `apps/web/.env.example` with placeholders; production fails safely (falls back to console logging, never fails to start) when absent. Recipient addresses and message bodies never appear in logs; telemetry records outcome and message type only. Any new UI surface joins the enumerated `packages/e2e` page/state list at 320/375/768/1280 across all three engines, including empty, loading, saved, error, denied and unsubscribe-confirmation states — no exclusion-list entry for a real page.

### Unchanged (restated)

Do-not-implement list stands: MVP-007, 008, 009, 011, 012, 013, 017; TD-004, 005, 006, 008, 009, 010; BUG-002; PROP-001 to PROP-006; pricing; Offer structured data; analytics (FR-016); creator and collections routes; compatibility workflow; search-behaviour changes; the deferred per-product sign-in policy field; erasure execution or retention jobs; promoting `develop` to `main`. No gate check weakened, skipped, quarantined or conditionally excluded; the accessibility self-check stays permanent and unconditional; BUG-014 stays open, monitor-only, permanently instrumented. Open questions 1, 2, 3, 7, 8, 24, 46 and 47 remain open — none resolved as a side effect. Completion rule unchanged (tests pass; all required checks green on the head being merged; DB-gated suites confirmed PASSED by reading the log; skip count 0 or explained; 0 retries; docs and traceability updated; security and accessibility reviews complete). Merge via `gh pr merge` only, never locally, never squashed.

### Process

Implementation authorized on `feature/mvp-018-email` for exactly the scope this entry and the pre-work analysis describe. If a new product decision surfaces mid-implementation, it is recorded with a safest reversible default and implementation stops for approval — not resolved unilaterally.

## 2026-09-23 — MVP-018: security and accessibility review, Done, merge (closes FR-013)

PR #10 (`feature/mvp-018-email`). First CI run (`35822261607`) is green on all three jobs on the first attempt: `Secret scan` (11s), `Format, lint, typecheck, test, build` (2m40s, 213/213 `@ppu/web` tests plus every other package's suite reading "passed" with no "failed" anywhere in the log, including the three new/extended packages), `Accessibility` (9m47s, **747 passed, 0 failed, 0 flaky**, test execution 7.7m).

**Budget note, recorded honestly, not smoothed over:** the accessibility job's total time (9m47s) stayed under the 10-minute hard ceiling but with materially less headroom than MVP-020's run (7m50s) — the ceiling was not exceeded, so no new decision is triggered by the story instruction's own policy, but the trend (MVP-010: ~7m; MVP-020: 7m50s; MVP-018: 9m47s) is worth watching. If the next story's own accessibility additions push a future run over 10 minutes, that is the point at which a new decision (sharding, trimming, a scheduled full run) is required, per the standing policy — not before.

### Security review

Every claim below re-verified directly against the actual committed code on the PR head, not re-asserted from the implementation plan.

- **Append-only, proven not assumed:** `grep -n "\.update(\|\.updateMany(\|\.upsert(" packages/adapters/notifications/src/notification-service.ts` returns nothing — zero mutation calls against `EmailSend` anywhere in the service.
- **RLS:** confirmed by reading `20260922040000_add_notifications/migration.sql` directly — `ENABLE ROW LEVEL SECURITY` in the same migration that creates the table.
- **`Restrict` FK, consistent with MVP-020:** confirmed in the migration SQL — `ON DELETE RESTRICT` on `email_sends.userId`.
- **Consent checked fresh, never cached:** `sendOptional` calls `this.privacyRepository.getCurrentConsent(userId)` on every invocation — confirmed by direct read; no caching layer, no client-supplied `granted` flag accepted anywhere.
- **No PII in logs or telemetry:** every `logger.info` call site in this story's new/changed code (`notification-service.ts`, the deletion-request route) carries only `messageType`, `status`, `userId` (an opaque id) — confirmed by grep across every file that logs; no recipient address, subject, or body anywhere.
- **The deletion-request send failure genuinely cannot fail the request:** verified by a dedicated route test (`route.test.ts`, 5/5) that mocks `sendTransactional` to reject and asserts the response is still `201` with the correct body — not just read from the code, exercised.
- **Recipient address is the verified account record, never the session token or a client-supplied value:** `prisma.user.findUnique({ where: { id: session.user.id }, select: { email: true } })` — confirmed by direct read; `session.user.email` (session-token-derived) is never used as the send target.
- **The unsubscribe endpoint is deliberately not session-gated, and cannot be misused as a result:** confirmed by grep — `getServerSession` appears nowhere in `apps/web/app/api/unsubscribe/route.ts` or `apps/web/app/unsubscribe/page.tsx`. Its safety instead rests entirely on the token: `verifyUnsubscribeToken` (10 unit tests) proves every failure mode — bad signature, expired, malformed, wrong category — returns the identical `null`, and the route/page render the identical generic "this link is no longer valid" response for all of them, confirmed by a dedicated route test (`route.test.ts`, 4/4) and the page's own rendering logic (no branch on *why* verification failed).
- **`GET` has zero side effects:** confirmed by reading `apps/web/app/unsubscribe/page.tsx` directly — it only calls `verifyUnsubscribeLinkToken` (a pure check) and renders; the only write path is `POST /api/unsubscribe`, triggered by an explicit button click, never automatically.
- **No direct vendor SDK calls from feature code:** the only `fetch` call to `api.resend.com` is inside `ResendEmailAdapter`; confirmed by grep — no other file in `apps/web` or `packages/adapters/notifications` references Resend's API.
- **Secret handling:** `RESEND_API_KEY` and `EMAIL_UNSUBSCRIBE_SECRET` are read only from `process.env`, added to `turbo.json`'s `globalPassThroughEnv` and `apps/web/.env.example` with placeholders (no real value); production falls back safely (`ConsoleEmailAdapter`, or `verifyUnsubscribeLinkToken` always returning `null`) when either is absent — confirmed by direct read, neither path throws or fails to start.
- **No compliance claim:** `grep -rin "gdpr\|pipeda\|ccpa\|compliant\|compliance\|certified\|certification"` across every new/changed file in this story returns nothing.
- No findings.

### Accessibility review sign-off

**Scope and method, not conformance — no claim of "WCAG compliant", "conformant", "accessible", "audited", "certified", or screen-reader support is made here or anywhere else in this story's records.**

- **What:** the same automated axe-core (blocking WCAG 2/2.1/2.2 A/AA tags, advisory best-practice) plus scripted real-key-press keyboard traversal with focus-indicator contrast measurement MVP-023 established — no new method.
- **Where, new in this story:** five `/unsubscribe` states (`unsubscribe-empty`, `unsubscribe-denied`, `unsubscribe-confirmation`, `unsubscribe-loading`, `unsubscribe-error`) plus three backfilling `/account/privacy`'s existing `MARKETING_EMAIL` toggle (`privacy-consent-saved`, `privacy-consent-loading`, `privacy-consent-error`) — each at 320/375/768/1280px, in chromium/firefox/webkit. All passed in the real CI run (`747 passed, 0 failed, 0 flaky`).
- **Two real defects found and fixed before any CI push, not after:** (1) `unsubscribe-empty`/`unsubscribe-denied`/`unsubscribe-confirmation` had no keyboard stops at all (plain text, no link or button) — fixed with a "Back to the home page" link, the same pattern `BUG-008` already established for the 404 page. (2) That link's own clickable box (163.8px × 21px) was under the WCAG 2.5.8 24px minimum target size — fixed with `inline-block` padding. Both caught by running the real scan locally against a production build, the verification discipline this project has followed since MVP-010's first CI-only failures — this time found *before* CI, not after.
- **Date:** 2026-09-23. Result: 747/747 automated checks passing (CI run `35822261607`, `feature/mvp-018-email`, PR #10).
- **NOT tested:** screen readers, voice control, switch access, magnification, human manual review — unchanged from MVP-023's standing position.
- **Known open, carried forward, unaffected by this story:** BUG-013's residual framework-timing gap; BUG-014, open, non-reproducing, monitor-only, permanently instrumented.

### Done and merge

`planning/mvp-backlog.csv`/`planning/backlog.csv`: MVP-018 moves QA → Done. Merged via `gh pr merge` (not locally, not squashed). FR-013 is Partially Implemented (MVP-018's half only — MVP-015's "save products" half is not started, depends on MVP-009).

## 2026-09-23 — MVP-018 merge / accessibility budget breach

Issued directly by the product owner in chat ("PRODUCT-OWNER DECISION — MVP-018 MERGE / ACCESSIBILITY BUDGET BREACH").

### 1. Merge authorized for this run only

CI run `35823121452` (PR #10's actual head, `1c25049`) reported the `Accessibility` job at **10m7s wall-clock**, exceeding the 10-minute ceiling `docs/final-decisions.md` established for MVP-023 (Q39) by 7 seconds. **This corrects the immediately preceding entry's "the ceiling was not exceeded" line** — that entry was written against `35822261607` (head `b567ce2`, 9m47s), the intermediate head before this same-day docs-only push created the new head actually being merged. **Merge is authorized despite the breach.** Rationale, recorded: the identical suite ran 9m47s on the immediately preceding head with no functional change between the two commits (the intervening push was documentation only) — this is runner variance at the edge of an already-tight budget, not a regression. The gate itself was not weakened: 747/747 passed, 0 failed, 0 flaky, 0 skipped, all three engines, all four widths, the full rule set.

**This decision applies to this one run only.** It is not a revision of the 10-minute ceiling and sets no precedent for merging over a future breach.

### 2. Mitigation trigger — a standing condition, binding on every future story

**A mitigation decision is required — implementation must stop and ask — before, not after, whichever of these happens first:**
- (a) any future story adds one or more new page states to the `packages/e2e` enumerated matrix (`GATED_PAGES`); or
- (b) any future CI run's `Accessibility` job total wall-clock exceeds 10m00s.

On either trigger firing: stop before implementation (or before merging, if the trigger fires on a run already in flight), present mitigation options with the measured numbers below, and wait for a decision. **Do not merge past a second breach on the strength of this entry** — this authorization is exhausted after the one run it names.

**Measurements required with the trigger report**, every time: total wall-clock and its breakdown (dependency install, browser install, cache hit/miss, migrations, build, test execution, artifact upload); whether the Playwright browser cache was warm, and if still cold, why, given that successful runs now exist to populate it; test execution time alone, against the original 5–8 minute target; page-state count and total check count, with the delta since MVP-023. Job overhead and test-execution time are measured and proposed on separately — they have different remedies and must not be conflated.

**Mitigation preference, recorded, not approved:** sharding is preferred when the decision is eventually taken, because it preserves every engine, width and rule and costs only runner minutes. Trimming the matrix and a reduced required-check set with a scheduled full run are second choices — both reduce what the gate observes on a pull request. This is a recorded preference to make the eventual decision faster, **not approval to implement sharding**, and Q39 stands unchanged: dropping engines, widths or rules is never the answer.

### 3. Free headroom — investigate only, do not implement

Before the next story begins, determine and report only: whether the browser cache is warm on recent runs; where the roughly two minutes of non-test job time is spent. Report findings; change nothing without a separate decision — no workflow, caching configuration, worker count, timeout, or suite-setting change is authorized by this entry.

### 4. Security review addendum (naming required by this decision)

Restating and completing the security review above against the specific items this decision names, each re-verified directly against the code on the actual merge-candidate head, not re-asserted:

- **The Resend adapter and key handling:** `ResendEmailAdapter` (`packages/adapters/email/src/resend-email-adapter.ts`) makes the only `fetch` call to `api.resend.com` anywhere in the codebase — confirmed by grep. `RESEND_API_KEY` is read once from `process.env`, passed only into that adapter's constructor, never logged, never echoed in a response (a non-2xx response body is deliberately never read into the thrown error — see `resend-email-adapter.ts`'s own comment). No verified sending domain exists (open question 1), so this adapter is never the one selected in CI or in any environment today; `ConsoleEmailAdapter` is.
- **The stateless signed unsubscribe token:** scope — `verifyUnsubscribeToken` yields exactly one `(userId, category)` pair, hardcoded to reject any category other than `MARKETING_EMAIL` even though nothing else is ever minted; expiry — 30 days, encoded in the signed payload itself (`exp`), checked against the current time on every verification, confirmed by a dedicated test asserting a token is accepted just before its expiry and rejected just after; no enumeration — the token carries an opaque `userId`, never an email address, and no code path in the verify function or the route queries the database by address; `GET` is side-effect-free — confirmed by reading `apps/web/app/unsubscribe/page.tsx` directly, it only calls the pure verify function and renders, the only write is the explicit-click-triggered `POST`.
- **The MVP-020 submission-path change:** post-commit — the `sendTransactional` call in `apps/web/app/api/account/deletion-requests/route.ts` is the last statement before the function's `return`, after `repository.createDeletionRequest` has already resolved and its `logger.info("deletion_request.submitted", ...)` has already run; non-failing — wrapped in a `try`/`catch` that swallows any throw, proven (not just read) by a route test asserting the response is still `201` when the send rejects; no retry — the `catch` block does nothing but discard the error, no loop, no requeue.
- **No recipient address or message body reaches logs:** every `logger.info` call site touched or added by this story (`notification-service.ts` ×5, the deletion-request route ×1) passes only `messageType`, `status`, and `userId` (an opaque id) — confirmed by reading every call site directly; grepped separately for the literal strings `to:`, `subject`, `text:`, `html:` anywhere near a `logger.` call and found none.

### Unchanged (restated)

No gate check weakened, skipped, quarantined or conditionally excluded; the accessibility self-check stays permanent and unconditional; BUG-014 stays open, monitor-only, permanently instrumented. The shelved gate-policy question (item 17) stays shelved — no override, quarantine lane, flake budget or skip is added as a side effect of this decision.

## 2026-09-23 — Accessibility suite mitigation: sharding implemented

Issued directly by the product owner in chat ("PRODUCT-OWNER DECISION — ACCESSIBILITY SUITE MITIGATION"). Implements the mitigation the immediately preceding entry's standing trigger required before MVP-017 pre-work could begin, since MVP-017 adds new page states to the `packages/e2e` matrix.

### 1. Trigger and governing measure

The preceding entry's trigger (b) fired: the most recent measured run's **test execution alone** reached **8.08 minutes**, exceeding the original 5–8 minute target — this is the number treated as governing here, not the 10-minute job-wall-clock ceiling. The job ceiling is corroborating evidence of the same underlying growth (already documented as breached once, by 7 seconds, in the immediately preceding entry) but is a **lagging indicator**: it also contains the job's roughly 118 seconds of largely fixed, non-test overhead (dependency install, browser install/cache, migrations, build), which does not grow with the suite and so masks how close test execution itself is running to its own limit. Per-shard test execution replaces job wall-clock as the governing measure from this point forward (see the new budget, below).

### 2. Decision: implement Playwright sharding

Implemented exactly as recorded as a preference (not yet approved) in the preceding entry. Every engine, every width, and the full rule set are preserved in every shard — nothing was trimmed, skipped, quarantined, or moved to a reduced required set.

### 3. Constraint-by-constraint record

1. **Shard count proposed from measurement, arithmetic stated.** Main test pool (all page-state checks, excluding the self-check): 711 tests, measured at 447 seconds of execution. Self-check (`negative-controls.spec.ts`, 12 tests × 3 engines = 36 executions): a fixed ~38 seconds, which must be paid **in every shard** (constraint 3), not divided across shards. Fixed per-job overhead: ~118 seconds. A first-pass estimate at 3 shards, computed *without* honestly including the self-check's per-shard cost, suggested 447s ÷ 3 = 149s ≈ 2.48min of test time — comfortably under target. Recomputed correctly, with the self-check's fixed cost added per shard: (447s ÷ 3) + 38s = 187s of test execution ≈ 3.12min; adding the reported job overhead for context: 149s + 38s + 118s = 305s ≈ 5.08min total job time — this **exceeds** the 5-minute test-execution target once counted honestly (the 5.08min figure includes overhead; test-execution-alone at 3 shards is 187s ≈ 3.12min, which does clear 5 minutes, but the margin against an 8-minute ceiling was judged too thin against expected CI runner variance already observed in the immediately preceding entry's 7-second breach). At **4 shards**: (447s ÷ 4) + 38s = 149.75s of test execution ≈ 2.50min; total job time 111.75s + 38s + 118s = 267.75s ≈ 4.46min — clears the 5-minute target with headroom and stays well under the 8-minute ceiling. **4 shards was selected.**
   - **Runner-minutes tradeoff, reported as required:** pre-sharding, one job ≈ 10.05min of runner time (approx., from the measured 8.08min test execution + 118s overhead). Post-sharding, 4 shards run in parallel (same wall-clock class per shard, ≈4.46min each) but **consume** 4 × 4.46min ≈ 17.85min of total runner-minutes — roughly 1.78× the pre-sharding runner cost, in exchange for keeping per-shard wall-clock comfortably under budget. This is a direct, reported cost of the mitigation, not hidden in the per-shard number alone.
2. **Single required check, partial-pass merge impossible.** Implemented via the aggregator pattern: `accessibility-summary` (named, unchanged, **"Accessibility (axe + Playwright)"** — the exact pre-sharding required-check name, so branch protection needed zero reconfiguration) `needs: accessibility` (the 4-shard matrix job) and runs `if: always()`, failing (`exit 1`) unless `needs.accessibility.result == 'success'`. GitHub's own matrix-job result is itself an aggregate across all matrix instances (`'success'` only if every instance succeeded), so a single shard failing fails the matrix job's reported result, which fails the aggregator, which fails the one required check. No shard can pass while another fails and still show green on the PR.
3. **Self-check runs and passes in every shard, all three engines.** Each shard's job runs the self-check (`negative-controls.spec.ts`) as its own separate `playwright test` invocation, with no `--shard` flag applied to it (it is excluded from the main pool via `--grep-invert` and run in full, unsplit, once per shard) — so all 12 tests × 3 engines run identically in each of the 4 shards. This was a deliberate design choice, not an accident of Playwright's own `--shard` semantics, which would otherwise scatter the self-check's 36 executions unevenly across shards and leave any individual shard without full self-check coverage.
4. **Failure-evidence capture and BUG-014 instrumentation verified, not assumed, to survive sharding.** `packages/e2e/src/failure-evidence.ts`'s `attachOnFailure` fixture is a per-test Playwright fixture with no shard-count or shard-index dependency in its own logic — but this was proven empirically rather than taken on that reading alone: a deliberate, temporary, uncommitted change to `harness-smoke.spec.ts` (one assertion forced to fail) was run under `--shard=1/1` and confirmed to produce the full expected attachment sequence (console/network/title-trace/navigation/page-HTML, reaching attachment #8 as expected from the source), then immediately reverted via `git checkout --` before any commit — confirmed clean, matching the original file, no lasting change.
5. **Sharding is deterministic.** Verified, not assumed, by running `playwright test --list` with the same `--shard=N/4` argument repeatedly against the same commit and confirming identical partitions and counts every time. Playwright's `--shard` splits the fully resolved, sorted cross-project test list by index; nothing in the suite (no `test.describe.configure({ mode: 'parallel' })` randomization, no time- or load-based ordering) perturbs that ordering.
6. **Total check count preserved, both numbers reported.** Main-pool coverage: pre-sharding 711 tests (post `--grep-invert` of the self-check) are, post-sharding, split 178/178/178/177 across the 4 shards — confirmed by summing the four `--list` counts, which equals 711 exactly, with zero drops and zero duplicates. Self-check coverage: pre-sharding, 36 executions total (12 tests × 3 engines), run once. Post-sharding, the self-check is **deliberately, explicitly replicated** — 36 × 4 shards = **144 total self-check executions** — to satisfy constraint 3's "every shard, every engine" requirement. This is reported here as a stated, intentional increase, not a silent duplication: **711 + 144 = 855 total test executions post-sharding**, against **711 + 36 = 747 pre-sharding** (matching the exact `747 passed` figure recorded in the MVP-018 merge entry above). The delta (+108 executions) is entirely the self-check replication required by constraint 3, and is the correct, expected count — not a defect to reconcile away.
7. **No change to worker count, timeouts, retries, engines, widths, or rules.** `playwright.config.ts`'s `workers: isCi ? 3 : undefined`, `timeout: 45_000`, `expect.timeout: 7_500`, `retries: 0`, the three engine projects, and the four viewport widths (driven from `src/matrix.ts`, unchanged) are untouched by this change. The only addition to that file is `E2E_OUTPUT_SUFFIX`-driven output-path namespacing (`outputDir`, HTML `outputFolder`, JUnit/JSON `outputFile`), required because each shard's job now runs two separate `playwright test` invocations (main pool, then self-check) that would otherwise silently overwrite each other's report/results — confirmed empirically, not assumed: running two invocations back to back locally without namespacing overwrote `results/summary.md`'s content outright (a 7-test summary was replaced by a 12-test summary with no trace of the first run). The suffix is empty/unset outside CI's sharded runs (local dev, `pnpm test:a11y`, the unsharded `build-and-test` job), so this is invisible everywhere else.

### 4. New budget, replacing the preceding entry's

**Governing measure: per-shard test execution time.** Target: under 5 minutes per shard. Ceiling: 8 minutes per shard. Job wall-clock is still reported in every run's summary (per constraint 1's arithmetic, expected ≈4.46min per shard including the ~118s fixed overhead) but is no longer the gating figure — see section 1, above, for why job wall-clock became a lagging indicator.

**The standing condition carries over, in this new form, unchanged in kind:** implementation must stop and a new decision must be requested before, not after, whichever of these happens first — (a) any future story adds new page states to the matrix once per-shard test execution is already at or over the 5-minute target, or (b) any future CI run's per-shard test execution exceeds the 8-minute ceiling. This is recorded as a standing condition on this record, not merely noted in a progress report, exactly as the preceding entry's trigger was.

**Report with every future run, per the same standard this entry was held to:** per-shard test execution time (each of the 4, individually), per-shard overhead, shard count, total check count (main-pool + self-check, both numbers, as in constraint 6 above), page-state count, and the delta since the immediately preceding story's numbers.

### 5. Branch, PR and merge process

Implemented on its own branch off `develop` (`chore/accessibility-suite-sharding`), never on `main`. A real PR is opened via `gh pr create`, never merged locally, never squashed. This is a CI-only change plus documentation: no product code changed, no test-logic change beyond what sharding mechanically requires (the grep-invert split and the output-path namespacing forced by running two invocations per job).

**Not Done until:** all required checks are green on the actual head being merged; every shard is green; the self-check passes in every shard, in all three engines; the total check count matches the expectation in constraint 6 (855, with the +144 self-check replication explained, not just the raw number); DB-gated suites are confirmed **PASSED** by reading the actual run log text (not the status tick — ANSI colour codes render as literal `^[[..m` in raw logs, a known reading hazard this project has hit before); skip count is 0, or every skip is individually explained; 0 retries. `docs/03-trd.md`'s PR-check list is updated with the exact new check/job names (`Accessibility shard 1/4`…`4/4`, `Accessibility (axe + Playwright)` as the aggregator).

### 6. MVP-017 / collections conflict — reported separately, not resolved here

Per this decision's own instruction, the apparent conflict between MVP-017's backlog scope, FR-014, and open question 24 (whether `/collections/[slug]` has an owning story) is investigated and reported to the product owner as its own item, with a safest reversible default proposed and **no unilateral resolution** — see the report delivered alongside this entry. MVP-017 pre-work does not begin until that conflict is resolved by the product owner.

### Unchanged (restated)

No gate check weakened, skipped, quarantined, or conditionally excluded, as a result of this change. The accessibility self-check stays permanent and unconditional (and is now replicated in every shard, per constraint 3). BUG-014 stays open, monitor-only, permanently instrumented — its instrumentation is confirmed (constraint 4) to survive sharding unchanged. The shelved gate-policy question (item 17) stays shelved — no override, quarantine lane, flake budget or skip is added as a side effect of this decision. The do-not-implement list from the preceding entries is unchanged and restated: MVP-007, 008, 009, 011, 012, 013, 014, 015, 016, 017, 019, 024, 025; TD-004, 005, 006, 008, 009, 010; BUG-002; PROP-001–006; pricing; Offer structured data; analytics; creator and collections routes; compatibility workflow; search behaviour changes; erasure execution or retention jobs; promoting `develop` to `main`. Open questions 1, 2, 3, 7, 8, 17, 24, 38, 46, 47 remain open.

### 7. CI confirmation — Done

PR #12 (`chore/accessibility-suite-sharding` → `develop`), CI run `35832293062`, first push, first attempt: all 6 checks green — `Secret scan` (8s), `Format, lint, typecheck, test, build` (2m23s), all 4 shards, and the `Accessibility (axe + Playwright)` aggregator (3s, correctly reporting success only once every shard had already reported success).

**Read directly from the raw run log, not the status tick** (per this decision's own Done requirement, and this project's standing practice — ANSI colour codes render as literal `^[[..m` in the raw log, confirmed again here):

| Shard | Job wall-clock | Main-pool result | Self-check result | Test execution (main + self-check) |
|---|---|---|---|---|
| 1/4 | 3m11s | `178 passed (1.2m)` | `36 passed (25.3s)` | 97.3s ≈ 1.62min |
| 2/4 | 4m40s | `178 passed (1.9m)` | `36 passed (51.1s)` | 165.1s ≈ 2.75min |
| 3/4 | 3m57s | `178 passed (1.8m)` | `36 passed (18.0s)` | 126.0s ≈ 2.10min |
| 4/4 | 4m24s | `177 passed (2.4m)` | `36 passed (22.6s)` | 166.6s ≈ 2.78min |

**All 4 shards clear the new 5-minute test-execution target with wide margin** (worst case 2.78min, well under half the ceiling); none approach the 8-minute ceiling. Per-shard overhead (job wall-clock minus test execution) ranges 93.7s–114.9s, consistent with the ~118s estimate used in the shard-count arithmetic.

**Main-pool count, verified by direct sum, not assumed:** 178 + 178 + 178 + 177 = **711** — the exact pre-sharding main-pool count, confirming zero drops and zero duplicates across the shard boundary. **Self-check count:** 36 × 4 shards = **144**, present and passing in every shard. **Total test executions: 711 + 144 = 855**, matching the number predicted in constraint 6 exactly.

**Zero failures, zero skips, zero retries — confirmed by grepping the full raw log**, not inferred from the green tick: every occurrence of the substring "failed" in the accessibility shards' output is a page-state test *name* (e.g. `signin-send-failed`, `unsubscribe-error @ ...: ... confirmation failed`), not a failing assertion; every occurrence of "retr" is Docker's own `--health-retries` service-container flag or ClamAV's internal startup socket-polling in the unrelated `build-and-test` job, not a Playwright retry. `retries: 0` in `playwright.config.ts` was never exercised because nothing needed retrying.

**DB-gated suites confirmed PASSED by reading the raw log text:** the `Format, lint, typecheck, test, build` job's `Test (unit + integration)` step shows every package's `Test Files` line as `N passed (N)` — including `@ppu/adapter-identity`, whose Prisma-Client integration tests ran (not self-skipped, since `DATABASE_URL` is set in CI) — with no `failed` count anywhere in that step's output.

**Definition-of-Done met.** This CI-infrastructure change is marked **Done**. Merged via `gh pr merge` (not locally, not squashed) once this confirmation was recorded.

### 8. External review requested and addressed, before merge

Per this decision's process requirements, the finished change was put to an independent code review (GitHub Copilot, given the exact workflow excerpt, playwright.config.ts, the grep-target string and describe structure, the count reconciliation, per-step timing from the Actions API, the full five-field branch-protection read, and the `git diff --stat` scope — a review-packet approach chosen specifically so the reviewer worked from verified artifacts, not a paraphrase). Six findings came back, ranked. Disposition of each, decided on its merits rather than accepted wholesale:

**Fixed (code, this same push):**
- **Finding 1 (HIGH) — hardcoded shard total.** `--shard=${{ matrix.shard }}/4` hardcoded the denominator while the job's own `name:` already derives it from `${{ strategy.job-total }}`. If the matrix list ever grows or shrinks without updating both places, the two drift silently — a confusing Playwright error, not an obvious misconfiguration. Fixed to `--shard=${{ matrix.shard }}/${{ strategy.job-total }}`; verified by re-parsing the workflow YAML afterward and confirming the `main` step's `run` block now contains `strategy.job-total`.
- **Finding 3 (MEDIUM) — no assertion on the self-check's own test count.** A passing self-check proves nothing if fewer of its 36 tests were collected than expected (e.g. a future change that broke `negative-controls.spec.ts`'s own discovery would still report "passed" on whatever subset survived) — this is exactly the "gate that can't fail" failure mode this project has been burned by before (BUG-014's history). Added a step, **"Verify the self-check ran all 36 tests,"** that reads the JUnit self-check report's root `tests` attribute and fails the shard if it is not exactly 36, or if the file is missing outright. The extraction logic (`grep -o 'tests="[0-9]*"' | head -1 | grep -o '[0-9]*'`, confined to line 1 so a child `<testsuite>`'s own `tests=` attribute is never matched by mistake) was **verified against a real downloaded artifact from this PR's own CI run** (`accessibility-report-shard-1`, `results/junit-selfcheck.xml`, root element confirmed `tests="36"` by direct inspection), not assumed from the JUnit format's documentation. A PCRE lookbehind (`grep -oP '...\K...'`) was tried first and rejected: it failed locally with a locale error ("supports only unibyte and UTF-8 locales"), so the simpler two-step `grep -o` was used instead specifically to avoid that fragility, and all three branches (correct count, missing file, wrong count) were simulated locally against the real artifact before being pushed.

**Verified, not changed (finding 4, MEDIUM — branch protection only partly checked):** this decision's earlier CI-confirmation section (section 7) had verified `required_status_checks.contexts` and `strict` only. Reading the full protection object confirms all five fields the original branch-protection decision specified: `enforce_admins: false`, `required_pull_request_reviews.required_approving_review_count: 0` (pull request required), `allow_force_pushes: false`, `allow_deletions: false`, matching `docs/open-questions.md` item 17 exactly. No drift found; nothing to fix.

**Documented, not changed (findings 2, 5, 6 — structural/informational, not code defects):**
- **Finding 2 — shard imbalance is real and the slowest shard, not the average, governs the budget.** Playwright shards by test *count*, not by measured duration, so shards with near-identical test counts (178/178/178/177) can still differ by roughly 2× in execution time depending on which page states each shard happens to receive. Recorded explicitly so a future reader budgets off the worst observed shard, not the mean: see the per-shard table in section 7 above — shard 4 has consistently been the slowest across every run in this PR. Not fixed: duration-balanced sharding would need a prior run's timing report as an input to the shard assignment, which is real added machinery not justified while every shard clears the target with room to spare.
- **Finding 5 — two `next start` server boots per shard.** Each shard's two `playwright test` invocations (main slice, then self-check) each spin up their own `webServer` (`reuseExistingServer: false`), so every shard boots the production server twice. This is part of why the 36-test self-check alone costs 19–30s per shard, and is a deliberate consequence of the output-namespacing design (section 3 of this decision) rather than an oversight: a single invocation covering both would break the two-invocation namespacing that prevents report clobbering. Left as is.
- **Finding 6 — the required-check name now sits on a near-empty aggregator job.** Documented directly where a future workflow editor would look: `docs/14-accessibility-testing.md`'s "CI job" section now carries an explicit caution that renaming `accessibility-summary` silently detaches branch protection from this gate, since GitHub matches required checks by name, not by which job does the real work.

**Cost, recorded as the reviewer requested rather than left implicit:** total test execution rose from the pre-sharding 485s (test-execution-alone, main pool) to approximately 554s summed across all four shards' main slices plus their four independent self-check runs — the self-check now runs four times instead of once, which is constraint 3's own deliberate cost, not a regression. Job wall-clock fell from 10m7s (the MVP-018 merge run that triggered this mitigation) to the confirmed 5m35s worst-shard wall-clock in section 7 — roughly a 45% reduction — purchased with roughly 76% more total runner-minutes, because the ~118s of largely fixed per-job overhead (install, browser setup, build) is now paid four times instead of once. This is the real trade this mitigation makes, stated in numbers so the next mitigation round (per the standing condition in section 4) starts from actuals rather than the shard-count arithmetic's original estimates.

**BUG-015 — an independent recommendation received, explicitly not adopted as a decision.** The same review was asked for an opinion on BUG-015's isolation-strategy options (recorded, not decided, in `planning/bugs/BUG-015.md`) and recommended per-package database isolation over sequencing the two packages' test tasks or test-side scoping, with a caveat that any per-package database provisioning must apply the same migrations (including RLS) as the shared one. **This is recorded in `planning/bugs/BUG-015.md` as a received recommendation, not promoted to an approved decision** — per this project's Decision Validation Rule, an AI reviewer's opinion is not one of the three approved-decision sources (`docs/final-decisions.md`, an approved ADR, or direct product-owner instruction), regardless of how well-reasoned. BUG-015 stays Open, unfixed, pending an actual product-owner/maintainer decision.

**CI confirmation of the fix push, run `35912193090`:** all 6 checks green (`Secret scan` 10s, `Format, lint, typecheck, test, build` 2m24s, shards 1–4 at 3m22s/4m6s/4m0s/4m12s, aggregator 3s). Counts unchanged and re-verified: 178+178+178+177 = 711, self-check 36×4 = 144, total 855 — the dynamic `${{ strategy.job-total }}` substitution produced the identical partition as the hardcoded `/4` it replaced, confirming the fix changed nothing about shard assignment, only its resilience to a future matrix-size change. The new **"Verify the self-check ran all 36 tests"** step is confirmed, via the Actions API (not the status tick), to have run and reported `"conclusion":"success"` in all 4 shards — the guard is live, not merely present in the YAML. Zero skips, zero retries, confirmed by the same raw-log grep discipline as every prior run in this decision. This is the head merged.

## 2026-09-23 — MVP-017 / `/collections/[slug]` scope conflict: decided by direct product-owner instruction

Section 6 of the "Accessibility suite mitigation" decision required this conflict to be investigated and reported before any MVP-017 pre-work, with a safest reversible default proposed and **not** applied unilaterally. That report was delivered in this session (MVP-017's backlog row, FR-014's exact text, the IA doc's URL model and page inventory, the data-model doc's Collection/CollectionItem listing with no Prisma model yet built, and open question 24's current text, all quoted directly, not paraphrased). The product owner then responded directly in chat: "you make the decisiton and jsut it man i am tried of you" — an explicit instruction to decide rather than continue asking, which is itself an approved source under the Decision Validation Rule (direct product-owner instruction, given in this session).

**Decision, adopting the proposed safest reversible default:** MVP-017's scope is **tutorials, patterns, learning paths, and comparison pages only** (FR-014's other four items, served at `/learn/[slug]` per the IA doc's routing). **`/collections/[slug]` and the `Collection`/`CollectionItem` catalog entities are excluded from MVP-017** and stay exactly as open question 24 already states: unresolved, must not be built unless separately approved. This mirrors the identical carve-out already applied to FR-003 (creator/collections routes, item 26) rather than inventing a new pattern. Nothing about `Collection`/`CollectionItem` changes here — no schema is added, no route is built, no traceability claim is made for them under MVP-017.

**Rationale:** FR-014's text and MVP-017's own title both gesture toward collections, but open question 24 is the more specific, product-owner-facing record on this exact route, was updated as recently as 2026-09-21 for the adjacent creator-profile question, and explicitly says collections "must not be built unless approved" — nothing in this session's report or the product owner's response supersedes that standing instruction. Splitting FR-014 this way is reversible: a future story can add collections without touching anything MVP-017 builds under this scope.

**Traceability:** `planning/requirement-traceability.csv`'s FR-014 row will be marked Partially Implemented once MVP-017 ships this narrowed scope (tutorials/patterns/learning-paths/comparison-pages), with a note that curated collections remain unbuilt pending open question 24. Open question 24 is updated to record this resolution without closing the question — collections themselves are still not approved for building.

## 2026-09-23 — MVP-017 implementation: content-publishing authorization reuses ADMIN

Engineering scoping call, made per CLAUDE.md's "safest reversible default" standard because no `EDITOR` role exists to author content and none may be invented (`packages/db/prisma/schema/identity.prisma`'s `UserRole` enum has only `MEMBER` and `ADMIN`). Recorded here, before any code that depends on it, per the Decision Validation Rule.

**Decision: content-publishing authority (create/edit/publish `Article` rows) reuses the existing `ADMIN` role. No `EDITOR` role or any other new role value is introduced, and no new mechanism to grant `ADMIN` is added.** FR-015 ("Admins can manage ... content ...", `docs/02-prd.md`) is the PRD-level basis for treating content publishing as an ADMIN capability, matching the precedent already set for MVP-020's deletion-request review surface (`docs/final-decisions.md`, "MVP-020 open questions 46, 47 and 48", question 48).

**Binding constraints, carried over unchanged from the ADMIN-role decision this reuses:**
- No application code path (route, server action, seed, environment variable, or test helper) ever assigns `ADMIN` — it remains a manual, undocumented-in-tooling operator action directly against the database.
- Every content-authoring/publishing surface is deny-by-default and server-side role-checked, giving a `MEMBER` (and an unauthenticated caller) the identical response — the same pattern `apps/web/app/admin/deletion-requests/page.tsx` and its API route already implement: no session or `role !== "ADMIN"` both render/return the same 404, never a distinguishable 401/403.
- Role is always re-queried fresh from the database (`prisma.user.findUnique`) on every request — never read from the session.
- `ADMIN` stays coarse-grained by design: this decision grants it no new *meaning*, only a new surface (content) that already checks for it, exactly as the original MVP-020 grant intended ("implies no capability beyond what MVP-020's own admin routes explicitly check for" — extended here to MVP-017's admin content routes by the same logic).

**Why this is the safest reversible default:** a future `EDITOR` role (finer-grained than ADMIN, scoped to content only) can be introduced later — as a new enum value plus new authorization checks on these same routes — without disrupting or reversing anything MVP-017 builds under this decision. Nothing here forecloses that; it only avoids inventing a role now that no approved source has authorized.

**Traceability:** cited by MVP-017's story record as the authorization basis for `apps/web/app/admin/content/*` and `apps/web/app/api/admin/content/*`.

## 2026-09-23 — MVP-017 implementation: `Article` only this pass; `LearningPath` deferred as a fast-follow within FR-014

Engineering scoping call, made per CLAUDE.md's "safest reversible default" standard. FR-014 (`docs/02-prd.md`) names five content types: tutorials, patterns, learning paths, comparison pages, and curated collections. Collections are already excluded from MVP-017 (see the immediately preceding 2026-09-23 entry). Of the remaining four, tutorials, patterns and comparison pages share one shape — a single authored document with a type discriminator — while a learning path is structurally different: an ordered sequence of items referencing *other* content, which needs its own data model (`LearningPath`/`LearningPathItem`), its own ordering/reordering UI, and its own referential-integrity questions (what happens to a path item when the content it references is unpublished or deleted) that a single-document model does not have.

**Decision: this MVP-017 pass builds `Article` only** — a single model with a `type` discriminator (`TUTORIAL | PATTERN | COMPARISON`) covering tutorials, patterns and comparison pages, at `/learn/[slug]` per the IA doc's routing. **`LearningPath`/`LearningPathItem` are explicitly deferred, not silently dropped** — they remain named, unbuilt placeholders in `docs/06-data-model.md`, exactly as `SEORecord` and (separately) `Collection`/`CollectionItem` already are.

**Consequence for traceability:** FR-014 is marked **Partially Implemented** by this story — Article-based content types only (tutorials, patterns, comparison pages); learning paths are not yet built. This mirrors the same "Partially Implemented" treatment already applied to FR-003 (`docs/final-decisions.md`, section C) for content the story's acceptance criteria doesn't yet cover.

**Open question recorded:** `docs/open-questions.md` gets a new numbered item stating that `LearningPath` needs its own follow-up story (or an approved MVP-017 scope extension) — not yet decided which, and not decided by this entry.

**Why this is the safest reversible default:** `Article` and `LearningPath` are additive, independent Prisma models — building `Article` now does not foreclose or complicate adding `LearningPath` later in a follow-up story or an approved scope extension of MVP-017 itself. Splitting the work this way keeps this vertical slice's blast radius (schema, migration, UI, API, e2e matrix) to one well-understood shape instead of two, consistent with CLAUDE.md's "keep the change small and complete" delivery rule.

**Traceability:** `planning/requirement-traceability.csv`'s FR-014 row is marked Partially Implemented once MVP-017 ships; `docs/06-data-model.md`'s "Engagement and content" section is updated with `Article`/`ArticlePublishEvent`'s real field-level shape, and explicitly notes `LearningPath`/`LearningPathItem`/`SEORecord` remain unbuilt placeholders pending the deferred follow-up.

## 2026-09-23 — MVP-017: security and accessibility review, Done, merge (closes FR-014, partial)

PR #14 (`feature/mvp-017-learn-content`). First push (run `35931158213`) failed 3 of 4 accessibility shards on a real, single-cause defect: the public `/learn/[slug]` page had no keyboard-reachable control at all (`article.body` renders as plain text with nothing else focusable), failing the keyboard-traversal check (WCAG 2.4.1) at every width, in whichever shard `learn-published` happened to land in. Diagnosed by reading each failing shard's step-level `conclusion` via the Actions API directly (not the status tick) to rule out two other log lines that looked alarming but were confirmed benign: "the destination stream closed early" (a Next.js streaming-response warning appearing between otherwise-passing tests) and a Postgres duplicate-key line (container-teardown log output from earlier in the run, not a live failure) — every other step in those shards, including the sharding suite's own self-check-count guard, succeeded cleanly. Fixed with the exact established pattern from BUG-008 and the unsubscribe page: a "Back to the home page" link (`inline-block py-2`, satisfying WCAG 2.4.1 and the WCAG 2.5.8 24px minimum touch target).

**Second push (run `35932897213`), the actual merge candidate: all 6 checks green.** Read directly from the raw log, not the status tick: the exact test that failed before (`learn-published @ 320px`/`@ 1280px`, keyboard traversal) now passes cleanly in chromium, firefox and webkit. `@ppu/adapter-content`'s DB-gated integration suite (`content-repository.integration.test.ts`, 7 tests) passed for real against CI's own throwaway Postgres — not self-skipped, confirmed by the literal `✓ ... (7 tests)` line in the `Test (unit + integration)` step's output. `@ppu/domain-content`'s `transitions.test.ts` (15 tests) passed in the same step. Zero skips, zero retries across all four accessibility shards, confirmed by grepping the full raw log (every "skipped"/"retr" hit is pnpm's own lockfile-resolution message or Docker's `--health-retries` flag, not a Playwright skip or retry).

### Security review

Every claim re-verified directly against the code on the PR head, not re-asserted from the implementation plan.

- **Authorization, deny-by-default, server-enforced:** confirmed by direct read of `apps/web/app/admin/content/page.tsx`, `apps/web/app/api/admin/content/route.ts`, `apps/web/app/api/admin/content/[id]/route.ts` and `apps/web/app/api/admin/content/[id]/publish/route.ts` — every one re-queries `role` fresh from `prisma.user.findUnique` on every request (never trusts the session), and a missing session or a non-`ADMIN` role produce the byte-identical 404/`NOT_FOUND` response, matching `/admin/deletion-requests`'s established pattern exactly. No `EDITOR` role was invented; content-publishing authority reuses `ADMIN`, per the dated decision above, citing FR-015's PRD basis.
- **No stored-XSS path:** confirmed by direct read of `apps/web/app/learn/[slug]/page.tsx` — `article.body` (untrusted Markdown, authored by an `ADMIN` today but treated as though anyone could write it, since it is rendered to every visitor) is placed as a plain React text child inside a `<div>`, never via `dangerouslySetInnerHTML`; React escapes every text node automatically, so no HTML in the body can ever execute. Tracked as an intentional first-pass limitation, not a gap: [TD-017](../planning/tech-debt/TD-017.md).
- **Immutability of publish state through the general edit path:** confirmed by direct read of `@ppu/domain-content`'s `ArticleUpdateInput` type and `apps/web/app/api/admin/content/[id]/route.ts`'s `PATCH` handler — `status`/`publishedAt` do not exist in the update input type at all, so a malicious or accidental PATCH payload cannot reach the database with them; publishing is only possible through the dedicated `POST .../[id]/publish` route, which itself re-validates the `DRAFT → PUBLISHED` transition inside the same database transaction as the write (`packages/adapters/content/src/content-repository.ts`'s `publishArticle`), never trusting a pre-check made outside the transaction boundary.
- **RLS and FK integrity:** confirmed by direct read of `packages/db/prisma/migrations/20260923000000_add_content/migration.sql` — `ENABLE ROW LEVEL SECURITY` on both new tables, in the same migration that creates them; `authorUserId`/`actorUserId` are `ON DELETE RESTRICT`, matching `privacy.prisma`'s established audit-trail rationale (a future user-deletion cannot silently destroy the record of who authored or published content).
- **No PII or sensitive data in logs:** every `logger.info` call site in the new content routes (`content.article_created`, `content.article_updated`, `content.article_published`) logs only `articleId` and `actorUserId` (both opaque ids) — confirmed by direct read of every call site; no title, body, excerpt or slug value is logged.
- **Input validation at the trust boundary:** confirmed by direct read of `@ppu/domain-content`'s validators (`isValidArticleSlug`/`isValidArticleTitle`/`isValidArticleBody`/`isValidArticleExcerpt`/`isValidArticleType`) and both API routes' `validateArticleFields` — every field is validated server-side before any database write, independent of whatever the client-side form does or doesn't check.
- **No compliance claim:** `grep -rin "gdpr\|pipeda\|ccpa\|compliant\|compliance\|certified\|certification"` across every new/changed file in this story returns nothing.
- No findings.

### Accessibility review sign-off

**Scope and method, not conformance — no claim of "WCAG compliant", "conformant", "accessible", "audited", "certified", or screen-reader support is made here or anywhere else in this story's records.**

- **What:** the same automated axe-core (blocking WCAG 2/2.1/2.2 A/AA tags, advisory best-practice) plus scripted real-key-press keyboard traversal with focus-indicator contrast measurement this project has used since MVP-023 — no new method.
- **Where, new in this story:** `learn-published` and `learn-draft-not-found` (the public `/learn/[slug]` read path) plus `admin-content-populated`/`-denied`, `admin-content-new`/`-new-denied`, and `admin-content-edit` (the `ADMIN`-gated editorial surface) — each at 320/375/768/1280px, in chromium/firefox/webkit as applicable. All pass in the real CI run (`35932897213`, all 6 checks green).
- **One real defect found by the real CI run and fixed before this review, not after:** `learn-published` had no keyboard-reachable control at all (WCAG 2.4.1) — fixed with the established "Back to the home page" link pattern (BUG-008). Confirmed fixed by reading the raw log directly: the exact test that failed on the first push now passes cleanly in all three engines on the second.
- **Date:** 2026-09-23. Result: all 6 required checks green (CI run `35932897213`, `feature/mvp-017-learn-content`, PR #14).
- **NOT tested:** screen readers, voice control, switch access, magnification, human manual review — unchanged from MVP-023's standing position.
- **Known open, unaffected by this story:** BUG-014 (open, monitor-only, permanently instrumented); BUG-015 (open, test-isolation flake, unrelated to content).

### Done and merge

`planning/mvp-backlog.csv`/`planning/backlog.csv`: MVP-017 moves QA → Done. Merged via `gh pr merge` (not locally, not squashed). FR-014 is Partially Implemented (`Article` — tutorials, patterns, comparison pages — done this story; `LearningPath`/`LearningPathItem` deferred, `docs/open-questions.md` item 50; collections excluded entirely, item 24).

## 2026-09-23 — Open question 2: invited and vetted third-party creators

Issued directly by the product owner in chat ("PRODUCT-OWNER DECISION — OPEN QUESTION 2").

**Decision: invited and vetted third-party creators. Not an open self-serve marketplace at MVP.** Flow: apply → moderator review → approved to publish. A creator cannot publish without an approved application.

**Rationale, as instructed to record:** matches what FR-008 and FR-010 already assume; caps quality and IP risk while the platform is unproven; loosening to open self-serve later is a policy change, not a re-architecture.

**Binding constraints:**
1. The creator application captures identity, public profile, support commitment and agreement acceptance, per FR-008.
2. **Payout details are captured as intent only. No live payment-provider onboarding in this story** — see open question 8, which stays open, and its own dated entry below recording that automated payouts were considered and set aside.
3. No self-serve publish path exists. Approval is a server-enforced precondition, checked at publish time, not a UI affordance.
4. Rejection, suspension and revocation of creator status are recorded as immutable audit events with actor, reason and timestamp.

**Closes:** `docs/open-questions.md` item 2. **Stays open:** items 3, 7, 8, the commission rate, and the new item 51 (MVP-011's legal-entity/conflict-of-interest dependency, recorded without being answered).

**Explicitly not decided by this entry, per direct instruction:** no commercial term, price, tier price, commission rate, payout mechanism, currency, tax position or refund policy. `docs/open-questions.md` items 3, 7 and 8 are updated with narrowed safest defaults only, each marked **NOT APPROVED** — see that file directly for the exact wording; it is not duplicated here.

## 2026-09-23 — Automated split payouts considered and set aside (open question 8 stays open)

Issued directly by the product owner in chat, as part of "PRODUCT-OWNER DECISION — OPEN QUESTION 2." Recorded as its own entry because it reverses a recommendation this session made in conversation (not in any file) before verifying it against existing scope.

An earlier recommendation in this session proposed building Stripe Connect Express (automated split payouts) now, as the payout mechanism for MVP-011. That recommendation directly contradicted an already-documented MVP boundary, confirmed by direct read of `docs/09-marketplace-operations.md`, "Multi-vendor payouts": *"Defer automated split payments until seller volume, tax/legal setup, identity verification and support operations justify the complexity. MVP may sell first-party products and manually onboard a limited creator cohort under approved commercial terms."*

**The standing position is unchanged: manual payouts for a founding cohort.** The creator application (open question 2's decision, constraint 2) captures payout intent only — no live Connect-style onboarding is built in that story. Automated split payouts remain a future, additive swap once seller volume justifies the complexity, per the existing `docs/09-marketplace-operations.md` boundary.

**Not to be re-proposed without an explicit reversal decision.** A future recommendation to build automated payouts must be presented as an explicit reversal of this entry and of `docs/09-marketplace-operations.md`, not slipped in as an implementation detail.

## 2026-09-24 — Product name (open question 1, partial)

Issued directly by the product owner in chat ("PRODUCT-OWNER DECISION — PRODUCT NAME (OPEN QUESTION 1, PARTIAL)").

**Decision: the product name is LowCodeStacks. Domain: lowcodestacks.com (registered).**

**Implemented, own branch (`rebrand/lowcodestacks`):** `apps/web/lib/seo/site.ts`'s `SITE_NAME` constant — the single source `SITE_NAME` was deliberately built to be (`docs/final-decisions.md` history; the constant's own header comment named exactly this eventuality) — updated from the "Power Platform Universe" working title to `"LowCodeStacks"`. The three places that had re-hardcoded the old name instead of importing the constant (the home page `<h1>`, the search page `<title>`, the sign-in email subject in `apps/web/lib/auth.ts`) now import and use `SITE_NAME` instead of carrying their own literal — so a future rename, should trademark clearance ever require one, is a smaller, more contained change than this one was. `packages/e2e/src/site.ts`'s own duplicate `SITE_NAME` — kept deliberately independent of the app's, per that file's own comment, so the accessibility gate's title assertions catch a real app-side drift rather than silently following it — was updated to the same value, with a new comment in both files stating explicitly that they are paired and must be changed together by hand; no shared import was introduced, since the harness's workspace `package.json` deliberately does not depend on `@ppu/web` and adding one would defeat the point of the duplication. `README.md`'s title updated. Test fixtures that hardcoded the old name as an *expected value* (not arbitrary example text) — `json-ld.test.ts`, `pages.test.tsx` — now import `SITE_NAME` too, for the same reason. `SessionsHeading.test.ts`'s use of the name was arbitrary example text for a pure string-matching function, not a real branding assertion; its literal was simply updated. `packages/e2e/src/title-trace.test.ts`'s own third hardcoded copy was replaced with an import from `packages/e2e/src/site.ts` (a same-package import, which does not touch the cross-package independence principle above). Verified: `pnpm build`/`typecheck`/`lint`/`test` all clean across the workspace; the home page and search page were checked directly in a browser against a real local database, confirming the rendered `<h1>`, the browser tab title, and the JSON-LD `WebSite.name` field all read "LowCodeStacks."

**Not changed, per explicit instruction:** the `@ppu/*` internal npm package scope (25 packages) — purely internal, never user-facing, and renaming it would touch every import statement in the codebase for zero external benefit; the GitHub repository name (`posiauday/PPUniverse`) — cosmetic, GitHub redirects the old URL, left alone to avoid unnecessary disruption to a repo where CI and branch protection are currently stable; any descriptive reference to Power Platform as the ecosystem the marketplace serves (e.g. the home page's own subtitle, the BRD's vision statement) — those describe what LowCodeStacks is a marketplace *for*, not the site's own name, and stay exactly as they were.

**`NEXT_PUBLIC_SITE_URL` requires no code change.** It was already built as a runtime environment variable (`apps/web/lib/site-url.ts`), never hardcoded, specifically so the domain could be decided independently of a code change. It must be set to `https://lowcodestacks.com` when a production deployment first exists — nothing is live today, so nothing needs setting yet.

**Open question 1 stays OPEN, narrowed to trademark clearance only.** The domain purchase does not settle clearance. Recorded assessment: "LowCodeStacks" is a descriptive name — "low-code" is generic industry vocabulary and "stacks" is common in software naming — which cuts both ways: low conflict risk against existing marks, but correspondingly weak as a registrable, enforceable mark of its own. For a marketplace whose durable advantage is inventory and trust rather than brand recognition, this trade is accepted, not treated as a defect to fix. **Close condition for this remainder of the question: a CIPO search and a clearance opinion** — neither performed yet, neither urgent before a production deployment exists.

**Constraints, restated, unchanged by this decision:** never use "Power" as a leading element of the product name, a subdomain, or a package name; any reference to Microsoft or the Power Platform ecosystem appears only as plain descriptive text; no "certified", "official", "approved", or endorsement phrasing anywhere.

## 2026-09-24 — TD-004 architecture and sequencing

Issued directly by the product owner in chat ("PRODUCT-OWNER DECISION — TD-004 ARCHITECTURE AND SEQUENCING"), following the pre-work analysis at `planning/prework/TD-004-prework-analysis.md`.

### 1. ADR-004 correction

The "Background jobs: BullMQ + Redis" row in `docs/adr/004-technology-decision-record.md` was never approved. The pre-work analysis's reading of that ADR's own Status line was correct: formal acceptance was limited to the testing-stack rows only, and `docs/final-decisions.md` never separately ratified the background-jobs row. **The ADR is amended** — the row is marked `~~BullMQ + Redis~~ — DRAFT, NOT APPROVED` and left in the table (not deleted), with a pointer to this decision, per direct instruction that the correction is more useful than a clean table.

**This is the third recorded instance of a table row, index entry, or summary being read as an approved decision when it was not one:** the marketplace license-tier structure (a relayed document presented it as already-locked; resolved 2026-09-18 by direct confirmation), `planning/bugs.csv`'s BUG-012/BUG-014 rows (the index disagreed with the records' own bodies and with git/CI evidence; resolved 2026-09-24), and this ADR row. A standing note recording this pattern is added to `CLAUDE.md`'s Decision validation rule section.

### 2. Architecture: Option A — Postgres-backed queue

**Decision: a Postgres-backed job queue in the existing database, workers claiming rows via `SELECT ... FOR UPDATE SKIP LOCKED`.**

**Rationale:** no new stateful service to provision, secure or back up; no new secret per environment; hosting-region-agnostic, so it does not front-run open question 5 (hosting region); and the DB-gated integration-test pattern this repo already uses (`describe.skipIf(!process.env.DATABASE_URL)`, an embedded/service-container Postgres in CI) extends to it directly, rather than adding a fourth CI service container alongside Postgres, MinIO and ClamAV.

**Rejected, with reasons recorded so they are not re-proposed** (full trade-off detail: `planning/prework/TD-004-prework-analysis.md`, §3):
- **Option B1 (BullMQ + Redis):** a second system of record for "did this job run" (Redis's own persistence-mode trade-offs create a reconciliation problem this project does not otherwise have); a new vendor/region choice coupled to the unresolved hosting decision; a fourth CI service container — for two known consumers with no stated throughput problem.
- **Option B2 (a managed queue platform):** vendor lock-in; for several candidates, a webhook-invocation model that contradicts `apps/worker`'s own shape (a long-running consumer process); several are hard to exercise offline, against this repo's consistent discipline of never depending on live vendor calls in CI.
- **Option C (outbox + scheduled retry):** solves durability but not request-blocking, which is the actual complaint both TD-004 and TD-015 record.

**Not decided here, left to the eventual story's own pre-work:** whether to use a library (`pg-boss`, `graphile-worker`) or hand-roll the claim/complete/retry mechanics. Either way, it is reached through the adapter pattern, exactly as `ResendEmailAdapter` and `S3StorageAdapter` already are.

**A new ADR is required before implementation** — this decision authorizes the architecture direction, not a completed ADR; `CLAUDE.md`'s "architecture defaults, not immutable vendor commitments... any change requires an ADR" still applies before code is written.

### 3. Sequencing: BUG-015 first

**BUG-015 must be resolved and merged before any job-queue implementation begins.** A job table is exactly the shared, mutable, cross-package state BUG-015 is about (`planning/bugs/BUG-015.md`) — landing queue infrastructure before the isolation strategy is settled creates a second surface for the identical flake, on a table every future integration suite will touch.

**BUG-015's isolation strategy is decided: per-package database isolation** — a distinct database or schema per test package, provisioned and torn down by the harness. This matches the recommendation already on record in `planning/bugs/BUG-015.md` from the external review conducted during the accessibility-sharding work. **Constraints, binding on that future implementation:**
1. Provisioning must apply the same migrations as production, including `ENABLE ROW LEVEL SECURITY` — a test schema that diverges from production is worse than the flake it replaces.
2. No production code change. `catalog-repository.ts`'s unscoped `PUBLISHED` scan is correct for a real sitemap and is not touched.
3. No sequencing of package test tasks as a substitute for isolation — it trades correctness for permanent serialisation and stops working the moment a third package touches the same tables.
4. CI runtime is reported before and after, the same discipline this project has used for every prior CI-shape change.

**This decision does not itself authorize starting BUG-015's fix** — per explicit instruction, that work gets its own separate authorization once this decision lands.

### 4. Open questions 52–56 recorded

See `docs/open-questions.md` for the full text of each. Summary: Q52 (job-queue architecture) closed by section 2 above; Q53 (sign-in email semantics once queued) closed — the sign-in send is not migrated, its blocking-and-failing behavior is deliberate and correct for a magic-link flow; Q54 (retry policy) closed as a revisable starting default (3 attempts, exponential backoff from 30s, then dead-letter); Q55 (dead-letter visibility) closed — an `ERROR`-level structured log line through the existing telemetry stack, no bespoke UI ahead of MVP-019; Q56 (worker process model) stays open, recorded as blocked on open question 5 (hosting), not as unanswered.

### 5. The queue foundation story — proposed, not approved

Added to `planning/proposed-stories.md` as **PROP-007, status Proposed**, using the scope, acceptance criteria and estimate anchor from the pre-work analysis's §7, unchanged. **Not added to the backlog. Not started.** Blocked on both BUG-015 (section 3 above) and its own approval. TD-004, TD-015, and MVP-012's release-file submission path are recorded as its three concrete, spec-grounded consumers; **MVP-009 and MVP-019 are recorded as under-specified consumers** — no requirement is invented for either, per the pre-work analysis's own finding.

### Unchanged (restated)

No queue, table, package, or worker is implemented by this decision. The file-scan and email paths are not modified. TD-006, MVP-007 and MVP-011 are not started under this authorization. Open question 5 and every other question not listed in section 4 remain exactly as they were. No gate check is weakened, skipped, quarantined or conditionally excluded; the accessibility self-check stays permanent and unconditional; BUG-014 stays open, monitor-only, permanently instrumented.

## 2026-09-24 — PROP-008 (Power Apps component generator/library): not pursued

Direct product-owner instruction ("You decide and let's finish this," following two rounds of research — this session's own informal generator-tooling pass, then the full `docs/research/power-apps-components/` package researched and written this session, including a follow-up pass adding `pcf.gallery` after this decision was first drafted). The product owner explicitly delegated the build-or-not call; this section records that call and the evidence behind it, per the Decision Validation Rule's third approval path (direct product-owner instruction given in this session).

**Decision: PROP-008 is not pursued at this time.** `planning/proposed-stories.md`'s PROP-008 entry is updated to reflect this — kept as a record, not deleted, in case conditions change later. `docs/open-questions.md` item 60 is closed accordingly.

**Reasoning, grounded in the research package's own evidence, not asserted:**
1. **The Canvas component market is already adequately served for the dominant Maker persona** (`docs/02-prd.md`'s own persona: wants "a fast, copy-ready component with setup instructions"). Two real, functioning competitors exist: PowerAppsUI (free, MIT, 35 catalogue entries) and PowerLibs (paid, proprietary, ~170–182 entries). Neither is a failed or abandoned product — both show real, ongoing investment.
2. **The PCF side is not an open field either.** `pcf.gallery`, found in a follow-up pass, is a multi-year (active since at least 2019), MVP-operated community directory with hundreds of listed controls and an existing commercial "Store" channel already soliciting paid ISV listings. A new entrant on the PCF side would be competing against established reach and community trust, not filling an empty gap.
3. **The one real, consistently-found differentiation angle — verified accessibility/performance/compatibility evidence — is unproven as a demand driver, not just undelivered by competitors.** No source in the research (including two rounds of web search for community demand signals, both returning nothing) shows Power Apps makers or buyers actually asking for this over a larger free catalogue. The inference that an "Architect" persona would value it comes from this project's own PRD, not from external market evidence.
4. **Every credible precedent in this space is a single-operator effort**, including the ones with real installed-base traction — PowerAppsUI (solo maintainer), PowerLibs (founder-led), `pcf.gallery` (one MVP). One of the most-installed relevant tools found in the entire research pass, "PCF Builder" (24,687 VS Code Marketplace installs), was abandoned in 2021 despite that install base — a concrete example that popularity alone hasn't kept similar efforts alive in this space.
5. **No live consumer exists yet.** LowCodeStacks has no creator pipeline live (open question 2 is closed in principle, but MVP-011 — the story that would actually onboard creators — has not started), so anything built under PROP-008 today would have no user until that pipeline exists regardless of its own merits.
6. **Opportunity cost.** This project's own core marketplace scope (creator onboarding, licensing, entitlements) is still incomplete and is the work `CLAUDE.md`'s "Product objective" actually charters this MVP to ship first. PROP-008 would compete directly with that for effort.

**Not closed off permanently** — if the creator pipeline matures, if a real demand signal for verified-quality evidence emerges, or if either existing competitor's position changes materially, this is a legitimate candidate to revisit. The full evidence trail (`docs/research/power-apps-components/`) stays in the repository specifically so a future re-evaluation doesn't have to start from nothing.

### Unchanged (restated)

No component, package, or UI was built. No requirement ID was created. No pricing, licensing, or architecture was decided for PROP-008. `docs/research/power-apps-components/`'s own findings are unchanged by this decision — this section only records what the product owner decided to do with those findings, not a revision of the research itself.

## 2026-09-24 — First-party-only publishing model (supersedes open question 2's earlier decision)

Direct product-owner instruction ("PRODUCT-OWNER DECISION — FIRST-PARTY-ONLY PUBLISHING MODEL"), following the read-only impact analysis this session produced on request (`planning/prework/first-party-only-impact-analysis.md`), then a second direct instruction ("PRODUCT-OWNER DECISION — FIRST-PARTY-ONLY FOLLOW-UP") authorizing the documentation and planning update this entry, and the rest of this pass, implements. **Documentation and planning only — no product code, schema, UI, route, API, or test changed by this decision or by the pass that follows it.**

### 1. Final business model

**LowCodeStacks is first-party-only.** Only an authorized LowCodeStacks administrator (the existing `ADMIN` role, already built — MVP-017, MVP-020) may create, publish, and sell products. No third-party creator or seller program exists in the approved scope. Visitors and customers cannot become creators or sellers, cannot publish products, cannot submit commercial products for sale, cannot receive commission, royalties, or payouts, and cannot create seller profiles or hold product-authoring/publishing permissions.

External users **may eventually submit suggestions** (a separate, not-yet-approved capability — see `planning/proposed-stories.md`, "Asset and Content Suggestions"). A suggestion creates no ownership right, no creator or seller relationship, no entitlement to payment or commission, no promise that LowCodeStacks will implement it, and no permission to submit confidential or third-party-owned material.

### 2. This explicitly supersedes, and does not erase, the earlier decision

**This entry supersedes "2026-09-23 — Open question 2: invited and vetted third-party creators" and its companion "2026-09-23 — Automated split payouts considered and set aside" entry, above.** Both historical entries are preserved exactly as written — not deleted, not rewritten — because they are an accurate record of what was decided and why at the time. This entry records that the business model has since changed, and why, not that the earlier decision was a mistake when it was made.

**Rationale, as instructed to record:** the product owner does not want third-party sellers; external users should provide suggestions only; seller onboarding, creator agreements, commission, payout, tax, and creator moderation are unnecessary for the approved model; first-party-only publishing materially reduces commercial, legal, operational, security, and support complexity.

### 3. MVP-011 — Superseded

`planning/mvp-backlog.csv`'s MVP-011 row (Creator application, FR-008) is marked **Superseded** — not Cancelled, not Removed, and explicitly **not renamed into a suggestion story**. The product-owner instruction is direct on this last point: *"A visitor suggestion inbox is a separate possible capability with different requirements, data, risks and acceptance criteria."* Reason for supersession: the story implements a third-party creator-onboarding model that is no longer part of the approved business model. See `planning/mvp-backlog.csv` and `planning/backlog.csv` for the updated row, and `planning/requirement-traceability.csv` for FR-008's updated traceability.

### 4. FR-008 — Superseded, not rewritten

FR-008 (*"Creator application captures identity, public profile, payout readiness, support commitment and agreement acceptance"*) is marked superseded in `docs/02-prd.md`, with the original text preserved and an explicit note of why it no longer applies — **not rewritten as though it always described suggestions.** Historical traceability in `planning/requirement-traceability.csv` is preserved alongside the supersession note.

### 5. MVP-013 — Superseded in its current form; quality requirements redistributed, not discarded

MVP-013 (Submission review queue, FR-010) is marked **Superseded** in its current creator/product-submission-moderation form. Per direct instruction, it is **not** converted into creator-application review, a suggestion inbox, a third-party product queue, or a nominal self-review workflow where the product owner approves their own submission. Its acceptance criterion, *"Reviewer can approve/request changes/reject with reason,"* has no first-party equivalent as written — reviewing someone else's submission presumes a submitter distinct from the reviewer, which first-party-only does not have — and is not force-fitted anywhere. The quality requirements MVP-013 was meant to protect are redistributed explicitly:

- **Product draft authoring and pre-publication validation** → MVP-012 (Product and release editor), which already owns the authoring surface these checks run inside.
- **Immutable release/version rules** → MVP-014 (Immutable published releases), already its own story, unaffected in substance.
- **Automated security, file scanning, compatibility validation, licence checks, and release checks** → remain with their existing owning gates: MVP-006 (file-scan pipeline, Done), TD-006/TD-008 (compatibility-evidence write-time validation and vocabulary, TD-006 Open, TD-008 Partially Resolved), and MVP-014's own release-immutability enforcement. None of these depended on a third-party creator role to begin with — they were always server-side, always going to run regardless of who authored the product.
- **Administrative operations and audit visibility** → MVP-019 (Operations console and audit), where still applicable — a first-party-authored product still needs an audit trail of who published/unpublished/retired it.

No quality, security, accessibility, licence, or audit requirement is discarded by this redistribution — each one moves to a story that already existed and already owned the underlying mechanism, independent of the creator/seller question.

### 6. MVP-012 — the next first-party authoring story; dependency changed

MVP-012 (Product and release editor, FR-009) becomes the next first-party authoring story. Its dependency changes from `MVP-006;MVP-011` to **`MVP-006`** (already Done), with TD-006 and TD-008 noted as the compatibility-evidence write-path prerequisites where applicable (TD-006 Open, TD-008 Partially Resolved — neither blocks MVP-012's own start, both are relevant to what MVP-012 must correctly call). **MVP-011 no longer gates MVP-012 in any form.**

The existing `ADMIN` authorization pattern (deny-by-default, re-queried server-side per request, no application code path grants it automatically — the same pattern MVP-017 and MVP-020 already established) is the approved authoring authority. **No `CREATOR`, `SELLER`, `EDITOR`, or `PUBLISHER` role is created.**

MVP-012 remains responsible for a first-party administrator's ability to: create and edit product drafts; manage product descriptions and documentation; upload files through the existing secure upload/scanning path (MVP-006); manage screenshots or media only where already approved (PROP-001, still Proposed); set licence offerings; record compatibility information and evidence; create releases and versions within the approved release workflow; submit the product to the applicable automated quality gates; publish only when server-side conditions pass; unpublish or retire where approved; and maintain changelogs and support information.

**Pricing is not implemented until open question 7 is answered. Checkout is not implemented until open question 3 is answered.** Neither is answered by this entry.

### 7. MVP-014, MVP-019, MVP-024, MVP-025 — dependencies and wording re-evaluated

Third-party creator, seller, commission, and payout assumptions are removed from these four stories' framing. What remains meaningful and is retained: immutable release history (MVP-014); product lifecycle, orders, refunds, entitlements, administrative controls, content management, product retirement, and audit events (MVP-019); customer support (MVP-024); launch readiness (MVP-025). No acceptance criterion in MVP-014, MVP-024, or MVP-025 depended on a third-party creator/seller concept to begin with (confirmed directly against each story's own acceptance-summary text in `planning/mvp-backlog.csv`), so none become obsolete or need a new owner. MVP-019's acceptance criterion (*"Sensitive actions are authorized and auditable"*) is unaffected in substance; the "creators" entry in FR-015's underlying admin-manageable-entity list (`docs/02-prd.md`) becomes moot without changing MVP-019's own scope.

### 8. Open questions updated

- **Item 2**: **CLOSED** by this decision. The earlier invited/vetted third-party creator decision is recorded as superseded, not erased.
- **Item 8**: **CLOSED AS OBSOLETE.** Creator commercial terms and creator payout models do not apply — LowCodeStacks has no third-party sellers.
- **Item 51**: narrowed. The MVP-011-specific and employment-conflict-of-interest wording is removed (MVP-011 no longer exists to be gated by it). What remains, recorded separately and narrowly: *"Legal entity and commercial readiness before LowCodeStacks accepts real payments, enters customer contracts, or begins production commercial operations."* **This does not currently exist and is not claimed to exist.** It does not block MVP-012 pre-work or first-party-authoring implementation — those don't involve real payments, customer contracts, or production commercial operations.
- **Item 7**: **stays open**, narrowed to first-party product pricing, licence-tier price relationships, and any future support/update pricing. Not resolved by this entry.
- **Item 3**: **stays open**, unchanged in substance — first-party checkout jurisdictions, currencies, tax, refunds, and consumer obligations. Not resolved by this entry.

Full updated text for each: `docs/open-questions.md`.

### 9. Compatibility-evidence display wording — a follow-up decision, not a schema change

The stored `CompatibilityEvidenceStatus.CREATOR_DECLARED` and `SupportStatus.CREATOR_SUPPORTED` enum values (`packages/db/prisma/schema/evidence.prisma`) are **not renamed, and no enum value is destructively changed, in this pass.** Recorded as a follow-up presentation decision only: **`CREATOR_DECLARED` should display as "Publisher declared."** `CREATOR_SUPPORTED` needs its own, separate wording review, since the exact intended evidence meaning (who is making the support commitment, and what it means under first-party-only) must be preserved, not assumed. No schema, validator, production presentation code, snapshot, or test is changed by this entry — see TD-018 (`planning/tech-debt/TD-018.md`) for the scoped follow-up record.

### 10. Suggestion capability — proposed, not approved

Recorded in `planning/proposed-stories.md` as **PROP-009, "Asset and Content Suggestions," status Proposed — not approved, not scheduled, not an MVP-012 dependency.** Full detail there. **Not built. Not scheduled. Explicitly not MVP-013 continued under a new name** — a visitor suggestion inbox is a separate capability with its own requirements, data, risks, and acceptance criteria, per direct instruction.

### 11. Third-party commercial surfaces marked out of scope

Creator applications, creator public profiles, seller onboarding, seller roles, creator publishing permission, seller agreements, creator support commitments, creator payout readiness, creator bank/payment/tax details, marketplace commissions, creator earnings/balances, payout schedules/thresholds, Stripe Connect (for creators), creator suspension/revocation, multi-seller disputes, and creator-product ownership relationships are all marked out of scope, unless needed for historical documentation (which the preserved, superseded decision entries above already satisfy). **Customer, order, licence, entitlement, refund, support, and first-party publishing concepts are unaffected and remain valid** — none of them depended on a third-party creator/seller concept.

### Unchanged (restated)

No product code, schema, UI, route, or API changed. No test changed. No CI change. No enum value changed or removed. No role created. Questions 3 and 7 are not resolved. MVP-007 is not started. No security or accessibility gate is weakened. No historical decision record is erased or rewritten.

## 2026-09-25 — MVP-014 immutable published releases: implementation authorization and decisions

Direct product-owner instruction ("PRODUCT-OWNER DECISION AND IMPLEMENTATION AUTHORIZATION — MVP-014 — IMMUTABLE PUBLISHED RELEASES"), following the read-only pre-work analysis this session produced on request (`planning/prework/MVP-014-prework-analysis.md`, 22-section classification of 19 candidate scope items). Implemented on `feature/mvp-014-immutable-releases-prework`. **Not merged under this authorization** — see the story's own status in `planning/mvp-backlog.csv` (QA, not Done) for the merge gate.

### 1. Scope boundary: MVP-019 owns Product suspend/archive, not MVP-014

**Confirmed by direct instruction:** `docs/09-marketplace-operations.md`'s four-state Product lifecycle (draft, published, suspended, archived) is owned by MVP-019. MVP-014 touches only the release-level immutability axis — a published `Release` can never be corrected or replaced — and does not add `SUSPENDED`/`ARCHIVED` to `ProductStatus` (confirmed still `DRAFT | PUBLISHED` only) or otherwise change `Product.status` semantics. A `Product` stays editable and re-publishable (further draft releases) for its whole life; only a published `Release` freezes.

### 2. Minimal `ReleasePublishEvent`: `action = "PUBLISHED"` only

Approved and built: a `ReleasePublishEvent` model (`packages/db/prisma/schema/evidence.prisma`), structurally identical to the existing `ArticlePublishEvent` precedent — `id`, `releaseId` (FK `Release`, `Restrict`), `productId` (FK `Product`, `Restrict`, denormalized for query convenience), `actorUserId` (FK `User`, `Restrict`), `action` (enum, **only `PUBLISHED` is a member — no other action value is approved**), `createdAt`. `ENABLE ROW LEVEL SECURITY` with zero policies, in the same migration that creates the table (not a later fix — MVP-012's own review found `release_files` missing this once; not repeated here). One event is written per release publication, on **both** the product's first release (`publishProductWithRelease`) and any subsequent release (`publishSubsequentRelease`), so the audit trail has no gap at a product's very first publish — a deliberate extension beyond a literal "subsequent releases only" reading, justified because auditing only later publishes would leave every product's inaugural release unaudited, an inconsistent and confusing gap for an audit trail whose entire purpose is completeness. `ProductPublishEvent` (named in the instruction's own required-reading list) does not exist anywhere in the codebase and was not built — only `ReleasePublishEvent`.

### 3. Concurrency: atomic conditional update required, a plain read-then-write is not sufficient

**Technical correction, binding on this and future release/entitlement-state-transition work:** a Prisma `findUnique`-then-`update` inside a `$transaction` does **not** by itself prove exclusivity under concurrency — Postgres's default `READ COMMITTED` isolation lets two concurrent transactions both read `publishedAt: null` before either writes. The invariant ("a Release transitions unpublished → published at most once, `publishedAt` never changes after") is enforced instead by an **atomic, database-backed conditional update**: `tx.release.updateMany({ where: { id, productId, publishedAt: null }, data: { publishedAt } })`, checking `.count !== 1` — Postgres's row-level locking on the `UPDATE` statement itself (not the earlier `SELECT`) is what guarantees exactly one concurrent caller wins. The readiness checks (CLEAN file, product-level license/support/compatibility fields) are re-verified **after** the claim, inside the same transaction, so a losing race or a stale readiness check rolls back the entire transaction — including the tentative claim — rather than leaving a not-ready release published. Proven against a real database, not just asserted: a genuine `Promise.allSettled`-based concurrency test (two simultaneous publish attempts on the same release) confirms exactly one fulfilled, one rejected, exactly one database state transition, and exactly one audit event.

**Extended, as a self-identified safe refactoring, to the existing `publishProductWithRelease`** (merged in MVP-012, PR #23): it had the identical latent read-then-write concurrency gap. Fixed with the same `updateMany`-gated pattern on both `Product` (`status: "DRAFT"` in the `WHERE`) and `Release` (`publishedAt: null` in the `WHERE`), and extended to write the same `ReleasePublishEvent` audit record (see section 2). This is invisible to any correctly-behaving single caller and only hardens the previously-unsafe concurrent-misuse case — no existing test's expected behavior changed, confirmed by the full existing `publishProductWithRelease` test suite passing unchanged plus its own new atomicity assertion.

### 4. No compatibility/licence snapshots; `Entitlement` unchanged; no `ChangelogEntry`

**Explicitly out of scope, confirmed by direct instruction:** MVP-014 does not snapshot `ProductLicense`, `SupportPolicy`, or `CompatibilityEntry` at the moment a release is published — those stay product-scoped and mutable exactly as MVP-005/MVP-012 built them. This is a recorded, known gap, not an oversight: see [TD-021](../planning/tech-debt/TD-021.md). The product-scoped `Entitlement` model (MVP-010) is unchanged — entitlements remain per-product, not per-release. `ChangelogEntry` remains an unbuilt, out-of-scope placeholder; `Release` has no `notes` field in the current schema, so the instruction's conditional "use the existing `Release.notes` field" requirement is correctly inapplicable (the field does not exist) — no new field was added, avoiding scope creep into `ChangelogEntry`-adjacent territory.

### 5. No `currentReleaseId` pointer; existing query shape retained; `Product.publishedAt` never changes on subsequent-release publish

**Explicitly retained, confirmed by direct instruction:** the "current" published release for a product with more than one is still derived by query — `publishedAt DESC, createdAt DESC, take 1` — unchanged from MVP-012. No `currentReleaseId` pointer or sequence field was added to `Product`. **`Product.publishedAt` is set exactly once, by the product's own first release/publish (`publishProductWithRelease`), and is never touched by `publishSubsequentRelease`** — confirmed by the implementation (the subsequent-release transaction's final read of `Product` is a plain `findUnique`, not re-derived from any write, since nothing in that transaction writes to `Product`).

### 6. Two separate methods, deliberately not unified

`publishProductWithRelease` (requires `Product.status === "DRAFT"`) and `publishSubsequentRelease` (requires `Product.status === "PUBLISHED"`) are kept as two distinct repository methods with opposite preconditions, per direct instruction not to add a blanket rule or share logic in a way that would weaken either one's guard.

### 7. New route, extends existing UI

`POST /api/admin/products/{productId}/releases/{releaseId}/publish` (new route, mirrors the existing publish route's authorization/error-mapping structure exactly). The existing `ReleasesEditor` admin component is extended (a `PublishReleaseControl` shown for a `DRAFT` release when the product is already `PUBLISHED`) — no new admin shell was built.

### 8. Accessibility: only actually-implemented states added

Two new Playwright a11y states were added to the existing page-state matrix (`packages/e2e/src/pages.ts`): `admin-products-edit-published-draft-ready` (a published product with a ready-to-publish draft release) and `admin-products-edit-published-draft-not-ready` (a published product with a not-yet-ready draft release), each at 320/375/768/1280px. No state was added for functionality not actually built.

### Unchanged (restated)

No `Product.status` enum value added or removed. No `EDITOR`/`PUBLISHER`/`CREATOR` role created. No pricing, checkout, or commerce code touched. No existing route's authorization pattern changed. `main` still requires a promoted release, separate from `develop`'s ordinary PR flow. Merge remains a separate, later authorization — never implied by this entry.

## 2026-09-26 — MVP-019 operations console and audit: open questions evaluated and decided

**Provenance, stated plainly:** `planning/prework/MVP-019-prework-analysis.md` (2026-09-26) surfaced five open questions rather than deciding them, per this repository's own established pre-work pattern. The product owner then directly instructed, in chat, that this session evaluate and decide them itself this time, rather than waiting for separate product-owner answers to each ("this time you evaluate and decide"). This is recorded as what it is — the agent's own reasoned evaluation, made under direct, explicit product-owner delegation of the decision — not as an independent product-owner judgment reached without that delegation. Per the Decision Validation Rule, direct product-owner instruction given directly in this session is itself an approved source; this entry is what makes that instruction durable rather than lost to chat history.

### Question 1 — `ProductStatus` transition graph for `SUSPENDED`/`ARCHIVED`

**Decided:** `PUBLISHED → SUSPENDED`, `SUSPENDED → PUBLISHED` (reinstate), `PUBLISHED → ARCHIVED`, and `SUSPENDED → ARCHIVED` are the only valid transitions. `ARCHIVED` is **terminal** — no code path transitions out of it. `DRAFT → SUSPENDED` and `DRAFT → ARCHIVED` are both **rejected** — a draft was never public, so there is nothing to suspend, and folding "abandon an unpublished draft" into the same `ARCHIVED` value as "retire a once-public product" would give one enum value two different meanings. No-op self-transitions (e.g. `PUBLISHED → PUBLISHED`) are also rejected, to keep the audit trail free of meaningless entries.

**Why:** `SUSPENDED → PUBLISHED` must exist or suspension is a one-way door, defeating its purpose as a *temporary* measure — the whole reason `docs/09-marketplace-operations.md`'s four-state model separates "suspended" from "archived" is that one is meant to be reversible and the other isn't. Making `ARCHIVED` terminal is the safer default of the two possible mistakes: if it turns out products sometimes need to come back from `ARCHIVED`, that is an additive follow-up (add an `UNARCHIVE` transition later); the reverse mistake — building an unarchive path now, then discovering "permanently retired" needed to actually mean permanent — is not something a later change can cleanly undo once administrators have relied on it.

### Question 2 — Entitlement holders' access when a Product is suspended or archived

**Decided: suspending or archiving a Product does not touch any `Entitlement` row.** Existing entitlement holders keep unchanged read/download access regardless of the Product's current `status`. Suspend/archive affects public discoverability only (the product drops out of listing, category, search and its own detail page becoming publicly reachable) — it is not a revocation mechanism.

**Why:** `Entitlement.revokedAt` already exists, precisely as the dedicated tool for cutting off access (MVP-010, "reserved and enforced at read time... nothing in this story ever sets it"). Silently wiring suspend/archive to also revoke entitlements would conflate two different administrative intents — "stop selling/showing this to new visitors" versus "existing owners lose what they already have" — under one action, which is exactly the kind of hard-to-reverse, customer-facing behavior change that deserves its own explicit decision with its own reasoning (a security takedown and a temporary sales pause are not the same thing), not an assumption folded into this story.

### Question 3 — "Manage users" (FR-015) scope for MVP-019

**Decided: out of scope for MVP-019.** No admin user-management UI, no user ban/suspend capability, and — critically — **no code path that changes `User.role`** is built by this story. FR-015's "manage users" phrase is left an explicit gap, not silently satisfied by nothing.

**Why:** MVP-020 already established a hard rule — "No application code path grants `ADMIN`... Granting is a manual operational act performed directly against the database by the operator" — and a "manage users" UI is exactly the kind of surface that could accidentally cross into role management if built without its own dedicated security review. Declining to build it now protects that existing rule rather than risking it being weakened by an under-specified addition.

### Question 4 — Unified `AuditEvent` table versus a read/merge admin view

**Decided: a read/merge admin view, not a new table.** MVP-019 builds an admin surface that queries and combines the three existing append-only event tables (`DeletionRequestEvent`, `ArticlePublishEvent`, `ReleasePublishEvent` — the last pending MVP-014's own merge) plus the new `ProductStatusEvent` (question 1/5) this story adds. No new unified `AuditEvent` table is created, and `docs/06-data-model.md`'s "Operations" placeholder listing is understood as descriptive of the *concept* the read/merge view now satisfies, not a literal mandate for one physical table.

**Why:** a real unified table would need every existing writer (`DeletionRequest`'s admin actions, `Article`'s publish action, `Release`'s publish action) to *also* write to it — either touching three already-shipped, already-tested write paths for a purely reporting-driven feature (real regression risk for no functional gain), or accepting the new table only covers actions from the day it ships onward, leaving a confusing "audit trail starts today" gap for everything before. The read/merge view has neither problem, costs nothing to existing code, and is fully reversible: deleting the view changes nothing about the underlying tables, and a future migration to one physical table (if a real cross-domain query-performance need ever appears) remains a clean additive step from here, not a redesign.

### Question 5 — Is a reason mandatory for every `SUSPENDED`/`ARCHIVED` transition?

**Decided: yes, for all four transitions in question 1's graph** (`PUBLISHED → SUSPENDED`, `SUSPENDED → PUBLISHED`, `PUBLISHED → ARCHIVED`, `SUSPENDED → ARCHIVED`) — a non-empty reason is required by application logic (not a `NOT NULL` schema constraint, mirroring `DeletionRequestEvent.reason`'s precedent of per-action-value strictness enforced in code) for every one of them, including the reinstating `SUSPENDED → PUBLISHED` transition.

**Why:** NFR-009 ("destructive admin actions require reason capture") is the binding requirement, and all four transitions are sensitive, live-product-affecting state changes worth a documented reason for future audit review — reinstating a suspended product is arguably less "destructive" than the other three, but carving out just that one transition as reason-optional would add a special case for marginal benefit, against a uniform, simpler, and more conservative rule.

### New table this decision authorizes: `ProductStatusEvent`

Structurally identical to the existing publish-event precedent (`ArticlePublishEvent`, `ReleasePublishEvent`): append-only, `Restrict` FKs, RLS enabled in the same migration that creates it. Fields: `id`, `productId` (FK `Product`, `Restrict`), `actorUserId` (FK `User`, `Restrict`), `fromStatus`/`toStatus` (both `ProductStatus`), `reason` (`String?`, required by application logic per question 5, never a schema `NOT NULL`), `createdAt`.

### Non-goals restated (unchanged from the pre-work analysis)

No `Order`, `Refund`, `Review`, `ReviewVote`, or `FeatureFlag` model or admin surface. No taxonomy (`Category`/`Tag`) admin CRUD UI. No `Entitlement.revokedAt`-setting code path (question 2 above keeps this explicitly separate). No `SupportCase`, `JobRecord`, `WebhookReceipt`, or `AnalyticsEvent` model. No new role.

### Unchanged (restated)

No product code, schema, UI, route, or API existed before this entry; the implementation that follows it on `feature/mvp-019-operations-console-prework` is what puts these decisions into effect. Neither PR #23 nor PR #24 (MVP-014) is touched by this branch. No historical decision record is erased or rewritten.

## 2026-09-28 — MVP-014 and MVP-019: security and accessibility review, Done

MVP-014 merged via PR #24 (merge commit `7c1f5d7`, run by the product owner — Claude Code's auto-mode guardrail blocked the agent from merging). MVP-019 is Done on merge of PR #25, whose branch was brought up to date with that merge before this entry. The product owner's direct instruction for this pass was to decide and move the project forward as the developer would.

### Security review

Re-verified against the code on the combined branch, not restated from the implementation plans.

- **Authorization:** both new routes (`POST .../releases/{releaseId}/publish`, `POST .../status`) and the `/admin/audit` page use the established deny-by-default pattern — no session and a non-`ADMIN` role get the identical 404, the role is re-read from the database per request, and `actorUserId` always comes from the server session, never the request body. Route tests cover both denial paths.
- **Input handling:** `toStatus` is checked against a server-owned allow-list, `reason` is validated server-side (non-empty, at most 1000 characters), and no client-supplied `fromStatus`, `publishedAt`, or product state is accepted anywhere.
- **Concurrency and audit integrity:** both state transitions are atomic conditional updates on an exact single prior state (`Release.publishedAt IS NULL`; `Product.status = <validated status>`), with the audit row written in the same transaction. The one defect found — MVP-019's first claim predicate could record a stale `fromStatus` — was caught by independent review and fixed before merge; the race test now asserts a continuous event chain and was shown to fail against the old predicate.
- **Data layer:** `release_publish_events` and `product_status_events` both have `ENABLE ROW LEVEL SECURITY` in the migration that creates them, and `Restrict` FKs so audit rows cannot be cascaded away. On a fresh database both migrations apply in order, and `prisma migrate diff` reports no drift between the merged schema and the migrations.
- **No entitlement side effects:** suspend/archive never touches `Entitlement` rows (question 2 above); `changeProductStatus` writes only `products` and `product_status_events`.
- **Audit view data exposure:** `/admin/audit` shows actor and deletion-requester emails to `ADMIN` users only — data `/admin/deletion-requests` already shows them. It is read-only, with no mutation path.
- No findings open.

### Accessibility review sign-off

Scope and method, not conformance. No claim of WCAG compliance, audit, or certification is made.

- **What:** the established axe-core blocking rules plus overflow and title checks at 320/375/768/1280px in chromium, firefox, and webkit, with the unconditional self-check in every shard.
- **New states:** MVP-014 added `admin-products-edit-published-draft-ready` and `-not-ready`; MVP-019 added `admin-products-edit-suspended`, `admin-audit-populated`, and `admin-audit-denied`. One real defect was found and fixed before merge: the audit table overflowed at 320/375px until wrapped in the labelled, keyboard-focusable scroll region the compatibility matrix already uses.
- **Not tested:** screen readers, voice control, switch access, magnification, human manual review — unchanged from MVP-023's standing position.

### Done

`planning/mvp-backlog.csv`/`planning/backlog.csv`: MVP-014 and MVP-019 move QA → Done. MVP-019's tech-debt record was renumbered TD-021 → TD-022 when the branches merged, since MVP-014's unrelated TD-021 merged first.

## 2026-09-25 — Stripe Checkout: provider and payment-shape decision (MVP-007 pre-work)

Direct product-owner instruction ("COMBINED PRODUCT-OWNER INSTRUCTION," Phase B, B1). Documentation and pre-work only — see `planning/prework/MVP-007-stripe-checkout-prework.md` for the full analysis this decision informs. **No Stripe code, SDK, route, schema, migration, or UI exists as a result of this entry.**

**Decision:** LowCodeStacks will use **Stripe Checkout** (hosted, one-time `payment` mode) for selected first-party premium products and premium digital assets. Free/MIT-licensed products remain the majority and bypass Stripe entirely.

**In scope, decided:**
- First-party products only — consistent with the standing first-party-only decision above.
- Only selected products are premium; most may remain free.
- One-time purchases only. Stripe-hosted Checkout. Server-created Checkout Sessions.
- Verified Stripe webhook (signature-checked, raw body, `whsec_...` secret) controls fulfillment — never the redirect return alone.
- Free products bypass Stripe entirely; no false paid Order is ever created for a free product.

**Explicitly not part of this decision — none of the following exist or are planned:** subscriptions, memberships, recurring charges, saved-card/usage billing beyond Checkout's own defaults, creator payouts, commissions, split payments, Stripe Connect, PayPal, or a second payment gateway at launch.

**This decision fixes the provider and payment shape only.** It does **not** decide currency, amount, launch countries, tax registration or collection, refund policy, support period, update entitlement, price per licence grant, or Enterprise commercial treatment. **Open questions 3 and 7 are not resolved and are unaffected by this entry.**

**Not authorized by this entry:** any Stripe SDK installation, Checkout/webhook implementation, API route, UI, schema, migration, Stripe Product/Price creation (including in test mode), product-owner-account configuration, or credential request. MVP-007 is not marked In Progress or Done.

### Unchanged (restated)

No product code, schema, UI, route, or API changed. No test changed. No CI change. No enum value changed. No role created. Questions 3 and 7 remain open, unresolved. MVP-007 is not started. PR #23/MVP-012 are untouched by this entry. No historical decision record is erased or rewritten.

## 2026-09-28 — MVP-007 slice 1 authorized; launch currency; refund policy; pricing mechanism (open questions 3 and 7)

All four decisions below are direct product-owner answers given in chat on 2026-09-28. They were asked one at a time, with the agent's recommendation stated where one was given.

### 1. MVP-007 slice 1 is authorized

The scope is exactly the part of MVP-007 that the Stripe pre-work (`planning/prework/MVP-007-stripe-checkout-prework.md`, section 21) identified as independent of pricing and tax: the `Order` and payment-event schema, the order state machine, and Stripe webhook signature verification. Slice 1 has **no prices, no Checkout Session creation, and no buyer-facing UI**. Those stay out of slice 1 and are sequenced below.

### 2. Launch currency: USD only (open question 3, part)

Buyers are charged in USD. That gives one price per licence tier, and Canadian buyers' cards convert automatically. The schema keeps a currency column so that adding CAD later is an additive change, not a redesign. This was the agent's stated recommendation, and the product owner accepted it.

### 3. Refund policy: all sales final (open question 3, part)

Product-owner instruction: *"There is no return or refund once purchased."* The products sold are digital components, which cannot be returned once delivered. Every paid product's refund classification (a `CLAUDE.md` requirement for paid assets) is therefore **non-refundable**.

These consequences follow from the decision. They record what it implies; they add no new scope:
- **Disclosure before purchase.** The buyer-facing purchase flow must say "all sales final" clearly *before* payment is taken. A no-refund policy is only as defensible as its disclosure. This binds the future checkout UI slice.
- **Chargebacks still exist.** A refund policy cannot prevent a buyer's bank from reversing a card payment. Stripe dispute events still need recording (MVP-008's webhook scope), and MVP-010's `Download` record remains the evidence that the product was delivered.
- **No in-app refund feature is built.** If an exceptional refund is ever needed (a duplicate charge, card fraud), it is done manually in the Stripe Dashboard. Revoking entitlement on refund is not built.
- **Consumer-law check.** Some jurisdictions give buyers of digital goods rights a store policy cannot waive. Launch countries are still undecided, so the policy should be checked with an accountant or lawyer before live payments are taken. This note is a flag, not legal advice.

### 4. Pricing: set by the product owner in the admin screens (open question 7)

Product-owner instruction: *"Price I should be able to decide."* Prices are **not fixed in code or in any decision record.** The administrator sets a USD price per product and per licence tier (Personal/Team/Enterprise) through the admin product editor, and can change it. A product with no active price is free. This resolves the Stripe pre-work's section 4 choice in favour of deriving "premium" from the existence of an active price, rather than adding a separate product flag. Price amounts are operational data the owner manages, not requirements.

### Sequencing that follows

1. **Slice 1** (authorized, starting now): orders, payment events, state machine, webhook signature verification.
2. **Slice 2** (unblocked by decision 4): a `Price` model, the admin price editor, and price display on the product page, including the "all sales final" notice (decision 3).
3. **Slice 3**: Checkout Session creation and the purchase flow. **Still gated on sales tax** (the remaining part of open question 3). Whether to collect tax, and where to register, has legal weight and is not decided.

### Still open

- **Open question 3:** launch countries (the Canada/US proposal is still not approved) and tax handling.
- **Open question 51:** legal entity before real payments.
- **Open question 5:** hosting.

## 2026-09-28 — Sales tax and launch countries (closes open question 3)

Direct product-owner answers given in chat on 2026-09-28, following the currency and refund decisions above. Together they close open question 3.

### 1. Sales tax: none collected at launch (option A)

No sales tax is collected at launch; it is revisited as sales approach the registration thresholds. The product owner chose this over registering for GST/HST now (option B) and collecting everywhere through Stripe Tax from day one (option C). The agent laid out all three options without recommending one, since the choice has legal weight, and noted they should be confirmed with an accountant. That note is a flag, not legal advice.

The thresholds this relies on, as stated when the options were given: in Canada, GST/HST registration is required after $30,000 CAD of sales over four consecutive calendar quarters; most US states require collection only after about $100,000 of sales into that state.

### 2. Launch countries: Canada and the United States only

Paid purchases are available only to buyers in Canada and the US. The agent recommended this and the product owner chose it. The reason is recorded because it is what makes decision 1 safe: the EU and UK require a non-EU seller of digital products to register and charge VAT from the **first** sale to a consumer, with no threshold, so a single EU/UK sale under "no tax collection" would already be non-compliant. **Free products stay available worldwide.** EU/UK sales can be added later, together with VAT registration.

### Consequences for MVP-007 slice 3 (checkout)

These follow from the decisions and bind the checkout implementation; they add no new scope:
- **Checkout must enforce Canada/US.** A buyer outside both must not be able to complete a paid purchase. Enforcing this through the buyer's billing country is part of slice 3's design.
- **Sales must be trackable against the thresholds.** Option A only works if the owner can see sales per country (and per US state) approaching the limits. Slice 3 therefore needs to record each paid order's billing country and, for the US, its state. How that is reported (an admin view or Stripe's own reporting) is not decided here.
- **No tax lines at launch.** Prices are charged as set, with no tax added. The currency (USD) and refund (all sales final) decisions above are unchanged.

### Open question 3: closed

Currency (USD), refunds (none), tax (none at launch, revisited at the thresholds) and countries (Canada and the US) are all decided.

## 2026-09-28 — Business model: free learning first; one price per product; work order

Direct product-owner instruction in chat on 2026-09-28, clarifying the pricing decision recorded earlier the same day.

### 1. Business model: mostly free, ads as the main revenue

The product owner's words: *"I do not want to sell a lot. I want to give a lot — people can learn amazing stuff about the niche and come back for learning."* LowCodeStacks is primarily a **free learning site**. Only a few items will ever carry a price. **Advertising is the main intended revenue**, with paid items a small addition. Traffic, and therefore SEO, is the engine for both. Ads are not yet built: they are a later story (see the order below) and will need a consent banner for EU/UK visitors before any ad is served.

### 2. One price per product, no licence tiers (revises the earlier pricing decision)

This supersedes the "per product and per licence tier" wording in "MVP-007 slice 1 authorized; launch currency; refund policy; pricing mechanism", decision 4. **A product either is free or has a single USD price**, set and cleared by the owner in the admin product editor. There is no per-tier pricing for now. Licence definitions stay as they are, because every paid asset still needs a licence; they just are not priced separately. Which licence a purchase grants is settled when checkout (slice 3) is built.

### 3. A priced product before checkout exists

Decided by the agent under the product owner's standing instruction to decide and move forward; reversible. Until checkout ships, a priced product's public page shows the price, the "all sales final" notice and "Purchasing opens soon", and **no free download**. The free-entitlement route refuses any priced product, so a paid item can never be claimed for free through it.

### 4. Article byline: the LowCodeStacks brand

Articles are published under the LowCodeStacks brand, not a personal name. The SEO story adds the brand as publisher in the article structured data.

### 5. Order of work

The product owner chose this order, keeping the smaller pricing slice ahead of SEO:
1. MVP-007 slice 2: one optional price per product.
2. SEO story: proper article rendering (TD-017), a `/learn` hub with internal links, share images and favicon, the BUG-002 crawl error and sitemap `lastmod` (TD-010), and brand publisher data.
3. Ads story: AdSense on learning pages only, with a consent banner and placements that respect performance and accessibility.
4. MVP-007 slice 3 (checkout) and MVP-008 (fulfilment).

## 2026-09-28 — SEO story (MVP-026): implementation decisions

The SEO story is item 2 of the product owner's agreed work order ("Business model: free learning first; one price per product; work order", decision 5) and inherits that approval. The choices below were made by the agent under the product owner's standing instruction to decide and move forward ("do what you think is right as developers"). Each is reversible.

1. **Story ID MVP-026**, epic SEO, P1. It was approved as a story, but it had no backlog row; this adds one.
2. **Article rendering (closes TD-017).** Markdown is rendered with react-markdown 10.1.0 and remark-gfm 4.0.1 (MIT, pinned). Raw HTML is never rendered, so there is no rehype-raw and no sanitizer. `#` and `##` both become h2, below the page's own h1, and deeper levels keep their own number. Wide code blocks and tables scroll inside their own focusable, labelled regions.
3. **`/learn` hub.** It lists every published article, grouped as Tutorials, Patterns and Comparisons, with CollectionPage and BreadcrumbList JSON-LD. It is indexable once one article is published; while it is empty it is `noindex, follow`. It lists at most 500 articles, with pagination deferred (TD-023).
4. **Internal links.**
   - A breadcrumb (visible, plus BreadcrumbList JSON-LD) on the hub and on every article.
   - A "Keep learning" list on every article: up to 4 related articles, same type first, topped up with the newest of any type.
   - A "Latest from Learn" section (6 newest) and a Learn link on the home page.
5. **Share images.** Generated 1200x630 cards (`next/og`) carry the page title and the LowCodeStacks name. They are served from `/og`, `/og/learn/{slug}` and `/og/products/{slug}`, deliberately **not** under `/api/`: robots.txt disallows `/api/` and X's crawler honours it. The text comes only from PUBLISHED rows looked up by slug, never from the URL, so nobody can mint a branded image with arbitrary text. An unknown or draft slug is a plain 404. `og:image` and the large Twitter card are emitted only when the site origin is valid, never as a relative URL. These cards are generated text, not uploaded media; the product screenshots proposal (PROP-001) is unaffected. The route-coverage guard now also recognises `route.tsx` handlers and allows exactly these three outside `/api`.
6. **Favicon.** `app/icon.svg`, a simple stacked-bars mark in the site colours. It is a placeholder until a designed logo exists.
7. **Brand in structured data.** Article `author` and `publisher` are the Organization "LowCodeStacks" (decision 4 of the business-model entry). No person is ever named.
8. **Sitemap `lastmod` (TD-010, partial).** Articles carry their real `updatedAt`, and the `/learn` hub carries the newest of them. Products and categories still carry none, because evidence edits do not bump `products.updatedAt` and an inaccurate date is worse than none. The home page and hub now take one slot each, leaving 49,998 URLs to split between the catalog and articles.
9. **BUG-002 (was PROP-006).** A repeated query parameter now uses its **first value**, the way a browser reads a form, instead of throwing and returning HTTP 500. This applies to `q`, `sort`, `page` and `pageSize` on `/search` and category pages. Nothing else about search changed.

## 2026-09-29 — Revised work order; learning expansion; maintenance agent limits

Direct product-owner instruction in chat (2026-09-28/29), answering the agent's two questions.

### 1. What the product owner asked for (direction approved; details still to be researched and confirmed)
- **Researched launch content.** The agent researches what works in each niche, writes original content and posts it before launch.
- **Sections per technology.** Each Power Platform technology has its own section: Power Apps, Power Automate, Power BI and the rest, plus SharePoint Online and Dynamics 365. Each covers learning topics, best architecture practices, free components and KPIs.
- **A daily maintenance agent.** It watches what visitors view, click and look for, and it tracks new updates across these products.
- **A top-tier UI.** Modern, clean, with graphics and motion, chosen by researching and comparing proven design approaches.

**Not yet decided, and to come back as a researched roadmap for confirmation:**
- The exact technology list.
- The section structure.
- The content plan and volume.
- The analytics tool (and its consent and privacy handling).
- The design direction.

### 2. Work order (revises decision 5 of "Business model: free learning first; one price per product; work order")
1. MVP-026, the SEO story (built; PR #28).
2. **New design system with motion**, meeting WCAG 2.2 AA, respecting reduced-motion preferences, and without hurting Core Web Vitals.
3. **Per-technology sections.**
4. **Researched launch content.**
5. Ads story (AdSense on learning pages, consent banner).
6. MVP-007 slice 3 (checkout) and MVP-008 (fulfilment).

The product owner chose this order over keeping ads next: ads earn little until there is content and traffic.

### 3. Maintenance agent: report and draft only
The agent may:
- Read analytics.
- Produce a daily report: traffic, top pages and clicks, what visitors search for, new Microsoft release notes.
- Create **unpublished drafts** of new or updated articles.

It **never publishes**. The product owner reviews each draft and publishes it through the existing admin editor, so nothing inaccurate or stale goes live unreviewed. Any analytics it reads must respect the consent and privacy rules in `docs/08-security-privacy-compliance.md`.

### 4. Content rules (restating standing rules that apply to all of this)
- All content is original writing. Microsoft documentation is linked and cited, never copied.
- No claim of Microsoft endorsement, certification or partnership.
- No Government of Saskatchewan names or material.

## 2026-09-29 — Releasing to `main`; branch hygiene

Direct product-owner instruction in chat, answering the agent's two questions.

1. **Catch-up release now.** Once #27 and #28 merge, the agent opens one release PR, `develop` → `main`, and CI runs on it. The product owner merges it. Before this, `main` was 173 commits behind `develop` and had nothing of its own. No deployment is wired to `main` yet, so a release updates the stable branch but publishes nothing to users.
2. **Then one release per milestone.** A `develop` → `main` release PR follows each finished milestone of the work order: design system, per-technology sections, launch content, ads, checkout. Stories keep merging into `develop` as before.
3. **Branch hygiene.** Merged branches are deleted once their PR merges; GitHub can restore any of them from the PR. On 2026-09-29 the agent deleted 21 merged remote branches and the merged local ones, including a duplicate Stripe pre-work branch whose document is already on `develop`, word for word. **Kept:** `research/monetization-architecture-audit` (21 unmerged research documents, useful input for the ads story) and the branches of the open PRs.

## 2026-09-29 — Design direction: A + B combined (not C)

Direct product-owner instruction in chat: *"Combination of A and B not c"*, choosing from the three directions in the design canvas "LowCodeStacks design directions" (a private claude.ai artifact).

- **Light theme (the default), from A "Studio Light":**
  - Ivory ground, teal accent.
  - Serif display headlines (Fraunces) over a sans body (Source Sans 3).
  - A learning-path panel on the home page.
- **Dark theme, a visitor toggle, from B "Night Lab":** the dark ground, the same layout and a lighter teal accent.
- **From B, in both themes:**
  - Dark code panels, with a file label and a Copy button.
  - Monospace labels (IBM Plex Mono) for eyebrows and content types.
  - An amber "What's new" digest strip. This is where the maintenance agent's release summaries will appear once you've reviewed and published them.
- **Direction C (Blueprint) is not used.**

Exact colour and spacing tokens are provisional until the design-system story builds and checks them. That check covers WCAG 2.2 AA contrast in both themes, honouring reduced-motion preferences, and Core Web Vitals.

## 2026-09-30 — Home page design: Premium 3 "Component showcase"

Direct product-owner instruction in chat: *"I like premium 3"*. This follows the A + B direction chosen the day before. Premium 3 is one of three premium explorations on the same design canvas; it was chosen over Bento and Editorial.

- **Home page layout** follows Premium 3:
  - A large serif headline beside a realistic, layered Power Apps screen, with a floating code card and a floating "tested on / licence" card.
  - A row of free-component cards underneath, each lifting on hover.
- **Everything else stays as decided on 2026-09-29.** That covers the A + B theme and fonts, the dark-mode toggle, the dark code panels and the "What's new" strip. The article page follows the "A + B — Article page" mockup.
- **Motion:** entrance fades, gentle floating cards and hover lifts. Only opacity and position animate. **All of it is off when the visitor's device asks for reduced motion.**
- **Content honesty:**
  - The "tested on" card shows only a version actually recorded for that component (the existing compatibility evidence).
  - It never shows an invented number.
  - The mockup's `[VERSION]` placeholder stays a placeholder until real data exists.

**Status:** direction approved. The design-system story will build and verify the tokens and components (contrast in both themes, reduced motion, Core Web Vitals).

## 2026-09-30 — Design system (MVP-027): story and slice 1 implementation decisions

The design system is item 2 of the revised work order ("Revised work order; learning expansion; maintenance agent limits", 2026-09-29) and inherits that approval. The visual direction was decided by the product owner ("Design direction: A + B combined"; "Home page design: Premium 3"). The product owner said "go ahead". The choices below were made by the agent under the standing instruction to decide and move forward. Each is reversible.

1. **Story MVP-027**, "Design system", P1, in four slices:
   1. Foundations: tokens, fonts, site header and footer, dark mode at parity.
   2. The Premium 3 home page.
   3. The article page layout: contents list, code Copy button, callouts, related column.
   4. Polish of the remaining pages.
2. **Tokens.** The A + B palette becomes semantic colour tokens in `apps/web/app/globals.css`.
   - Light theme: ivory ground, teal primary.
   - Dark theme: near-black ground, mint-teal primary.
   - Both themes: an amber highlight, and a dark code panel.
   - Components keep using only tokens, never raw colours, so every page gets both themes.
   - `lib/design-tokens.test.ts` checks every text pairing at 4.5:1 and every control boundary at 3:1, in both themes, from the CSS itself.
3. **Fonts.**
   - Fraunces (display, h1 and h2), Source Sans 3 (body) and IBM Plex Mono (code and labels).
   - Loaded with `next/font/google`, which **self-hosts them at build time**, so visitors' browsers never contact Google.
   - The fallback fonts are size-adjusted, so there is no layout shift when the web fonts arrive.
4. **Theme choice.**
   - Light by default. The visitor's choice is kept in one first-party cookie, `lcs-theme` (`light`/`dark`, one year, `SameSite=Lax`, `Secure` on https).
   - The cookie is set only when the visitor presses the toggle. That makes it a functional preference the visitor explicitly asked for, so it is **exempt from consent**, and it is recorded here as such.
   - The server reads the cookie, so the page renders in the right theme from the first byte, with no flash and no inline script (the no-raw-html guard still holds).
   - Anything but exactly `dark` is treated as light.
5. **Dark theme at parity** (`docs/05-ux-design-system.md`, "dark theme only after parity").
   - Dark ships on every page at once, because it lives entirely in the tokens.
   - The accessibility gate adds a dark-theme pass: **every gated page state again, dark, at 1280 px, in every browser engine**.
   - One width is enough, because the themes change colours, never layout.
6. **Site header and footer on every page.**
   - The header has the brand, **Learn** (`/learn`), **Components** (`/search`, until a dedicated components page exists) and **Sign in**, or **Account** when signed in, plus the theme toggle.
   - The footer carries a standing line: *"Independent site. Not affiliated with, endorsed by or certified by Microsoft."* plus the trademark notice. This keeps the no-endorsement rule visibly true on every page.
   - A **skip link** is the first keyboard stop (WCAG 2.4.1).
7. **Motion foundation.** `motion-rise` (entrance) and `motion-lift` (hover) animate only opacity and transform. A global `prefers-reduced-motion: reduce` rule turns off all animation and transitions.
8. **Brand refresh.** The favicon and share images move to the new palette: a teal tile with amber, mint and white bars, on a near-black card.

### MVP-027 slice 2 — home page (2026-09-30)

Built to the approved Premium 3 layout. Two deliberate deviations from the mockup's **words** (the layout is unchanged), both to keep the page truthful. Decided by the agent; reversible.

1. **Headline and chips.**
   - The mockup read "Components you can actually ship" under a "FREE · SOURCE INCLUDED · LICENSED" chip, with the claim that every component comes with a tutorial and its tested versions. None of that is true of the catalog yet.
   - The page now says **"Learn it properly. Ship components that last."**, under a **"FREE POWER PLATFORM LEARNING"** chip.
   - The subtitle describes what the site actually offers.
2. **Floating cards.**
   - The "tested on" card became **"Every product page: Licence, version and compatibility"**. Those sections exist on every product page today, showing "not provided" where evidence is missing.
   - The code card shows a generic component-input snippet.
   - The whole illustration is marked decorative (`aria-hidden`), is shown only on wide screens, and names no real product.
3. **Home sections, each left out when empty:**
   - The newest 4 published products ("New components and templates").
   - The newest 6 articles.
   - All categories.
   - The old "Learn · Search products · Sign in" row is removed, because the site header now carries those links.
   - The "What's new" strip is **not** shown yet: there is no digest page for it to link to. It arrives with the maintenance-agent work.

### MVP-027 slice 3 — article page (2026-09-30)

Built to the approved "A + B — Article page" mockup. Decided by the agent; reversible.

1. **Layout.**
   - Title block: type · reading time · updated date, then the headline and excerpt.
   - Below it, three columns on wide screens: **On this page** | article | **Keep learning**.
   - One column, in that order, on narrow screens. Each part is in the page once.
2. **"On this page."**
   - Links to the article's h2 and h3 headings.
   - The list and the heading ids come from the same Markdown parse, with the same slug rules: ids are only `[a-z0-9-]`, and repeats get `-1`, `-2`. A link therefore always matches its heading, and author text can never reach an attribute or URL fragment.
   - Left out when an article has fewer than two headings.
3. **Code panels.**
   - A bar shows the fenced block's language (only `[a-z0-9+#-]` is shown) and a **Copy** button.
   - Copying uses the Clipboard API, falling back to selection-based copy where the API is blocked.
   - The result is announced in a polite live region.
   - The button's focus ring uses the light code colour, so it stays visible on the dark bar in both themes.
4. **Callouts.** GitHub's alert syntax, `> [!TIP]`, `> [!NOTE]` and `> [!WARNING]`, renders as a labelled `role="note"` box. Ordinary blockquotes stay blockquotes. This is the syntax article authors, including the future maintenance agent's drafts, use for tips.
5. **Reading time:** whole minutes at about 200 words per minute, never below 1.
6. **Not built, for honesty:**
   - The mockup's right-column **free component** card needs a real link between an article and a product, which does not exist yet.
   - The **ad slot** belongs to the ads story.
7. **Dependencies.** `unified` 11.0.5, `remark-parse` 11.0.0, `mdast-util-to-string` 4.0.0, `@types/mdast` 4.0.4 and `@types/hast` 3.0.5, all MIT. They are declared directly at exactly the versions react-markdown already installs, so nothing new is downloaded.

### MVP-027 slice 4 — remaining pages (2026-09-30)

Decided by the agent; reversible. It completes the design system, whose four slices the product owner approved.

1. **Defaults for unstyled elements, instead of editing every component.**
   - Six pages render plain `<main>`, headings, buttons and fields with no classes: sign-in, account sessions, account privacy, unsubscribe, the audit log and deletion requests. The admin forms elsewhere are the same.
   - One `@layer base` block in `globals.css` now styles **only elements without a `class`**: the page width, headings, paragraphs, lists, forms, labels, fieldsets, fields, table cells and buttons.
   - Buttons: a submit button is the primary (filled) style; every other button is secondary (outlined).
   - Anything with its own classes is untouched, and a unit test enforces that every selector in the block excludes classed elements.
   - Sign-in's markup, which carries the BUG-005, BUG-011 and BUG-014 accessibility fixes, is **not changed at all**.
2. **No fading for in-flight buttons.** A button marked `aria-disabled` while submitting keeps full colour, because fading drops its text below 4.5:1. The cursor and its "…" label carry the state.
3. **BUG-009 (sign-in and account pages unstyled) is resolved by this slice.** Its record said the fix "needs the product owner"; the product owner's approval of the design system covers it.

## 2026-09-30 — Technology sections (MVP-028)

Direct product-owner instruction in chat, answering the agent's three questions. This is item 3 of the revised work order ("Revised work order; learning expansion; maintenance agent limits").

### Product-owner decisions
1. **Six sections at launch:** Power Apps, Power Automate, Power BI, Copilot Studio, Dataverse and Power Pages. **SharePoint Online, Dynamics 365 and a Governance & ALM section are not at launch.** They were offered and not chosen, and can be added later: each is one registry entry and one enum value.
2. **Four tabs per section:** **Learn · Architecture · Components · KPIs.**
3. **Addresses:** `/power-apps` (the Learn tab), `/power-apps/architecture`, `/power-apps/components` and `/power-apps/kpis`, and the same pattern for each section.

### Implementation decisions (agent, under the standing instruction; reversible)
4. **Story MVP-028**, P1, in two slices:
   - **Slice 1, content model:** the technology field, the KPI guide type, and the admin editor.
   - **Slice 2:** the section pages, the header menu, home tiles, SEO and the sitemap.
5. **Articles** get an optional `technology`. None means cross-cutting: the article still appears on `/learn`, just in no section.
   - A new article type, `KPI_GUIDE` ("KPI guide"), feeds the KPIs tab.
   - Tab mapping: **Learn** = tutorials and comparisons; **Architecture** = patterns; **KPIs** = KPI guides.
6. **Components tab.** It is fed by **product categories**, mapped in code from each category's fixed asset type:
   - Power Apps components and templates → Power Apps.
   - Power Automate templates → Power Automate.
   - Power BI templates → Power BI.
   - Architecture blueprints and governance assets are cross-cutting.
   - There is no new database column, so the mapping cannot drift from the categories. This is built in slice 2.
7. **One registry** (`TECHNOLOGIES` in `@ppu/domain-content`) holds each section's name and URL segment. The header, pages, sitemap and admin editor all read it.
8. **Empty tabs** will show a "coming soon" state and stay `noindex` until they have content, so thin pages never hurt search ranking (slice 2).

### MVP-028 slice 2 — the section pages (2026-09-30)

Decided by the agent; reversible.

1. **Routes.**
   - `app/[technology]/page.tsx` is the Learn tab; `app/[technology]/[tab]/page.tsx` serves `architecture`, `components` and `kpis`.
   - Any other technology or tab, and `/{technology}/learn`, is a 404, so there is no duplicate of the Learn tab.
   - Existing top-level routes keep priority.
   - Because every unknown top-level path now reaches this route, its 404 carries exactly the title `app/not-found.tsx` gives every other 404. That was caught by the BUG-008 regression test.
2. **Tabs are links, not an ARIA tab widget.** Each tab is its own page, so they are a navigation list with `aria-current="page"`.
3. **Search engines.**
   - A tab with content is indexable, with CollectionPage and BreadcrumbList data.
   - An empty tab shows "Coming soon" with links onward, and is `noindex, follow` with breadcrumbs only.
   - The sitemap lists section tabs that have content, right after the home page, and reserves 24 slots for them.
4. **Navigation.**
   - The header has a **Technologies** disclosure menu. It is the WAI-ARIA disclosure pattern: Escape and a click outside close it, and focus returns to the button.
   - The home page has an "Explore by technology" tile grid, and `/learn` has a chip row. These are the always-present, crawlable links; the menu is a shortcut.
5. **The Components tab** lists up to 12 newest products per technology category, with an "All N in {category}" link when there are more.

## 2026-09-30 — Launch content plan approved; competitor research rule

Direct product-owner instruction in chat: *"approve the content launch"*.

1. **The launch content plan is approved**, as published in the "LowCodeStacks Launch Content" plan (a private claude.ai artifact):
   - **Wave 1:** 24 articles, four per technology section (two Learn, one Architecture, one KPI guide).
   - **Wave 2:** 15 more after launch.
2. **Workflow.** The agent writes every article as a **draft**, tagged to its section and tab, and the product owner reviews and publishes it. Nothing is published by the agent.
3. **Testing disclosure.** Examples are checked against Microsoft's documentation, but the agent cannot run them in a Power Platform tenant. Articles say an example follows Microsoft's documented behaviour unless someone has actually tested it.
4. **Competitor research (agent decision, recorded because the product owner asked to "scrape competitor websites and use their code").** Competitor sites may be **reviewed** for what they offer, how they are organised and where they fall short. Their **code, text and assets are never copied or scraped**: that is their copyright and usually against their terms, and it would contradict the "original writing" rule. Everything LowCodeStacks publishes is original work, citing sources where it relies on them.

## 2026-09-30 — Hosting: Netlify, free plan first; free-only infrastructure

Direct product-owner instructions in chat, in order:
- *"if it add any cost then i only want whtevr is free"*
- *"okay go with netlify"*

They followed the agent's comparison of free and cheapest hosting options. The full comparison is in `docs/adr/005-hosting-netlify.md`.

1. **Cost rule: free infrastructure only.** Hosting, database, storage and similar services use free plans. Any paid plan needs the product owner's confirmation at the time it's needed.
2. **The web app is hosted on Netlify's Free plan.**
   - **Upgrade path.** If the free plan is outgrown, the planned step is Netlify Personal ($9/month, no migration). Under rule 1, the product owner confirms it then; it isn't approved in advance.
   - **Why not Vercel.** Vercel's free plan forbids commercial use, and lists ads and payments as commercial.
   - **Why not Cloudflare.** Its free plan's 10 ms CPU limit per request doesn't suit our database-backed pages.
3. **Unchanged:** the database is PostgreSQL on Supabase (free plan), and file storage is Cloudflare R2 (free tier).
4. **Production deploys only on releases to `main`,** because production deploys use free-plan credits and preview deploys don't.
5. **Resolves the hosting-provider part of open question 5.** The region and data-residency commitments stay open; the region should match the Supabase project's region.
6. **Context recorded, not a new decision.** The product owner noted that visitors don't upload anything (first-party-only, 2026-09-24) and that no background worker was promised. Nothing at launch needs a worker or a malware scanner.
   - **Two questions stay open:** how product files are checked once downloads exist (a hosted scanner costs money, so it falls under rule 1), and the worker model (open question 56).
   - **Not changed yet:** `CLAUDE.md`'s upload and job-queue defaults. Updating them belongs to the decisions-sync pass, which awaits product-owner approval.
7. **Not decided here:** the decisions-sync pass. It awaits the product owner's answer. The launch question is answered in the next entry.

## 2026-09-30 — Launch is content-first

Direct product-owner instruction in chat, answering "content-first launch?": *"yes all content got created first adn then live"*.

1. **The first public launch is content-first.** The site goes live on `lowcodestacks.com` (Netlify, see the previous entry) **after the launch content is created**: the 24 wave-1 articles in the approved plan ("Launch content plan approved", 2026-09-30), reviewed and published by the product owner.
2. **Checkout and product downloads aren't part of this launch.** They follow in a later release, in the work order already decided ("Revised work order", 2026-09-29: content, then ads, then checkout).
3. **Known conflict, recorded rather than resolved silently.** `docs/02-prd.md`'s release criteria still describe a launch that includes a paid product, purchase and download. Under this decision those criteria describe the later commerce release, not the content launch. Rewording the PRD belongs to the decisions-sync pass, which still awaits product-owner approval.
4. **Interpretation note (agent).** "All content" is read as the 24 wave-1 articles, not the 15 wave-2 articles, which the approved plan schedules after launch. If the product owner meant wave 2 as well, this entry should be corrected.

## 2026-10-01 — Visual redesign: "Daylight" (replaces the A + B look and the Premium 3 home)

Direct product-owner instructions in chat, choosing from the design canvas "LowCodeStacks — Daylight site" (a private claude.ai artifact):
- The dark "Nightshift" proposal was rejected: *"NO I dont like thi s"* (too dark, too generic, not enough visuals or motion).
- Of four bright concepts, Daylight was chosen: *"Day light look best"*, then *"A"*.
- *"lets focnus on day liht first rebudl full site usinf that"*, and after the full page set was drawn, *"Yes go ahead"*.
- The article page's text and layout were approved too: *"Arctile page's page text adn oreitation seems good too"*.

### Product-owner decisions
1. **Daylight is the site's visual design.** It replaces the A + B colours and fonts ("Design direction: A + B combined", 2026-09-29) and the Premium 3 home layout ("Home page design: Premium 3", 2026-09-30).
2. **The look:**
   - Warm paper background (`#FBF8F3`), near-black ink (`#14141A`), a lime accent and a violet focus colour.
   - One pastel tint and one dark text colour per technology (Power Apps lavender, Power Automate sky, Power BI butter, Copilot Studio mint, Dataverse green, Power Pages pink), every pairing at least 4.5:1.
   - Bricolage Grotesque for display headings, an Instrument Serif italic for one accent word per heading, Geist for body text and Geist Mono for labels and code.
   - Glossy 3D-style shapes drawn in CSS, and live animated mock-ups (an app that types and scrolls, a flow running, bars growing to a target).
3. **The pages drawn on the canvas** are the target: home, technology hub, guides library, article, search, sign-in, page not found, and the mobile home and article. Admin and account pages take the same tokens and components without a separate design.

### What does not change
Everything that was a commitment rather than a look stays as decided:
- The dark-mode toggle at parity ("Design system (MVP-027)", decision 5). It gets a Daylight dark palette. The canvas only draws the light theme, but the product owner did not withdraw the toggle, so the safest reading is to keep it.
- Dark code panels with a language label and Copy button; callouts; the article contents list.
- The footer's standing non-affiliation line, the skip link, self-hosted fonts, and motion that stops entirely for reduced-motion users.
- Content honesty: home sections come from real data and are left out when empty; decorative mock-ups are hidden from assistive technology and never present invented data as real.

### Implementation decisions (agent, under the standing instruction; reversible)
1. **Story MVP-031**, "Daylight redesign", P1. Built as one branch in ordered commits: foundations (tokens, fonts, header, footer, brand mark); home; technology hub; guides library and article; search, sign-in and page not found; shared `@ppu/ui` components.
2. **Search stays a product search.** The canvas draws search results as guides, but `/search` searches the product catalog today, and making guides searchable is a product change. The page gets the Daylight look over its current behaviour. Recorded as open question 63.
3. **Truthful copy in place of the canvas's sample words:**
   - The hero's announcement pill shows the real number of published guides. It does not claim every guide is "checked against Microsoft Learn", which the site cannot verify for future articles.
   - An article shows a "Cites Microsoft Learn" badge only when its body actually links to learn.microsoft.com.
   - Each technology panel shows that technology's real published guide count.
   - "Start with these three" lists three named launch guides by slug, each shown only if published; the section is left out if none are.
   - The scrolling topic ribbon is decorative (hidden from assistive technology, not links). The same guides are reachable as real links on the page.
4. **Fonts** load through `next/font/google`, which self-hosts them at build time (all four are SIL Open Font License).

### Logo: X2 "Code stack" (2026-10-01)
Direct product-owner instruction in chat, after several rounds of logo boards on the same canvas (card stacks, isometric stacks, niche variations, a rethink and finally full lockups drawn from an inspiration sheet the product owner supplied): *"X2 is final if you think that ther wont be anythgin else better than it"*. The agent's view, given in the same exchange, was that nothing on the boards beat it for this niche, which met the product owner's condition.

1. **The mark:** three soft rounded cards stepped up and to the right, lime at the back, coral in the middle and violet at the front, with a white `</>` on the front card. It reads as stacks of components, built by people who also write code. Each card has a light-to-deep gradient in its own colour.
2. **The logo is the stack symbol alone.** Product owner, in the same exchange: *"just keep the stack part in logo below is jsut branding"*. The name and tagline drawn under the mark on the X2 board are branding that sits beside the logo, not part of it:
   - the wordmark, "LowCode" in ink and "Stacks" in violet, set in Bricolage Grotesque;
   - the tagline *"Built to hold up"*, which matches the home headline and is used only where there is room for one.
3. **Small sizes:** at 20 px and below, the `</>` is illegible. The favicon uses a simplified drawing of the same mark: a larger front card with a bold `< >` and no slash. This is a drawing choice, not a second logo.

Reversible implementation details (agent): the mark is an inline SVG component with per-instance gradient ids, so several marks on one page do not collide. No trademark search has been done beyond the earlier web search, which found no other "LowCodeStacks" brand. A formal clearance search is the product owner's call.

### Board fidelity pass (2026-10-01)
The product owner asked whether the built site will look exactly like the canvas: *"i love what we have on the design board an dwant to have it liek that designed"*. A side-by-side comparison found visual drift, plus four places where the site and the board differ in content or features. The product owner answered those four, delegating three of them to the agent:

1. **Home sections the board does not draw** ("Latest from Learn", "New components and templates", "Browse by category") **stay**, restyled to the board's brand kit: *"that is fine because will demand us to create new things or section its just the fomrating and design shoudl followu th ebrand kit show in the baord"*.
2. **Header**, delegated (*"do what make sense for the goal of the site adn make it profeisnall"*). The agent's decision: the board's header with its two extra items, a "KPI guides" link and a "Search" box that shows a Ctrl K / ⌘K shortcut. It also keeps "Sign in" and the light/dark toggle, which are working features the board leaves out.
3. **Search covers guides and components**, delegated (*"you descied taqth which will be more benficial after researching and implement"*). This closes open question 63. The reasons:
   - Launch is content-first, so searching only the catalog returns nothing.
   - Guides are what visitors come for.
   - Google retired the sitelinks search box in November 2024, so search brings no SEO feature; it is purely for visitors.
   - Results pages stay `noindex, follow`, Google's guidance for internal search results.
   - The implementation is PostgreSQL full-text search, the MVP search baseline in CLAUDE.md, over published guides only.
4. **Footer**, delegated (*"You research what is better for gettign site viral ANd for excellent SEO"*). The agent's decision is the board's look, extended with link columns: the six technologies, the guide types and the site's main pages. The reasons:
   - Google asks that "every page you care about should have a link from at least one other page", with descriptive anchor text.
   - A site-wide footer gives every section a crawlable link from every page.
   - The non-affiliation line and the trademark sentence stay, as standing commitments.
   - About, Privacy and Terms pages are not invented: they need facts and legal terms from the product owner (open question 64). For sharing, the article's "Copy link" control from the board is built.

The look of every drawn page follows the canvas. The exceptions are the truthful-copy rules above, and real data in place of sample data.

## 2026-10-02 — About, Privacy and Terms pages (MVP-032)

Direct product-owner instructions in chat, in reply to open question 64 ("About, Privacy and Terms need product-owner content"):
- *"you buuild it for what iam puttin out there you know"*: the agent writes the three pages from what the site actually does.
- **Operator:** "LowCodeStacks, run by Uday Posia" (chosen: name plus brand, full name "Uday Posia").
- **Contact address:** `contact@lowcodestacks.com`. The product owner creates the mailbox or forwarding at the registrar before launch.
- **Location:** Saskatchewan, Canada.
- **Content licence:** code samples free to reuse (MIT); article text and images reserved ("Code free, text reserved").

### Decisions
1. **This supersedes "no legal copy authored by the agent"** ("MVP-020 open questions 46, 47 and 48", scope boundary) **for these three pages only**, by the product owner's direct instruction. Each page states only what the code actually does: an inventory of personal data, cookies, logs and service providers was taken from the codebase on 2026-10-02. The pages carry no compliance claim of any kind ("No compliance claim of any kind, anywhere" still holds):
   - they describe practices, how to make requests, and the 30-day response the operator commits to;
   - they name the Office of the Privacy Commissioner of Canada as where to complain.
   The agent recommends a lawyer reviews them before launch; that is the product owner's call.
2. **Open question 47 (jurisdiction) is partly answered.** The operator is in Saskatchewan, which has no general private-sector privacy law, so PIPEDA (federal) is the relevant privacy law, per the Office of the Privacy Commissioner. The Terms' governing law is Saskatchewan and the federal laws of Canada that apply there. Still open: the hosting region (open question 5) and paid-sales terms (open question 3).
3. **Open question 64 is closed.** The footer links About, Privacy and Terms, and the account page links the Terms it records acceptance of.
4. **Policy versions:** a reversible migration adds real `PolicyVersion` rows (`2026-10-02`) for the Terms and the Privacy notice. Terms acceptance then references the real version; the placeholder rows stay, as history, since consent records may point at them.

## 2026-10-02 — Navigation restructure: by technology and by goal

The product owner asked for a strategist's review of the navigation (*"do we need kapi guide on tha navigation hwo to organize evyethgin so tit become easier ffor eveytpoen"*). The agent's review found:
- two competing groupings, by technology and by article type;
- "KPI guides" as a top link (jargon, 6 of 24 guides, and a jump into `/learn`);
- "Components" linking to an empty catalog at launch;
- technology tabs holding one guide each;
- inconsistent labels.

The product owner then approved, by direct answers in chat:
1. **Top bar: Technologies ▾ · Guides · (Updates, when built) · search · sign-in.** "KPI guides" is removed from the top bar. "Components" is hidden until the first product is published (feature flag).
2. **Technology pages: one page with sections instead of four tabs** while content is small. The old tab addresses redirect to the matching section. Tabs may return when a technology has more than about 8 guides of one kind. This supersedes "Four tabs per section" ("Technology sections (MVP-028)", decision 2) for now.
3. **Goal labels everywhere for the kinds of guide:** Fix a problem (tutorials), Choose the right tool (comparisons), Design it to last (patterns), Measure success (KPI guides).
4. **Draw it on the design canvas first,** for sign-off before it is built.

The product owner added that sections must not be generic: *"kpi i think just hsopuld be at power bi but you have to reseach as SKME in each competn ... decide wht shoudl put on each page not generalise eveytwhere it shoudl dynamic"*. The agent's per-technology topic map, researched from Microsoft Learn's own documentation structure for each product (2026-10-02), is a **proposal awaiting the product owner's confirmation**. It is not decided here.

### Structure boards approved (2026-10-02)
The product owner reviewed the six navigation-restructure boards on the design canvas and replied *"Look good"*. **The per-technology section map is approved** as drawn:
- **Power Apps:** Choose & plan · Data & delegation · Formulas & components · Performance & offline · Ship it: solutions & ALM · Adoption & usage.
- **Power Automate:** Triggers & flow design · Approvals · Errors, retries & limits · Desktop flows (RPA) · Choose the right tool · Run & monitor.
- **Power BI:** Data modelling · DAX & calculations · Reports, visuals & KPIs · Refresh & gateways · Security & sharing.
- **Copilot Studio:** Build your agent · Knowledge & grounding · Tools, actions & MCP · Test & evaluate · Publish to Teams & web · Monitor & cost.
- **Dataverse:** Tables & schema · Security model · Business logic · Dataverse or something else · Data quality & integration.
- **Power Pages:** Build your site · Access & table permissions · Sign-in & identity · Liquid & custom code · Choose · Go-live & monitor.

A KPI section exists only in Power BI. Measuring guides elsewhere sit in that product's own section (adoption, run health, cost, go-live). Also approved as drawn: the Guides hub by goal, the Technologies menu, and the Updates page layout. The Updates page's content pipeline is still to be built.

The product owner also asked for a deep research plan for each section's content, presentation and backlinks. It is `docs/research/content-research-plan.md`, a proposal awaiting approval.

### Governance & admin area and the Updates badge (2026-10-02)
Direct product-owner instruction: *"Also add coe and data and governance adn dlp polict i dont knwo what tech all come ro fall into but you will have to do researhc for that too. Updates need otficaiotn motions bangs to get user to click on it"*.

1. **A 7th area, "Governance & admin",** for admins and CoE leads. It cuts across every product, so it isn't placed inside one. This supersedes the earlier choice not to have a Governance & ALM section at launch ("Technology sections (MVP-028)", decision 1). Its sections, from Microsoft Learn's admin and governance documentation (checked 2026-10-02):
   - Environments & strategy
   - Data policies (DLP) & connectors
   - Security & access
   - CoE & visibility
   - ALM & deployment
   - Licensing & capacity
   - AI & agent governance

   Two research findings shape its first guides:
   - Microsoft now calls DLP policies **"data policies"**, alongside **advanced connector policies**.
   - The **CoE Starter Kit is no longer actively maintained**. Its core features moved into the admin center (Inventory, Usage, Monitor, Actions), so "Moving off the CoE Starter Kit" is a priority guide.
2. **Updates badge:** a lime count of updates since the visitor's last visit, with a soft ping animation, in the top bar and the phone menu.
   - **Lifecycle:** it stops once Updates is opened; reduced motion shows a still badge.
   - **Accessibility:** screen readers hear "Updates, N new".
   - **Storage:** the last-visit date is stored only in the visitor's browser (local storage), never sent to the server. The Privacy notice must say so in the same change that ships the badge.
3. The design canvas carries the Governance & admin page board and the badge on every restructure board. The Brand board is updated with the X2 logo, the Governance colour (#E2E8F0 / #334155, 8.4:1), the goal labels and the badge.

### Technology pages are hubs (2026-10-02)
The product owner clarified: *"if i open power apps section then i should see everything organized and i choose where to go"*. Researched against how product hubs are organised on Stripe's documentation and Microsoft Learn (every area visible at once, each with its top links), and against the Diátaxis documentation framework (tutorials, how-to, reference, explanation):
- **Each technology page opens as a map:** a short hero with a scoped "Stuck? Search …" box and three common problems, then **every section as a card**. Each card has a one-line description, its guides as links, coming guides marked "Coming", and "See all".
- **A "Quick reference" row** per technology: limits tables, cheat sheets and an error index. This is the "reference" kind we lacked, and these are the pages people bookmark.
- **The ordered "New here? Start with these 3" path sits at the end**, reached from a link in the hero, so it never blocks someone exploring.

### Updates page details: open questions 65 to 69 (2026-10-05)
Answered by the product owner in this session (multiple choice; for question 66 the product owner said *"which is better, research and keep that"*, delegating the choice to the agent's research):
- **65, "new" for a first-time visitor:** updates published in the last **14 days** count as new; the badge shows at most "9+". This keeps the existing default.
- **66, follow options:** an **RSS 2.0 feed** at `/updates/feed.xml`, linked from `/updates` ("Follow with RSS") and from the page's `<head>`. **No email newsletter for now.** Research:
  - **RSS:** it collects no personal data, so the Privacy notice doesn't change. Google accepts RSS 2.0 and Atom 1.0 feeds as sitemaps for recent URLs (Google Search Central, "Build and submit a sitemap").
  - **Email:** a weekly email is a commercial electronic message under Canada's anti-spam law (CASL). It needs recorded consent, sender identification, a working unsubscribe, a Privacy notice change and a sending pipeline. That makes it a separate story if wanted later.
- **67 and 68:** tracker dates show **month and year only**, and the feed heading stays **"Latest"**. Both keep the existing defaults.
- **69:** `/updates` **joins `sitemap.xml`** once it has a published update. A sitemap slot is reserved for it (`MAX_SECTION_PATHS`).

## 2026-10-05 — Hosting plan and automatic production migrations

### Netlify Personal plan (2026-10-05)
The account ran out of Free-plan credits (300 a month; each production deploy costs 15), which paused production deploys. The product owner **bought the Netlify Personal plan** ("i bought 9 dollar plan"). This is the upgrade step ADR-005 names, confirmed by the product owner as that ADR requires. To keep within credits, production deploys still happen only on releases to `main`.

### Production migrations run automatically on release (2026-10-05)
The product owner asked to stop running migrations by hand (*"i want to make this database process automated i dont want to run command again and again"*). They approved storing the 5432 connection string in Netlify, which replaces the earlier deployment-guide rule "Never put the 5432 string in Netlify":
- **What runs:** the Netlify **production** build (`apps/web/netlify.toml`, `[context.production]`) runs `packages/db/scripts/deploy-migrations.mjs` (`prisma migrate deploy`) before building the site.
- **Why it's safe:** Netlify publishes a deploy only when its build succeeds. Migrations always land before the code that needs them, and a failed migration leaves the previous deploy live.
- **The setting:** `MIGRATE_DATABASE_URL` holds the 5432 string, scoped to Builds and the Production context only, and marked secret. The product owner sets it; agents never handle it. The site's runtime keeps using the 6543 `DATABASE_URL`.
- **Fail-safe:** a missing variable, an invalid URL, or a port-6543 URL fails the production build with a clear message. Deploy previews never run migrations.
- **Amended 2026-10-06:** three production builds stopped with "port 6543", although the product owner's Netlify values all showed 5432. To stop depending on that value, the script now uses `MIGRATE_DATABASE_URL` if set, otherwise the site's `DATABASE_URL`. A Supabase pooler address on 6543 is switched to 5432, the same host, user and password in session mode (Supabase docs, "Connecting to Postgres"). The build log shows the variable name, host and port it used, never the password. `MIGRATE_DATABASE_URL` is now optional. A 6543 address on any other host still fails the build.
- **Approval:** merging the release PR into `main` is the deployment approval for its migrations (CLAUDE.md, "No direct production changes"). Migrations stay additive and reversible, as before.

## 2026-10-06 — Hub framing, reference pages, trust signals and community solutions

### Hub taglines, top-fix chips, daily reference row, scoped search (approved)
The product owner approved the proposal in `docs/research/technology-daily-needs.md`: each hub describes the product's job, not one guide's problem. They also asked to start writing content now, researched in depth.
- **Taglines:**
  - Power Apps "Build, fix and speed up your apps";
  - Power Automate "Flows that run, and tell you when they don't";
  - Power BI "Reports people trust, refreshed on time";
  - Copilot Studio "Agents that answer well and act safely";
  - Dataverse "Data your apps and flows can rely on";
  - Power Pages "Secure sites for people outside your org";
  - Governance & admin keeps "Guardrails that don't slow makers down".
- **Top-fix chips:** each hub's chips come from Microsoft's most-documented problems for that product (the research note lists them).
- **Daily reference row:** a row of quick-lookup pages on every hub (error codes, limits, cheat sheets, checklists). This delivers the "Quick reference" row approved on 2026-10-02. It is a new content kind, `REFERENCE`.
- **Scoped search:** a hub's search box searches that technology only.
- **Process:** drawn on the design board first, then built; same design system.

### Trust signals on fixes and reference pages (approved)
The product owner selected all four:
1. **Source-checked:** "Checked against Microsoft Learn on <date>", with every step linked to Microsoft's page.
2. **Tested by us:** shown only when an admin records that the fix was run in a real tenant, with the date and product version. Agents never mark something tested.
3. **"Did this fix it?" votes:** anonymous Yes/No, with no sign-in and no personal data stored. A fix shows as "Accepted" once enough readers say yes; the threshold is set when built.
4. **Last-reviewed date and "this changed" reports:** pages are re-checked after 6 months, or sooner if readers report a change.

### Community solutions (approved in principle; approach researched)
The product owner asked to let readers add their own solutions, which can be marked as the solution, and asked for the best approach. Research:
- Google's spam policies make site owners responsible for user-generated spam.
- Google recommends `rel="ugc"` on links in user content.
- The BRD scopes the first release as "not a complete social network".

The approach:
- **Who can post:** signed-in readers only, rate-limited.
- **Moderation first:** a submission is hidden until an admin approves it.
- **Format:** plain text and code blocks only, with no HTML; links get `rel="ugc nofollow"`.
- **Accepted answer:** an admin can mark one community solution as the accepted fix, pinned with a badge.
- **Reports:** readers can report a posted solution.
- **Before it ships:** Terms (a licence for what people post) and Privacy (display name) updates, which need the product owner's approval of the wording.

Delivery: MVP-037 (hub framing), MVP-038 (reference type and trust signals 1, 2 and 4), MVP-039 (votes and accepted fixes), MVP-040 (community solutions). Content is written in parallel as drafts, researched against Microsoft Learn; agents never publish.
## 2026-10-06 — Sign-in methods: Google, email and password, and the email link

The product owner reviewed the sign-in research (email-link sign-in, and Microsoft Defender for Office 365 scanning links in work email before delivery). They chose by multiple choice:
- **Google sign-in: yes.** Auth.js Google provider with the existing `Account` table and database sessions; no migration. Google verifies email addresses, so a Google sign-in links to an existing account with the same email.
- **Email and password: yes, "build it properly".** Auth.js's Credentials provider requires JWT sessions, but this site uses database sessions, which back the session list on the Account page. So password sign-in is built as its own flow that creates the same database sessions, with:
  - slow password hashing;
  - a forgot-password email;
  - attempt limits;
  - a security review.

  The Auth.js docs discourage passwords; the product owner chose them anyway.
- **The email link stays, fixed.** The link opens a page with a "Sign me in" button. Email scanners open links but don't press buttons, so a scanner can't use up the link.
- **Not chosen:** Apple (it needs the paid Apple Developer Program) and Microsoft (recommended for this audience, not selected).

This replaces "Auth.js, **Magic Link only** for MVP". Delivery is three stories: MVP-034 (sign-in hardening, plus the security headers and `/admin` home page from the configuration review), MVP-035 (Google) and MVP-036 (email and password). Each one updates the Privacy notice where it changes what is collected.

### Drafts import automatically on release (2026-10-06)
After the first MVP-033 release, production still had no guides: the 24 launch guides and 4 updates had never been imported. The product owner asked not to run the import by hand (*"I have already set database url why i would need to do this"*). Agents can't run it from the product owner's machine, because that would mean handling the connection string. So the Netlify production build now imports drafts after building the site (`packages/adapters/content/scripts/import-drafts-on-deploy.mjs`):
- **Drafts only:** it runs the existing `content:import` and `updates:import`. Both create DRAFTs, skip any slug that already exists, and never publish. This keeps the rule that the agent never publishes: the product owner publishes in `/admin/content` and `/admin/updates`.
- **Settings:** it uses the build's `DATABASE_URL`, and `ARTICLE_AUTHOR_EMAIL` (an existing admin's email, set in Netlify by the product owner). Without the email, the step is skipped with a message.
- **Never blocks a release:** a failed import is a warning in the build log, and the deploy goes ahead.
- **Scope:** production only. Deploy previews never import.

### Content plan targets and order (2026-10-06)
The product owner approved the proposal ("Continue", in reply to it) and with it `docs/research/content-research-plan.md`'s method:
- **Target for the first full round:** every hub section holds **2–4 items**, about 15–20 per technology and about 110–130 in total. Each item is one of the five kinds: Fix, Choose, Design, Measure, Look it up.
- **Method:** a short research brief per section (`docs/research/content-briefs/<technology>/<section>.md`: real problems, search phrases, gaps, sources, proposed titles), the product owner's yes or no on the titles, then drafts. Drafts are checked against Microsoft Learn and imported; the product owner publishes.
- **Order:** the highest daily demand first, starting with Power Automate, then Power BI *Refresh & gateways*. The hubs' top-fix chips get their own guides early.
- Still open from that plan: analytics (Search Console only, or privacy-friendly analytics).
- **Approved titles, second round (2026-10-06):** the product owner selected every proposed title in `docs/research/content-briefs/cross-technology-2026-10-06.md`:
  - **Power BI:** gateway moves and sharing; permissions cheat sheet; refresh on your terms; dynamic RLS; incremental refresh;
  - **Power Pages:** licensing explained; invitations; Web API cheat sheet;
  - **Copilot Studio:** licensing and Copilot Credits; Dataverse tables as knowledge;
  - **Power Apps:** attachments and photos to SharePoint; the Dataverse capacity email.

## 2026-10-06 — Article visuals: our own diagrams, our own screenshots, in the Daylight style

The product owner asked how images and snapshots would make the guides easier to follow, and chose by multiple choice **"Diagrams + own screenshots"**. They then added that the pages follow the design system, *"and motion graphics where possible for every page"*.
- **Diagrams:** drawn by us as graphics in the Daylight tokens: decision charts, flow layouts, checklists as pictures. We use only our own glyphs, never Microsoft product logos or icons, which are trademarks.
- **Screenshots:** only ones **we take ourselves**, from a test account with made-up data. The product owner signs in; the agent never handles credentials. Each screenshot is cropped, given numbered callouts, and labelled with the date it was taken. Microsoft's screenshots from Learn are never copied. **Before the first screenshot is published,** Microsoft's published rules on using screenshots of its products are checked and recorded here. The product owner noted that **most of the site's content is free to read**. The check therefore covers both free educational pages and paid marketplace pages, and screenshots are used only where the rules allow for that kind of page.
- **Motion where it helps understanding** (for example, a flow's steps lighting up in order), following the design system's motion rules:
  - the resting state is the finished picture;
  - all motion stops under `prefers-reduced-motion`;
  - anything moving for longer than 5 seconds has a pause control (WCAG 2.2.2).
- **Accessibility:** every image has alt text, and the steps it shows are also written in the text.
- **Safety:** images are served only from this site. Articles can't load images from other domains. A test fails any article whose image file is missing or has no alt text.
- **Delivery:** story MVP-041 (article visuals), built as a vertical slice: the article image component, storage in the repo, the validation test, and the accessibility checks. It comes before the first screenshots are added.

## 2026-10-06 — SEO additions alongside the guide-page redesign

The product owner reviewed `docs/research/seo-audit-2026-10-06.md` and chose all four proposed additions, by multiple choice:
1. **Image in guide structured data:** each guide's existing 1200×630 share image (`/og/learn/{slug}`) becomes the `image` of its `TechArticle` JSON-LD.
2. **A "How we write and check guides" page:** public, and linked from every guide. It explains research, the check against Microsoft Learn, product-owner review and the dates shown. The wording is shown to the product owner before it ships. Follows Google's guidance on explaining how content is created.
3. **IndexNow ping on publish:** when an article or update is published, its URL is sent to `api.indexnow.org`, with the key file hosted on the site. Only public page URLs are sent, never personal data. Bing and other engines take part; Google isn't mentioned as a participant. A failed ping never blocks publishing.
4. **A page-speed check in CI:** a Lighthouse budget keeps pages within Google's Core Web Vitals targets (LCP ≤ 2.5 s, INP < 200 ms, CLS < 0.1), so the new visuals and motion can't slow pages down.

Also decided: start the guide-page and hub designs **now**, with 3 concepts on the design board, before PR #75 merges. Not adopted: FAQ and HowTo structured data, which Google no longer shows. Delivery: story MVP-042, built together with the chosen design.

## 2026-10-06 — Guide page and hub designs chosen

The product owner reviewed the design board's new row (G1–G3 guide concepts, H1–H2 hub concepts, and the "How we write" page) and chose by multiple choice:
- **Guide page: "Mix by guide type".** One shared frame for every guide: G1's header, with the trust strip (Microsoft Learn check, date, number of sources, "How we write guides"), an optional quick-answer card, table of contents, side column, "Did this fix it?" and sources. Then by type:
  - **Fix** guides (TUTORIAL) add G2's symptom picker and tick-off steps with a progress count;
  - **Design** guides (PATTERN) add G3's animated diagram and Do / Don't cards;
  - **Choose, Measure and Look it up** guides use the shared frame alone.
- **Hubs: "H1, plus H2's journey for Power BI".** H1 (hub search, most-needed fixes, the "Look it up" row, every section with its guides, "What changed") is the standard hub. Power BI uses H2's numbered journey for its sections.
- **Still to approve:** the hub headlines on the board, and the "How we write" page wording (including the AI-assistance sentence). Both are shown again before they ship.

All motion follows the design system's rules: the resting state is the finished picture, it stops under `prefers-reduced-motion`, and anything moving for more than 5 seconds has a pause control. Delivery: MVP-037 (hub framing), MVP-038 (trust signals), MVP-039 (votes), MVP-041 (visuals) and MVP-042 (SEO), sequenced in `docs/plans/guide-and-hub-redesign.md`.

## 2026-10-06 — A search phrase for every guide

The product owner asked: *"Make sure every page, article or whatever has good keywords so search engines find it easily."* Google's own documentation (checked 2026-10-06) says:
- the **meta keywords tag is not used** by Google Search;
- what helps is **descriptive, unique titles**, a **short description**, and using **the words people search for**;
- **repeating keywords is against its spam policies**.

So, instead of a keywords tag:
- **Every guide names one `searchPhrase`** in its front matter: the words a person would type, such as `power automate flow not triggering`. It is required for launch content, unique per guide, never a list, and at most 80 characters. It isn't stored in the database.
- **A CI gate checks each guide uses its phrase naturally** (`packages/adapters/content/src/content-files.test.ts`):
  - every word of it is in the title or the first 160 characters of the excerpt (the meta description), and at least half are in the title;
  - at least half are in the opening paragraph;
  - the exact phrase appears no more than four times in the body.
  - Titles must also be unique.
- **All 57 launch guides** were given a phrase. Where a guide didn't use its phrase, the excerpt or opening sentence was reworded naturally, usually by naming the product. **No approved title was changed.**
- **Pages other than guides** (hubs, `/learn`, updates, About) get the same treatment in the redesign build (MVP-037, MVP-042): a unique, descriptive `<title>` and description that name the product and what the page helps with. A technology level is also added to the breadcrumb trail, so results read "LowCodeStacks › Power Automate › …".
- **Limit:** phrases are chosen from how people word their questions in the official communities and on Microsoft Learn, not from search-volume data. Re-check them against Search Console's queries report after 4–8 weeks of data.

### Approvals for the redesign (2026-10-06)
The product owner chose by multiple choice:
- **Hub headlines approved:**
  - Power Automate: "Flows that run, and tell you when they don't";
  - Power BI: "From messy exports to numbers people trust".
- **Drafted for the other five, not yet approved:**
  - Power Apps: "Apps people open every day, built to last";
  - Copilot Studio: "Agents that answer from your data, and only what they should";
  - Dataverse: "Tables that stay tidy, secure and fast";
  - Power Pages: "Websites for your customers, secured by design";
  - Governance & admin: "Room to build, with guardrails that hold".
- **"How we write and check guides" wording approved as shown on the board,** including "Drafts are written with the help of AI, then fact-checked line by line."
- **Build timing:** the redesign build (`docs/plans/guide-and-hub-redesign.md`) starts **after PR #75 is merged**.

## 2026-10-06 — Email and password sign-in: rules (MVP-036)

The product owner restated that **only signed-in readers may comment or post**, and that email and password sign-in is a must alongside Google and the email link. They chose by multiple choice:
- **Minimum length: 12 characters.** This is below NIST SP 800-63B rev. 4's 15-character minimum for password-only accounts; the product owner chose it knowingly. Following the rest of NIST:
  - accept at least 64 characters (the build allows 128) and any Unicode;
  - no composition rules (no "must contain a symbol");
  - no forced periodic changes;
  - a change is required only when there is evidence the password was compromised.
- **Leaked-password check: Have I Been Pwned's Pwned Passwords range API.** It is free, needs no API key and has no attribution requirement (checked 2026-10-06). Only the first 5 characters of the password's SHA-1 hash are sent, with the `Add-Padding` header, and the password never leaves the server.

  If the service can't be reached within 2 seconds, local checks still apply: the password can't contain the email's name part or the site name, or be one repeated character. Sign-up isn't blocked by an outage, and the outage is logged.

  The Privacy notice names the service.
- **Confirm the email before the first password sign-in: yes.** Sign-up emails a confirmation link, and the password works only after it's clicked.

  If the email already has an account (from Google or the email link), sign-up never reveals that. Instead, the owner of the address gets an email with a link to set a password. One email always means one account.

**Engineering defaults** (reversible, from OWASP's password storage cheat sheet):
- Hashing with Node's built-in **scrypt** (N=2^17, r=8, p=1, a 16-byte random salt and 64-byte key), compared in constant time. Node's built-in, so there's no native dependency on Netlify.
- Sign-in creates the same **database session** the other methods create, so the Account sessions page keeps working.
- Failed attempts are limited per account and per IP address, through a database table. Serverless memory can't be trusted.
- Reset and confirmation links are single-use, expire after 1 hour, and are stored only as SHA-256 hashes.

## 2026-10-06 — Hub headlines (all seven) and hub build order (MVP-037)

**Source:** direct product-owner instruction in this session. Asked to approve the five drafted hub headlines, the product owner answered: "review all and update what would be the best for it and then design it and implement". The wording is delegated to the agent, as recorded here. Asked about order, they chose **hubs first**, before the guide-page frame. This changes `docs/plans/guide-and-hub-redesign.md`'s slice order from 1 → 3 → 2 → 4 → 5 to 3 → 1 → 2 → 4 → 5.

**Headlines, as built** (lead, then the serif accent):
- **Power Automate:** "Flows that run, *and tell you when they don't*". Kept: approved 2026-10-06.
- **Power BI:** "From messy exports *to numbers people trust*". Kept: approved 2026-10-06.
- **Power Apps:** "Apps that open fast, *and see every row*". This replaces the draft "Apps people open every day, built to last". The new one names the two problems people bring most often, slow apps and the 500-row delegation limit, in the same "does X, and Y" rhythm as Power Automate.
- **Copilot Studio:** "Agents that answer right, *and know when not to*". This replaces "Agents that answer from your data, and only what they should". It's shorter, and covers the same two themes: grounding, and keeping answers inside what the agent should say.
- **Dataverse:** "Tables that stay fast, *and open only to the right people*". This replaces "Tables that stay tidy, secure and fast". It leads with the security model, the area's most-asked problem (security roles and "missing privilege" errors).
- **Power Pages:** "Sites for your customers, *secured table by table*". This replaces "Websites for your customers, secured by design". It names how Power Pages actually secures data, table permissions, and avoids the vaguer "by design".
- **Governance & admin:** "Room to build, *with guardrails that hold*". Kept as drafted.

None of the headlines claims Microsoft endorsement or a product capability. They describe what the guides help a reader achieve.

**Also delegated and built with the hubs:**
- **Most-needed fixes:** each hub's two to five problems, chosen from the research in `docs/research/content-briefs/`. Each one links straight to the guide that fixes it.
- **Search titles and descriptions:** each hub names the product and what it helps with (`HUB_SEO`, `apps/web/lib/technology-hubs.ts`).

## 2026-10-06 — Branded emails: concept E1 and the wording (MVP-044)

**Source:** direct product-owner instruction in this session.
- **Request:** "start designing the email that we send out to have our design system and nice UI, all emails that go from the site".
- **Design:** the design board's "Emails" row offered three concepts. Asked which one, the product owner chose **E1, "Card on cream"**: the site's cream page, a white card, the X2 logo, a lime marker under the heading's last words and a black pill button.
- **Wording:** asked whether the wording on the "All four emails" board was OK, they answered: "You decide what to put in wording". The wording is the agent's, recorded here, and replaces the deletion receipt's old placeholder text.

**The four emails, as built** (`apps/web/lib/email-templates.ts`, `EMAILS`):
- **Sign-in link:** "Your sign-in *link*". It says the link works once and expires in 24 hours (Auth.js's default), and explains the second button on the site (scanner protection, MVP-034).
- **Confirm your email** (password sign-up): one step left; the link expires in 1 hour.
- **Choose a new password:** set or reset; saving signs you out on every other device; the link expires in 1 hour.
- **Deletion request received:** "We'll review the request and reply within 30 days, as our Privacy notice promises", with a button to the account page and the contact address.

**Rules for every email:**
- Tables and inline styles, and system fonts.
- The logo as a PNG from the site (`/email/logo.png`), because Gmail shows no SVG. It is the only image: no tracking pixel, no tracked links.
- A plain link under every button, and a plain-text version of each email.
- Dark-mode colours where the mail app supports them.
- The independent notice in every footer.

## 2026-10-06 — Guide frame built; How we write: interim wording

**Built (slice 1 of `docs/plans/guide-and-hub-redesign.md`).** The product owner chose the guide page redesign next. Every guide now has the G1 frame:
- the trail: technology, its section, the kind of guide;
- the title with its serif accent;
- chips for the technology, the kind and the reading time;
- the **trust strip**;
- an optional **quick-answer card**;
- contents, the guide and a side column of related guides ("If that wasn't it" on fix guides).

The guide's image is now in its `TechArticle` data, and the new page is `/how-we-write`.

**The trust strip claims only what the guide states** (the 2026-10-01 rule: no check the site can't point to):
- "Checked against Microsoft Learn" and a date appear only when the guide carries a dated note. 33 guides do; the 24 first-wave guides don't, because the records don't confirm a dated check for each.
- Otherwise the strip shows the number of sources and the last-updated date.

**Quick answers:** a guide can add a `> [!ANSWER] Title` block, a short numbered list that links to its own sections. A test fails if a link points at a heading that doesn't exist. Three guides have one so far: the trigger checklist, more than 5,000 SharePoint items, and delegation. Each answer is drawn only from its guide's own text.

**How we write: interim wording.** The page uses the wording approved on the board, with three sentences changed until the features they describe exist:
- the intro says every guide "lists the sources it was checked against", not that it "shows the date it was last checked";
- step 2 says "guides checked since launch show the date they were checked";
- steps 5 and the closing line say to **email the contact address**, not "use Something here changed? on any guide". That button arrives with slice 4.

When slice 4 ships and the first-wave guides are re-checked, the approved sentences return.

## 2026-10-07 — Votes and reports (MVP-039, MVP-038 part; redesign slice 4)

**Source:** direct product-owner instruction in this session. Asked by multiple choice, the product owner chose:
- **Votes ("Did this fix it?"):** the badge rule "at 10 votes, 80% Yes". Visitors see only a thank-you. A guide shows **Accepted fix** once at least 10 people voted and at least 80% said Yes. All counts are shown only in the admin.
- **Reports ("Something here changed?"):** a short note with no contact details. It's anonymous, at most 500 characters, and waits in the admin until closed. We ask people not to include personal details, and the Privacy notice says how long notes are kept.

**As built:**
- **What's stored:**
  - a vote: only yes or no, the guide and the time;
  - a report: only the note, the guide and the time.

  Nothing about the visitor, no account needed. Closing a report in `/admin/feedback` deletes it.
- **Abuse limits,** as hashed per-address counters in the existing `auth_throttle` table, deleted a day after last use:
  - one vote per guide per address per day (a repeat is thanked but not counted);
  - 60 votes an hour per address;
  - 5 reports an hour per address.
- **Wording:**
  - fix guides ask "Did this fix it?" (Yes, fixed / Not yet); other guides ask "Was this helpful?" (Yes / Not really);
  - "Not yet" opens the report note;
  - the Accepted fix badge shows only on fix guides.
- **Privacy notice:** new version 2026-10-08, with a "Feedback on guides" section and the retention lines.
- **How we write:** the two report sentences return to the approved wording. The checked-date sentences stay interim (see "How we write: interim wording").


## 2026-10-07 — Top bar names, AI search readiness, and comments

**Source:** direct product-owner instruction in this session. The product owner asked for the top bar to be reviewed ("Technologies, Guides look weird"), and for an audit of how the site appears in AI tools. The agent's research and three drawn concepts were shown; the product owner chose by multiple choice and added notes.

**Top bar (MVP-045): concept A, with two changes from the product owner.**
- **Power Platform ▾** replaces "Technologies" (the same menu). On phones the menu's group label reads "Power Platform" too.
- **Fixes** (the fix guides on `/learn`) and **Patterns** (the pattern guides on `/learn`) replace "Guides".
- **Updates** stays. The product owner offered "MS updates" or "Updates", the agent's choice; "Updates" was chosen because "MS updates" could read as official Microsoft content, which the site must not imply.
- The button reads **Learn** and opens `/learn` (the product owner's change from "Find a fix").
- The search box reads **"Search an error or topic"**.
- Choose, Measure and Look it up guides stay one click away: each technology page, and the menu's "every guide by goal" link.
- Supersedes the top-bar part of "Navigation restructure: by technology and by goal" (2026-10-02, decision 1).

**AI search readiness.** The product owner approved all four proposals:
1. **Code gaps:** guides are marked as articles for sharing (`og:type` article with their dates); the site describes itself as an organisation (name, logo and web address) in its structured data; an RSS feed of guides.
2. **Quick answers on every guide,** written from each guide's own text, never adding claims the guide doesn't make.
3. **IndexNow** (already part of MVP-042): the product owner creates the key and adds it in Netlify.
4. **A named author** on every guide, with a profile page. **Open:** whose name, and the profile text, still to be confirmed by the product owner before anything is published.

Not adopted, from the agent's research: `llms.txt` (Google says it doesn't use it; no evidence any AI search tool does), and blocking AI crawlers (the guides are free; training and search crawlers are separate, so this would not be needed for search either way).

**Comments (MVP-040).** Asked by multiple choice earlier on 2026-10-07, the product owner chose:
- **When:** after redesign slice 2 (MVP-041).
- **Moderation:** comments show at once and are removed if reported (not a queue before publishing).
- **Name:** a display name the reader chooses. Then, in this round, the product owner added: **every signed-in reader is given a random, Power Platform-flavoured display name and an avatar,** which they can change, and those show on their comments.

## 2026-10-07 — No personal details on the site; guide text and the admin panel

**Source:** direct product-owner instruction in this session, by multiple choice with notes, and two follow-up messages.

**No personal details on the site.**
- **Brand only.** Guides stay credited to LowCodeStacks in structured data. The "named author" in "AI search readiness" (decision 4 of that entry) is withdrawn; "Business model ..., decision 4" (no person named in public data) stands.
- **A byline.** Guides show "Posted by **the Maker Desk**", the name LowCodeStacks publishes under. The product owner asked for "a nice name related to the niche" and delegated it; "maker" is what Power Platform calls the people who build apps and flows. It can be changed in one place (`BYLINE_NAME`, `apps/web/lib/legal/pages.ts`).
- **No name, no place.** The owner's name, province and city come off the site: About, Privacy and Terms, the copyright lines and the MIT notice ("LowCodeStacks"). The product owner: *"remove city name too if not required"* and *"I have never seen any site put it"*. The Terms' governing-law clause now says "the laws of Canada that apply", with no province; a governing-law clause isn't required.
- **Privacy still says who is responsible:** "run independently by its owner", with the contact email. Canada's privacy law (PIPEDA, Schedule 1, 4.8.2) asks for the *name or title* and the address of the person accountable, so a title meets the first part. **Open:** whether an email address is enough "address" or a mailing address is needed: not legal advice; worth checking with a lawyer before payments launch.
- **Unchanged:** the Privacy notice still says data may be stored outside Canada and names Canada's Privacy Commissioner. Both are needed for the disclosures to be accurate.
- New Privacy and Terms versions, 2026-10-09 (migration `20261009000000_add_policy_versions_2026_10_09`). The Terms' sign-in sentence is brought up to date at the same time: email link, Google or password.

**Guide text.** For now the agent researches and drafts improved guide text as files only (drafts). Published guides are changed in the admin. In future, guide text is **editable by an admin only**.

**Admin panel and a Contributor role (MVP-047).** The product owner asked for *"a more powerful, full of features, more admin-friendly admin panel ... with all required things there to manage the whole site"*, and to **create a Contributor role**, whose abilities are **to be decided**. Until then a Contributor can do nothing an ordinary signed-in reader can't. Designed on the canvas first, for approval.

## 2026-10-07 — Comments wording, admin panel, speed check and the Learn module

**Source:** direct product-owner answers in this session, by multiple choice.

1. **Comments (MVP-040): the Terms and Privacy wording is approved as written** in `docs/plans/mvp-040-comments.md`. It goes into the Terms ("Comments") and the Privacy notice ("Comments and your profile") with new versions. The product owner then sets `FEATURE_COMMENTS=on` in Netlify.
2. **Admin panel (MVP-047): concept A, "Command centre".** A sidebar with every area, grouped (Content, Community, People, Site), with live counts. The home shows what needs the admin now, then the site's health. The Contributor role's abilities are still to be decided (2026-10-07 entry above).
3. **Page-speed check (MVP-042): measured with Playwright, not Lighthouse CI.** Lighthouse CI's dependencies carry 4 high-severity advisories (tmp, extract-zip, basic-ftp), which would fail the security audit. The check measures LCP and CLS, and long tasks as the lab stand-in for INP, in Chromium with the tools already in the repo. The budget is the one approved on 2026-10-06 (LCP ≤ 2.5 s, CLS < 0.1). This supersedes "a Lighthouse budget" in "SEO additions alongside the guide-page redesign", decision 4.
4. **The Learn module: go ahead as planned** in `docs/plans/learn-module.md`. Topics made of short lessons at `/topics`, with the fixed lesson shape, optional progress for signed-in readers, and "check yourself" questions. First topics: one per technology. Next step: 3 design concepts for the topic and lesson pages, for sign-off before building.

## 2026-10-07 — Display font and the Learn module design direction

**Source:** direct product-owner answers in this session, by multiple choice with a note.

1. **The display font (Bricolage Grotesque) uses `font-display: optional`** to remove the home page's layout shift (CLS 0.13; TD-032). On a slow first visit the headline keeps the fallback font for that page; the font is cached and used from the next page on.
2. **The Learn module follows concept L3, "Story scroll"**: lessons drawn as a path, and each lesson a guided scroll through the fixed shape with a stepper. The product owner asked the agent to *"research more to take [the] L3 approach to peak and top class, add animation or what not; research what top learn modules use"*, and to show **variations of L3** for a final choice before building.

## 2026-10-07 — Learn module design: "Workspace"

**Source:** direct product-owner instruction in this session (*"I will go with workspace"*), after five redesign directions were shown live and as recorded demos (`.nav-mock/learn-redesign.html`, not committed).

1. **The Learn module uses direction 1, "Workspace".** This supersedes concept L3 "Story scroll" (entry above). A lesson page has three columns: on the left, the topic's lessons, each with a ring that fills as it is read; in the middle, the lesson; on the right, an "On this page" tracker and a reading-progress bar. A knowledge check closes each lesson, with an explanation for every answer and no penalty, and the next lesson slides in. On a phone the side columns collapse.
2. **The fixed lesson shape stays** (`docs/plans/learn-module.md`): what you'll understand, the idea, how it works, the important things, try it, check yourself (the knowledge check), and sources. Progress for signed-in readers and the addresses at `/topics` stay as approved on 2026-10-07.
3. **Not chosen:** Explorable, Cards, Map and Simulator. The agent's recommendation (Map as the Learn home, plus a formula playground in key lessons) was not taken; the `/topics` home and topic pages follow the Workspace style.
