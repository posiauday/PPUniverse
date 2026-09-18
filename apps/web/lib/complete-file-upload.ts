import { PrismaFileScanRepository } from "@ppu/adapter-files";
import { prisma } from "@ppu/db";
import { checkUploadPolicy, verifyMimeType, type FileScanRecord } from "@ppu/domain-files";
import { scanAdapter } from "./scanning";
import { storageAdapter } from "./storage";

export class UploadNotFoundError extends Error {
  constructor() {
    super("No uploaded object found at the given storage key.");
    this.name = "UploadNotFoundError";
  }
}

/**
 * The full MVP-006 pipeline: verify the upload landed in quarantine ->
 * re-check policy against the real size -> declared-vs-detected type check
 * -> malware scan -> CLEAN (moved out of quarantine) or REJECTED. Runs
 * synchronously in the request — a documented, reversible scope reduction
 * from the TRD's async-job default (see planning/progress-report.md
 * MVP-006 section); no story yet owns setting up the job queue.
 */
export async function completeFileUpload(params: {
  storageKey: string;
  originalFilename: string;
  declaredMimeType: string;
  uploadedByUserId: string;
}): Promise<FileScanRecord> {
  const repo = new PrismaFileScanRepository(prisma);

  const meta = await storageAdapter.headObject("quarantine", params.storageKey);
  if (!meta) {
    throw new UploadNotFoundError();
  }

  const record = await repo.create({
    storageKey: params.storageKey,
    originalFilename: params.originalFilename,
    declaredMimeType: params.declaredMimeType,
    sizeBytes: meta.sizeBytes,
    uploadedByUserId: params.uploadedByUserId,
  });
  await repo.updateStatus(record.id, "QUARANTINED");

  // Re-check against the ACTUAL uploaded size, not just what the client
  // declared when requesting the upload URL.
  const policyViolation = checkUploadPolicy({
    declaredMimeType: params.declaredMimeType,
    sizeBytes: meta.sizeBytes,
  });
  if (policyViolation) {
    return repo.updateStatus(record.id, "REJECTED", {
      rejectionReason:
        policyViolation.code === "SIZE_EXCEEDS_LIMIT"
          ? `Actual size ${policyViolation.sizeBytes} bytes exceeds the ${policyViolation.limitBytes}-byte limit`
          : `Declared type ${policyViolation.declaredMimeType} is not allowed`,
    });
  }

  const leadingBytes = await storageAdapter.getObjectRange("quarantine", params.storageKey, 0, 511);
  const mimeCheck = verifyMimeType(params.declaredMimeType, leadingBytes);
  if (mimeCheck.verifiable && !mimeCheck.matchesDeclared) {
    return repo.updateStatus(record.id, "REJECTED", {
      detectedMimeType: mimeCheck.detectedMimeType,
      rejectionReason: `Declared type ${params.declaredMimeType} does not match detected type ${mimeCheck.detectedMimeType}`,
    });
  }

  await repo.updateStatus(record.id, "SCANNING", {
    detectedMimeType: mimeCheck.verifiable ? mimeCheck.detectedMimeType : undefined,
  });

  const fullBytes = await storageAdapter.getObject("quarantine", params.storageKey);
  const scanResult = await scanAdapter.scan(fullBytes);

  if (scanResult.verdict === "clean") {
    const clean = await repo.updateStatus(record.id, "CLEAN");
    await storageAdapter.moveObject("quarantine", "clean", params.storageKey);
    return clean;
  }

  // Fail closed: a scan-engine error is treated as REJECTED, never as a
  // pass-through to CLEAN. The rejection reason distinguishes an actual
  // malware finding from an infrastructure failure for whoever reviews it.
  return repo.updateStatus(record.id, "REJECTED", {
    rejectionReason:
      scanResult.verdict === "infected"
        ? `Malware scan flagged this file: ${scanResult.signature}`
        : `Malware scan failed: ${scanResult.message}`,
  });
}
