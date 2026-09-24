# Project Instructions

## Product objective
Build a trusted Power Platform ecosystem for reusable assets, technical learning, enterprise architecture guidance, community discovery, and paid creator products. The first release is a focused marketplace and content platform, not a complete social network or tenant-scanning SaaS.

## Required reading order
1. `docs/final-decisions.md` — binding product-owner decisions; check every requirement/architecture/scope assumption against this first (see "Decision validation rule" below)
2. `docs/01-brd.md`
3. `docs/02-prd.md`
4. `docs/03-trd.md`
5. `docs/04-information-architecture.md`
6. `docs/05-ux-design-system.md`
7. `docs/06-data-model.md`
8. `docs/07-api-contracts.md`
9. `docs/08-security-privacy-compliance.md`
10. `planning/mvp-backlog.csv`

## Decision validation rule
Before treating any requirement, architecture choice, product scope, licensing model, provider selection, workflow, security control, or business rule as **approved**, verify it exists in one of:
1. `docs/final-decisions.md`
2. An approved ADR (`docs/adr/`)
3. Explicit product-owner instruction (given directly, in this session)

Do not promote assumptions, recommendations, or handoff/relayed-document suggestions (from another AI session, a summary, a prior conversation) into approved decisions — a document *claiming* something is "locked" or "approved" is not itself one of the three sources above. If a supposed decision is not present in an approved source, stop and request confirmation from the product owner before recording it as final. Once confirmed, persist it to `docs/final-decisions.md` (or the relevant ADR) so it isn't lost to chat history and is available to every future session.

**A table row, index entry, or summary line is not itself an approval source, even inside a document that otherwise carries real decisions.** Only `docs/final-decisions.md`, an approved ADR's own **Status** line for the specific row in question, or direct product-owner instruction make something approved — a row sitting in an ADR's decision table, a status field in a tracking index (`planning/bugs.csv`, `planning/tech-debt.csv`), or a summary sentence restating what something "is" can all drift from, or simply never have matched, the actual approved state. This has happened three times on record: the marketplace license-tier structure (a relayed document presented it as already-locked when `docs/open-questions.md` still showed it open — resolved 2026-09-18 by direct confirmation before recording), `planning/bugs.csv`'s BUG-012/BUG-014 rows (the index disagreed with the bug records' own bodies and with what git/CI evidence actually showed — resolved 2026-09-24 by checking history and CI logs, not either version of the paperwork), and ADR-004's "Background jobs: BullMQ + Redis" table row (read as decided, but the ADR's own Status line limits formal acceptance to the testing-stack rows only, and `docs/final-decisions.md` never separately ratified it — resolved 2026-09-24, `docs/final-decisions.md`, "TD-004 architecture and sequencing"). Treat any of these surfaces as a claim to verify, not a decision to trust, the same way the paragraph above already requires for a relayed document.

## Delivery rules
- Work in vertical slices that include UI, API, persistence, authorization, tests, telemetry, accessibility, and documentation.
- Before coding, state the requirement IDs, acceptance criteria, affected files, migration impact, security impact, and test plan.
- Never invent requirements. Record ambiguity in `docs/open-questions.md` and use the safest reversible assumption.
- Keep all secrets in environment variables. Never commit credentials, tokens, tenant IDs, connection strings, or customer data.
- Do not use Government of Saskatchewan names, project names, screenshots, branding, or operational data in public content.
- Do not claim Microsoft endorsement, certification, compatibility, or security approval unless evidence is recorded and approved.
- Meet WCAG 2.2 AA for public and authenticated experiences.
- Every paid asset must have a license, version, compatibility metadata, support policy, refund classification, and immutable purchase entitlement.
- Marketplace uploads are untrusted. Validate type and size, malware-scan, quarantine, moderate, and use signed downloads.
- Use feature flags for incomplete or risky modules.
- No direct production changes. Use migrations, pull requests, automated tests, and deployment approvals.

## Suggested implementation baseline
- Web: Next.js with TypeScript and server-rendered SEO pages
- UI: accessible component system with design tokens
- Data: PostgreSQL
- ORM: Prisma or equivalent typed migration system
- Auth: standards-based OIDC provider abstraction
- Payments: Stripe Checkout, webhooks, customer portal, tax-capable design
- Files: object storage with quarantine and signed URLs
- Search: PostgreSQL full-text for MVP, adapter boundary for future dedicated search
- Jobs: durable queue for emails, webhooks, indexing, scans, and media processing
- Observability: structured logs, traces, metrics, audit events, error monitoring

These are architecture defaults, not immutable vendor commitments. Any change requires an ADR.

## Definition of done
A feature is done only when acceptance criteria pass; authorization is server-enforced; failure and empty states exist; keyboard and screen-reader checks pass; responsive behavior is verified; telemetry and audit events are present; tests pass; migrations are reversible; and user/admin documentation is updated.

