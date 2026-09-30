import { readdirSync, readFileSync } from "node:fs";
import { join, relative } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

/**
 * MVP-021 security guard. The JSON-LD component (packages/ui/src/json-ld.tsx) is
 * the ONLY place in the codebase allowed to insert raw HTML, and it does so only
 * from an escaped, typed JSON serialization. Any other raw-HTML sink appearing
 * anywhere in application or package source fails this test, so a future change
 * cannot quietly add a second one.
 */

const REPO_ROOT = fileURLToPath(new URL("../../../../", import.meta.url));
const SKIPPED_DIRECTORIES = new Set([
  "node_modules",
  "dist",
  ".next",
  ".turbo",
  "generated",
  "coverage",
]);
const ALLOWED = new Map([["packages/ui/src/json-ld.tsx", ["dangerouslySetInnerHTML"]]]);

const SINKS: Array<[string, RegExp]> = [
  ["dangerouslySetInnerHTML", /dangerouslySetInnerHTML/],
  ["innerHTML", /\.innerHTML\b|\binnerHTML\s*=/],
  ["insertAdjacentHTML", /insertAdjacentHTML/],
  ["document.write", /\bdocument\.write\s*\(/],
  ["eval", /\beval\s*\(/],
  ["new Function", /\bnew Function\s*\(/],
];

function sourceFiles(directory: string, found: string[] = []): string[] {
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      if (!SKIPPED_DIRECTORIES.has(entry.name)) sourceFiles(join(directory, entry.name), found);
    } else if (/\.(ts|tsx)$/.test(entry.name) && !/\.test\.|\.d\.ts$/.test(entry.name)) {
      found.push(join(directory, entry.name));
    }
  }
  return found;
}

describe("raw HTML sinks", () => {
  const files = [
    ...sourceFiles(join(REPO_ROOT, "apps")),
    ...sourceFiles(join(REPO_ROOT, "packages")),
  ];

  it("scans a meaningful set of files", () => {
    expect(files.length).toBeGreaterThan(50);
  });

  it("appear only in the audited JSON-LD component", () => {
    const violations: string[] = [];
    for (const file of files) {
      const path = relative(REPO_ROOT, file).split("\\").join("/");
      const text = readFileSync(file, "utf8");
      for (const [name, pattern] of SINKS) {
        if (pattern.test(text) && !(ALLOWED.get(path) ?? []).includes(name)) {
          violations.push(`${path}: ${name}`);
        }
      }
    }
    expect(violations).toEqual([]);
  });

  it("the audited component really does contain its one allowed sink", () => {
    const text = readFileSync(join(REPO_ROOT, "packages/ui/src/json-ld.tsx"), "utf8");
    expect(text).toMatch(/dangerouslySetInnerHTML/);
  });
});
