# BUG-015 Pre-Work Analysis — Test Isolation (Per-Package Database)

Authorization: "STORY INSTRUCTION — BUG-015 (Test isolation: per-package database)"
(direct product-owner instruction, 2026-09-24). Pre-work only — no production code,
schema, or package changes are made in this pass. The isolation **strategy** itself
(per-package database isolation) is already decided and is not re-opened here; the
two rejected alternatives (test-task sequencing, test-side scoping) are not
re-proposed.

Branch: `feature/bug-015-test-isolation`. Base: `develop` at `925d00a` (PR #18 merge).

Related: `planning/bugs/BUG-015.md` (original report), `planning/prework/TD-004-prework-analysis.md`
(the sibling pre-work this one follows the same format as), `docs/final-decisions.md`
"TD-004 architecture and sequencing" (the decision that makes this story block TD-004/PROP-007).

---

## 1. Scope of the race

**Every integration suite that writes to the shared CI Postgres, which tables each
touches, confirmed by direct read of all 9 `*.integration.test.ts` files** (not
assumed to be only catalog and entitlements, per the instruction):

| Package | File | Tables written | Unscoped `findMany`/`count` reads? |
|---|---|---|---|
| catalog | `catalog-repository.integration.test.ts` | `compatibilityRecord`, `licenseDefinition`, `product`, `productLicense`, `release`, `supportPolicy` | **Yes — two spots, see below** |
| content | `article-repository.integration.test.ts` | `article`, `articlePublishEvent`, `user` | No (all scoped) |
| entitlements | `entitlement-repository.integration.test.ts` | `product`, `user` | No (all scoped) |
| files | `file-repository.integration.test.ts` | `user` | No `findMany`/`count` calls at all |
| identity | (session/user adapter integration test) | `session`, `user` | No `findMany`/`count` calls at all |
| notifications | `*.integration.test.ts` | `consentRecord`, `emailSend`, `user` | No (all scoped) |
| privacy | `*.integration.test.ts` | `consentRecord`, `deletionRequest`, `deletionRequestEvent`, `policyVersion`, `user` | No (all scoped) |
| scanning | `clamav-scan-adapter.integration.test.ts` | none — confirmed by direct read, no `db.`/`prisma.`/`PrismaClient` reference in the file at all (it exercises ClamAV over the network, not Postgres) | n/a |
| storage | `s3-storage-adapter.integration.test.ts` | none — confirmed by direct read, same as above (exercises MinIO/S3, not Postgres) | n/a |

**Write-surface conclusion:** 7 of 9 packages write to Postgres in their integration
tests, and all 7 write to the shared `user` table (identity's user-creation helper,
or each package's own local fixture user). Two packages (catalog, entitlements) both
write to `product`. Two packages (scanning, storage) don't touch Postgres at all —
their tests race against ClamAV/MinIO state instead, which is out of this story's
scope.

**Read-surface conclusion — this is narrower than the write surface, and it is what
actually makes a test flaky:** despite 7 packages writing to shared tables
concurrently, only **catalog** has any *unscoped* read that compares against another
snapshot. No other package's integration suite does a table-wide `findMany`/`count`
that could be perturbed by a concurrent insert from a different package — every other
package's reads are scoped by an ID, slug, or foreign key it fully controls. This
matters for §2 below: the race is not "every shared table is at risk," it's
"catalog's cross-package-visible read pattern is at risk, and only catalog has that
pattern today."

**Catalog has two vulnerable spots in the same file, not one — the second is a new
finding not present in `planning/bugs/BUG-015.md`:**

1. **Documented: `listSitemapEntries` (the reported bug).** Calls
   `listSitemapEntries()` (an unscoped scan across all `PUBLISHED` products/categories)
   and separately re-derives expected counts, comparing two independently-taken
   snapshots. A concurrent `PUBLISHED` product insert from `entitlements` (or from
   catalog's own other tests, if ever run out of isolation) landing between the two
   snapshots flips the comparison.

2. **New, not previously documented: "lists a category if and only if it currently
   has a PUBLISHED product"** (`catalog-repository.integration.test.ts:463-475`).
   This test calls `listSitemapEntries()` once (snapshot T1), then separately calls
   `db.category.findMany()` and, for each category, a scoped `count` of that
   category's `PUBLISHED` products (snapshot T2, taken after T1), asserting
   `entries.categorySlugs.includes(category.slug) === (published > 0)`. If a
   `PUBLISHED` product is inserted into a category between T1 and T2, the assertion
   can flip: the category could be absent from the T1-derived `categorySlugs` but
   show `published > 0` at T2.

   **This is concretely triggerable, not just theoretical.** Confirmed by direct
   read of both files:
   - `catalog-repository.integration.test.ts:22-31` sets up the suite's primary
     fixture category via `db.category.findUniqueOrThrow({ where: { slug:
     "power-apps-components" } })` — the same shared, migration-seeded category
     (`packages/db/prisma/migrations/20260918000001_seed_catalog_categories/migration.sql`).
   - `entitlement-repository.integration.test.ts:18-67`'s `beforeAll` does the exact
     same lookup, `db.category.findUniqueOrThrow({ where: { slug:
     "power-apps-components" } })`, and creates its own `PUBLISHED` product
     (`entitlement-repo-product`) in that category.
   - Both suites therefore write `PUBLISHED` products into the identical shared
     category row when run concurrently against the same database, which is exactly
     the precondition for the T1/T2 window above.

   In the common case this test still passes, because catalog's own fixtures
   already make `power-apps-components` eligible (`published > 0`) independent of
   entitlements' insert (line 474: "This test's own published products make the
   primary category eligible") — entitlements' insert doesn't flip the boolean in
   that case, it's redundant with catalog's own state. But the assertion has no
   guard against the T1/T2 window itself, so it is not proven safe under all
   interleavings (e.g. a run ordering where catalog's own category-eligibility
   fixtures haven't committed yet at T1 but entitlements' insert has committed by
   T2). Recorded here as a second confirmed-real instance of the same class of bug
   in the same file, not as a new bug report — `planning/bugs/BUG-015.md` is not
   being amended in this pre-work pass; the implementation phase should treat both
   spots as in scope for the same fix, since isolating the database removes both
   at once.

**Conclusion for scope:** the fix must isolate the database/schema for every package
whose integration suite writes to Postgres (7 packages: catalog, content,
entitlements, files, identity, notifications, privacy) for consistency and to
prevent new races as more unscoped reads get added later — not just the 2 packages
implicated in the currently-known races. Scanning and storage are out of scope (no
Postgres access).

---

## 2. Database-vs-schema trade-off

**Recommendation: separate PostgreSQL schemas within one database, one schema per
package, not separate databases.** Evidence:

- **Prisma already parameterizes this.** Every current `DATABASE_URL` in this repo
  (`.env.example` files, `ci.yml:64,145`) already carries `?schema=public` on the
  connection string. Prisma Migrate and Prisma Client both target the schema named
  in that query parameter — this is Prisma's own first-class, documented mechanism
  for exactly this "one physical Postgres instance, N isolated logical schemas"
  shape. No `schema.prisma` file changes are required (this is distinct from
  Prisma's `multiSchema` preview feature, which is for one schema file spanning
  multiple schemas simultaneously — not needed here; the same schema file is applied
  once per target schema, N times).
- **Lower provisioning cost.** `CREATE SCHEMA IF NOT EXISTS pkg_catalog` runs inside
  an ordinary connection, no reconnect, no elevated privilege beyond what the
  `ppuniverse` role already has (it is the container's own initdb-created role, which
  has `CREATEDB`/schema-creation rights in both the CI service container and the
  local embedded-postgres instance — confirmed by `ci.yml:20-22`, the role that
  creates the `ppuniverse` database itself). `CREATE DATABASE` requires a connection
  to a separate maintenance database (`postgres`) and cannot run inside the same
  transaction/session as the rest of a test setup step.
- **One connection string shape, varied by one parameter**, vs. genuinely different
  `DATABASE_URL` values per package (a separate database requires a distinct
  connection because a Postgres connection is bound to one database for its
  lifetime). Schema-per-package keeps host/port/credentials/database name identical
  and only varies `?schema=pkg_x`, which is a smaller, more mechanical change to
  every package's test setup.
- **RLS is not a blocker either way.** `packages/db/prisma/migrations/20260917020000_enable_row_level_security/migration.sql`
  enables RLS with **zero policies** on 5 tables (`users`, `accounts`, `sessions`,
  `verification_tokens`, `file_scans`) — table-owner-bypass is the entire mechanism
  (documented in the migration's own header comment), with no `current_setting`/
  session-variable policy logic anywhere. RLS is schema-agnostic here: it is a
  per-table `ALTER TABLE ... ENABLE ROW LEVEL SECURITY` with no schema-qualified
  policy predicates, so it applies identically whether the table lives in `public`,
  `pkg_catalog`, or any other schema, and needs no rewriting for this change.

**Trade-off acknowledged:** separate databases give slightly stronger isolation
(e.g., a schema-qualified query typo can't accidentally cross into a sibling
package's schema the way it could under a shared `search_path` misconfiguration).
This is judged not to matter here because each package's Prisma Client is
instantiated with its own single-schema `DATABASE_URL` and never sets a multi-schema
`search_path` — there is no shared session where two packages' schemas are both on
the path at once, so accidental cross-schema access isn't actually possible in this
design, only in a design that put multiple schemas on one `search_path`, which this
proposal doesn't do.

---

## 3. Migrations, including RLS

Each package's isolated schema needs the full, identical migration history applied
to it — not a subset. Mechanism: run `prisma migrate deploy` once per package,
targeting that package's own `?schema=pkg_x` connection string, before that
package's tests run. This is the same command already used today
(`ci.yml:96-97`, `pnpm --filter @ppu/db exec prisma migrate deploy`), invoked N times
instead of once, each time with a different `DATABASE_URL`.

RLS migration behavior under this: `ENABLE ROW LEVEL SECURITY` is a per-table DDL
statement scoped to the schema it runs in (Postgres resolves `"users"` against
whatever schema is current for that connection) — applying the same migration SQL
against `pkg_catalog.users`, `pkg_entitlements.users`, etc. is correct and requires
no changes to the migration file itself, per §2 above.

**Runtime cost, from real measured data (`gh api` on CI run 36012330775, the most
recent build-and-test job as of 2026-09-24):**

| Step | Duration |
|---|---|
| Install dependencies | 8s |
| Apply migrations (single schema, today) | 61s |
| Test (unit + integration, single schema, today) | 20s |

A single `migrate deploy` run costs ~61s. Running it once per package needing
isolation (7 packages, per §1) is the dominant new cost this story introduces — see
§8 for the full runtime estimate and how to avoid simply multiplying 61s × 7
sequentially.

---

## 4. Seeded data

`packages/db/prisma/migrations/20260918000001_seed_catalog_categories/migration.sql`
seeds 6 fixed-ID taxonomy categories (`power-apps-components`, `power-apps-templates`,
`power-automate-templates`, `power-bi-templates`, `architecture-blueprints`,
`governance-assets`) as part of the migration history itself, not as a separate seed
script. Because §3's approach re-runs the full migration history per schema, this
seed migration runs once per isolated schema automatically — every package's schema
gets its own independent copy of the same 6 categories with the same IDs (the
migration's `INSERT`s use fixed UUIDs, confirmed by the earlier read of this file in
this session). This is what makes the isolation actually work for §1's finding:
catalog's and entitlements' schemas each get their *own* `power-apps-components` row
once isolated, so their concurrent inserts into "that category" are no longer the
same row.

No other seed data beyond this one migration was found in the migrations directory.

---

## 5. Local parity with no Docker

The user's established local workflow (per `local-postgres-without-docker.md`
memory) runs `embedded-postgres` from the scratchpad, a single Postgres instance on
a fixed local port, with `describe.skipIf(!process.env.DATABASE_URL)` letting
integration tests self-skip entirely when no `DATABASE_URL` is set. Schema-based
isolation preserves this without weakening it:

- The embedded-postgres instance is one physical Postgres server, same as CI's
  service container — `CREATE SCHEMA` works identically against it.
- A developer running one package's tests locally (e.g. `pnpm --filter @ppu/catalog test`)
  only needs that package's own schema created and migrated, not all 7 — so the
  local inner-loop cost does not multiply by 7 the way CI's does, only CI (which
  legitimately runs everything together) pays the full multiplied migration cost.
- `describe.skipIf(!process.env.DATABASE_URL)` continues to work unchanged: a
  developer with no `DATABASE_URL` set still gets a clean skip, per the explicit
  "do not make the local story worse" constraint.

**Open question for the implementation phase, not decided here:** whether each
package's local `.env`/test setup derives its own `?schema=pkg_x` automatically from
a shared base `DATABASE_URL`, or whether each package needs its own `DATABASE_URL`
entry in `.env.example`. Recorded as open question 57 below rather than assumed.

---

## 6. Naming and teardown (avoiding orphaned schemas)

Recommended (not yet implemented, no code written): schema names derived
deterministically from the package name (`pkg_catalog`, `pkg_entitlements`, etc.),
created idempotently with `CREATE SCHEMA IF NOT EXISTS` before migration and left in
place between runs (schemas are cheap; dropping and recreating 7 schemas' full
migration history on every single CI run is exactly the 7×61s cost problem in §3).
This avoids the orphan risk a random/timestamped schema name would create (a
crashed run leaving `pkg_catalog_1758727200` behind forever) by using fixed, known
names that a later run simply reuses and re-migrates (idempotent `migrate deploy`).
No teardown step is needed for CI (`postgres:17-alpine` service containers are
ephemeral per-job already). For local embedded-postgres, the same fixed-name schemas
persist across runs in the user's own scratchpad data directory, consistent with how
the single `public` schema already persists there today — this is not a new
behavior.

---

## 7. Interaction with the future job-queue table

Per `docs/final-decisions.md` "TD-004 architecture and sequencing" §3, this story
must resolve *before* any job-queue table exists, specifically because a shared job
table would be the same class of shared-mutable-state risk this story removes. Once
this story lands, a future job-queue table becomes just another table inside each
package's own isolated schema *if* the job queue itself is scoped per-package — but
`planning/prework/TD-004-prework-analysis.md` describes a single, cross-package job
queue (one durable queue serving file-scan, email, etc. consumers from multiple
packages), which is a genuinely different shape: a queue table that multiple
packages' *tests* would need to write to concurrently is exactly the pattern this
story is designed to prevent recurring. This is flagged as open question 58 below —
it is a real design question for the eventual PROP-007 implementation, not something
this pre-work can or should resolve, and PROP-007 remains blocked on this story
regardless of the answer.

---

## 8. CI runtime estimate

**Baseline (today, single shared schema):** 61s migrate + 20s test = ~81s of the
`build-and-test` job's total wall time is DB-setup-and-test (from §3's measured
data).

**After isolation, naive sequential 7-schema migration:** 7 × 61s ≈ 427s (~7 minutes)
added to migration time alone, which is not acceptable against this project's
existing CI-runtime discipline (the accessibility shard budget elsewhere in this
repo targets <5min/shard, ceiling 8min, for comparison).

**Recommended mitigation, to size correctly during implementation (not decided or
built here):** run the 7 packages' `migrate deploy` invocations in parallel (they
are independent schema targets against the same server, no shared lock between
them once `public`'s own baseline migration state no longer needs to be re-derived
per schema — each `migrate deploy` only needs its own schema's `_prisma_migrations`
tracking table, which is itself schema-scoped). Parallelized, the wall-clock cost
should approach the single-schema 61s baseline rather than the naive 427s sum,
bounded by Postgres's own connection/lock concurrency rather than by sequential
waiting. This needs to be measured directly during implementation, not estimated
further here — recorded as open question 59 below (acceptable CI runtime ceiling for
this story) since "approach 61s" is this pre-work's best estimate, not a verified
number.

**Test-count invariant** (per the instruction's completion rule for the eventual
implementation): the total test count must match before and after. This pre-work
does not change any test file, so there is nothing to reconcile yet; the
implementation phase must capture the current total count via CI logs before making
any change, exactly as PR #12's shard work already established as this project's
convention for exactly this kind of self-check.

---

## Items requiring a product decision (added to `docs/open-questions.md` as NOT
APPROVED — not decided here)

