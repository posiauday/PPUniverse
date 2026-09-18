import type { FileScanStatus } from "./types.js";

/**
 * Valid transitions for the FileScan lifecycle (docs/06-data-model.md).
 * Pre-scan validation failures (type mismatch, size violation) reject
 * directly from QUARANTINED without ever reaching SCANNING, since no AV
 * scan was attempted. OVERRIDDEN is reachable only from REJECTED — the
 * override *action* itself (who, why, audit trail) belongs to moderation/
 * admin stories (MVP-013, MVP-019), not this one; this only models that the
 * state exists and is a valid destination.
 */
const VALID_TRANSITIONS: Record<FileScanStatus, readonly FileScanStatus[]> = {
  UPLOADED: ["QUARANTINED"],
  QUARANTINED: ["SCANNING", "REJECTED"],
  SCANNING: ["CLEAN", "REJECTED"],
  CLEAN: [],
  REJECTED: ["OVERRIDDEN"],
  OVERRIDDEN: [],
};

export function canTransition(from: FileScanStatus, to: FileScanStatus): boolean {
  return VALID_TRANSITIONS[from].includes(to);
}

export class InvalidFileScanTransitionError extends Error {
  constructor(
    public readonly from: FileScanStatus,
    public readonly to: FileScanStatus,
  ) {
    super(`Cannot transition FileScan from ${from} to ${to}`);
    this.name = "InvalidFileScanTransitionError";
  }
}

export function assertValidTransition(from: FileScanStatus, to: FileScanStatus): void {
  if (!canTransition(from, to)) {
    throw new InvalidFileScanTransitionError(from, to);
  }
}
