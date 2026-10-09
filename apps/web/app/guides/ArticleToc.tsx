import type { ReactNode } from "react";
import type { OutlineItem } from "../../lib/article-outline";
import { TocSpy } from "./TocSpy";

/**
 * "On this page" (MVP-027 slice 3; Daylight look, MVP-031): links to the
 * article's h2 and h3 headings, built by lib/article-outline.ts from the same
 * parse that renders them. A plain navigation list: above the article on small
 * screens, in the left column on wide ones -- one copy in the page either
 * way. The column (StickyColumn) is what sticks, so anything placed under the
 * list, such as Copy link, moves with it instead of sliding under it
 * (BUG-026). Left out when there are fewer than two headings, where it would
 * add nothing. TocSpy marks the section being read (BUG-029).
 */
export function ArticleToc({ items }: { items: readonly OutlineItem[] }) {
  if (items.length < 2) return null;
  return (
    <nav
      aria-labelledby="toc_label"
      className="rounded-[1.25rem] border border-border bg-card p-5 lg:border-0 lg:bg-transparent lg:p-0"
    >
      <p
        id="toc_label"
        className="font-mono text-xs font-medium tracking-widest text-muted-foreground uppercase"
      >
        On this page
      </p>
      <TocSpy ids={items.map((item) => item.id)}>
        <ol className="mt-3 text-sm">
          {items.map((item) => (
            <li key={item.id}>
              <a
                href={`#${item.id}`}
                className={`flex min-h-10 items-center border-l-2 border-border py-1.5 pr-2 leading-snug text-muted-foreground no-underline hover:border-foreground hover:text-foreground aria-[current=location]:border-primary aria-[current=location]:font-semibold aria-[current=location]:text-foreground motion-safe:transition-colors ${item.level === 3 ? "pl-7" : "pl-4"}`}
              >
                {item.text}
              </a>
            </li>
          ))}
        </ol>
      </TocSpy>
    </nav>
  );
}

/**
 * The left column on wide screens: the contents list and anything under it
 * stick together below the header, scrolling on their own when they are
 * taller than the window (BUG-026: Copy link slid under the sticky list).
 */
export function StickyColumn({ children }: { children: ReactNode }) {
  return (
    <div className="lg:sticky lg:top-28 lg:max-h-[calc(100vh-8rem)] lg:self-start lg:overflow-y-auto lg:pr-1">
      {children}
    </div>
  );
}
