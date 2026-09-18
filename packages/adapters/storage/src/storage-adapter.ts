/**
 * Two zones, matching the TRD's "object storage with quarantine and
 * private delivery zones": everything lands in `quarantine` first and only
 * moves to `clean` once its FileScan status is CLEAN (packages/domain/files).
 * Neither zone is ever public; delivery (MVP-009) issues short-lived
 * signed URLs at request time.
 */
export type StorageZone = "quarantine" | "clean";

export interface ObjectMetadata {
  sizeBytes: number;
  contentType: string;
}

export interface StorageAdapter {
  getSignedUploadUrl(
    zone: StorageZone,
    key: string,
    contentType: string,
    expiresInSeconds?: number,
  ): Promise<string>;
  getSignedDownloadUrl(zone: StorageZone, key: string, expiresInSeconds?: number): Promise<string>;
  headObject(zone: StorageZone, key: string): Promise<ObjectMetadata | null>;
  getObject(zone: StorageZone, key: string): Promise<Uint8Array>;
  getObjectRange(zone: StorageZone, key: string, start: number, end: number): Promise<Uint8Array>;
  moveObject(fromZone: StorageZone, toZone: StorageZone, key: string): Promise<void>;
  deleteObject(zone: StorageZone, key: string): Promise<void>;
}
