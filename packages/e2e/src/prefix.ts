import { randomBytes } from "node:crypto";

/**
 * Reserved, obviously non-production identifier prefix for every row the
 * accessibility harness creates (decision Q36). Cleanup may delete a row only if
 * the harness created it AND its identifying column starts with this prefix, so
 * seeded categories, licence definitions and any real data are unreachable.
 */
export const RESERVED_PREFIX = "zz-e2e-a11y-";

/** A per-worker prefix: reserved prefix + a random run token + the worker index. */
export function newWorkerPrefix(
  workerIndex: number,
  token: string = randomBytes(3).toString("hex"),
): string {
  return `${RESERVED_PREFIX}${token}-w${workerIndex}-`;
}

export function isReserved(value: string): boolean {
  return value.startsWith(RESERVED_PREFIX);
}

/** Refuses to let a non-reserved identifier anywhere near a delete. */
export function assertReserved(kind: string, value: string): void {
  if (!isReserved(value)) {
    throw new Error(
      `Refusing to touch ${kind} "${value}": it does not start with the reserved test prefix "${RESERVED_PREFIX}".`,
    );
  }
}
