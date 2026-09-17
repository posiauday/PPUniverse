# Project Instructions

## Product objective
Build a trusted Power Platform ecosystem for reusable assets, technical learning, enterprise architecture guidance, community discovery, and paid creator products. The first release is a focused marketplace and content platform, not a complete social network or tenant-scanning SaaS.

## Required reading order
1. `docs/01-brd.md`
2. `docs/02-prd.md`
3. `docs/03-trd.md`
4. `docs/04-information-architecture.md`
5. `docs/05-ux-design-system.md`
6. `docs/06-data-model.md`
7. `docs/07-api-contracts.md`
8. `docs/08-security-privacy-compliance.md`
9. `planning/mvp-backlog.csv`

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

## Commands
Document actual commands after scaffold creation. Prefer deterministic commands such as `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm test:e2e`, and `pnpm build`.
