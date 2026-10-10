import Link from "next/link";
import type { ReactNode } from "react";

/**
 * The parts every admin list shares (MVP-052 phase 2; docs/final-decisions.md,
 * 2026-10-10, "Admin centre: concept A with B's Inbox"): a status pill, a
 * search box with status tabs, and a list whose rows line up in columns on
 * wide screens and stack on a phone. Everything works without JavaScript: the
 * search is a GET form and the tabs are links that keep the search.
 */

const STATUS_LOOK = {
  Published: "bg-[#dcfce7] text-[#166534]",
  Draft: "bg-[#fef3c7] text-[#92400e]",
  Scheduled: "bg-[#ede9fe] text-[#5b21b6]",
  Suspended: "bg-[#fee2e2] text-[#b91c1c]",
  Archived: "bg-[#e2e8f0] text-[#334155]",
} as const;

export type StatusLabel = keyof typeof STATUS_LOOK;

export function StatusPill({ status }: { status: StatusLabel }) {
  return (
    <span
      className={`inline-flex w-fit items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold ${STATUS_LOOK[status]}`}
    >
      <span aria-hidden="true" className="size-1.5 rounded-full bg-current" />
      {status}
    </span>
  );
}

/** A small pill link for a row's actions (Preview, Edit, View). */
export const ROW_LINK =
  "inline-flex min-h-11 items-center rounded-full border border-border bg-card px-4 text-sm font-semibold text-foreground no-underline hover:border-foreground";

export interface ListTab {
  key: string;
  label: string;
  count: number;
}

/** A query string for this list with `changes` applied; empty values are dropped. */
export function listHref(
  path: string,
  current: Record<string, string | undefined>,
  changes: Record<string, string | undefined>,
): string {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries({ ...current, ...changes }))
    if (value) params.set(key, value);
  const query = params.toString();
  return query ? `${path}?${query}` : path;
}

/**
 * The search box, any extra filters (`children`, such as a technology choice),
 * and the status tabs. The tabs keep the search and filters; searching keeps
 * the tab.
 */
export function ListToolbar({
  path,
  noun,
  query,
  status,
  filters = {},
  tabs,
  children,
}: {
  path: string;
  /** What is listed, for the search box's name: "guides". */
  noun: string;
  query: string;
  status: string;
  /** The other filters in force, kept by the tabs and the search. */
  filters?: Record<string, string | undefined>;
  tabs: readonly ListTab[];
  children?: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-3">
      <form role="search" method="get" action={path} className="flex flex-wrap items-center gap-2">
        <label className="flex min-h-11 min-w-0 flex-1 basis-60 items-center gap-2 rounded-full border border-border bg-card px-4 focus-within:border-foreground">
          <svg
            viewBox="0 0 24 24"
            aria-hidden="true"
            className="size-4 shrink-0 text-muted-foreground"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
          >
            <path d="M10.5 4.5a6 6 0 1 1 0 12 6 6 0 0 1 0-12zM15 15l5 5" />
          </svg>
          <span className="sr-only">Search {noun}</span>
          <input
            type="search"
            name="q"
            defaultValue={query}
            placeholder={`Search ${noun}`}
            className="min-w-0 flex-1 border-0 bg-transparent p-0 text-base outline-none"
          />
        </label>
        {status !== "all" ? <input type="hidden" name="status" value={status} /> : null}
        {children}
        <button
          type="submit"
          className="inline-flex min-h-11 items-center rounded-full bg-foreground px-5 font-semibold text-background"
        >
          Search
        </button>
      </form>
      <nav
        aria-label="Status"
        className="flex w-fit max-w-full flex-wrap rounded-2xl bg-muted p-1 text-sm font-semibold sm:rounded-full"
      >
        {tabs.map((tab) => (
          <Link
            key={tab.key}
            href={listHref(
              path,
              { q: query || undefined, ...filters },
              { status: tab.key === "all" ? undefined : tab.key },
            )}
            aria-current={status === tab.key ? "page" : undefined}
            className={`inline-flex min-h-10 items-center gap-1.5 rounded-full px-4 no-underline ${
              status === tab.key
                ? "bg-card text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {tab.label}
            <span className="text-xs font-normal">{tab.count}</span>
          </Link>
        ))}
      </nav>
    </div>
  );
}

/**
 * The list itself: column headings on wide screens (hidden from screen
 * readers, which hear each row as one item), the rows, or `empty` when none
 * match. `columns` is the grid template both use.
 */
export function ListFrame({
  headings,
  columns,
  empty,
  children,
}: {
  headings: readonly string[];
  columns: string;
  empty: ReactNode;
  children: ReactNode[];
}) {
  return (
    <div className="overflow-hidden rounded-[1.5rem] border border-border bg-card">
      <div
        aria-hidden="true"
        className={`hidden gap-4 border-b border-border bg-muted/60 px-5 py-3 text-xs font-semibold tracking-wide text-muted-foreground uppercase md:grid ${columns}`}
      >
        {headings.map((heading, index) => (
          <span key={heading} className={index === headings.length - 1 ? "text-right" : ""}>
            {heading}
          </span>
        ))}
      </div>
      {children.length === 0 ? (
        <div className="px-5 py-10 text-center text-muted-foreground">{empty}</div>
      ) : (
        <ul>{children}</ul>
      )}
    </div>
  );
}

/** One row: stacked on a phone, the frame's columns from md. */
export function ListRow({ columns, children }: { columns: string; children: ReactNode }) {
  return (
    <li
      className={`flex flex-col gap-2 border-b border-border px-5 py-4 last:border-0 hover:bg-muted/30 md:grid md:items-center md:gap-4 ${columns}`}
    >
      {children}
    </li>
  );
}

/** A row's actions, right-aligned from md. */
export function RowActions({ children }: { children: ReactNode }) {
  return <div className="flex flex-wrap items-center gap-2 md:justify-end">{children}</div>;
}
