import { describe, expect, it } from "vitest";
import { migrationPlan } from "./deploy-migrations.mjs";

const POOLER = "aws-0-us-east-1.pooler.supabase.com";
const SESSION = `postgresql://postgres.ref:secret@${POOLER}:5432/postgres?schema=public`;
const TRANSACTION = `postgresql://postgres.ref:secret@${POOLER}:6543/postgres?schema=public`;

describe("migrationPlan (automatic production migrations)", () => {
  it("skips, without failing, outside the Netlify production context", () => {
    for (const CONTEXT of [undefined, "deploy-preview", "branch-deploy", "dev"]) {
      const plan = migrationPlan({ CONTEXT, MIGRATE_DATABASE_URL: SESSION });
      expect(plan).toMatchObject({ run: false, fail: false });
    }
  });

  it("uses MIGRATE_DATABASE_URL as given when it is a 5432 string", () => {
    const plan = migrationPlan({
      CONTEXT: "production",
      MIGRATE_DATABASE_URL: SESSION,
      DATABASE_URL: TRANSACTION,
    });
    expect(plan).toMatchObject({ run: true, url: SESSION });
    expect(plan.message).toContain(`MIGRATE_DATABASE_URL: ${POOLER}:5432.`);
  });

  it("switches a Supabase pooler address on 6543 to 5432, same host, user and password", () => {
    const plan = migrationPlan({ CONTEXT: "production", MIGRATE_DATABASE_URL: TRANSACTION });
    expect(plan).toMatchObject({ run: true, url: SESSION });
    expect(plan.message).toContain("switched from the transaction pooler");
  });

  it("falls back to the site's DATABASE_URL when MIGRATE_DATABASE_URL is unset", () => {
    const plan = migrationPlan({ CONTEXT: "production", DATABASE_URL: TRANSACTION });
    expect(plan).toMatchObject({ run: true, url: SESSION });
    expect(plan.message).toContain("via DATABASE_URL");
  });

  it("fails the production build when nothing usable is set", () => {
    expect(migrationPlan({ CONTEXT: "production" })).toMatchObject({ run: false, fail: true });
    expect(
      migrationPlan({ CONTEXT: "production", MIGRATE_DATABASE_URL: "not a url" }),
    ).toMatchObject({ run: false, fail: true });
    expect(
      migrationPlan({
        CONTEXT: "production",
        MIGRATE_DATABASE_URL: "postgresql://u:secret@other-pooler.example.com:6543/db",
      }),
    ).toMatchObject({ run: false, fail: true });
  });

  it("never puts the password in a message", () => {
    for (const env of [
      { CONTEXT: "production", MIGRATE_DATABASE_URL: SESSION },
      { CONTEXT: "production", DATABASE_URL: TRANSACTION },
      {
        CONTEXT: "production",
        MIGRATE_DATABASE_URL: "postgresql://u:secret@x.example.com:6543/db",
      },
      { CONTEXT: "preview", MIGRATE_DATABASE_URL: SESSION },
    ]) {
      expect(migrationPlan(env).message).not.toContain("secret");
    }
  });
});
