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
