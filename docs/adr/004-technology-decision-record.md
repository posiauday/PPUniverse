# ADR 004-technology-decision-record: Final technology decisions for MVP build

## Status
Accepted (2026-09-21), for the testing-stack rows only.

Approval source: the product owner's direct instruction of 2026-09-21 on MVP-023 (`docs/final-decisions.md`, "Product-owner decisions for MVP-023" Q41, and "Product-owner response to the MVP-023 stop-gate confirmation" item 4). This status change records the approval of the testing stack — Playwright, axe-core and @axe-core/playwright, at the pinned versions in the 2026-09-21 amendment below — and does not approve or change any other row of this ADR. The status of the other rows is as recorded in `docs/final-decisions.md`; any row that is not approved there needs its own decision.

## Context
`CLAUDE.md` lists a suggested implementation baseline and states architecture defaults require an ADR to change. No application code exists yet. This ADR confirms the baseline as final for MVP-001 onward, adds the specific choices the baseline left open, and marks which specifics remain vendor/business decisions rather than technical ones (tracked in `docs/open-questions.md`).

## Decision
Confirm, as final for MVP:

| Concern | Decision | Rationale |
|---|---|---|
| Monorepo tooling | pnpm workspaces + Turborepo | Fast incremental CI, native workspace protocol, low operational overhead vs Nx for a single web+worker topology |
| Web framework | Next.js (App Router), TypeScript strict mode | Server-rendered/static SEO pages (NFR-004), React Server Components for catalog/product pages |
| UI layer | Radix UI primitives + Tailwind CSS, design tokens generated from `docs/05-ux-design-system.md` | Accessible-by-default primitives support WCAG 2.2 AA (NFR-001) faster than building from scratch |
| Database | PostgreSQL 15+ | Matches TRD system of record; supports full-text search and JSONB for compatibility/metadata fields |
| ORM/migrations | Prisma with Prisma Migrate, multi-file schema (`prismaSchemaFolder` preview) split by domain | Typed interfaces at trust boundaries (TRD quality requirement); domain-aligned schema files ease ownership |
| Identity | Auth.js (NextAuth) with a generic OIDC provider adapter | Satisfies "standards-based OIDC provider abstraction"; actual IdP vendor is **open** (open question 4) |
| Payments | Stripe Checkout + Billing Portal + webhooks | Explicitly named in CLAUDE.md baseline; tax-capable via Stripe Tax when jurisdictions are decided (open question 3) |
| Object storage | S3-compatible storage behind a `StorageAdapter` interface | Vendor (AWS S3, Azure Blob, R2, etc.) is **open**, tied to hosting region (open question 5) |
| Background jobs | BullMQ + Redis | Durable queue for webhooks, email, indexing, scans, media processing per TRD |
| Search | PostgreSQL full-text (`tsvector`/`tsquery`) behind a `SearchAdapter` interface | Matches TRD "adapter boundary for future dedicated search"; no separate search service for MVP |
| Email | Transactional email behind an `EmailAdapter` interface | Vendor is **open**; interface lets CI run against a fake adapter |
| Malware scanning | Scan behind a `ScanAdapter` interface (e.g., ClamAV self-hosted or a vendor API) | Vendor/cost model is **open** (open question 9); interface unblocks upload pipeline development |
| Observability | OpenTelemetry traces/metrics, structured JSON logs, an `ErrorMonitoringAdapter` | Correlation IDs across web/worker/webhooks per TRD; vendor for error monitoring is **open** |
| Testing | Vitest (unit/integration), Playwright (E2E), axe-core (automated a11y) + manual keyboard/screen-reader pass | Matches `docs/11-test-strategy.md` layers |
| CI/CD | GitHub Actions | Matches `docs/12-devops-runbook.md` pipeline stages; no vendor lock beyond GitHub, which already hosts the repo |

## Amendment (2026-09-17, during MVP-002)
"Identity: Auth.js with a generic OIDC provider adapter" is underspecified: OIDC delegates account creation to an external IdP, but FR-004 requires the app itself to create accounts and verify email — not something an OIDC flow does. Clarification, not a reversal: Auth.js's provider model supports both patterns under one abstraction. MVP-002 uses Auth.js's Email provider (passwordless magic-link) as the base identity mechanism — the app owns the account and the email-verification step, sessions are database-backed (unchanged from the original decision). Generic OIDC providers remain available in the same Auth.js configuration for enterprise SSO once open question 4 resolves; adding one later is a config addition, not a rearchitecture.

