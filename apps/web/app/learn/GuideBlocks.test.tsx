import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { outlineOf } from "../../lib/article-outline";
import { textOf } from "../../lib/test-text";
import { ArticleBody } from "./ArticleBody";

const render = (markdown: string) => renderToStaticMarkup(<ArticleBody markdown={markdown} />);
const text = (html: string) => textOf(html).replace(/&#x27;/g, "'");

/** Slice 2 (MVP-041): the Markdown conventions behind the G2 and G3 blocks. */
describe("guide blocks", () => {
  it("draws [!SYMPTOMS] as a titled group of symptom cards", () => {
    const html = render(
      [
        "> [!SYMPTOMS] What does run history show?",
        "> - `500 · 502` [Fails sometimes, works on re-run](#step-1): Usually temporary.",
        "> - `429` [Too many requests](#step-2): That's throttling.",
      ].join("\n"),
    );
    expect(html).toContain('class="guide-symptoms');
    expect(html).toContain('aria-label="What does run history show?"');
    expect(html).toContain('href="#step-1"');
    expect(text(html)).not.toContain("[!SYMPTOMS]");
    expect(html.match(/<li>/g)).toHaveLength(2);
    // The ": " joining title and note doesn't start the note.
    expect(html).not.toContain("</a>:");
    expect(html).toContain("</a>Usually temporary.");
  });

  it("draws [!DIAGRAM] as ordered stops with a Pause box, and stays a quote without two stops", () => {
    const html = render(
      "> [!DIAGRAM] Where a trigger can stop\n> An item is created -> Flow is on? -> The run starts",
    );
    expect(html).toContain("<figcaption");
    expect(text(html)).toContain("Where a trigger can stop");
    expect(html).toContain("guide-stops-3");
    expect(html.match(/class="guide-stop"/g)).toHaveLength(3);
    expect(text(html)).toContain("Flow is on?");
    expect(html).toContain('type="checkbox"');
    expect(text(html)).toContain("Pause animation");

    const plain = render("> [!DIAGRAM] Lonely\n> Only one stop");
    expect(plain).toContain("<blockquote");
    expect(plain).not.toContain("guide-stop");
  });

  it("puts a Do next to a Don't, side by side", () => {
    const html = render(
      "> [!DO]\n> Respond once, after both scopes.\n\n> [!DONT]\n> Respond inside each scope.",
    );
    expect(html).toMatch(/<div class="mt-6 grid[^"]*">\s*<div role="note" class="guide-do/);
    expect(html).toContain('class="guide-dont');
    expect(text(html)).toContain("Don't");
  });

  it("turns the ### steps under Work through it into ticked steps with a count", () => {
    const markdown = [
      "Intro.",
      "",
      "## Work through it",
      "",
      "### Is it you or them?",
      "",
      "Check service health.",
      "",
      "### Let retries do their job",
      "",
      "Leave the retry policy on Default.",
      "",
      "## Sources",
      "",
      "- a",
    ].join("\n");
    const html = render(markdown);
    expect(html.match(/class="guide-step /g)).toHaveLength(2);
    expect(html.match(/type="checkbox"/g)).toHaveLength(2);
    expect(html).toContain('data-total="2"');
    expect(html).toContain(">Is it you or them?</h3>");
    // Each tick box is named for its step, for screen readers.
    expect(html).toContain(`aria-label="Done: Let retries do their job"`);
    // Sources stays outside the steps.
    expect(html.indexOf(">Sources</h2>")).toBeGreaterThan(html.indexOf('data-total="2"'));
    // The contents list still lists every heading, ids unchanged.
    expect(outlineOf(markdown).map((item) => item.id)).toEqual([
      "work-through-it",
      "is-it-you-or-them",
      "let-retries-do-their-job",
      "sources",
    ]);
    expect(html).toContain('id="let-retries-do-their-job"');
  });

  it("leaves a single step alone, and the old callouts unchanged", () => {
    const one = render("## Work through it\n\n### Only step\n\nText.");
    expect(one).not.toContain("guide-step");
    const tip = render("> [!TIP]\n> Still a tip.");
    expect(tip).toContain('role="note"');
    expect(text(tip)).toContain("Still a tip.");
  });
});
