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

export const prisma: PrismaClient = globalThis.__ppuPrisma ?? createPrismaClient();

if (process.env["NODE_ENV"] !== "production") {
  globalThis.__ppuPrisma = prisma;
}

export * from "./generated/client/client.js";
