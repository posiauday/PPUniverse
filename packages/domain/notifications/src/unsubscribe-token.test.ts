import { createHmac } from "node:crypto";
import { describe, expect, it } from "vitest";
import { mintUnsubscribeToken, verifyUnsubscribeToken } from "./unsubscribe-token.js";

const SECRET = "test-secret-do-not-use-in-real-environments";

describe("mintUnsubscribeToken / verifyUnsubscribeToken", () => {
  it("round-trips: a freshly minted token verifies to the same userId and category", () => {
    const token = mintUnsubscribeToken("user-1", SECRET);
    const result = verifyUnsubscribeToken(token, SECRET);
    expect(result).toEqual({ userId: "user-1", category: "MARKETING_EMAIL" });
  });

  it("rejects an expired token", () => {
    const mintedAt = new Date("2026-01-01T00:00:00Z");
    const token = mintUnsubscribeToken("user-1", SECRET, mintedAt, 1000);
    const wellAfterExpiry = new Date("2026-01-01T00:00:02Z");
    expect(verifyUnsubscribeToken(token, SECRET, wellAfterExpiry)).toBeNull();
  });

  it("accepts a token checked just before its expiry", () => {
    const mintedAt = new Date("2026-01-01T00:00:00Z");
    const token = mintUnsubscribeToken("user-1", SECRET, mintedAt, 1000);
    const justBeforeExpiry = new Date("2026-01-01T00:00:00.999Z");
    expect(verifyUnsubscribeToken(token, SECRET, justBeforeExpiry)).not.toBeNull();
  });

  it("rejects a token signed with a different secret", () => {
    const token = mintUnsubscribeToken("user-1", SECRET);
    expect(verifyUnsubscribeToken(token, "a-completely-different-secret")).toBeNull();
  });

  it("rejects a tampered payload even if the signature parses", () => {
    const token = mintUnsubscribeToken("user-1", SECRET);
    const [, signature] = token.split(".");
    const forgedPayload = Buffer.from(
      JSON.stringify({ userId: "someone-elses-id", category: "MARKETING_EMAIL", exp: 9999999999 }),
    ).toString("base64url");
    expect(verifyUnsubscribeToken(`${forgedPayload}.${signature}`, SECRET)).toBeNull();
  });

  it("rejects malformed tokens: wrong shape, garbage, empty", () => {
    expect(verifyUnsubscribeToken("not-a-token", SECRET)).toBeNull();
    expect(verifyUnsubscribeToken("", SECRET)).toBeNull();
    expect(verifyUnsubscribeToken("a.b.c", SECRET)).toBeNull();
    expect(verifyUnsubscribeToken(".", SECRET)).toBeNull();
  });

  it("rejects a well-formed but non-MARKETING_EMAIL category, signed correctly", () => {
    // Hand-construct a validly-signed token for a category this module
    // never mints, proving the category check is enforced independently
    // of how the token was produced.
    const payload = { userId: "user-1", category: "SOMETHING_ELSE", exp: 9999999999 };
    const encodedPayload = Buffer.from(JSON.stringify(payload)).toString("base64url");
    const signature = createHmac("sha256", SECRET).update(encodedPayload).digest("base64url");
    expect(verifyUnsubscribeToken(`${encodedPayload}.${signature}`, SECRET)).toBeNull();
  });

  it("every distinct failure mode returns the identical null — no way to distinguish them", () => {
    const results = [
      verifyUnsubscribeToken("garbage", SECRET),
      verifyUnsubscribeToken(mintUnsubscribeToken("user-1", "wrong-secret"), SECRET),
      verifyUnsubscribeToken(
        mintUnsubscribeToken("user-1", SECRET, new Date(0), 1),
        SECRET,
        new Date(1000),
      ),
    ];
    for (const result of results) {
      expect(result).toBeNull();
    }
  });
});
