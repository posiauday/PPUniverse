import { CreateBucketCommand, S3Client } from "@aws-sdk/client-s3";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { S3StorageAdapter } from "./s3-storage-adapter.js";

/**
 * Runs only when S3_ENDPOINT is set (a real S3-compatible endpoint — MinIO
 * locally/in CI). See docker-compose.yml and .github/workflows/ci.yml.
 */
const endpoint = process.env["S3_ENDPOINT"];
const hasStorage = Boolean(endpoint);

describe.skipIf(!hasStorage)("S3StorageAdapter (integration)", () => {
  const config = {
    bucket: process.env["S3_BUCKET"] ?? "ppuniverse-test",
    region: process.env["S3_REGION"] ?? "us-east-1",
    endpoint,
    forcePathStyle: true,
    credentials: {
      accessKeyId: process.env["S3_ACCESS_KEY_ID"] ?? "minioadmin",
      secretAccessKey: process.env["S3_SECRET_ACCESS_KEY"] ?? "minioadmin",
    },
  };
  let storage: S3StorageAdapter;

  beforeAll(async () => {
    const setupClient = new S3Client({
      region: config.region,
      endpoint: config.endpoint,
      forcePathStyle: true,
      credentials: config.credentials,
    });
    try {
      await setupClient.send(new CreateBucketCommand({ Bucket: config.bucket }));
    } catch (error) {
      const code = (error as { name?: string }).name;
      if (code !== "BucketAlreadyOwnedByYou" && code !== "BucketAlreadyExists") {
        throw error;
      }
    }
    storage = new S3StorageAdapter(config);
  });

  afterAll(async () => {
    await storage.deleteObject("quarantine", "integration-test.txt").catch(() => undefined);
    await storage.deleteObject("clean", "integration-test.txt").catch(() => undefined);
  });

  it("returns null headObject for an object that was never uploaded", async () => {
    expect(await storage.headObject("quarantine", "does-not-exist.txt")).toBeNull();
  });

  it("issues a signed upload URL that actually accepts a PUT, then headObject/getObjectRange see it", async () => {
    const body = "hello quarantine";
    const uploadUrl = await storage.getSignedUploadUrl(
      "quarantine",
      "integration-test.txt",
      "text/plain",
    );

    const response = await fetch(uploadUrl, {
      method: "PUT",
      headers: { "Content-Type": "text/plain" },
      body,
    });
    expect(response.ok).toBe(true);

    const meta = await storage.headObject("quarantine", "integration-test.txt");
    expect(meta?.sizeBytes).toBe(body.length);

    const bytes = await storage.getObjectRange("quarantine", "integration-test.txt", 0, 4);
    expect(Buffer.from(bytes).toString("utf8")).toBe("hello");
  });

  it("moveObject relocates the object between zones", async () => {
    await storage.moveObject("quarantine", "clean", "integration-test.txt");
    expect(await storage.headObject("quarantine", "integration-test.txt")).toBeNull();
    expect(await storage.headObject("clean", "integration-test.txt")).not.toBeNull();
  });

  it("issues a signed download URL that actually serves the object", async () => {
    const downloadUrl = await storage.getSignedDownloadUrl("clean", "integration-test.txt");
    const response = await fetch(downloadUrl);
    expect(response.ok).toBe(true);
    expect(await response.text()).toBe("hello quarantine");
  });
});
