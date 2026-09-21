import { describe, expect, it } from "vitest";
import { buildRobots } from "./robots.js";

describe("buildRobots", () => {
  it("allows crawling, blocks only /api/, and references the absolute sitemap", () => {
    expect(buildRobots({ ok: true, origin: "https://example.com" })).toEqual({
      rules: [{ userAgent: "*", allow: "/", disallow: ["/api/"] }],
      sitemap: "https://example.com/sitemap.xml",
    });
  });

  it("omits the Sitemap line entirely when the site origin is unavailable", () => {
    const robots = buildRobots({ ok: false, reason: "MISSING" });
    expect(robots).toEqual({ rules: [{ userAgent: "*", allow: "/", disallow: ["/api/"] }] });
    expect("sitemap" in robots).toBe(false);
  });

  it("does not disallow sign-in, account or search — a blocked URL can never have its noindex read", () => {
    const text = JSON.stringify(buildRobots({ ok: true, origin: "https://example.com" }));
    for (const path of ["/signin", "/account", "/search"]) {
      expect(text).not.toContain(path);
    }
  });

  it("does not advertise admin, creator or preview paths", () => {
    const text = JSON.stringify(
      buildRobots({ ok: true, origin: "https://example.com" }),
    ).toLowerCase();
    for (const word of ["admin", "creator", "preview", "internal", "moderat"]) {
      expect(text, word).not.toContain(word);
    }
  });
});
