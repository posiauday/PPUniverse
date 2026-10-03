import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { parseUpdateSource } from "@ppu/domain-content";
import { describe, expect, it } from "vitest";

/**
 * The updates gate (MVP-033 slice D): every drafted update in content/updates
 * must be importable -- it parses, passes the admin API's validators (a
 * Microsoft source link among them), has a unique slug and is named after it.
 * Runs in CI, so a broken draft fails the build before it can be imported.
 */

const ROOT = fileURLToPath(new URL("../../../../content/updates/", import.meta.url));
const FILES = readdirSync(ROOT).filter((name) => name.endsWith(".md") && name !== "README.md");

describe("content/updates", () => {
  it.each(FILES)("%s is a valid, importable update", (name) => {
    const result = parseUpdateSource(readFileSync(join(ROOT, name), "utf8"));
    expect(result.ok ? [] : result.errors).toEqual([]);
    if (result.ok) expect(name).toBe(`${result.update.slug}.md`);
  });

  it("has unique slugs", () => {
    const slugs = FILES.map((name) => name.replace(/\.md$/, ""));
    expect(new Set(slugs).size).toBe(slugs.length);
  });
});
