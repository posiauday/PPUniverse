import ReactMarkdown, { type Components } from "react-markdown";

/**
 * The quick-answer card in a guide's header (the G1 board, MVP-038 part):
 * a guide's optional `> [!ANSWER] Title` block, usually a short numbered
 * list whose items link to the sections that explain them. Rendered by
 * react-markdown with no raw HTML, the same single rule as ArticleBody.
 */
const components: Components = {
  ol: ({ node: _node, ...props }) => (
    <ol className="mt-3 flex list-none flex-col gap-2.5 [counter-reset:qa]" {...props} />
  ),
  ul: ({ node: _node, ...props }) => (
    <ul className="mt-3 flex list-disc flex-col gap-2 pl-5" {...props} />
  ),
  li: ({ node: _node, ...props }) => (
    <li
      className="relative rounded-2xl bg-card px-4 py-3 pl-14 text-[0.9375rem] leading-snug [counter-increment:qa] before:absolute before:top-3 before:left-4 before:grid before:h-7 before:w-7 before:place-items-center before:rounded-full before:bg-primary before:font-display before:text-sm before:font-bold before:text-primary-foreground before:content-[counter(qa)]"
      {...props}
    />
  ),
  p: ({ node: _node, ...props }) => <p className="mt-2 first:mt-0" {...props} />,
  a: ({ node: _node, ...props }) => (
    <a className="font-semibold text-foreground underline underline-offset-4" {...props} />
  ),
  strong: ({ node: _node, ...props }) => <strong className="font-semibold" {...props} />,
};

export function QuickAnswer({ title, markdown }: { title: string; markdown: string }) {
  return (
    <aside
      aria-labelledby="quick_answer"
      className="rounded-[1.75rem] border border-card/90 bg-card/55 p-5.5 shadow-[0_30px_60px_-40px_rgb(30_58_138/0.6)]"
    >
      <h2 id="quick_answer" className="font-display text-[1.375rem] font-bold">
        {title}
      </h2>
      <ReactMarkdown components={components}>{markdown}</ReactMarkdown>
    </aside>
  );
}
