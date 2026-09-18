/**
 * Minimal magic-byte sniffing for the declared-vs-detected type check
 * (docs/13-implementation-readiness-plan.md §6, docs/08 threat: malicious
 * uploads). Only covers types with a reliable binary signature; text-based
 * types (json/markdown/plain) have none, so they're treated as
 * unverifiable by this method and trusted on declared type alone — an
 * explicit, narrow scope choice, not an oversight.
 */
const SIGNATURES: ReadonlyArray<{ mimeType: string; matches: (bytes: Uint8Array) => boolean }> = [
  {
    mimeType: "application/zip",
    matches: (b) =>
      b.length >= 4 &&
      b[0] === 0x50 &&
      b[1] === 0x4b &&
      (b[2] === 0x03 || b[2] === 0x05 || b[2] === 0x07),
  },
  {
    mimeType: "image/png",
    matches: (b) =>
      b.length >= 8 &&
      b[0] === 0x89 &&
      b[1] === 0x50 &&
      b[2] === 0x4e &&
      b[3] === 0x47 &&
      b[4] === 0x0d &&
      b[5] === 0x0a &&
      b[6] === 0x1a &&
      b[7] === 0x0a,
  },
  {
    mimeType: "image/jpeg",
    matches: (b) => b.length >= 3 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff,
  },
  {
    mimeType: "application/pdf",
    matches: (b) =>
      b.length >= 4 && b[0] === 0x25 && b[1] === 0x50 && b[2] === 0x44 && b[3] === 0x46,
  },
];

const UNVERIFIABLE_MIME_TYPES = new Set(["application/json", "text/markdown", "text/plain"]);

export type MimeVerification =
  | { verifiable: true; detectedMimeType: string; matchesDeclared: boolean }
  | { verifiable: false; detectedMimeType: null; matchesDeclared: true };

export function verifyMimeType(
  declaredMimeType: string,
  leadingBytes: Uint8Array,
): MimeVerification {
  if (UNVERIFIABLE_MIME_TYPES.has(declaredMimeType)) {
    return { verifiable: false, detectedMimeType: null, matchesDeclared: true };
  }
  const signature = SIGNATURES.find((s) => s.matches(leadingBytes));
  if (!signature) {
    return {
      verifiable: true,
      detectedMimeType: "application/octet-stream",
      matchesDeclared: false,
    };
  }
  return {
    verifiable: true,
    detectedMimeType: signature.mimeType,
    matchesDeclared: signature.mimeType === declaredMimeType,
  };
}
