import { S3StorageAdapter, type StorageAdapter } from "@ppu/adapter-storage";

/**
 * S3-compatible: MinIO locally/CI, real vendor still open (ADR 004,
 * docs/open-questions.md item 5).
 */
export const storageAdapter: StorageAdapter = new S3StorageAdapter({
  bucket: process.env["S3_BUCKET"] ?? "ppuniverse",
  region: process.env["S3_REGION"] ?? "us-east-1",
  endpoint: process.env["S3_ENDPOINT"],
  forcePathStyle: true,
  credentials:
    process.env["S3_ACCESS_KEY_ID"] && process.env["S3_SECRET_ACCESS_KEY"]
      ? {
          accessKeyId: process.env["S3_ACCESS_KEY_ID"],
          secretAccessKey: process.env["S3_SECRET_ACCESS_KEY"],
        }
      : undefined,
});
