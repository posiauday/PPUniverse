import type { PrismaClient } from "@ppu/db";
import {
  assertValidTransition,
  type CreateFileScanInput,
  type FileScanRecord,
  type FileScanRepository,
  type FileScanStatus,
  type FileScanStatusPatch,
} from "@ppu/domain-files";

export class PrismaFileScanRepository implements FileScanRepository {
  constructor(private readonly db: PrismaClient) {}

  async create(input: CreateFileScanInput): Promise<FileScanRecord> {
    const row = await this.db.fileScan.create({
      data: {
        storageKey: input.storageKey,
        originalFilename: input.originalFilename,
        declaredMimeType: input.declaredMimeType,
        sizeBytes: input.sizeBytes,
        uploadedByUserId: input.uploadedByUserId,
      },
    });
    return toRecord(row);
  }

  async findById(id: string): Promise<FileScanRecord | null> {
    const row = await this.db.fileScan.findUnique({ where: { id } });
    return row ? toRecord(row) : null;
  }

  async updateStatus(
    id: string,
    status: FileScanStatus,
    patch: FileScanStatusPatch = {},
  ): Promise<FileScanRecord> {
    const current = await this.db.fileScan.findUnique({ where: { id } });
    if (!current) {
      throw new Error(`FileScan not found: ${id}`);
    }
    // Re-enforced here, not just trusted from the caller — this repository
    // is the last line of defense against an invalid write reaching Postgres.
    assertValidTransition(current.status as FileScanStatus, status);

    const now = new Date();
    const row = await this.db.fileScan.update({
      where: { id },
      data: {
        status,
        detectedMimeType: patch.detectedMimeType ?? current.detectedMimeType,
        rejectionReason: patch.rejectionReason ?? current.rejectionReason,
        scanStartedAt: status === "SCANNING" ? now : current.scanStartedAt,
        scanCompletedAt:
          status === "CLEAN" || status === "REJECTED" ? now : current.scanCompletedAt,
      },
    });
    return toRecord(row);
  }
}

function toRecord(row: {
  id: string;
  storageKey: string;
  originalFilename: string;
  declaredMimeType: string;
  detectedMimeType: string | null;
  sizeBytes: number;
  status: string;
  rejectionReason: string | null;
  uploadedByUserId: string;
}): FileScanRecord {
  return {
    id: row.id,
    storageKey: row.storageKey,
    originalFilename: row.originalFilename,
    declaredMimeType: row.declaredMimeType,
    detectedMimeType: row.detectedMimeType,
    sizeBytes: row.sizeBytes,
    status: row.status as FileScanStatus,
    rejectionReason: row.rejectionReason,
    uploadedByUserId: row.uploadedByUserId,
  };
}
