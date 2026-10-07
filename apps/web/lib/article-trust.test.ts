import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { outlineOf } from "./article-outline";
import { readGuideTrust } from "./article-trust";

const GUIDE = `Intro paragraph.

> [!ANSWER] The usual three
> 1. [The flow is off](#is-the-flow-on): check its Status.
> 2. A trigger condition filtered it out.

## Body

> [!NOTE]
> Checked against Microsoft Learn on 6 October 2026.

> [!NOTE]
> A different note stays in the body.

## Sources

- [One](https://learn.microsoft.com/a)
- [Two](https://learn.microsoft.com/b)
* [Three](https://learn.microsoft.com/c)

## After

- not a source
`;

describe("readGuideTrust (guide frame, MVP-038 part)", () => {
  it("reads the checked-on date, the sources and the quick answer", () => {
    const trust = readGuideTrust(GUIDE);
    expect(trust.checkedOn?.toISOString()).toBe("2026-10-06T00:00:00.000Z");
    expect(trust.sourceCount).toBe(3);
    expect(trust.quickAnswer).toEqual({
      title: "The usual three",
      markdown:
        "1. [The flow is off](#is-the-flow-on): check its Status.\n2. A trigger condition filtered it out.",
    });
  });

  it("takes the checked-on note and the quick answer out of the body, and nothing else", () => {
    const { body } = readGuideTrust(GUIDE);
    expect(body).not.toContain("Checked against Microsoft Learn");
    expect(body).not.toContain("[!ANSWER]");
    expect(body).toContain("A different note stays in the body.");
    expect(body).toContain("## Sources");
    expect(body).toContain("Intro paragraph.");
  });

  it("claims no date when the guide states none, or an impossible one", () => {
    expect(readGuideTrust("Just text.\n\n## Sources\n\n- a").checkedOn).toBeNull();
    const bad = readGuideTrust(
      "> [!NOTE]\n> Checked against Microsoft Learn on 31 September 2026.",
    );
    expect(bad.checkedOn).toBeNull();
    expect(bad.body).toContain("31 September 2026");
  });

  it("reads the date from a note that says more, and keeps that note in the body", () => {
    const trust = readGuideTrust(
      "> [!NOTE]\n> Checked against Microsoft Learn on 6 October 2026. Prices change often.",
    );
    expect(trust.checkedOn?.toISOString()).toBe("2026-10-06T00:00:00.000Z");
    expect(trust.body).toContain("Prices change often.");
  });

  it("handles Windows line endings and a guide with no Sources heading", () => {
    const trust = readGuideTrust(GUIDE.replace(/\n/g, "\r\n"));
    expect(trust.checkedOn).not.toBeNull();
    expect(readGuideTrust("No sources here.").sourceCount).toBe(0);
  });

  it("reads every launch guide: each lists sources, and each dated note parses", () => {
    const root = join(__dirname, "..", "..", "..", "content", "articles");
    let dated = 0;
    for (const folder of readdirSync(root, { withFileTypes: true })) {
      if (!folder.isDirectory()) continue;
      for (const file of readdirSync(join(root, folder.name))) {
        if (!file.endsWith(".md")) continue;
        const text = readFileSync(join(root, folder.name, file), "utf8");
        const trust = readGuideTrust(text.replace(/^---[\s\S]*?\n---\r?\n/, ""));
        expect(trust.sourceCount, file).toBeGreaterThan(0);
        // Every quick-answer link points at a heading that exists in the guide.
        if (trust.quickAnswer) {
          const ids = new Set(outlineOf(trust.body).map((item) => item.id));
          for (const [, anchor] of trust.quickAnswer.markdown.matchAll(/\]\(#([^)]+)\)/g)) {
            expect(ids.has(anchor!), `${file}: #${anchor}`).toBe(true);
          }
        }
        if (/Checked against Microsoft Learn on/.test(text)) {
          expect(trust.checkedOn, file).not.toBeNull();
          dated += 1;
        }
      }
    }
    expect(dated).toBeGreaterThan(20);
  });
});
