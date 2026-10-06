import { describe, expect, it } from "vitest";
import { migrationPlan } from "./deploy-migrations.mjs";

const URL_5432 = "postgresql://user:secret@db.example.com:5432/postgres?schema=public";

describe("migrationPlan (automatic production migrations)", () => {
  it("skips, without failing, outside the Netlify production context", () => {
    for (const CONTEXT of [undefined, "deploy-preview", "branch-deploy", "dev"]) {
      const plan = migrationPlan({ CONTEXT, MIGRATE_DATABASE_URL: URL_5432 });
      expect(plan).toMatchObject({ run: false, fail: false });
    }
  });

  it("fails the production build when MIGRATE_DATABASE_URL is missing or invalid", () => {
    expect(migrationPlan({ CONTEXT: "production" })).toMatchObject({ run: false, fail: true });
    expect(
      migrationPlan({ CONTEXT: "production", MIGRATE_DATABASE_URL: "not a url" }),
    ).toMatchObject({ run: false, fail: true });
  });

  it("refuses the 6543 transaction pooler, which migrations can't use", () => {
    const plan = migrationPlan({
      CONTEXT: "production",
      MIGRATE_DATABASE_URL: "postgresql://user:secret@pooler.example.com:6543/postgres",
    });
    expect(plan).toMatchObject({ run: false, fail: true });
  });

  it("runs with the 5432 string in production, and never puts it in a message", () => {
    expect(migrationPlan({ CONTEXT: "production", MIGRATE_DATABASE_URL: URL_5432 })).toEqual({
      run: true,
      url: URL_5432,
    });
    for (const env of [
      { CONTEXT: "production", MIGRATE_DATABASE_URL: URL_5432.replace("5432", "6543") },
      { CONTEXT: "preview", MIGRATE_DATABASE_URL: URL_5432 },
    ]) {
      const plan = migrationPlan(env);
      expect(plan.run).toBe(false);
      if (!plan.run) expect(plan.message).not.toContain("secret");
    }
  });
});
