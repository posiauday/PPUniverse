import { afterEach, describe, expect, it, vi } from "vitest";

// BUG-012: the exported `prisma` is a lazy proxy that resolves the real client on every
// property access. The client was only cached when NODE_ENV !== "production", so a
// production build constructed a new PrismaClient (and a new pg pool) for every query,
// exhausting Postgres's connections under concurrent load.
const constructed = vi.fn();

vi.mock("@prisma/adapter-pg", () => ({
  PrismaPg: class {
    constructor(public readonly options: unknown) {}
  },
}));

vi.mock("./generated/client/client.js", () => ({
  PrismaClient: class {
    readonly category = { count: async () => 0 };
    constructor(options: unknown) {
      constructed(options);
    }
  },
}));

describe("the shared Prisma client is constructed once, whatever NODE_ENV is", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    delete (globalThis as { __ppuPrisma?: unknown }).__ppuPrisma;
    vi.resetModules();
    constructed.mockClear();
  });

  it.each(["production", "development", "test"])(
    "in %s mode, repeated use builds one client and one pool",
    async (mode) => {
      vi.stubEnv("NODE_ENV", mode);
      vi.stubEnv("DATABASE_URL", "postgresql://user:pw@localhost:5432/db");
      vi.resetModules();

      const { prisma } = await import("./index.js");
      for (let query = 0; query < 5; query++) {
        await prisma.category.count();
      }

      expect(constructed).toHaveBeenCalledTimes(1);
    },
  );
});
