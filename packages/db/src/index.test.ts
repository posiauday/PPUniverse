import { describe, expect, it } from "vitest";
import { prisma } from "./index.js";

describe("prisma client module", () => {
  it("exports a singleton PrismaClient instance with the expected models", () => {
    expect(prisma).toBeDefined();
    expect(prisma.user).toBeDefined();
    expect(prisma.session).toBeDefined();
    expect(prisma.account).toBeDefined();
    expect(prisma.verificationToken).toBeDefined();
  });

  it("reuses the same instance across imports (dev hot-reload safety)", async () => {
    const { prisma: prismaAgain } = await import("./index.js");
    expect(prismaAgain).toBe(prisma);
  });
});
