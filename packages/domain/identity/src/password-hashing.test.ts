import { describe, expect, it } from "vitest";
import {
  hashPassword,
  needsRehash,
  parsePasswordHash,
  verifyPassword,
} from "./password-hashing.js";

describe("password hashing", () => {
  it("verifies the right password and rejects others", async () => {
    const stored = await hashPassword("green flows run on monday");
    expect(stored).toMatch(/^scrypt\$17\$8\$1\$[A-Za-z0-9+/=]+\$[A-Za-z0-9+/=]+$/);
    expect(await verifyPassword("green flows run on monday", stored)).toBe(true);
    expect(await verifyPassword("green flows run on tuesday", stored)).toBe(false);
  });

  it("salts every hash, so the same password never hashes the same", async () => {
    const [a, b] = await Promise.all([
      hashPassword("same password here"),
      hashPassword("same password here"),
    ]);
    expect(a).not.toBe(b);
  });

  it("treats different Unicode forms of the same text as the same password", async () => {
    const stored = await hashPassword("café au lait please");
    expect(await verifyPassword("café au lait please", stored)).toBe(true);
  });

  it("never matches a malformed or tampered hash", async () => {
    const stored = await hashPassword("green flows run on monday");
    expect(await verifyPassword("green flows run on monday", "plaintext")).toBe(false);
    expect(
      await verifyPassword("green flows run on monday", stored.replace("scrypt$17", "scrypt$99")),
    ).toBe(false);
    expect(await verifyPassword("green flows run on monday", stored.slice(0, -4))).toBe(false);
    expect(parsePasswordHash("scrypt$17$8$1$$")).toBeNull();
  });

  it("asks for a re-hash when the stored parameters are weaker than today's", async () => {
    const weak = await hashPassword("green flows run on monday", { log2N: 14, r: 8, p: 1 });
    expect(needsRehash(weak)).toBe(true);
    expect(await verifyPassword("green flows run on monday", weak)).toBe(true);
    expect(needsRehash(await hashPassword("x"))).toBe(false);
  });
});
