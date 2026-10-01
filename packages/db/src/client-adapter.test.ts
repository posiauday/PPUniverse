import { afterEach, describe, expect, it, vi } from "vitest";

// MVP-030: what createPrismaClient() hands the pg adapter. The schema must reach
// PrismaPg (it qualifies ORM queries), and no `-c search_path` startup option may
// be sent, because transaction-mode poolers (Supabase on port 6543, production)
// don't pass startup parameters through.
const adapterArgs = vi.fn();

vi.mock("@prisma/adapter-pg", () => ({
  PrismaPg: class {
    constructor(poolConfig: unknown, adapterOptions: unknown) {
      adapterArgs(poolConfig, adapterOptions);
    }
  },
}));

vi.mock("./generated/client/client.js", () => ({
  PrismaClient: class {
    readonly category = { count: async () => 0 };
  },
}));

async function buildClientFor(databaseUrl: string): Promise<void> {
  vi.stubEnv("DATABASE_URL", databaseUrl);
  vi.resetModules();
  const { prisma } = await import("./index.js");
  await prisma.category.count();
}

describe("createPrismaClient passes the schema to PrismaPg and no startup option", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    delete (globalThis as { __ppuPrisma?: unknown }).__ppuPrisma;
    adapterArgs.mockClear();
  });

  it("production: the public schema through the transaction pooler", async () => {
    const url = "postgresql://u:p@aws-0-region.pooler.supabase.com:6543/postgres?schema=public";
    await buildClientFor(url);
    expect(adapterArgs).toHaveBeenCalledWith({ connectionString: url }, { schema: "public" });
  });

  it("tests: an isolated pkg_* schema, still with no startup option", async () => {
    const url = "postgresql://u:p@localhost:5432/db?schema=pkg_catalog";
    await buildClientFor(url);
    expect(adapterArgs).toHaveBeenCalledWith({ connectionString: url }, { schema: "pkg_catalog" });
  });
});
