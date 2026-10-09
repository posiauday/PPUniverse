import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

/**
 * BUG-038: every table has row-level security enabled with no policies
 * (docs/final-decisions.md, "RLS implementation note"). Two migrations
 * created tables without it and nothing noticed, so this reads every
 * migration and fails for any table that is created, and not later dropped,
 * without an `ENABLE ROW LEVEL SECURITY` in some migration.
 */

const MIGRATIONS = fileURLToPath(new URL("../prisma/migrations", import.meta.url));

/** The SQL of every migration, oldest first, with comments removed. */
function migrationSql(): string[] {
  return readdirSync(MIGRATIONS, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort()
    .map((name) =>
      readFileSync(join(MIGRATIONS, name, "migration.sql"), "utf8").replace(/--[^\n]*/g, ""),
    );
}

function tablesWithoutRowLevelSecurity(migrations: readonly string[]): string[] {
  const created = new Set<string>();
  const secured = new Set<string>();
  for (const sql of migrations) {
    for (const [, table] of sql.matchAll(/CREATE TABLE (?:IF NOT EXISTS )?"([^"]+)"/gi)) {
      created.add(table!);
    }
    for (const [, table] of sql.matchAll(/DROP TABLE (?:IF EXISTS )?"([^"]+)"/gi)) {
      created.delete(table!);
      secured.delete(table!);
    }
    for (const [, table] of sql.matchAll(/ALTER TABLE "([^"]+)" ENABLE ROW LEVEL SECURITY/gi)) {
      secured.add(table!);
    }
  }
  return [...created].filter((table) => !secured.has(table)).sort();
}

describe("row-level security on every table (BUG-038)", () => {
  it("is enabled by a migration for every table the migrations create", () => {
    expect(tablesWithoutRowLevelSecurity(migrationSql())).toEqual([]);
  });

  it("would catch a table created without it, and not one that was dropped", () => {
    expect(
      tablesWithoutRowLevelSecurity([
        'CREATE TABLE "a" (id TEXT);\nALTER TABLE "a" ENABLE ROW LEVEL SECURITY;',
        'CREATE TABLE "b" (id TEXT);',
        'CREATE TABLE "c" (id TEXT);\n-- ALTER TABLE "c" ENABLE ROW LEVEL SECURITY;'.replace(
          /--[^\n]*/g,
          "",
        ),
        'CREATE TABLE "d" (id TEXT);\nDROP TABLE "d";',
      ]),
    ).toEqual(["b", "c"]);
  });
});
