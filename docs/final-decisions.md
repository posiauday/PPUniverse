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
