/**
 * Which Postgres schema this process's database lives in (MVP-030).
 *
 * Every DATABASE_URL in this repo carries `?schema=` (production uses
 * `public`; each adapter package's integration tests use their own `pkg_*`
 * schema, BUG-015). pg itself ignores that parameter. The schema is applied
 * where queries are written, never through the connection's session state:
 *   - ORM queries: PrismaPg's `{ schema }` option schema-qualifies them
 *     (index.ts).
 *   - Raw SQL: callers qualify table names with `qualifiedTable()` below.
 *
 * Nothing depends on the session's `search_path`. That matters because
 * transaction-mode poolers, such as Supabase's Supavisor on port 6543 (which
 * ADR-005 production uses from serverless functions), don't pass startup
 * parameters through, and a session-level `-c search_path` option can't be
 * relied on there for any schema.
 */

/** A plain, unquoted Postgres identifier. Anything else is refused, so it can be embedded safely. */
const SCHEMA_NAME = /^[A-Za-z_][A-Za-z0-9_]*$/;

export class InvalidDatabaseSchemaError extends Error {
  constructor(schema: string) {
    super(
      `DATABASE_URL's ?schema= value ${JSON.stringify(schema)} is not a plain identifier (letters, digits, underscores).`,
    );
    this.name = "InvalidDatabaseSchemaError";
  }
}

/** The schema named by a connection string's `?schema=` parameter, validated; `undefined` when absent. */
export function schemaFromConnectionString(connectionString: string): string | undefined {
  const schema = new URL(connectionString).searchParams.get("schema") ?? undefined;
  if (schema !== undefined && !SCHEMA_NAME.test(schema)) {
    throw new InvalidDatabaseSchemaError(schema);
  }
  return schema;
}

/**
 * The schema this process's queries target: DATABASE_URL's `?schema=`, or
 * Postgres's `public` when none is given. Read on every call, not cached:
 * test-schema isolation rewrites DATABASE_URL before the client is first used.
 */
export function getDatabaseSchema(env: NodeJS.ProcessEnv = process.env): string {
  const connectionString = env["DATABASE_URL"];
  return (connectionString && schemaFromConnectionString(connectionString)) || "public";
}

/** A schema-qualified, quoted table reference for raw SQL, e.g. `"public"."products"`. */
export function qualifiedTable(table: string, env: NodeJS.ProcessEnv = process.env): string {
  if (!SCHEMA_NAME.test(table)) {
    throw new Error(`qualifiedTable: ${JSON.stringify(table)} is not a plain table name.`);
  }
  return `"${getDatabaseSchema(env)}"."${table}"`;
}
