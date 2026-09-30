import type { Element, ElementContent } from "hast";
import ReactMarkdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";
import { remarkArticleStructure } from "../../lib/article-outline";
import { CopyCodeButton } from "./CopyCodeButton";

/**
 * Renders an article's Markdown source as real HTML structure -- headings,
 * lists, links, tables, code -- so readers and search engines see the
 * article's actual shape (TD-017; SEO story, docs/final-decisions.md).
 *
 * Safe without a sanitizer: react-markdown builds React elements from the
 * Markdown syntax tree and never renders raw HTML (no rehype-raw), so HTML
 * typed into the body shows as text and cannot execute. Its default URL
 * transform drops `javascript:` and other unsafe link protocols. No raw-HTML
 * sink is used anywhere here, so the no-raw-html guard
 * (lib/seo/no-raw-html.test.ts) still holds.
 *
 * Headings: the page's own title is the only h1, so a "#" in the body
 * becomes an h2, the same as "##" -- the level authors normally use for a
 * top section. Deeper levels keep their own number. Shifting every level
 * down by one instead would turn "##" into an h3 directly under the h1,
 * skipping a level (found by the accessibility gate; BUG-007 is the
 * precedent for heading order). Every heading carries an id from
 * lib/article-outline.ts, which the "On this page" list links to.
 *
 * Code blocks and tables can be wider than a phone screen, so each scrolls
 * inside its own keyboard-focusable, labelled region rather than widening
 * the page (WCAG 1.4.10 reflow, 2.1.1 keyboard). Code sits in the design
 * system's dark code panel in both themes, under a bar with its language and
 * a Copy button (MVP-027 slice 3). `> [!TIP]`, `> [!NOTE]` and `> [!WARNING]`
 * blockquotes render as labelled callouts.
 */
const components: Components = {
  h1: (props) => <h2 className="mt-10 scroll-mt-6 text-2xl font-semibold" {...stripNode(props)} />,
  h2: (props) => <h2 className="mt-10 scroll-mt-6 text-2xl font-semibold" {...stripNode(props)} />,
  h3: (props) => <h3 className="mt-8 scroll-mt-6 text-lg font-semibold" {...stripNode(props)} />,
  h4: (props) => <h4 className="mt-6 font-semibold" {...stripNode(props)} />,
  h5: (props) => <h5 className="mt-4 font-semibold" {...stripNode(props)} />,
  h6: (props) => <h6 className="mt-4 font-semibold" {...stripNode(props)} />,
  p: (props) => <p className="mt-4 leading-relaxed" {...stripNode(props)} />,
  ul: (props) => <ul className="mt-4 list-disc space-y-1 pl-6" {...stripNode(props)} />,
  ol: (props) => <ol className="mt-4 list-decimal space-y-1 pl-6" {...stripNode(props)} />,
  a: (props) => <a className="font-medium text-primary underline" {...stripNode(props)} />,
  blockquote: (props) => (
    <blockquote
      className="mt-4 border-l-4 border-border pl-4 text-muted-foreground"
      {...stripNode(props)}
    />
  ),
  div: ({ node: _node, children, ...rest }) => {
    const kind = (rest as Record<string, unknown>)["data-callout"];
    if (kind === "tip" || kind === "note" || kind === "warning") {
      return (
        <div role="note" className="mt-5 rounded-xl border border-border bg-muted px-4 py-3">
          <p className="font-mono text-xs font-medium tracking-wide text-primary uppercase">
            {CALLOUT_LABEL[kind]}
          </p>
          <div className="[&>p:first-child]:mt-1">{children}</div>
        </div>
      );
    }
    return <div {...rest}>{children}</div>;
  },
  pre: ({ node, ...props }) => {
    const code = node ? textOf(node) : "";
    const language = node ? languageOf(node) : null;
    return (
      <figure className="mt-5">
        <figcaption className="code-panel-bar flex min-h-10 items-center justify-between gap-3 rounded-t-card border border-b-0 border-code-border bg-code px-4 py-1.5 font-mono text-xs text-code-muted">
          <span>{language ?? "code"}</span>
          <CopyCodeButton code={code} />
        </figcaption>
        <pre
          tabIndex={0}
          aria-label="Code example, scrollable"
          className="overflow-x-auto rounded-b-card border border-code-border bg-code p-4 font-mono text-sm leading-relaxed text-code-foreground"
          {...props}
        />
      </figure>
    );
  },
  table: (props) => (
    <div role="region" aria-label="Table, scrollable" tabIndex={0} className="mt-5 overflow-x-auto">
      <table className="w-full border-collapse text-sm" {...stripNode(props)} />
    </div>
  ),
  th: (props) => (
    <th
      className="border-b border-border px-3 py-2 text-left font-semibold"
      {...stripNode(props)}
    />
  ),
  td: (props) => <td className="border-b border-border px-3 py-2" {...stripNode(props)} />,
};

const CALLOUT_LABEL = { tip: "Tip", note: "Note", warning: "Warning" } as const;

/** react-markdown passes its syntax-tree `node` to every component; it must
 * not be forwarded to a DOM element. */
function stripNode<T extends { node?: unknown }>(props: T): Omit<T, "node"> {
  const { node: _node, ...rest } = props;
  return rest;
}

/** The plain text of a code block, for the Copy button. */
function textOf(node: Element | ElementContent): string {
  if (node.type === "text") return node.value;
  if ("children" in node) return node.children.map((child) => textOf(child)).join("");
  return "";
}

/** "powerfx" from a fenced block's ```powerfx; only [a-z0-9+#-] is kept. */
function languageOf(pre: Element): string | null {
  const code = pre.children.find((child): child is Element => child.type === "element");
  const classes = code?.properties?.["className"];
  const list = Array.isArray(classes) ? classes : [];
  for (const entry of list) {
    const match = String(entry).match(/^language-([a-z0-9+#-]{1,24})$/i);
    if (match?.[1]) return match[1].toLowerCase();
  }
  return null;
}

export function ArticleBody({ markdown }: { markdown: string }) {
  return (
    <div className="text-[1.0625rem]">
      <ReactMarkdown remarkPlugins={[remarkGfm, remarkArticleStructure]} components={components}>
        {markdown}
      </ReactMarkdown>
    </div>
  );
}
