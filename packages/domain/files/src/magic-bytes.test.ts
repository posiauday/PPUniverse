import { describe, expect, it } from "vitest";
import { verifyMimeType } from "./magic-bytes.js";

describe("verifyMimeType", () => {
  it("confirms a matching zip signature", () => {
    const bytes = new Uint8Array([0x50, 0x4b, 0x03, 0x04]);
    expect(verifyMimeType("application/zip", bytes)).toEqual({
      verifiable: true,
      detectedMimeType: "application/zip",
      matchesDeclared: true,
    });
  });

  it("confirms a matching PNG signature", () => {
    const bytes = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
    expect(verifyMimeType("image/png", bytes)).toEqual({
      verifiable: true,
      detectedMimeType: "image/png",
      matchesDeclared: true,
    });
  });

  it("flags a mismatch: declared PNG but actually a zip", () => {
    const bytes = new Uint8Array([0x50, 0x4b, 0x03, 0x04]);
    const result = verifyMimeType("image/png", bytes);
    expect(result).toEqual({
      verifiable: true,
      detectedMimeType: "application/zip",
      matchesDeclared: false,
    });
  });

  it("flags unrecognized bytes as a mismatch", () => {
    const bytes = new Uint8Array([0x00, 0x01, 0x02, 0x03]);
    const result = verifyMimeType("application/pdf", bytes);
    expect(result).toEqual({
      verifiable: true,
      detectedMimeType: "application/octet-stream",
      matchesDeclared: false,
    });
  });

  it("treats text-based declared types as unverifiable and trusts them", () => {
    const bytes = new Uint8Array([0x7b, 0x22, 0x61, 0x22]); // '{"a"
    expect(verifyMimeType("application/json", bytes)).toEqual({
      verifiable: false,
      detectedMimeType: null,
      matchesDeclared: true,
    });
  });
});
