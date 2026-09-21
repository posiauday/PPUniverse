/**
 * Pre-flight guard for destructive test setup (decision Q36). The harness writes
 * temporary rows and deletes them again, so it must positively identify its
 * database as local or CI before it touches it, and refuse otherwise.
 *
 * "Positively identify" means all of:
 * - a parseable postgres:// or postgresql:// URL;
 * - a loopback host (localhost, 127.0.0.1, ::1) — and no libpq-style `host`,
 *   `hostaddr` or `service` query parameter that could redirect the connection
 *   somewhere else;
 * - an explicit opt-in, E2E_ALLOW_DATABASE_WRITES=1, so a forgotten tunnel to a
 *   remote database on localhost can never be written to by accident.
 *
 * Refusal messages name the reason and, at most, the host — never the URL or its
 * credentials.
 */

export interface DatabaseTargetEnv {
  DATABASE_URL?: string | undefined;
  E2E_ALLOW_DATABASE_WRITES?: string | undefined;
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

  if (env.E2E_ALLOW_DATABASE_WRITES !== "1") {
    return {
      ok: false,
      reason: "E2E_ALLOW_DATABASE_WRITES=1 is not set (an explicit opt-in is required)",
    };
  }

  const inCi = env.CI === "true" && env.GITHUB_ACTIONS === "true";
  return { ok: true, kind: inCi ? "ci" : "local" };
}

export class DatabaseGuardError extends Error {
  constructor(reason: string) {
    super(
      `Refusing to run destructive accessibility-test setup: ${reason}. ` +
        "The harness only writes to a database it can positively identify as local or CI " +
        "(see docs/final-decisions.md, decision Q36).",
    );
    this.name = "DatabaseGuardError";
  }
}

/** Throws (so the test FAILS loudly, never silently passes) unless the target is local or CI. */
export function assertSafeDatabaseTarget(
  env: DatabaseTargetEnv = process.env as DatabaseTargetEnv,
): "ci" | "local" {
  const target = evaluateDatabaseTarget(env);
  if (!target.ok) throw new DatabaseGuardError(target.reason);
  return target.kind;
}
