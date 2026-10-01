import { describe, expect, it } from "vitest";
import { pgSchemaOptions } from "./connection-options.js";

describe("pgSchemaOptions", () => {
  it("sends no startup option for the public schema, so transaction poolers accept the connection", () => {
    expect(
      pgSchemaOptions(
        "postgresql://u:p@aws-0-region.pooler.supabase.com:6543/postgres?schema=public&pgbouncer=true",
      ),
    ).toEqual({ schema: "public", options: undefined });
  });

  it("keeps the search_path startup option for a non-public (test) schema", () => {
    expect(pgSchemaOptions("postgresql://u:p@localhost:5432/db?schema=pkg_catalog")).toEqual({
      schema: "pkg_catalog",
      options: '-c search_path="pkg_catalog"',
    });
  });

  it("sends neither when the connection string names no schema", () => {
    expect(pgSchemaOptions("postgresql://u:p@localhost:5432/db")).toEqual({
      schema: undefined,
      options: undefined,
    });
  });
});