- **Open question 57**: does each package derive its own `?schema=pkg_x` from one
  shared base `DATABASE_URL` automatically, or does each package get its own
  `DATABASE_URL` entry in `.env.example`/CI env? (§5)
- **Open question 58**: if/when PROP-007's job queue is built, is it one
  cross-package queue table (as currently pre-work'd) or a per-package queue,
  given this story's isolation strategy? (§7)
- **Open question 59**: what CI runtime ceiling is acceptable for this story's added
  migration cost, and is parallelizing the 7 `migrate deploy` calls an acceptable
  approach, pending a real measurement during implementation? (§8)

These three are drafted here and will be inserted into `docs/open-questions.md`
verbatim in this same pre-work commit, each marked NOT APPROVED, consistent with the
Decision Validation Rule.

---

## Explicitly not done in this pre-work (per the instruction)

- No production code changed. `packages/adapters/catalog/src/catalog-repository.ts`
  is untouched — confirmed, this pass made zero edits to any `.ts` file, only this
  document and `docs/open-questions.md`.
- No schema or package changes.
- The reproduction-before/not-after requirement, the CI runtime/test-count
  before/after reconciliation, and the accessibility-job non-interference check are
  implementation-phase completion-rule items, not pre-work items — they are recorded
  here as commitments for that later phase, not satisfied now.
- TD-006, PROP-007, MVP-007, MVP-011 not started. Open questions 5/56/others not
  resolved. No gate weakened, skipped, or quarantined. BUG-014's accessibility
  self-check untouched.
