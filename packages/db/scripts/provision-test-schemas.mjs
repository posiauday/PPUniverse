#!/usr/bin/env node
/**
 * BUG-015 test isolation: provisions one Postgres schema per adapter package
 * that writes to the shared integration-test database, then runs
 * `prisma migrate deploy` against each schema so every package's tests see
 * the identical, fully-migrated table set but in a schema no other package's
 * concurrently-running tests can write into.
 *
 * See planning/prework/BUG-015-prework-analysis.md §1-2 for why schema-per-
 * package (not database-per-package) was chosen, and
 * planning/bugs/BUG-015.md for the races this removes.
 *
 * This script runs BEFORE `@ppu/db` is built (turbo's dependency graph only
 * builds it as part of `pnpm test`/`pnpm build`, which happen later in CI),
 * so it cannot import the compiled TypeScript guard in
 * ../src/db-target-guard.ts. The check below is a deliberate, minimal,
 * independent duplicate of that exact logic — see that file's own header
 * comment for the project's established precedent of duplicating a small
 * safety check across a boundary like this one rather than coupling to a
 * not-yet-built package. Keep the two in sync by hand if the policy changes.
 *
 * Usage: node scripts/provision-test-schemas.mjs [--parallel|--sequential]
 * Requires DATABASE_URL (pointing at the base database, any schema) and
 * DB_MIGRATIONS_ALLOW_DESTRUCTIVE_SETUP=1 in the environment.
 */

import { execFile, execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import path from "node:path";
import pg from "pg";

const PACKAGE_DIR = path.dirname(path.dirname(fileURLToPath(import.meta.url)));

// The 7 adapter packages whose integration suites write to Postgres
// (planning/prework/BUG-015-prework-analysis.md §1). scanning/storage are
// excluded — confirmed by direct read to have no Postgres access at all.
const ADAPTER_PACKAGES = [
  "catalog",
  "content",
  "entitlements",
  "files",
  "identity",
  "notifications",
  "privacy",
];

function schemaNameFor(pkg) {
  return `pkg_${pkg}`;
}

// --- inline duplicate of db-target-guard.ts's evaluateDatabaseTarget; see header comment ---
const LOOPBACK_HOSTS = new Set(["localhost", "127.0.0.1", "::1", "[::1]"]);
const REDIRECTING_PARAMS = ["host", "hostaddr", "service"];

function assertSafeDatabaseTarget(env) {
  const raw = (env.DATABASE_URL ?? "").trim();
  if (raw === "") throw new Error("Refusing: DATABASE_URL is not set");

  let url;
  try {
    url = new URL(raw);
  } catch {
    throw new Error("Refusing: DATABASE_URL is not a parseable URL");
  }

  if (url.protocol !== "postgres:" && url.protocol !== "postgresql:") {
    throw new Error("Refusing: DATABASE_URL is not a postgres:// or postgresql:// URL");
  }

  const redirecting = REDIRECTING_PARAMS.filter((name) => url.searchParams.has(name));
  if (redirecting.length > 0) {
    throw new Error(
      `Refusing: DATABASE_URL carries a connection-redirecting parameter (${redirecting.join(", ")})`,
    );
  }

  if (!LOOPBACK_HOSTS.has(url.hostname.toLowerCase())) {
    throw new Error(`Refusing: DATABASE_URL host "${url.hostname}" is not a loopback address`);
  }

  if (env.DB_MIGRATIONS_ALLOW_DESTRUCTIVE_SETUP !== "1") {
    throw new Error(
      "Refusing: DB_MIGRATIONS_ALLOW_DESTRUCTIVE_SETUP=1 is not set (an explicit opt-in is required)",
    );
  }
  return url;
}
// --- end inline duplicate ---

function schemaUrlFor(baseUrl, schema) {
  const url = new URL(baseUrl.toString());
  url.searchParams.set("schema", schema);
  return url.toString();
}

async function createSchemas(baseUrl) {
  const client = new pg.Client({ connectionString: baseUrl.toString() });
  await client.connect();
  try {
    for (const pkg of ADAPTER_PACKAGES) {
      const schema = schemaNameFor(pkg);
      // Identifier comes from a fixed, hardcoded list above, never from
      // external input, so this is not building a query from untrusted data.
      await client.query(`CREATE SCHEMA IF NOT EXISTS "${schema}"`);
    }
  } finally {
    await client.end();
  }
}

function migrateOne(pkg, baseUrl) {
  const schema = schemaNameFor(pkg);
  const url = schemaUrlFor(baseUrl, schema);
  const start = Date.now();
  const npxCmd = process.platform === "win32" ? "npx.cmd" : "npx";
  execFileSync(npxCmd, ["prisma", "migrate", "deploy"], {
    cwd: PACKAGE_DIR,
    env: { ...process.env, DATABASE_URL: url },
    stdio: "inherit",
    shell: process.platform === "win32",
  });
  return { pkg, schema, ms: Date.now() - start };
}

// Genuinely concurrent: execFile (not execFileSync) spawns without blocking
// the event loop, so all 7 child processes actually run at once rather than
// one at a time inside a Promise executor (a real bug caught while measuring
// this locally — an earlier version of this function wrapped the blocking
// execFileSync in `new Promise((resolve) => resolve(migrateOne(...)))`, which
// does not yield control and is sequential in disguise. Kept as a comment so
// the mistake isn't quietly reintroduced.
function migrateOneAsync(pkg, baseUrl) {
  const schema = schemaNameFor(pkg);
  const url = schemaUrlFor(baseUrl, schema);
  const npxCmd = process.platform === "win32" ? "npx.cmd" : "npx";
  const start = Date.now();
  return new Promise((resolve, reject) => {
    execFile(
      npxCmd,
      ["prisma", "migrate", "deploy"],
      {
        cwd: PACKAGE_DIR,
        env: { ...process.env, DATABASE_URL: url },
        shell: process.platform === "win32",
      },
      (error, stdout, stderr) => {
        if (stdout) process.stdout.write(stdout);
        if (stderr) process.stderr.write(stderr);
        if (error) {
          reject(new Error(`migrate deploy failed for ${pkg}: ${error.message}`));
          return;
        }
        resolve({ pkg, schema, ms: Date.now() - start });
      },
    );
  });
}

async function migrateSequential(baseUrl) {
  const results = [];
  for (const pkg of ADAPTER_PACKAGES) {
    results.push(migrateOne(pkg, baseUrl));
  }
  return results;
}

async function migrateParallel(baseUrl) {
  return Promise.all(ADAPTER_PACKAGES.map((pkg) => migrateOneAsync(pkg, baseUrl)));
}

async function main() {
  const mode = process.argv.includes("--parallel") ? "parallel" : "sequential";
  const baseUrl = assertSafeDatabaseTarget(process.env);

  console.log(`[provision-test-schemas] creating ${ADAPTER_PACKAGES.length} schemas...`);
  const createStart = Date.now();
  await createSchemas(baseUrl);
  console.log(`[provision-test-schemas] schemas created in ${Date.now() - createStart}ms`);

  console.log(`[provision-test-schemas] running migrate deploy (${mode})...`);
  const migrateStart = Date.now();
  const results =
    mode === "parallel" ? await migrateParallel(baseUrl) : await migrateSequential(baseUrl);
  const totalMs = Date.now() - migrateStart;

  console.log(`[provision-test-schemas] mode=${mode} total=${totalMs}ms`);
  for (const r of results) {
    console.log(`[provision-test-schemas]   ${r.pkg} (${r.schema}): ${r.ms}ms`);
  }
}

main().catch((err) => {
  console.error(err.message ?? err);
  process.exit(1);
});
