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