Also confirmed during MVP-002: `next-auth` "latest" is `4.24.15` (the v5/"Auth.js" rebrand is still `5.0.0-beta.x`, unreleased as stable) and `prisma` "latest" is an `8.0.0-rc.x` release candidate. Both are pinned to their last stable line for this build: `next-auth@4.24.15` with `@next-auth/prisma-adapter@1.0.7`, and `prisma@7.10.0` — matching the TS 7.0/6.0.3 precedent from MVP-001 of preferring the stable line over a newer major still settling.

## Amendment (2026-09-17, product-owner constitution)
`docs/final-decisions.md`'s 2026-09-17 entry resolves several items this ADR left open, and adds two items not previously decided. Recorded here per this ADR's own table structure; `docs/final-decisions.md` is the authoritative source if these ever diverge.

| Concern | Resolution |
|---|---|
| Object storage vendor | Cloudflare R2 (production), MinIO (development, already implemented in MVP-006 — no code change needed, R2 is S3-API-compatible) |
| Email vendor | Resend (not yet built — MVP-018) |
| Error monitoring / observability vendor | Sentry (errors) + PostHog (product analytics) (not yet built — MVP-022) |
| Malware scanning | ClamAV confirmed correct for development (MVP-006); production requires an asynchronous scanning service, not the current synchronous in-request pipeline (tracked as `planning/tech-debt/TD-004.md` until a story owns it) |
| Row Level Security | Approved and required. Implemented as RLS-enabled-with-zero-policies on every table (standard PostgreSQL DDL, no Supabase-specific `auth.uid()`/PostgREST dependency) — the app's own Postgres connection uses the table-owning role and is unaffected; this only closes the anon-key/PostgREST exposure path the app never uses. See `docs/final-decisions.md` for the full rationale and the production-role caveat. |
| UI component layer | shadcn/ui confirmed as the concrete realization of this ADR's existing "Radix UI primitives + Tailwind CSS" decision — not a change, just a specific choice within it. Not yet installed; adopt starting with MVP-003. |
| API style | REST + OpenAPI compatibility — new, not previously decided. Not yet implemented for MVP-002/006's existing routes; adopt going forward, backfill incrementally. |

This amendment closes the storage-vendor, email-vendor, error-monitoring-vendor, and RLS portions of `docs/open-questions.md` items 5, 9/19, and 16 respectively — see that document for the updated entries.

## Amendment (2026-09-21, MVP-023: accessibility testing stack)
The Testing row is confirmed as Vitest (unit/integration), Playwright (E2E) and axe-core (automated accessibility) with a manual review checklist. Exact versions (no ranges); licences were read from the installed packages on 2026-09-21:

| Package | Pinned version | Licence |
|---|---|---|
| `@playwright/test` (pulls `playwright` and `playwright-core`, same version) | 1.63.0 | Apache-2.0 |
| `@axe-core/playwright` | 4.13.0 | MPL-2.0 |
| `axe-core` | 4.13.0 | MPL-2.0 |

- All three are devDependencies of the private workspace package `packages/e2e` only. The MPL-2.0 packages are used unmodified as test tooling and are not distributed with the application.
- The blocking gate uses Playwright's pinned, bundled browsers (for Playwright 1.63.0: chromium 153.0.8010.12, firefox 155.0, webkit 26.6); no moving or branded channel may gate a merge.
- **Not shipped, verified 2026-09-21:** a production build contains no reference to axe-core or Playwright, and the web app's production dependency tree contains neither. Next.js declares `@playwright/test` as an optional peer, which pnpm resolved from the workspace and would have linked into that tree; the root `.pnpmfile.cjs` removes that peer declaration (`planning/tech-debt/TD-012.md`).
- The manual keyboard and screen-reader pass named in the row now has a checklist and process document (`docs/14-accessibility-testing.md`). It has **not** been performed: screen-reader compatibility is unverified, and who performs it, how often and on which pairs is open question 38.

## Consequences
- Every vendor-specific integration (identity, storage, email, scanning, error monitoring) is reachable only through an adapter interface, so CI and local development can run against fake/in-memory adapters without real vendor secrets — this directly enables MVP-001 (CI baseline) to be built before those vendor decisions are made.
- Multi-file Prisma schema is a preview feature; if it destabilizes, fallback is a single `schema.prisma` with domain-commented sections (non-breaking change, no ADR needed).
- Choosing PostgreSQL full-text search for MVP means search ranking/relevance tuning is constrained to what `tsvector` supports; migrating to a dedicated search service later is a contained adapter swap, not a rewrite.
- This ADR does not resolve open questions 1, 3, 4, 5, 8, 9, or 11 — those remain business/vendor decisions and are re-listed in `docs/open-questions.md`.
