# Power Platform Universe: Claude Code Build Pack

This repository is the execution package for building a production-grade Power Platform community, learning platform, asset marketplace, and SaaS tool suite.

## Start here
1. Open the repository in Claude Code.
2. Read `CLAUDE.md` and `docs/00-document-index.md`.
3. Run `/product-discovery`, then `/architecture-gate`, then `/vertical-slice`.
4. Build only the MVP scope defined in `docs/02-prd.md` and `planning/mvp-backlog.csv`.
5. Do not add unapproved features, fake marketplace inventory, fabricated reviews, or unsupported Microsoft claims.

## Recommended first release
- Public catalog and SEO landing pages
- Authenticated user accounts
- Power Apps component asset pages
- Free and paid downloads
- Stripe checkout and license entitlement
- Creator submission and admin moderation
- Documentation and changelog
- Analytics, consent, accessibility, security, and observability foundations

The broader feature matrix is included as a planning input, not an instruction to build all features at once.

## Development

Requires Node.js >=20 and pnpm (`corepack enable` or `npm install -g pnpm`).

```bash
pnpm install
pnpm build
pnpm lint
pnpm typecheck
pnpm test
```

`packages/db` needs a `DATABASE_URL` (see `packages/db/.env.example` and `apps/web/.env.example`) to generate the Prisma client and run migrations/integration tests. For local Postgres:

```bash
docker compose up -d
pnpm --filter @ppu/db exec prisma migrate deploy
DATABASE_URL="postgresql://ppuniverse:ppuniverse@localhost:5432/ppuniverse?schema=public" pnpm test
```

Without `DATABASE_URL`, everything else (typecheck, lint, unit tests, build) still works — DB-dependent integration tests skip themselves (`describe.skipIf`) rather than failing.

CI (`.github/workflows/ci.yml`) runs format-check, lint, typecheck, test (unit + integration, against a Postgres service container), build, a non-blocking dependency audit, and a secret scan on every pull request.

## Repository structure

```
apps/web              Next.js (TypeScript) web application and server API — accounts, sign-in, sessions (MVP-002)
apps/worker            Background job process (BullMQ consumers, added per story)
packages/shared         Cross-cutting infra: API error envelope, pagination helper
packages/db             Prisma schema/client — Identity domain so far (User, Account, Session, VerificationToken)
packages/domain/identity        Session-ownership rules, repository port + in-memory fake
packages/adapters/identity      Prisma-backed session repository
packages/adapters/email          Minimal EmailAdapter (console/dev implementation)
packages/config, telemetry, ui                       structural placeholders, filled in by the stories that need them
packages/domain/<name>                                one per TRD domain, structural placeholders except identity
packages/adapters/<name>                              one per external integration, structural placeholders except identity/email
```

Placeholder packages carry only a `README.md` stating their purpose and owning backlog story — see `docs/13-implementation-readiness-plan.md` §1 and §3 for the full rationale.
