/**
 * Pre-flight guard for destructive schema-provisioning setup (BUG-015 test
 * isolation). `provision-test-schemas.mjs` runs `CREATE SCHEMA IF NOT EXISTS`
 * and `prisma migrate deploy` against the target database, so it must
 * positively identify that target as local or CI before touching it, and
 * refuse otherwise.
 *
 * Deliberately a separate, independent copy of the same pattern as
 * `packages/e2e/src/db-guard.ts` (decision Q36) rather than a shared import —
 * this project's own established convention (see `apps/web/lib/seo/site.ts` /
 * `packages/e2e/src/site.ts`'s SITE_NAME pairing) is that a harness-safety
 * check like this is cheap to duplicate and should not create a cross-package
 * dependency between two things that must be free to diverge independently.
 *
 * "Positively identify" means all of:
 * - a parseable postgres:// or postgresql:// URL;
 * - a loopback host (localhost, 127.0.0.1, ::1) — and no libpq-style `host`,
 *   `hostaddr` or `service` query parameter that could redirect the connection
 *   somewhere else;
 * - an explicit opt-in, DB_MIGRATIONS_ALLOW_DESTRUCTIVE_SETUP=1, so a forgotten
 *   tunnel to a remote database on localhost can never be provisioned into by
 *   accident.
 *
 * Refusal messages name the reason and, at most, the host — never the URL or
 * its credentials.
 */

export interface DatabaseTargetEnv {
  DATABASE_URL?: string | undefined;
  DB_MIGRATIONS_ALLOW_DESTRUCTIVE_SETUP?: string | undefined;
  CI?: string | undefined;
  GITHUB_ACTIONS?: string | undefined;
}

export type DatabaseTarget = { ok: true; kind: "ci" | "local" } | { ok: false; reason: string };

const LOOPBACK_HOSTS = new Set(["localhost", "127.0.0.1", "::1", "[::1]"]);
const REDIRECTING_PARAMS = ["host", "hostaddr", "service"];

export function evaluateDatabaseTarget(env: DatabaseTargetEnv): DatabaseTarget {
  const raw = env.DATABASE_URL?.trim() ?? "";
  if (raw === "") return { ok: false, reason: "DATABASE_URL is not set" };

  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    return { ok: false, reason: "DATABASE_URL is not a parseable URL" };
  }

  if (url.protocol !== "postgres:" && url.protocol !== "postgresql:") {
    return { ok: false, reason: "DATABASE_URL is not a postgres:// or postgresql:// URL" };
  }

  const redirecting = REDIRECTING_PARAMS.filter((name) => url.searchParams.has(name));
  if (redirecting.length > 0) {
    return {
      ok: false,
      reason: `DATABASE_URL carries a connection-redirecting parameter (${redirecting.join(", ")})`,
    };
  }

  if (!LOOPBACK_HOSTS.has(url.hostname.toLowerCase())) {
    return { ok: false, reason: `DATABASE_URL host "${url.hostname}" is not a loopback address` };
  }

  if (env.DB_MIGRATIONS_ALLOW_DESTRUCTIVE_SETUP !== "1") {
    return {
      ok: false,
      reason: "DB_MIGRATIONS_ALLOW_DESTRUCTIVE_SETUP=1 is not set (an explicit opt-in is required)",
    };
  }

  const inCi = env.CI === "true" && env.GITHUB_ACTIONS === "true";
  return { ok: true, kind: inCi ? "ci" : "local" };
}

export class DatabaseGuardError extends Error {
  constructor(reason: string) {
    super(
      `Refusing to run destructive schema-provisioning setup: ${reason}. ` +
        "This script only writes to a database it can positively identify as local or CI " +
        "(see planning/prework/BUG-015-prework-analysis.md).",
    );
    this.name = "DatabaseGuardError";
  }
}

/** Throws (so the script FAILS loudly, never silently passes) unless the target is local or CI. */
export function assertSafeDatabaseTarget(
  env: DatabaseTargetEnv = process.env as DatabaseTargetEnv,
): "ci" | "local" {
  const target = evaluateDatabaseTarget(env);
  if (!target.ok) throw new DatabaseGuardError(target.reason);
  return target.kind;
}
