import { randomBytes, scrypt, timingSafeEqual } from "node:crypto";

/**
 * Password hashing (MVP-036). scrypt, from Node's standard library, with the
 * parameters OWASP's Password Storage Cheat Sheet lists first for scrypt
 * (N=2^17, r=8, p=1). The stored form names its own parameters, so they can be
 * raised later and old hashes still verify (and are re-hashed on sign-in).
 *
 *   scrypt$<log2 N>$<r>$<p>$<salt base64>$<key base64>
 */
export interface ScryptParameters {
  log2N: number;
  r: number;
  p: number;
}

export const CURRENT_SCRYPT: ScryptParameters = { log2N: 17, r: 8, p: 1 };
const SALT_BYTES = 16;
const KEY_BYTES = 64;

function derive(password: string, salt: Buffer, params: ScryptParameters): Promise<Buffer> {
  const N = 2 ** params.log2N;
  // scrypt needs 128 * N * r bytes; Node's default cap (32 MiB) is too small for N=2^17.
  const maxmem = 128 * N * params.r + 16 * 1024 * 1024;
  return new Promise((resolve, reject) => {
    scrypt(
      password.normalize("NFKC"),
      salt,
      KEY_BYTES,
      { N, r: params.r, p: params.p, maxmem },
      (error, key) => (error ? reject(error) : resolve(key)),
    );
  });
}

export async function hashPassword(
  password: string,
  params: ScryptParameters = CURRENT_SCRYPT,
): Promise<string> {
  const salt = randomBytes(SALT_BYTES);
  const key = await derive(password, salt, params);
  return [
    "scrypt",
    params.log2N,
    params.r,
    params.p,
    salt.toString("base64"),
    key.toString("base64"),
  ].join("$");
}

interface ParsedHash {
  params: ScryptParameters;
  salt: Buffer;
  key: Buffer;
}

export function parsePasswordHash(stored: string): ParsedHash | null {
  const parts = stored.split("$");
  if (parts.length !== 6 || parts[0] !== "scrypt") return null;
  const [log2N, r, p] = [Number(parts[1]), Number(parts[2]), Number(parts[3])];
  if (![log2N, r, p].every((n) => Number.isInteger(n) && n > 0) || log2N > 22 || r > 32 || p > 16)
    return null;
  const salt = Buffer.from(parts[4] ?? "", "base64");
  const key = Buffer.from(parts[5] ?? "", "base64");
  if (salt.length < 8 || key.length !== KEY_BYTES) return null;
  return { params: { log2N, r, p }, salt, key };
}

/** True only when the password matches; a malformed stored hash never matches. */
export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const parsed = parsePasswordHash(stored);
  if (!parsed) return false;
  const key = await derive(password, parsed.salt, parsed.params);
  return key.length === parsed.key.length && timingSafeEqual(key, parsed.key);
}

/** Whether a stored hash uses weaker parameters than today's, so it should be re-hashed. */
export function needsRehash(stored: string, params: ScryptParameters = CURRENT_SCRYPT): boolean {
  const parsed = parsePasswordHash(stored);
  if (!parsed) return true;
  return (
    parsed.params.log2N < params.log2N || parsed.params.r < params.r || parsed.params.p < params.p
  );
}

let dummyHash: Promise<string> | null = null;
/**
 * Spends the same time as a real check when the account doesn't exist, so
 * response time can't reveal which emails have accounts.
 */
export async function verifyAgainstDummy(password: string): Promise<false> {
  dummyHash ??= hashPassword("dummy password for timing only");
  await verifyPassword(password, await dummyHash);
  return false;
}
