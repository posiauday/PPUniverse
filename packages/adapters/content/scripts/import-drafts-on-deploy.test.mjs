import { describe, expect, it } from "vitest";
import { IMPORTERS, importPlan } from "./import-drafts-on-deploy.mjs";

const READY = {
  CONTEXT: "production",
  ARTICLE_AUTHOR_EMAIL: "admin@example.com",
  DATABASE_URL: "postgresql://u:secret@pooler.example.com:6543/postgres",
};

describe("importPlan (automatic draft import on release)", () => {
  it("imports only in the production context", () => {
    expect(importPlan(READY).run).toBe(true);
    for (const CONTEXT of [undefined, "deploy-preview", "branch-deploy", "dev"]) {
      expect(importPlan({ ...READY, CONTEXT }).run).toBe(false);
    }
  });

  it("skips, with a message, when the author email or database is missing", () => {
    const noEmail = importPlan({ ...READY, ARTICLE_AUTHOR_EMAIL: undefined });
    expect(noEmail.run).toBe(false);
    expect(noEmail.message).toContain("ARTICLE_AUTHOR_EMAIL");
    expect(importPlan({ ...READY, DATABASE_URL: undefined }).run).toBe(false);
  });

  it("runs the two draft importers and never prints the connection string", () => {
    expect(IMPORTERS).toEqual(["content:import", "updates:import"]);
    for (const env of [READY, { ...READY, ARTICLE_AUTHOR_EMAIL: undefined }]) {
      expect(importPlan(env).message).not.toContain("secret");
    }
  });
});
