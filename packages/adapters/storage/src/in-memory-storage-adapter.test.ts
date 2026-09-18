import { describe, expect, it } from "vitest";
import { InMemoryStorageAdapter } from "./in-memory-storage-adapter.js";

describe("InMemoryStorageAdapter", () => {
  it("headObject returns null for an object that was never seeded", async () => {
    const storage = new InMemoryStorageAdapter();
    expect(await storage.headObject("quarantine", "missing.zip")).toBeNull();
  });

  it("headObject reports size and content type for a seeded object", async () => {
    const storage = new InMemoryStorageAdapter();
    storage.seed("quarantine", "a.zip", new Uint8Array([1, 2, 3, 4]), "application/zip");
    expect(await storage.headObject("quarantine", "a.zip")).toEqual({
      sizeBytes: 4,
      contentType: "application/zip",
    });
  });

  it("getObject returns the full stored bytes", async () => {
    const storage = new InMemoryStorageAdapter();
    storage.seed("quarantine", "a.bin", new Uint8Array([1, 2, 3]), "application/octet-stream");
    expect(await storage.getObject("quarantine", "a.bin")).toEqual(new Uint8Array([1, 2, 3]));
  });

  it("getObjectRange returns the requested byte range", async () => {
    const storage = new InMemoryStorageAdapter();
    storage.seed(
      "quarantine",
      "a.bin",
      new Uint8Array([10, 20, 30, 40, 50]),
      "application/octet-stream",
    );
    expect(await storage.getObjectRange("quarantine", "a.bin", 1, 3)).toEqual(
      new Uint8Array([20, 30, 40]),
    );
  });

  it("moveObject relocates the object and removes it from the source zone", async () => {
    const storage = new InMemoryStorageAdapter();
    storage.seed("quarantine", "a.zip", new Uint8Array([1]), "application/zip");
    await storage.moveObject("quarantine", "clean", "a.zip");
    expect(await storage.headObject("quarantine", "a.zip")).toBeNull();
    expect(await storage.headObject("clean", "a.zip")).toEqual({
      sizeBytes: 1,
      contentType: "application/zip",
    });
  });

  it("moveObject throws when the source object does not exist", async () => {
    const storage = new InMemoryStorageAdapter();
    await expect(storage.moveObject("quarantine", "clean", "missing.zip")).rejects.toThrow();
  });

  it("deleteObject removes the object", async () => {
    const storage = new InMemoryStorageAdapter();
    storage.seed("quarantine", "a.zip", new Uint8Array([1]), "application/zip");
    await storage.deleteObject("quarantine", "a.zip");
    expect(await storage.headObject("quarantine", "a.zip")).toBeNull();
  });
});
