import { describe, expect, it } from "vitest";
import {
  DatabaseGuardError,
  assertSafeDatabaseTarget,
  evaluateDatabaseTarget,
  type DatabaseTargetEnv,
} from "./db-guard.js";

const LOCAL = "postgresql://ppuniverse:ppuniverse@localhost:5432/ppuniverse?schema=public";
const opted = (overrides: DatabaseTargetEnv = {}): DatabaseTargetEnv => ({
  DATABASE_URL: LOCAL,
  E2E_ALLOW_DATABASE_WRITES: "1",
  ...overrides,
});

function refusalReason(env: DatabaseTargetEnv): string {
  const target = evaluateDatabaseTarget(env);
  if (target.ok) throw new Error("expected the guard to refuse");
  return target.reason;
}

describe("database guard", () => {
  it("accepts a loopback database with the explicit opt-in", () => {
    expect(evaluateDatabaseTarget(opted())).toEqual({ ok: true, kind: "local" });
  });

  it.each(["localhost", "127.0.0.1", "[::1]"])("accepts the loopback host %s", (host) => {
    const url = `postgres://user:pw@${host}:5544/db`;
    expect(evaluateDatabaseTarget(opted({ DATABASE_URL: url })).ok).toBe(true);
  });

  it("identifies a CI database only when both CI variables say so", () => {
    expect(evaluateDatabaseTarget(opted({ CI: "true", GITHUB_ACTIONS: "true" }))).toEqual({
      ok: true,
      kind: "ci",
    });
    expect(evaluateDatabaseTarget(opted({ CI: "true" }))).toEqual({ ok: true, kind: "local" });
  });

  it("refuses when DATABASE_URL is missing or blank", () => {
    expect(refusalReason({ E2E_ALLOW_DATABASE_WRITES: "1" })).toMatch(/not set/);
    expect(refusalReason(opted({ DATABASE_URL: "   " }))).toMatch(/not set/);
  });

  it("refuses an unparseable URL and a non-postgres URL", () => {
    expect(refusalReason(opted({ DATABASE_URL: "not a url" }))).toMatch(/parseable/);
    expect(refusalReason(opted({ DATABASE_URL: "mysql://u:p@localhost/db" }))).toMatch(/postgres/);
  });

  it.each([
    "postgresql://u:p@db.example.com:5432/app",
    "postgresql://u:p@10.0.0.5:5432/app",
    "postgresql://u:p@localhost.evil.example:5432/app",
    "postgresql://u:p@0.0.0.0:5432/app",
  ])("refuses the non-loopback host in %s", (url) => {
    expect(refusalReason(opted({ DATABASE_URL: url }))).toMatch(/not a loopback address/);
  });

  it.each(["host=db.example.com", "hostaddr=10.0.0.5", "service=prod"])(
    "refuses a loopback URL that carries a connection-redirecting parameter (%s)",
    (param) => {
      const url = `postgresql://u:p@localhost:5432/app?${param}`;
      expect(refusalReason(opted({ DATABASE_URL: url }))).toMatch(/redirecting/);
    },
  );

  it("refuses without the explicit opt-in, even for a loopback database", () => {
    expect(refusalReason({ DATABASE_URL: LOCAL })).toMatch(/E2E_ALLOW_DATABASE_WRITES/);
    expect(refusalReason(opted({ E2E_ALLOW_DATABASE_WRITES: "true" }))).toMatch(
      /E2E_ALLOW_DATABASE_WRITES/,
    );
  });

  it("never echoes the URL or its credentials in a refusal", () => {
    const secretUrl = "postgresql://admin:hunter2@db.example.com:5432/app";
    const reason = refusalReason(opted({ DATABASE_URL: secretUrl }));
    expect(reason).not.toContain("hunter2");
    expect(reason).not.toContain("admin");
  });

  it("throws a DatabaseGuardError so the test fails loudly instead of skipping", () => {
    expect(() => assertSafeDatabaseTarget({ DATABASE_URL: LOCAL })).toThrow(DatabaseGuardError);
    expect(() => assertSafeDatabaseTarget(opted())).not.toThrow();
  });
});
