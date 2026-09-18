import { describe, expect, it } from "vitest";
import { redact } from "./redact.js";

describe("redact", () => {
  it("redacts default-sensitive keys case-insensitively", () => {
    const result = redact({ Password: "hunter2", TOKEN: "abc", safe: "value" });
    expect(result).toEqual({ Password: "[REDACTED]", TOKEN: "[REDACTED]", safe: "value" });
  });

  it("redacts nested objects", () => {
    const result = redact({ user: { email: "a@b.com", sessionToken: "xyz" } });
    expect(result).toEqual({ user: { email: "a@b.com", sessionToken: "[REDACTED]" } });
  });

  it("redacts within arrays", () => {
    const result = redact([{ apiKey: "k1" }, { apiKey: "k2" }]);
    expect(result).toEqual([{ apiKey: "[REDACTED]" }, { apiKey: "[REDACTED]" }]);
  });

  it("supports call-site-specific extra keys without needing to edit the default list", () => {
    const result = redact({ storageKey: "s3/path", other: "x" }, ["storageKey"]);
    expect(result).toEqual({ storageKey: "[REDACTED]", other: "x" });
  });

  it("leaves primitive values and non-sensitive keys untouched", () => {
    expect(redact("plain string")).toBe("plain string");
    expect(redact(42)).toBe(42);
    expect(redact(null)).toBeNull();
  });
});
