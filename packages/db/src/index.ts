import { PrismaPg } from "@prisma/adapter-pg";
import { schemaFromConnectionString } from "./database-schema.js";
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
// connection string the way Prisma's migration engine does. It hands the
// string straight to `pg`, which ignores `?schema=` (found by tracing a real
// BUG-015 CI failure where every query hit `public`). The schema is
// therefore applied where queries are written, never through session state
// (MVP-030; see database-schema.ts):
//   - ORM queries: PrismaPg's second constructor argument (`{ schema }`)
//     schema-qualifies every table reference it generates.
//   - Raw SQL (catalogRepository's full-text searchProducts()): qualified
//     with `qualifiedTable()`.
// No `-c search_path` startup option is sent. Transaction-mode poolers, such
// as Supabase's on port 6543 (production, ADR-005), don't pass startup
// parameters through, so the connection can't depend on one.
// Every DATABASE_URL in this repo carries `?schema=`, so it stays the single
// source of truth for the schema.
/**
 * Connections each server instance may hold (BUG-027). pg's default is 10.
 * In production every Netlify function instance has its own pool, and a
 * frozen instance keeps its idle connections open, so a burst of traffic
 * that starts many instances can fill the Supabase pooler's client limit
 * (200 on our plan) and fail every database page until they are reaped.
 * 3 keeps a page's parallel queries parallel while allowing ~65 instances.
 */
export const POOL_MAX = 3;
/** Close an idle connection after 5 s (pg's default is 10 s). */
export const POOL_IDLE_MS = 5_000;

function createPrismaClient(): PrismaClient {
  const connectionString = process.env["DATABASE_URL"];
  if (!connectionString) {
    throw new Error("DATABASE_URL is not set. See packages/db/.env.example.");
  }
  const schema = schemaFromConnectionString(connectionString);
  const adapter = new PrismaPg(
    { connectionString, max: POOL_MAX, idleTimeoutMillis: POOL_IDLE_MS },
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
  getDatabaseSchema,
  InvalidDatabaseSchemaError,
  qualifiedTable,
  schemaFromConnectionString,
} from "./database-schema.js";
export {
  assertSafeDatabaseTarget,
  DatabaseGuardError,
  evaluateDatabaseTarget,
  type DatabaseTarget,
  type DatabaseTargetEnv,
} from "./db-target-guard.js";
