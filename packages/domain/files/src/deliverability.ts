import type { FileScanRecord } from "./types.js";

/**
 * The core invariant this story exists to enforce (MVP-006 acceptance
 * criterion): a file can only ever be delivered once its scan result is
 * CLEAN. MVP-009 (signed downloads) is the actual consumer of this gate —
 * this package only defines and tests the rule itself.
 */
export function isDeliverable(fileScan: Pick<FileScanRecord, "status">): boolean {
  return fileScan.status === "CLEAN";
}

export class FileNotDeliverableError extends Error {
  constructor(public readonly status: FileScanRecord["status"]) {
    super(`File is not deliverable: scan status is ${status}, not CLEAN`);
    this.name = "FileNotDeliverableError";
  }
}

export function assertDeliverable(fileScan: Pick<FileScanRecord, "status">): void {
  if (!isDeliverable(fileScan)) {
    throw new FileNotDeliverableError(fileScan.status);
  }
}
