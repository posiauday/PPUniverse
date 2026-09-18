import { assertValidTransition } from "./state-machine.js";
import type { FileScanRecord, FileScanStatus } from "./types.js";

export interface CreateFileScanInput {
  storageKey: string;
  originalFilename: string;
  declaredMimeType: string;
  sizeBytes: number;
  uploadedByUserId: string;
}

export interface FileScanStatusPatch {
  detectedMimeType?: string;
  rejectionReason?: string;
}

export interface FileScanRepository {
  create(input: CreateFileScanInput): Promise<FileScanRecord>;
  findById(id: string): Promise<FileScanRecord | null>;
  updateStatus(
    id: string,
    status: FileScanStatus,
    patch?: FileScanStatusPatch,
  ): Promise<FileScanRecord>;
}

/** Test double — no infrastructure dependency. Not for production use. */
export class InMemoryFileScanRepository implements FileScanRepository {
  private readonly records = new Map<string, FileScanRecord>();
  private nextId = 1;

  async create(input: CreateFileScanInput): Promise<FileScanRecord> {
    const record: FileScanRecord = {
      id: `fake-file-scan-${this.nextId++}`,
      storageKey: input.storageKey,
      originalFilename: input.originalFilename,
      declaredMimeType: input.declaredMimeType,
      detectedMimeType: null,
      sizeBytes: input.sizeBytes,
      status: "UPLOADED",
      rejectionReason: null,
      uploadedByUserId: input.uploadedByUserId,
    };
    this.records.set(record.id, record);
    return record;
  }

  async findById(id: string): Promise<FileScanRecord | null> {
    return this.records.get(id) ?? null;
  }

  async updateStatus(
    id: string,
    status: FileScanStatus,
    patch: FileScanStatusPatch = {},
  ): Promise<FileScanRecord> {
    const existing = this.records.get(id);
    if (!existing) {
      throw new Error(`FileScan not found: ${id}`);
    }
    assertValidTransition(existing.status, status);
    const updated: FileScanRecord = {
      ...existing,
      status,
      detectedMimeType: patch.detectedMimeType ?? existing.detectedMimeType,
      rejectionReason: patch.rejectionReason ?? existing.rejectionReason,
    };
    this.records.set(id, updated);
    return updated;
  }
}
