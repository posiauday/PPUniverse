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
function createPrismaClient(): PrismaClient {
  const connectionString = process.env["DATABASE_URL"];
  if (!connectionString) {
    throw new Error("DATABASE_URL is not set. See packages/db/.env.example.");
  }
  const adapter = new PrismaPg({ connectionString });
  return new PrismaClient({ adapter });
}

function getPrisma(): PrismaClient {
  if (globalThis.__ppuPrisma) {
    return globalThis.__ppuPrisma;
  }
  const client = createPrismaClient();
  if (process.env["NODE_ENV"] !== "production") {
    globalThis.__ppuPrisma = client;
  }
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
