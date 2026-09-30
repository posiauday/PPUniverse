import type { SortOption } from "@ppu/domain-catalog";
import { cn } from "./cn.js";

const SORT_LABELS: Record<SortOption, string> = {
  relevance: "Relevance",
  recent: "Newest",
  alphabetical: "A–Z",
};

export interface SortLinksProps {
  /** Builds the full href for a given sort option (caller owns query-string construction, keeping this component URL-scheme-agnostic). */
  hrefFor: (sort: SortOption) => string;
  current: SortOption;
  /** Relevance only makes sense with an active search query. */
  includeRelevance: boolean;
}

/** Plain links, not a <select> — keyboard/screen-reader accessible by default, no client JS needed, and each option is its own crawlable, shareable URL. */
export function SortLinks({ hrefFor, current, includeRelevance }: SortLinksProps) {
  const options: SortOption[] = includeRelevance
    ? ["relevance", "recent", "alphabetical"]
    : ["recent", "alphabetical"];

  return (
    <nav aria-label="Sort products" className="flex items-center gap-3 text-sm">
      <span className="text-muted-foreground">Sort:</span>
      {options.map((option) => {
        const isCurrent = option === current;
        return (
          <a
            key={option}
            href={hrefFor(option)}
            aria-current={isCurrent ? "true" : undefined}
            className={cn(isCurrent ? "font-semibold text-foreground" : "text-muted-foreground")}
          >
            {SORT_LABELS[option]}
          </a>
        );
      })}
    </nav>
  );
}
