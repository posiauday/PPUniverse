import { describe, expect, it, vi } from "vitest";
import { createSiteUrlProvider, resolveSiteUrl, type SiteUrlEnv } from "./site-url.js";

const production = (url: string | undefined): SiteUrlEnv => ({
  NODE_ENV: "production",
  NEXT_PUBLIC_SITE_URL: url,
});
const development = (url: string | undefined, port?: string): SiteUrlEnv => ({
  NODE_ENV: "development",
  NEXT_PUBLIC_SITE_URL: url,
  PORT: port,
});

describe("resolveSiteUrl — production", () => {
  it("accepts an https origin and normalizes it", () => {
    expect(resolveSiteUrl(production("https://example.com"))).toEqual({
      ok: true,
      origin: "https://example.com",
    });
  });

  it.each([
    ["a trailing slash", "https://example.com/", "https://example.com"],
    ["mixed case and the default port", "HTTPS://Example.COM:443/", "https://example.com"],
    ["a non-default port", "https://example.com:8443", "https://example.com:8443"],
    ["surrounding whitespace", "  https://example.com  ", "https://example.com"],
    ["a subdomain", "https://www.example.co.uk", "https://www.example.co.uk"],
  ])("normalizes %s so canonical URLs never differ by formatting", (_label, input, expected) => {
    expect(resolveSiteUrl(production(input))).toEqual({ ok: true, origin: expected });
  });

  it.each([
    ["unset", undefined],
    ["empty", ""],
    ["whitespace only", "   "],
  ])("fails safe when the value is %s — it never invents a domain", (_label, input) => {
    expect(resolveSiteUrl(production(input))).toEqual({ ok: false, reason: "MISSING" });
  });

  it.each([
    ["plain http", "http://example.com"],
    ["http on localhost", "http://localhost:3000"],
    ["a javascript: URL", "javascript:alert(1)"],
    ["a data: URL", "data:text/html,hello"],
    ["ftp", "ftp://example.com"],
  ])("rejects %s", (_label, input) => {
    expect(resolveSiteUrl(production(input))).toEqual({
      ok: false,
      reason: "UNSUPPORTED_PROTOCOL",
    });
  });

  it.each([
    ["localhost", "https://localhost"],
    ["a .localhost host", "https://app.localhost"],
    ["a loopback IPv4 literal", "https://127.0.0.1"],
    ["a private IPv4 literal", "https://192.168.1.10"],
    ["an IPv6 literal", "https://[::1]"],
    ["a single-label host", "https://intranet"],
    ["a trailing-dot host", "https://example.com."],
  ])("rejects %s as a production origin", (_label, input) => {
    expect(resolveSiteUrl(production(input))).toEqual({ ok: false, reason: "DISALLOWED_HOST" });
  });

  it.each([
    ["a username and password", "https://user:secret@example.com"],
    ["a username only", "https://user@example.com"],
  ])("rejects %s", (_label, input) => {
    expect(resolveSiteUrl(production(input))).toEqual({ ok: false, reason: "HAS_CREDENTIALS" });
  });

  it.each([
    ["a path", "https://example.com/app"],
    ["an extra slash", "https://example.com//"],
    ["a query", "https://example.com?x=1"],
    ["a bare question mark", "https://example.com/?"],
    ["a fragment", "https://example.com#top"],
  ])("rejects %s — the value must be a bare origin", (_label, input) => {
    expect(resolveSiteUrl(production(input))).toEqual({ ok: false, reason: "NOT_AN_ORIGIN" });
  });

  it.each([
    ["no scheme", "example.com"],
    ["free text", "not a url"],
  ])("rejects a value with %s", (_label, input) => {
    expect(resolveSiteUrl(production(input))).toEqual({ ok: false, reason: "INVALID_URL" });
  });
});

describe("resolveSiteUrl — fails closed when the environment is unknown", () => {
  it.each([undefined, "staging", "preview", ""])(
    "treats NODE_ENV=%j as production: localhost http is not allowed",
    (nodeEnv) => {
      expect(
        resolveSiteUrl({ NODE_ENV: nodeEnv, NEXT_PUBLIC_SITE_URL: "http://localhost:3000" }),
      ).toEqual({ ok: false, reason: "UNSUPPORTED_PROTOCOL" });
    },
  );

  it("treats an unset value with an unknown NODE_ENV as missing, not as localhost", () => {
    expect(resolveSiteUrl({ NODE_ENV: "staging", NEXT_PUBLIC_SITE_URL: undefined })).toEqual({
      ok: false,
      reason: "MISSING",
    });
  });
});

describe("resolveSiteUrl — development and test", () => {
  it.each(["development", "test"])(
    "%s: an unset value falls back to http://localhost:3000",
    (nodeEnv) => {
      expect(resolveSiteUrl({ NODE_ENV: nodeEnv })).toEqual({
        ok: true,
        origin: "http://localhost:3000",
      });
    },
  );

  it("uses PORT for the localhost fallback, ignoring a malformed PORT", () => {
    expect(resolveSiteUrl(development(undefined, "4100"))).toEqual({
      ok: true,
      origin: "http://localhost:4100",
    });
    expect(resolveSiteUrl(development(undefined, "abc"))).toEqual({
      ok: true,
      origin: "http://localhost:3000",
    });
  });

  it.each([
    ["localhost", "http://localhost:3000", "http://localhost:3000"],
    ["127.0.0.1", "http://127.0.0.1:3000/", "http://127.0.0.1:3000"],
    ["an IPv6 loopback", "http://[::1]:3000", "http://[::1]:3000"],
    ["https on any host", "https://preview.example.test", "https://preview.example.test"],
  ])("accepts %s", (_label, input, expected) => {
    expect(resolveSiteUrl(development(input))).toEqual({ ok: true, origin: expected });
  });

  it("still rejects plain http on a non-loopback host", () => {
    expect(resolveSiteUrl(development("http://example.com"))).toEqual({
      ok: false,
      reason: "UNSUPPORTED_PROTOCOL",
    });
  });
});

describe("createSiteUrlProvider", () => {
  it("reports a misconfiguration once per provider, with only the reason", () => {
    const logError = vi.fn();
    const getSiteUrl = createSiteUrlProvider({
      readEnv: () => production("http://example.com"),
      logError,
    });

    expect(getSiteUrl()).toEqual({ ok: false, reason: "UNSUPPORTED_PROTOCOL" });
    getSiteUrl();
    getSiteUrl();

    expect(logError).toHaveBeenCalledTimes(1);
    expect(logError).toHaveBeenCalledWith("seo.site_url_invalid", {
      reason: "UNSUPPORTED_PROTOCOL",
    });
  });

  it("does not log when the value is valid", () => {
    const logError = vi.fn();
    const getSiteUrl = createSiteUrlProvider({
      readEnv: () => production("https://example.com"),
      logError,
    });
    expect(getSiteUrl()).toEqual({ ok: true, origin: "https://example.com" });
    expect(logError).not.toHaveBeenCalled();
  });

  it("re-reads the environment on every call", () => {
    let value: string | undefined = undefined;
    const getSiteUrl = createSiteUrlProvider({
      readEnv: () => production(value),
      logError: vi.fn(),
    });
    expect(getSiteUrl().ok).toBe(false);
    value = "https://example.com";
    expect(getSiteUrl()).toEqual({ ok: true, origin: "https://example.com" });
  });
});
