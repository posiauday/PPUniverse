import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { ArticleBody } from "./ArticleBody";

const render = (markdown: string) => renderToStaticMarkup(<ArticleBody markdown={markdown} />);

describe("ArticleBody", () => {
  it("renders Markdown as real structure, with no h1 and no skipped heading level", () => {
    const html = render("# Setup\n\n## Step one\n\n### Detail\n\nSome **bold** text.\n\n- a\n- b");
    expect(html).toContain(">Setup</h2>");
    expect(html).toContain(">Step one</h2>");
    expect(html).toContain(">Detail</h3>");
    expect(html).not.toContain("<h1");
    expect(html).toContain("<strong>bold</strong>");
    expect(html).toContain("<li>a</li>");
  });

  it("renders links as real, crawlable anchors", () => {
    const html = render(
      "See [the docs](https://learn.microsoft.com/power-apps/) and [a guide](/learn/other).",
    );
    expect(html).toContain('href="https://learn.microsoft.com/power-apps/"');
    expect(html).toContain('href="/learn/other"');
  });

  it("never renders raw HTML: script and event-handler markup stays inert text", () => {
    const html = render('<script>alert(1)</script>\n\n<img src=x onerror="alert(2)">');
    expect(html).not.toContain("<script");
    expect(html).not.toContain("<img");
    // Shown as escaped, visible text -- never as an element or attribute.
    expect(html).toContain("&lt;script&gt;");
    expect(html).toContain("&lt;img");
    expect(html).not.toMatch(/<[a-z]+[^>]*\sonerror=/i);
  });

  it("drops javascript: links", () => {
    const html = render("[click](javascript:alert(1))");
    expect(html).not.toContain("javascript:");
  });

  it("puts code blocks and tables in keyboard-focusable, labelled scroll regions", () => {
    const html = render("```\nSet(varX, 1)\n```\n\n| a | b |\n|---|---|\n| 1 | 2 |");
    expect(html).toMatch(/<pre[^>]*tabindex="0"[^>]*aria-label="Code example, scrollable"/);
    expect(html).toMatch(/<div role="region" aria-label="Table, scrollable" tabindex="0"/);
    expect(html).toContain("<table");
  });

  it("does not leak react-markdown's syntax-tree node prop into the DOM", () => {
    expect(render("# Title\n\nText")).not.toContain("node=");
  });
});
