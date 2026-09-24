/**
 * Per-package test-database isolation (BUG-015). Each of the 7 adapter packages
 * whose integration suites write to Postgres gets its own Postgres schema
 * (`pkg_<name>`) inside the same database, so two packages' tests running
 * concurrently in CI (Turborepo, one shared `DATABASE_URL`) never see each
 * other's rows. See `planning/prework/BUG-015-prework-analysis.md` §1-2 for why
 * schema-per-package was chosen over database-per-package.
 *
 * `deriveTestSchemaName` reads the package name from `npm_package_name`, which
 * pnpm sets on every script it runs from that package's own `package.json` — no
 * schema name is ever hand-typed per package, removing the chance of a typo
 * silently aliasing two packages onto the same schema.
 */

const ADAPTER_PACKAGE_PREFIX = "@ppu/adapter-";

export function deriveTestSchemaName(packageName: string | undefined): string {
  if (!packageName || !packageName.startsWith(ADAPTER_PACKAGE_PREFIX)) {
    throw new Error(
      `deriveTestSchemaName: cannot derive a test schema from package name "${packageName}" ` +
        `(expected it to start with "${ADAPTER_PACKAGE_PREFIX}", read from the npm_package_name ` +
        "environment variable pnpm sets for the running script).",
    );
  }
  const suffix = packageName.slice(ADAPTER_PACKAGE_PREFIX.length);
  return `pkg_${suffix}`;
}

/**
 * Rewrites `process.env.DATABASE_URL` in place to target this package's own
 * isolated schema. A no-op when DATABASE_URL isn't set — the caller's own
 * `describe.skipIf(!hasDatabase)` guard handles that case, this function must
 * not force a database requirement where none existed before (local parity).
 *
 * Must run before `@ppu/db`'s `prisma` proxy is first touched (its first
 * property access is what reads DATABASE_URL) — call this from a Vitest
 * `setupFiles` entry, which runs before any test file's own `beforeAll`.
 */
export function applyTestSchemaIsolation(env: NodeJS.ProcessEnv = process.env): void {
  const databaseUrl = env["DATABASE_URL"];
  if (!databaseUrl) return;

  const schema = deriveTestSchemaName(env["npm_package_name"]);
  const url = new URL(databaseUrl);
  url.searchParams.set("schema", schema);
  env["DATABASE_URL"] = url.toString();
}
