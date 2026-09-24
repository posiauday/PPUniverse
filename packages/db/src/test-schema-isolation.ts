/**
 * Per-package test-database isolation (BUG-015). Each of the 7 adapter packages
 * whose integration suites write to Postgres gets its own Postgres schema
 * (`pkg_<name>`) inside the same database, so two packages' tests running
 * concurrently in CI (Turborepo, one shared `DATABASE_URL`) never see each
 * other's rows. See `planning/prework/BUG-015-prework-analysis.md` §1-2 for why
 * schema-per-package was chosen over database-per-package.
 *
 * `packageName` is passed explicitly by each package's own `vitest.setup.ts`
 * (a one-line literal, e.g. `applyTestSchemaIsolation("catalog")`) rather than
 * inferred from an environment variable such as `npm_package_name`. An earlier
 * version of this module read `npm_package_name`, which pnpm sets when it runs
 * a script directly but which is not reliably present when Turborepo invokes
 * the task — that silently fell back to no isolation at all in CI (both
 * packages ending up on the shared `public` schema, exactly the state this fix
 * removes), caught by a real CI run rather than local testing alone. An
 * explicit literal has no such environment dependency to get wrong.
 */

const ADAPTER_PACKAGE_NAMES = new Set([
  "catalog",
  "content",
  "entitlements",
  "files",
  "identity",
  "notifications",
  "privacy",
]);

export function deriveTestSchemaName(packageName: string): string {
  if (!ADAPTER_PACKAGE_NAMES.has(packageName)) {
    throw new Error(
      `deriveTestSchemaName: "${packageName}" is not one of the 7 adapter packages this ` +
        `story isolates (${[...ADAPTER_PACKAGE_NAMES].join(", ")}).`,
    );
  }
  return `pkg_${packageName}`;
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
export function applyTestSchemaIsolation(
  packageName: string,
  env: NodeJS.ProcessEnv = process.env,
): void {
  const databaseUrl = env["DATABASE_URL"];
  if (!databaseUrl) return;

  const schema = deriveTestSchemaName(packageName);
  const url = new URL(databaseUrl);
  url.searchParams.set("schema", schema);
  env["DATABASE_URL"] = url.toString();
}
