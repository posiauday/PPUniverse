import ReactMarkdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";

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
 * precedent for heading order).
 * Code blocks and tables can be wider than a phone screen, so each scrolls
 * inside its own keyboard-focusable, labelled region rather than widening
 * the page (WCAG 1.4.10 reflow, 2.1.1 keyboard).
 */
const components: Components = {
  h1: (props) => <h2 className="mt-8 text-xl font-semibold" {...stripNode(props)} />,
  h2: (props) => <h2 className="mt-8 text-xl font-semibold" {...stripNode(props)} />,
  h3: (props) => <h3 className="mt-6 text-lg font-semibold" {...stripNode(props)} />,
  h4: (props) => <h4 className="mt-5 font-semibold" {...stripNode(props)} />,
  h5: (props) => <h5 className="mt-4 font-semibold" {...stripNode(props)} />,
  h6: (props) => <h6 className="mt-4 font-semibold" {...stripNode(props)} />,
  p: (props) => <p className="mt-4" {...stripNode(props)} />,
  ul: (props) => <ul className="mt-4 list-disc pl-6" {...stripNode(props)} />,
  ol: (props) => <ol className="mt-4 list-decimal pl-6" {...stripNode(props)} />,
  a: (props) => <a className="underline" {...stripNode(props)} />,
  pre: (props) => (
    <pre
      tabIndex={0}
      aria-label="Code example, scrollable"
      className="mt-4 overflow-x-auto rounded-card border border-border p-4 text-sm"
      {...stripNode(props)}
    />
  ),
  table: (props) => (
    <div role="region" aria-label="Table, scrollable" tabIndex={0} className="mt-4 overflow-x-auto">
      <table className="border-collapse text-sm" {...stripNode(props)} />
    </div>
  ),
};

/** react-markdown passes its syntax-tree `node` to every component; it must
 * not be forwarded to a DOM element. */
function stripNode<T extends { node?: unknown }>(props: T): Omit<T, "node"> {
  const { node: _node, ...rest } = props;
  return rest;
}

export function ArticleBody({ markdown }: { markdown: string }) {
  return (
    <div className="mt-6">
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
        {markdown}
      </ReactMarkdown>
    </div>
  );
}
