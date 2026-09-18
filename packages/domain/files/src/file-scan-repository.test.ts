import { describe, expect, it } from "vitest";
import { InMemoryFileScanRepository } from "./file-scan-repository.js";
import { InvalidFileScanTransitionError } from "./state-machine.js";

describe("InMemoryFileScanRepository", () => {
  it("creates a record at UPLOADED status", async () => {
    const repo = new InMemoryFileScanRepository();
    const record = await repo.create({
      storageKey: "quarantine/a.zip",
      originalFilename: "a.zip",
      declaredMimeType: "application/zip",
      sizeBytes: 100,
      uploadedByUserId: "user-1",
    });
    expect(record.status).toBe("UPLOADED");
    expect(record.uploadedByUserId).toBe("user-1");
  });

  it("walks a record through the full clean path", async () => {
    const repo = new InMemoryFileScanRepository();
    const created = await repo.create({
      storageKey: "quarantine/a.zip",
      originalFilename: "a.zip",
      declaredMimeType: "application/zip",
      sizeBytes: 100,
      uploadedByUserId: "user-1",
    });
    await repo.updateStatus(created.id, "QUARANTINED");
    await repo.updateStatus(created.id, "SCANNING", { detectedMimeType: "application/zip" });
    const final = await repo.updateStatus(created.id, "CLEAN");
    expect(final.status).toBe("CLEAN");
    expect(final.detectedMimeType).toBe("application/zip");
  });

  it("rejects an invalid status transition rather than silently applying it", async () => {
    const repo = new InMemoryFileScanRepository();
    const created = await repo.create({
      storageKey: "quarantine/a.zip",
      originalFilename: "a.zip",
      declaredMimeType: "application/zip",
      sizeBytes: 100,
      uploadedByUserId: "user-1",
    });
    await expect(repo.updateStatus(created.id, "CLEAN")).rejects.toThrow(
      InvalidFileScanTransitionError,
    );
  });

  it("findById returns null for an unknown id", async () => {
    const repo = new InMemoryFileScanRepository();
    expect(await repo.findById("missing")).toBeNull();
  });
});
