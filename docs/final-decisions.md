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
