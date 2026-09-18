import {
  CopyObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
  NotFound,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import type { ObjectMetadata, StorageAdapter, StorageZone } from "./storage-adapter.js";

export interface S3StorageAdapterConfig {
  bucket: string;
  region: string;
  endpoint?: string;
  forcePathStyle?: boolean;
  credentials?: { accessKeyId: string; secretAccessKey: string };
}

function zoneKey(zone: StorageZone, key: string): string {
  return `${zone}/${key}`;
}

/**
 * S3-compatible implementation (ADR 004): works against real AWS S3 or any
 * S3-compatible endpoint (MinIO for local/CI). Final production vendor is
 * still open (docs/open-questions.md item 5).
 */
export class S3StorageAdapter implements StorageAdapter {
  private readonly client: S3Client;
  private readonly bucket: string;

  constructor(config: S3StorageAdapterConfig) {
    this.bucket = config.bucket;
    this.client = new S3Client({
      region: config.region,
      endpoint: config.endpoint,
      forcePathStyle: config.forcePathStyle,
      credentials: config.credentials,
    });
  }

  async getSignedUploadUrl(
    zone: StorageZone,
    key: string,
    contentType: string,
    expiresInSeconds = 300,
  ): Promise<string> {
    const command = new PutObjectCommand({
      Bucket: this.bucket,
      Key: zoneKey(zone, key),
      ContentType: contentType,
    });
    return getSignedUrl(this.client, command, { expiresIn: expiresInSeconds });
  }

  async getSignedDownloadUrl(
    zone: StorageZone,
    key: string,
    expiresInSeconds = 300,
  ): Promise<string> {
    const command = new GetObjectCommand({ Bucket: this.bucket, Key: zoneKey(zone, key) });
    return getSignedUrl(this.client, command, { expiresIn: expiresInSeconds });
  }

  async headObject(zone: StorageZone, key: string): Promise<ObjectMetadata | null> {
    try {
      const result = await this.client.send(
        new HeadObjectCommand({ Bucket: this.bucket, Key: zoneKey(zone, key) }),
      );
      return {
        sizeBytes: result.ContentLength ?? 0,
        contentType: result.ContentType ?? "application/octet-stream",
      };
    } catch (error) {
      if (error instanceof NotFound) {
        return null;
      }
      throw error;
    }
  }

  async getObject(zone: StorageZone, key: string): Promise<Uint8Array> {
    const result = await this.client.send(
      new GetObjectCommand({ Bucket: this.bucket, Key: zoneKey(zone, key) }),
    );
    const body = result.Body;
    if (!body) {
      return new Uint8Array();
    }
    return body.transformToByteArray();
  }

  async getObjectRange(
    zone: StorageZone,
    key: string,
    start: number,
    end: number,
  ): Promise<Uint8Array> {
    const result = await this.client.send(
      new GetObjectCommand({
        Bucket: this.bucket,
        Key: zoneKey(zone, key),
        Range: `bytes=${start}-${end}`,
      }),
    );
    const body = result.Body;
    if (!body) {
      return new Uint8Array();
    }
    return body.transformToByteArray();
  }

  async moveObject(fromZone: StorageZone, toZone: StorageZone, key: string): Promise<void> {
    await this.client.send(
      new CopyObjectCommand({
        Bucket: this.bucket,
        Key: zoneKey(toZone, key),
        CopySource: `${this.bucket}/${zoneKey(fromZone, key)}`,
      }),
    );
    await this.deleteObject(fromZone, key);
  }

  async deleteObject(zone: StorageZone, key: string): Promise<void> {
    await this.client.send(
      new DeleteObjectCommand({ Bucket: this.bucket, Key: zoneKey(zone, key) }),
    );
  }
}
