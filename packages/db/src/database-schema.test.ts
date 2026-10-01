import { describe, expect, it } from "vitest";
import {
  getDatabaseSchema,
  InvalidDatabaseSchemaError,
  qualifiedTable,
  schemaFromConnectionString,
} from "./database-schema.js";

describe("schemaFromConnectionString", () => {
  it("reads ?schema= from a pooler connection string", () => {
    expect(
      schemaFromConnectionString(
        "postgresql://u:p@aws-0-region.pooler.supabase.com:6543/postgres?schema=public",
      ),
    ).toBe("public");
  });

  it("returns undefined when no schema is named", () => {
    expect(schemaFromConnectionString("postgresql://u:p@localhost:5432/db")).toBeUndefined();
  });

  it("refuses a schema that isn't a plain identifier, so it can never be embedded unsafely", () => {
    expect(() =>
      schemaFromConnectionString('postgresql://u:p@localhost:5432/db?schema=x"; drop table y; --'),
    ).toThrow(InvalidDatabaseSchemaError);
  });
});

describe("getDatabaseSchema and qualifiedTable", () => {
  it("defaults to public when DATABASE_URL names no schema, or is unset", () => {
    expect(getDatabaseSchema({ DATABASE_URL: "postgresql://u:p@localhost:5432/db" })).toBe("public");
    expect(getDatabaseSchema({})).toBe("public");
  });

  it("follows an isolated test schema", () => {
    const env = { DATABASE_URL: "postgresql://u:p@localhost:5432/db?schema=pkg_catalog" };
    expect(getDatabaseSchema(env)).toBe("pkg_catalog");
    expect(qualifiedTable("products", env)).toBe('"pkg_catalog"."products"');
  });

  it("qualifies with public in production", () => {
    const env = { DATABASE_URL: "postgresql://u:p@host:6543/postgres?schema=public" };
    expect(qualifiedTable("categories", env)).toBe('"public"."categories"');
  });

  it("refuses a table name that isn't a plain identifier", () => {
    expect(() => qualifiedTable('products" p; --', {})).toThrow();
  });
});
