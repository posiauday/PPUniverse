/**
 * How the pg Pool behind PrismaPg is told which schema to use (MVP-030).
 *
 * Every DATABASE_URL in this repo carries `?schema=`, which pg itself ignores
 * (see the comment in index.ts). Two things act on it:
 *   1. PrismaPg's `{ schema }` option, which schema-qualifies ORM queries.
 *   2. A libpq-style `-c search_path=...` startup option, which the raw-SQL
 *      paths (catalog full-text search) need, because they use unqualified
 *      table names.
 *
 * The startup option is sent only when the schema is NOT `public`:
 *   - `public` is already Postgres's default search_path, so the option adds
 *     nothing there.
 *   - Transaction-mode connection poolers, such as Supabase's Supavisor on
 *     port 6543, which ADR-005 production uses from serverless functions,
 *     don't pass startup parameters through, and may reject the connection.
 *   - Test schemas (`pkg_*`) are reached over direct connections in CI and
 *     locally, so they keep the option, and BUG-015's isolation is unchanged.
 */
export interface PgSchemaOptions {
  schema: string | undefined;
  options: string | undefined;
}

export function pgSchemaOptions(connectionString: string): PgSchemaOptions {
  const schema = new URL(connectionString).searchParams.get("schema") ?? undefined;
  const options = schema && schema !== "public" ? `-c search_path="${schema}"` : undefined;
  return { schema, options };
}
