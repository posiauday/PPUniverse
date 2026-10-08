/**
 * Avatar seeds a reader can choose (docs/final-decisions.md, 2026-10-08,
 * "Avatars: choose from a gallery; the crown is for admins"). A seed draws
 * one maker critter (avatarFromSeed), so choosing an avatar is choosing a
 * seed. The crown seed draws the premium crowned avatar, which only admins
 * can choose.
 */

/** Draws the crowned avatar instead of a critter. Only an admin can choose it. */
export const CROWN_SEED = "crown";

/** A critter seed: 6 to 16 lowercase letters and digits, as the gallery makes them. */
const SEED_PATTERN = /^[a-z0-9]{6,16}$/;

export type AvatarChoice =
  { ok: true; seed: string } | { ok: false; problem: "invalid" | "admins-only" };

/** Checks a chosen seed: a critter seed for anyone, the crown for admins only. */
export function checkAvatarChoice(seed: unknown, isAdmin: boolean): AvatarChoice {
  if (seed === CROWN_SEED)
    return isAdmin ? { ok: true, seed } : { ok: false, problem: "admins-only" };
  if (typeof seed === "string" && SEED_PATTERN.test(seed)) return { ok: true, seed };
  return { ok: false, problem: "invalid" };
}

/** A new critter seed for the gallery, from the given random source. */
export function newAvatarSeed(random: () => number): string {
  let seed = "";
  while (seed.length < 10) seed += Math.floor(random() * 36).toString(36);
  return seed;
}
