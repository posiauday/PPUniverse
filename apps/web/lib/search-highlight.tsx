import { SEARCH_MATCH_END, SEARCH_MATCH_START } from "@ppu/domain-content";
import type { ReactNode } from "react";

export interface MarkedSegment {
  text: string;
  match: boolean;
}

/**
 * Splits a search hit's marked text (see ArticleSearchHit) into plain and
 * matched runs. Text only: nothing is parsed as markup. An unpaired marker
 * is dropped rather than trusted.
 */
export function splitMarked(marked: string): MarkedSegment[] {
  const segments: MarkedSegment[] = [];
  let rest = marked;
  while (rest.length > 0) {
    const start = rest.indexOf(SEARCH_MATCH_START);
    const end = start === -1 ? -1 : rest.indexOf(SEARCH_MATCH_END, start + 1);
    if (start === -1 || end === -1) {
      segments.push({
        text: rest.replaceAll(SEARCH_MATCH_START, "").replaceAll(SEARCH_MATCH_END, ""),
        match: false,
      });
      break;
    }
    if (start > 0) {
      segments.push({ text: rest.slice(0, start).replaceAll(SEARCH_MATCH_END, ""), match: false });
    }
    segments.push({ text: rest.slice(start + 1, end), match: true });
    rest = rest.slice(end + 1);
  }
  return segments.filter((segment) => segment.text.length > 0);
}

/** Renders marked text with each match in a lime <mark>, as the search board draws it. */
export function Highlighted({ marked }: { marked: string }): ReactNode {
  return splitMarked(marked).map((segment, index) =>
    segment.match ? (
      <mark
        key={index}
        className="rounded-sm bg-highlight px-0.5 text-highlight-foreground [box-decoration-break:clone]"
      >
        {segment.text}
      </mark>
    ) : (
      segment.text
    ),
  );
}
