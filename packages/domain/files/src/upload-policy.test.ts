import { describe, expect, it } from "vitest";
import {
  checkUploadPolicy,
  describeUploadPolicyViolation,
  MAX_UPLOAD_SIZE_BYTES,
  sanitizeFilename,
} from "./upload-policy.js";

describe("checkUploadPolicy", () => {
  it("allows a compliant request", () => {
    expect(checkUploadPolicy({ declaredMimeType: "application/zip", sizeBytes: 1024 })).toBeNull();
  });

  it("rejects a disallowed mime type", () => {
    expect(
      checkUploadPolicy({ declaredMimeType: "application/x-msdownload", sizeBytes: 1024 }),
    ).toEqual({ code: "MIME_TYPE_NOT_ALLOWED", declaredMimeType: "application/x-msdownload" });
  });

  it("rejects a file over the size limit", () => {
    expect(
      checkUploadPolicy({
        declaredMimeType: "application/zip",
        sizeBytes: MAX_UPLOAD_SIZE_BYTES + 1,
      }),
    ).toEqual({
      code: "SIZE_EXCEEDS_LIMIT",
      sizeBytes: MAX_UPLOAD_SIZE_BYTES + 1,
      limitBytes: MAX_UPLOAD_SIZE_BYTES,
    });
  });

  it("allows a file exactly at the size limit", () => {
    expect(
      checkUploadPolicy({ declaredMimeType: "application/zip", sizeBytes: MAX_UPLOAD_SIZE_BYTES }),
    ).toBeNull();
  });
});

describe("describeUploadPolicyViolation", () => {
  it("describes a disallowed mime type", () => {
    expect(
      describeUploadPolicyViolation({
        code: "MIME_TYPE_NOT_ALLOWED",
        declaredMimeType: "application/x-msdownload",
      }),
    ).toContain("application/x-msdownload");
  });

  it("describes a size violation", () => {
    expect(
      describeUploadPolicyViolation({ code: "SIZE_EXCEEDS_LIMIT", sizeBytes: 100, limitBytes: 50 }),
    ).toContain("100");
  });
});

describe("sanitizeFilename", () => {
  it("strips a path prefix", () => {
    expect(sanitizeFilename("C:\\Users\\me\\a.zip")).toBe("a.zip");
    expect(sanitizeFilename("/home/me/a.zip")).toBe("a.zip");
  });

  it("strips control characters", () => {
    expect(sanitizeFilename("a\u0000\u0001.zip")).toBe("a.zip");
  });

  it("falls back to a placeholder for an empty result", () => {
    expect(sanitizeFilename("   ")).toBe("unnamed-file");
  });

  it("leaves an ordinary filename unchanged", () => {
    expect(sanitizeFilename("my-component.zip")).toBe("my-component.zip");
  });
});
