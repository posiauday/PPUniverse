/**
 * Mirrors docs/06-data-model.md "Versioning and files" FileScan status list
 * exactly: uploaded, quarantined, scanning, clean, rejected, overridden.
 */
export type FileScanStatus =
  "UPLOADED" | "QUARANTINED" | "SCANNING" | "CLEAN" | "REJECTED" | "OVERRIDDEN";

export interface FileScanRecord {
  id: string;
  storageKey: string;
  originalFilename: string;
  declaredMimeType: string;
  detectedMimeType: string | null;
  sizeBytes: number;
  status: FileScanStatus;
  rejectionReason: string | null;
  uploadedByUserId: string;
}
