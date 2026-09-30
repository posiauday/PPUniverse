import { readdirSync, readFileSync, statSync } from "node:fs";
import { basename, dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";
import { parseArticleSource, technologyInfo } from "@ppu/domain-content";
import { describe, expect, it } from "vitest";

/**
 * The content gate (MVP-029): every launch article in content/articles must be
 * importable -- it parses, passes the admin editor's validators, has a unique
 * slug, is named after that slug, and sits in the folder of its technology
 * section (content/articles/power-apps/... for POWER_APPS; content/articles/
 * general/ for none). Runs in CI, so a broken article fails the build before
 * it can be imported.
 */

const ROOT = fileURLToPath(new URL("../../../../content/articles/", import.meta.url));

function markdownFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) return markdownFiles(path);
    return name.endsWith(".md") ? [path] : [];
  });
}

const FILES = markdownFiles(ROOT).filter((path) => basename(path) !== "README.md");

describe("content/articles", () => {
  it.each(FILES.map((path) => [relative(ROOT, path).split("\\").join("/"), path]))(
    "%s is a valid, importable article in the right place",
    (_name, path) => {
      const result = parseArticleSource(readFileSync(path, "utf8"));
      expect(result.ok ? [] : result.errors).toEqual([]);
      if (!result.ok) return;
      expect(basename(path)).toBe(`${result.article.slug}.md`);
      const folder = basename(dirname(path));
      const expected = result.article.technology ? technologyInfo(result.article.technology).slug : "general";
      expect(folder).toBe(expected);
    },
  );

  it("has no two articles with the same slug", () => {
    const slugs = FILES.map((path) => basename(path, ".md"));
    expect(new Set(slugs).size).toBe(slugs.length);
  });
});
