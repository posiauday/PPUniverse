import { describe, expect, it, vi } from "vitest";

vi.mock("@ppu/db", () => ({ prisma: {} }));
vi.mock("@ppu/adapter-privacy", () => ({ PrismaPrivacyRepository: class {} }));

const { safeContinuePath } = await import("./terms-acceptance");

describe("safeContinuePath", () => {
  it("keeps a path on this site", () => {
    expect(safeContinuePath("/guides/fix-delegation?x=1")).toBe("/guides/fix-delegation?x=1");
  });

  it("sends anything else to the account page", () => {
    for (const value of [
      undefined,
      null,
      "",
      "https://evil.example",
      "//evil.example",
      "/\\evil.example",
      "learn",
    ])
      expect(safeContinuePath(value)).toBe("/account");
  });
});
