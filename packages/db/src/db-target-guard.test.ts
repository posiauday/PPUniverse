import { describe, expect, it } from "vitest";
import {
  DatabaseGuardError,
  assertSafeDatabaseTarget,
  evaluateDatabaseTarget,
  type DatabaseTargetEnv,
} from "./db-target-guard.js";

const LOCAL = "postgresql://ppuniverse:ppuniverse@localhost:5432/ppuniverse?schema=public";
const opted = (overrides: DatabaseTargetEnv = {}): DatabaseTargetEnv => ({
  DATABASE_URL: LOCAL,
  DB_MIGRATIONS_ALLOW_DESTRUCTIVE_SETUP: "1",
  ...overrides,
});

function refusalReason(env: DatabaseTargetEnv): string {
  const target = evaluateDatabaseTarget(env);
  if (target.ok) throw new Error("expected the guard to refuse");
  return target.reason;
}

describe("evaluateDatabaseTarget", () => {
  it("refuses when DATABASE_URL is not set", () => {
    expect(refusalReason({})).toMatch(/not set/);
  });

  it("refuses an unparseable URL", () => {
    expect(refusalReason(opted({ DATABASE_URL: "not-a-url" }))).toMatch(/not a parseable URL/);
  });

  it("refuses a non-postgres protocol", () => {
    expect(refusalReason(opted({ DATABASE_URL: "mysql://localhost/db" }))).toMatch(
      /not a postgres/,
    );
  });

  it("refuses a redirecting host/hostaddr/service query parameter", () => {
    expect(refusalReason(opted({ DATABASE_URL: `${LOCAL}&host=evil.example.com` }))).toMatch(
      /redirecting parameter/,
    );
  });

  it("refuses a non-loopback host", () => {
    expect(
      refusalReason(
        opted({
          DATABASE_URL: "postgresql://user:pw@prod-db.example.com:5432/ppuniverse",
        }),
      ),
    ).toMatch(/not a loopback address/);
  });

  it("refuses without the explicit opt-in", () => {
    expect(
      refusalReason({ DATABASE_URL: LOCAL, DB_MIGRATIONS_ALLOW_DESTRUCTIVE_SETUP: undefined }),
    ).toMatch(/explicit opt-in/);
  });

  it("accepts a loopback URL with the opt-in set, and reports local outside CI", () => {
    const target = evaluateDatabaseTarget(opted());
    expect(target).toEqual({ ok: true, kind: "local" });
  });

  it("reports ci when CI and GITHUB_ACTIONS are both true", () => {
    const target = evaluateDatabaseTarget(opted({ CI: "true", GITHUB_ACTIONS: "true" }));
    expect(target).toEqual({ ok: true, kind: "ci" });
  });
});

describe("assertSafeDatabaseTarget", () => {
  it("throws DatabaseGuardError with a message naming the reason, never the URL", () => {
    let error: unknown;
    try {
      assertSafeDatabaseTarget({});
    } catch (e) {
      error = e;
    }
    expect(error).toBeInstanceOf(DatabaseGuardError);
    expect((error as Error).message).toMatch(/DATABASE_URL is not set/);
    expect((error as Error).message).not.toContain("ppuniverse:ppuniverse");
  });

  it("returns the target kind when safe", () => {
    expect(assertSafeDatabaseTarget(opted())).toBe("local");
  });
});
