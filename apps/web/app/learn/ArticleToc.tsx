import type { OutlineItem } from "../../lib/article-outline";

/**
 * "On this page" (MVP-027 slice 3; Daylight look, MVP-031): links to the
 * article's h2 and h3 headings, built by lib/article-outline.ts from the same
 * parse that renders them. A plain navigation list: above the article on small
 * screens, a sticky left column on wide ones -- one copy in the page either
 * way. Left out when there are fewer than two headings, where it would add
 * nothing.
 */
export function ArticleToc({ items }: { items: readonly OutlineItem[] }) {
  if (items.length < 2) return null;
  return (
    <nav
      aria-labelledby="toc_label"
      className="rounded-[1.25rem] border border-border bg-card p-5 lg:sticky lg:top-28 lg:border-0 lg:bg-transparent lg:p-0"
    >
      <p
        id="toc_label"
        className="font-mono text-xs font-medium tracking-widest text-muted-foreground uppercase"
      >
        On this page
      </p>
      <ol className="mt-3 text-sm">
        {items.map((item) => (
          <li key={item.id}>
            <a
              href={`#${item.id}`}
              className={`flex min-h-10 items-center border-l-2 border-border py-1.5 pr-2 leading-snug text-muted-foreground no-underline hover:border-foreground hover:text-foreground ${item.level === 3 ? "pl-7" : "pl-4"}`}
            >
              {item.text}
            </a>
          </li>
        ))}
      </ol>
    </nav>
  );
}
