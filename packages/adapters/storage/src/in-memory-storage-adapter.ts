import type { ObjectMetadata, StorageAdapter, StorageZone } from "./storage-adapter.js";

interface StoredObject {
  bytes: Uint8Array;
  contentType: string;
}

/** Test double — no network. Not for production use. */
export class InMemoryStorageAdapter implements StorageAdapter {
  private readonly objects = new Map<string, StoredObject>();

  private zoneKey(zone: StorageZone, key: string): string {
    return `${zone}/${key}`;
  }

  /** Test-only helper to seed an object as if a client had already uploaded it. */
  seed(zone: StorageZone, key: string, bytes: Uint8Array, contentType: string): void {
    this.objects.set(this.zoneKey(zone, key), { bytes, contentType });
  }

  async getSignedUploadUrl(zone: StorageZone, key: string): Promise<string> {
    return `https://fake-storage.test/upload/${this.zoneKey(zone, key)}`;
  }

  async getSignedDownloadUrl(zone: StorageZone, key: string): Promise<string> {
    return `https://fake-storage.test/download/${this.zoneKey(zone, key)}`;
  }

  async headObject(zone: StorageZone, key: string): Promise<ObjectMetadata | null> {
    const object = this.objects.get(this.zoneKey(zone, key));
    return object ? { sizeBytes: object.bytes.length, contentType: object.contentType } : null;
  }

  async getObject(zone: StorageZone, key: string): Promise<Uint8Array> {
    const object = this.objects.get(this.zoneKey(zone, key));
    if (!object) {
      throw new Error(`Object not found: ${this.zoneKey(zone, key)}`);
    }
    return object.bytes;
  }

  async getObjectRange(
    zone: StorageZone,
    key: string,
    start: number,
    end: number,
  ): Promise<Uint8Array> {
    const object = this.objects.get(this.zoneKey(zone, key));
    if (!object) {
      throw new Error(`Object not found: ${this.zoneKey(zone, key)}`);
    }
    return object.bytes.slice(start, end + 1);
  }

  async moveObject(fromZone: StorageZone, toZone: StorageZone, key: string): Promise<void> {
    const fromKey = this.zoneKey(fromZone, key);
    const object = this.objects.get(fromKey);
    if (!object) {
      throw new Error(`Object not found: ${fromKey}`);
    }
    this.objects.set(this.zoneKey(toZone, key), object);
    this.objects.delete(fromKey);
  }

  async deleteObject(zone: StorageZone, key: string): Promise<void> {
    this.objects.delete(this.zoneKey(zone, key));
  }
}
