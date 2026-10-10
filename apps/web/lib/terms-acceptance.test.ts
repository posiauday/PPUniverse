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

  // Site review, 2026-10-10: the same rule as the sign-in page's continuePath (BUG-040).
  it("refuses addresses a browser would read as another site, and a repeated parameter", () => {
    for (const value of [
      // A slash, a tab or newline and a slash: browsers drop the whitespace and read "//evil.example".
      "/\t/evil.example",
      "/\n/evil.example",
      "/\\\\evil.example",
      "///evil.example",
      ["/guides", "/account"],
    ])
      expect(safeContinuePath(value)).toBe("/account");
  });
});
