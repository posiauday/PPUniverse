import { InvalidFileScanTransitionError } from "@ppu/domain-files";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { PrismaFileScanRepository } from "./file-scan-repository.js";

/**
 * Runs only when DATABASE_URL points at a real, migrated Postgres database.
 * CI provides one via a Postgres service container; locally, docker compose
 * up -d then export DATABASE_URL before pnpm test (see README.md).
 */
const hasDatabase = Boolean(process.env["DATABASE_URL"]);

describe.skipIf(!hasDatabase)("PrismaFileScanRepository (integration)", () => {
  let db: import("@ppu/db").PrismaClient;
  let repo: PrismaFileScanRepository;
  let userId: string;

  beforeAll(async () => {
    const { prisma } = await import("@ppu/db");
    db = prisma;
    repo = new PrismaFileScanRepository(db);
    const user = await db.user.create({ data: { email: "file-scan-repo@example.test" } });
    userId = user.id;
  });

  afterAll(async () => {
    await db.user.deleteMany({ where: { id: userId } });
    await db.$disconnect();
  });

  it("creates a record at UPLOADED and walks it to CLEAN with scan timestamps set", async () => {
    const created = await repo.create({
      storageKey: `quarantine/${crypto.randomUUID()}.zip`,
      originalFilename: "a.zip",
      declaredMimeType: "application/zip",
      sizeBytes: 1024,
      uploadedByUserId: userId,
    });
    expect(created.status).toBe("UPLOADED");

    await repo.updateStatus(created.id, "QUARANTINED");
    const scanning = await repo.updateStatus(created.id, "SCANNING", {
      detectedMimeType: "application/zip",
    });
    expect(scanning.detectedMimeType).toBe("application/zip");

    const clean = await repo.updateStatus(created.id, "CLEAN");
    expect(clean.status).toBe("CLEAN");

    const row = await db.fileScan.findUniqueOrThrow({ where: { id: created.id } });
    expect(row.scanStartedAt).not.toBeNull();
    expect(row.scanCompletedAt).not.toBeNull();
  });

  it("rejects an invalid transition at the database boundary, not just in memory", async () => {
    const created = await repo.create({
      storageKey: `quarantine/${crypto.randomUUID()}.zip`,
      originalFilename: "b.zip",
      declaredMimeType: "application/zip",
      sizeBytes: 1024,
      uploadedByUserId: userId,
    });
    await expect(repo.updateStatus(created.id, "CLEAN")).rejects.toThrow(
      InvalidFileScanTransitionError,
    );
  });

  it("enforces the unique storageKey constraint", async () => {
    const storageKey = `quarantine/${crypto.randomUUID()}.zip`;
    await repo.create({
      storageKey,
      originalFilename: "c.zip",
      declaredMimeType: "application/zip",
      sizeBytes: 1,
      uploadedByUserId: userId,
    });
    await expect(
      repo.create({
        storageKey,
        originalFilename: "d.zip",
        declaredMimeType: "application/zip",
        sizeBytes: 1,
        uploadedByUserId: userId,
      }),
    ).rejects.toThrow();
  });
});
