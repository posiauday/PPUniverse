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
      const expected = result.article.technology
        ? technologyInfo(result.article.technology).slug
        : "general";
      expect(folder).toBe(expected);
    },
  );

  it("has no two articles with the same slug", () => {
    const slugs = FILES.map((path) => basename(path, ".md"));
    expect(new Set(slugs).size).toBe(slugs.length);
  });
});

/**
 * Search gate (2026-10-06, docs/final-decisions.md "Search phrase for every
 * guide"): each article names the words people type to find it, and uses them
 * where Google reads first. Google ignores the meta keywords tag; what helps
 * is a descriptive title, a short description and an opening that use the
 * searcher's words, without repeating them (keyword stuffing is spam).
 */
const STOP_WORDS = new Set(
  "a an and are as at be by for from how i in into is it my not of on or the to vs why with your didn t than".split(" "),
);
/** Words in a text, lower-cased; "5,000" reads as "5000", and "on-premises" as "on" and "premises". */
function words(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/(\d),(\d)/g, "$1$2")
    .split(/[^a-z0-9]+/)
    .filter(Boolean);
}
/** A crude stem, so "approvals" matches "approval" and "firing" matches "fire". */
function stem(word: string): string {
  return word.length <= 4 ? word : word.replace(/ies$/, "y").replace(/(ing|es|ed|s)$/, "");
}
function uses(text: string, word: string): boolean {
  const target = stem(word);
  return words(text).some((w) => {
    const s = stem(w);
    return s === target || (target.length >= 3 && (s.startsWith(target) || (target.startsWith(s) && s.length >= 4)));
  });
}
const parsed = FILES.map((path) => {
  const result = parseArticleSource(readFileSync(path, "utf8"));
  return { name: basename(path, ".md"), article: result.ok ? result.article : null };
});

describe("search phrases", () => {
  it.each(parsed.map((p) => [p.name, p.article] as const))(
    "%s targets a search phrase in its title, description and opening",
    (_name, article) => {
      if (!article) return; // reported by the importability test above
      const phrase = article.searchPhrase ?? "";
      expect(phrase, "searchPhrase is required for launch content").not.toBe("");
      const main = words(phrase).filter((w) => !STOP_WORDS.has(w));
      const description = (article.excerpt ?? "").slice(0, 160);
      const missing = main.filter((w) => !uses(article.title, w) && !uses(description, w));
      expect(missing, "every phrase word is in the title or the first 160 characters of the excerpt").toEqual([]);
      const inTitle = main.filter((w) => uses(article.title, w)).length;
      expect(inTitle * 2, "at least half the phrase words are in the title").toBeGreaterThanOrEqual(main.length);
      const opening = article.body.split(/\n## /)[0] ?? "";
      const inOpening = main.filter((w) => uses(opening, w)).length;
      expect(inOpening * 2, "at least half the phrase words are in the opening, before the first ##").toBeGreaterThanOrEqual(main.length);
      const repeats = article.body.toLowerCase().split(phrase.toLowerCase()).length - 1;
      expect(repeats, "the exact phrase isn't repeated over and over").toBeLessThanOrEqual(4);
    },
  );

  it("gives every article its own phrase and its own title", () => {
    const phrases = parsed.map((p) => p.article?.searchPhrase?.toLowerCase()).filter(Boolean);
    expect(new Set(phrases).size).toBe(phrases.length);
    const titles = parsed.map((p) => p.article?.title.toLowerCase()).filter(Boolean);
    expect(new Set(titles).size).toBe(titles.length);
  });
});
