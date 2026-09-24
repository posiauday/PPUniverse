import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "./generated/client/client.js";

declare global {
  var __ppuPrisma: PrismaClient | undefined;
}

// Prisma 7 removed the implicit native query engine: a driver adapter is now
// required (docs/adr/004 amendment). pg (node-postgres) talks to Postgres
// directly using DATABASE_URL, same connection string as before. Output is
// generated inside src/ (not node_modules) so our own build step compiles
// it to real runtime JS instead of shipping raw generated TypeScript.
//
// @prisma/adapter-pg does NOT read a `?schema=` query parameter from the
// connection string the way Prisma's migration engine does — it hands the
// string straight to `pg`, which has no idea what `?schema=` means and just
// falls back to Postgres's default `search_path` (`public`). Two separate
// fixes were needed, found by tracing a real BUG-015 CI failure where the
// connection string was visibly correct at runtime but every query still
// hit `public`:
//   1. PrismaPg's own second constructor argument (`{ schema }`) — this is
//      what its ORM-generated queries (findMany, create, etc.) use to
//      schema-qualify table references.
//   2. The underlying `pg` Pool's own `options` (a libpq-style `-c
//      search_path=...` startup parameter) — ORM queries alone aren't the
//      whole surface: catalogRepository's full-text searchProducts() issues
//      raw SQL (Prisma.sql) with UNQUALIFIED table names, which resolve
//      against whatever the actual Postgres session's search_path is, not
//      against PrismaPg's own `schema` option (that option only affects the
//      ORM layer). Setting it at the connection level covers both.
// Every DATABASE_URL in this repo already carries `?schema=`, so parsing it
// out here keeps that one place as the source of truth rather than
// requiring a second, separate schema value to be kept in sync.
function createPrismaClient(): PrismaClient {
  const connectionString = process.env["DATABASE_URL"];
  if (!connectionString) {
    throw new Error("DATABASE_URL is not set. See packages/db/.env.example.");
  }
  const schema = new URL(connectionString).searchParams.get("schema") ?? undefined;
  const adapter = new PrismaPg(
    { connectionString, options: schema ? `-c search_path="${schema}"` : undefined },
    { schema },
  );
  return new PrismaClient({ adapter });
}

function getPrisma(): PrismaClient {
  if (globalThis.__ppuPrisma) {
    return globalThis.__ppuPrisma;
  }
  const client = createPrismaClient();
  // Cached in every environment. The exported proxy below calls getPrisma() on every
  // property access, so skipping the cache in production built a new client and a new
  // connection pool for every query and exhausted Postgres (BUG-012).
  globalThis.__ppuPrisma = client;
  return client;
}

/**
 * A lazy proxy: constructing the real client (which requires
 * DATABASE_URL) only happens on first actual property access, not at
 * module-import time. Without this, any module importing a *value* from
 * @ppu/db — even something unrelated to the `prisma` singleton, like the
 * `Prisma.sql` tagged-template helper — would eagerly throw if
 * DATABASE_URL isn't set, before a caller's own
 * describe.skipIf(!hasDatabase) integration-test guard ever gets to run
 * (a real bug this fixes, not a hypothetical one — see git history).
 */
export const prisma: PrismaClient = new Proxy({} as PrismaClient, {
  get(_target, prop, receiver) {
    return Reflect.get(getPrisma(), prop, receiver);
  },
});

export * from "./generated/client/client.js";
export { applyTestSchemaIsolation, deriveTestSchemaName } from "./test-schema-isolation.js";
export {
  assertSafeDatabaseTarget,
  DatabaseGuardError,
  evaluateDatabaseTarget,
  type DatabaseTarget,
  type DatabaseTargetEnv,
} from "./db-target-guard.js";
