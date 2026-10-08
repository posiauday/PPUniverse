import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { outlineOf } from "./article-outline";
import { readGuideTrust } from "./article-trust";

/**
 * Every launch guide's quick answer (MVP-046; docs/final-decisions.md,
 * "Top bar names, AI search readiness, and comments"): 2 to 4 short numbered
 * points, each linking to a heading that really exists in the same guide, so
 * a reader (or an AI tool quoting it) always lands on the full explanation.
 */
const ARTICLES = fileURLToPath(new URL("../../../content/articles/", import.meta.url));

function guides(): Array<{ file: string; body: string }> {
  return readdirSync(ARTICLES, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .flatMap((dir) =>
      readdirSync(join(ARTICLES, dir.name))
        .filter((name) => name.endsWith(".md"))
        .map((name) => {
          const raw = readFileSync(join(ARTICLES, dir.name, name), "utf8").replace(/\r\n/g, "\n");
          return { file: `${dir.name}/${name}`, body: raw.replace(/^---\n[\s\S]*?\n---\n/, "") };
        }),
    );
}

describe("launch guides' quick answers", () => {
  const all = guides();

  it("finds the launch guides", () => {
    expect(all.length).toBeGreaterThan(50);
  });

  it.each(all.map((guide) => [guide.file, guide.body] as const))(
    "%s has a quick answer of 2 to 4 points, each linking to a real heading",
    (_file, body) => {
      const answer = readGuideTrust(body).quickAnswer;
      expect(answer).not.toBeNull();
      const points = answer!.markdown.split("\n").filter((line) => /^\d+\. /.test(line));
      expect(points.length).toBeGreaterThanOrEqual(2);
      expect(points.length).toBeLessThanOrEqual(4);
      const ids = outlineOf(body).map((item) => item.id);
      const anchors = [...answer!.markdown.matchAll(/\]\(#([a-z0-9-]+)\)/g)].map(
        (match) => match[1],
      );
      expect(anchors.length).toBeGreaterThan(0);
      for (const anchor of anchors) expect(ids, `#${anchor}`).toContain(anchor);
    },
  );
});