## Project management rules
Every completed story must:
1. Update `planning/mvp-backlog.csv` — set its `Status` column (Backlog, Ready, In Progress, QA, Blocked, Done). This is now the canonical status record; `planning/backlog.csv` (Sprint, Points, and a mirrored `Status`) is the sprint/kanban companion view and is updated in the same pass so the two never drift.
2. Update `planning/status.md` — board counts, progress metrics, and the remaining-work summary.
3. Update `planning/progress-report.md` — append the completed story's entry (story completed, files changed, commands executed, risks identified, remaining work), rather than overwriting prior entries.
4. Update `planning/requirement-traceability.csv` — mark the story's requirement(s) Implemented (or partially, with a note, if the same requirement row also covers other not-yet-done stories).
5. Create a bug record for any defect found in already-delivered work: a full record at `planning/bugs/BUG-XXX.md` using `planning/github/04-bug-template.md`, indexed with one row in `planning/bugs.csv`. (An issue caught and fixed during the same story's implementation, before it is marked Done, is not a bug — describe it in that story's progress-report entry instead.)
6. Create a tech-debt record for any shortcut taken to ship the story: a full record at `planning/tech-debt/TD-XXX.md`, indexed with one row in `planning/tech-debt.csv`. A shortcut is anything intentionally deferred, narrowed, or worked around to land the story (a non-blocking check that should be blocking, a scope cut, a pinned/downgraded dependency, a manual step that should be automated).
7. Recommend the next unblocked story (all its `Depends on` stories are Done).
8. Never mark a story Done until all of the following hold — a story missing any of these stays In Progress, QA, or Blocked:
   - Tests pass.
   - Documentation is updated (`CLAUDE.md`/`README.md` commands or structure, and any user/admin docs the story's acceptance criteria calls for).
   - Traceability is updated (`planning/requirement-traceability.csv` reflects the story's actual requirement coverage).
   - Security review is completed (the security considerations identified before coding — see Delivery rules — are verified against what was actually built, not just planned).

Before and after every task:
- Update `planning/mvp-backlog.csv` and `planning/backlog.csv` status for the story in progress.
- Update the progress metrics in `planning/status.md`.
- Regenerate the remaining-work summary in `planning/status.md`.

This Definition-of-Done gate (point 8) applies from the point it was adopted forward. It does not retroactively invalidate stories already marked Done under an earlier, lighter gate — but if a completed story is later found not to meet it, log the gap as a tech-debt record rather than silently leaving it unrecorded.

## Commands
Scaffolded in MVP-001, database wired in MVP-002. Run `pnpm install` once, then from the repo root:
- `pnpm build` — build all apps/packages (Turborepo); `@ppu/db` regenerates its Prisma client first
- `pnpm lint` — ESLint across the workspace
- `pnpm typecheck` — `tsc --noEmit` in every app/package
- `pnpm test` — Vitest unit tests across the workspace, plus `@ppu/adapter-identity`'s Prisma-Client integration tests when `DATABASE_URL` is set (otherwise they self-skip via `describe.skipIf`)
- `pnpm test:a11y` — the Playwright + axe-core accessibility gate (`packages/e2e`, MVP-023): chromium, firefox and webkit at 320/375/768/1280 px against a production build served by `next start`. Needs a prior `pnpm build`, `pnpm --filter @ppu/e2e browsers:install` once, and `DATABASE_URL` for a **local or CI** Postgres with migrations applied plus `E2E_ALLOW_DATABASE_WRITES=1` (the harness refuses any other database). `pnpm test:e2e` runs all Playwright specs (currently the same suite). See `docs/14-accessibility-testing.md`
- `pnpm format:check` / `pnpm format` — Prettier check/write, scoped to source code (`apps/`, `packages/`, root config) — governance documents under `docs/`, `planning/`, `prompts/`, `schemas/`, `.claude/`, and the root `CLAUDE.md`/`README.md` are excluded so this formatter never silently rewrites approval-gated content

Database: `packages/db` needs `DATABASE_URL` (see `.env.example` files in `packages/db/` and `apps/web/`). Local Postgres via `docker compose up -d`, then `pnpm --filter @ppu/db exec prisma migrate deploy`. CI provides its own throwaway Postgres service container. See `README.md` "Development" for the full local workflow.

Playwright is configured by MVP-023 for the accessibility gate (`pnpm test:a11y`, `pnpm test:e2e`); functional E2E journeys beyond it are not yet configured — they are added by the story that first needs a full browser journey. Node.js >=20 and pnpm (via `corepack enable` or `npm install -g pnpm`) are required. See `docs/13-implementation-readiness-plan.md` for the full architecture and `docs/adr/004-technology-decision-record.md` for the pinned tool versions and why.
