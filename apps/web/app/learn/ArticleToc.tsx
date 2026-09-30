import type { OutlineItem } from "../../lib/article-outline";

/**
 * "On this page" (MVP-027 slice 3): links to the article's h2 and h3
 * headings, built by lib/article-outline.ts from the same parse that renders
 * them. A plain navigation list: above the article on small screens, a
 * sticky left column on wide ones -- one copy in the page either way. Left
 * out when there are fewer than two headings, where it would add nothing.
 */
export function ArticleToc({ items }: { items: readonly OutlineItem[] }) {
  if (items.length < 2) return null;
  return (
    <nav
      aria-labelledby="toc_label"
      className="rounded-xl border border-border bg-card p-4 lg:sticky lg:top-6 lg:border-0 lg:bg-transparent lg:p-0"
    >
      <p
        id="toc_label"
        className="font-mono text-xs font-medium tracking-wide text-muted-foreground uppercase"
      >
        On this page
      </p>
      <ol className="mt-2 space-y-0.5 text-sm">
        {items.map((item) => (
          <li key={item.id} className={item.level === 3 ? "pl-4" : undefined}>
            <a
              href={`#${item.id}`}
              className="inline-flex min-h-8 items-center py-1 text-muted-foreground no-underline hover:text-foreground hover:underline"
            >
              {item.text}
            </a>
          </li>
        ))}
      </ol>
    </nav>
  );
}
