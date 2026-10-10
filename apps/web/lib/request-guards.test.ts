import { afterEach, describe, expect, it, vi } from "vitest";
import { isSameOrigin } from "./request-guards";

/** The same-origin check every write route uses (site review, 2026-10-10). */
const at = (url: string, origin?: string) =>
  new Request(url, { method: "POST", headers: origin ? { Origin: origin } : {} });

afterEach(() => vi.unstubAllEnvs());

describe("isSameOrigin", () => {
  it("accepts this site's public address", () => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://lowcodestacks.com");
    expect(isSameOrigin(at("https://lowcodestacks.com/api/x", "https://lowcodestacks.com"))).toBe(
      true,
    );
  });

  it("accepts the address the request was sent to, such as a preview or a test server", () => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://e2e.example.org");
    expect(isSameOrigin(at("http://localhost:3100/api/x", "http://localhost:3100"))).toBe(true);
  });

  it("refuses another site, and a request with no Origin", () => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://lowcodestacks.com");
    expect(isSameOrigin(at("https://lowcodestacks.com/api/x", "https://evil.example"))).toBe(false);
    expect(isSameOrigin(at("https://lowcodestacks.com/api/x", "null"))).toBe(false);
    expect(isSameOrigin(at("https://lowcodestacks.com/api/x"))).toBe(false);
  });
});
