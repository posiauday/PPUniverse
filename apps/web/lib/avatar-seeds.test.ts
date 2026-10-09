import { describe, expect, it } from "vitest";
import { CROWN_SEED, checkAvatarChoice, newAvatarSeed } from "./avatar-seeds";

describe("checkAvatarChoice", () => {
  it("accepts a gallery seed from anyone", () => {
    expect(checkAvatarChoice("k3v9x2m0qa", false)).toEqual({ ok: true, seed: "k3v9x2m0qa" });
  });

  it("gives the crown only to admins", () => {
    expect(checkAvatarChoice(CROWN_SEED, true)).toEqual({ ok: true, seed: CROWN_SEED });
    expect(checkAvatarChoice(CROWN_SEED, false)).toEqual({ ok: false, problem: "admins-only" });
  });

  it("refuses anything that isn't a gallery seed", () => {
    for (const value of ["", "abc", "UPPER12", "has space1", "a".repeat(17), 42, null])
      expect(checkAvatarChoice(value, true)).toEqual({ ok: false, problem: "invalid" });
  });
});

describe("newAvatarSeed", () => {
  it("makes a valid ten-character seed", () => {
    let n = 0;
    const seed = newAvatarSeed(() => ((n += 7) % 36) / 36);
    expect(seed).toMatch(/^[a-z0-9]{10}$/);
    expect(checkAvatarChoice(seed, false).ok).toBe(true);
  });
});
