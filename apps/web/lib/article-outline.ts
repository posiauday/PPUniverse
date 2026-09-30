import type { Blockquote, Heading, Nodes, Paragraph, Root, Text } from "mdast";
import { toString } from "mdast-util-to-string";
import remarkGfm from "remark-gfm";
import remarkParse from "remark-parse";
import { unified } from "unified";

/**
 * Article structure (MVP-027 slice 3): heading anchors, the "On this page"
 * list, and callouts. The list and the rendered headings come from the SAME
 * Markdown parse (remark-parse + remark-gfm, exactly what ArticleBody's
 * react-markdown uses) and the same slug rules, in document order, so a
 * contents link always matches its heading's id.
 *
 * Ids are built only from [a-z0-9-], never from raw heading text, so author
 * text cannot inject anything into an attribute or a URL fragment.
 */

export interface OutlineItem {
  /** 2 or 3: body "#" and "##" both render as h2 (ArticleBody), "###" as h3. */
  level: 2 | 3;
  text: string;
  id: string;
}

/** Turns heading text into an id; repeats get -1, -2 ... like GitHub's anchors. */
export function createSlugger(): (text: string) => string {
  const seen = new Map<string, number>();
  return (text) => {
    const base =
      text
        .toLowerCase()
        .normalize("NFKD")
        .replace(/[^a-z0-9\s-]/g, "")
        .trim()
        .replace(/[\s-]+/g, "-")
        .replace(/^-|-$/g, "") || "section";
    const count = seen.get(base) ?? 0;
    seen.set(base, count + 1);
    return count === 0 ? base : `${base}-${count}`;
  };
}

/** The rendered level of a Markdown heading depth (see ArticleBody's mapping). */
function renderedLevel(depth: number): number {
  return depth <= 2 ? 2 : depth;
}

function walk(node: Nodes, visit: (node: Nodes) => void): void {
  visit(node);
  if ("children" in node) {
    for (const child of node.children) walk(child as Nodes, visit);
  }
}

export const CALLOUT_KINDS = ["tip", "note", "warning"] as const;
export type CalloutKind = (typeof CALLOUT_KINDS)[number];
const CALLOUT_MARKER = /^\[!(TIP|NOTE|WARNING)\]\s*/i;

/**
 * remark plugin used by ArticleBody:
 * - every heading gets an id (data.hProperties.id);
 * - a blockquote whose text starts with [!TIP], [!NOTE] or [!WARNING]
 *   (GitHub's alert syntax) becomes a callout: rendered as a div with
 *   data-callout, the marker text removed.
 */
export function remarkArticleStructure() {
  return (tree: Root) => {
    const slug = createSlugger();
    walk(tree, (node) => {
      if (node.type === "heading") {
        const heading = node as Heading;
        heading.data = {
          ...heading.data,
          hProperties: { ...heading.data?.hProperties, id: slug(toString(heading)) },
        };
      } else if (node.type === "blockquote") {
        markCallout(node as Blockquote);
      }
    });
  };
}

function markCallout(quote: Blockquote): void {
  const first = quote.children[0];
  if (first?.type !== "paragraph") return;
  const lead = (first as Paragraph).children[0];
  if (lead?.type !== "text") return;
  const match = (lead as Text).value.match(CALLOUT_MARKER);
  if (!match?.[1]) return;
  (lead as Text).value = (lead as Text).value.slice(match[0].length);
  quote.data = {
    ...quote.data,
    hName: "div",
    hProperties: { "data-callout": match[1].toLowerCase() },
  };
}

/** The "On this page" list: rendered h2 and h3 headings, in order, with their ids. */
export function outlineOf(markdown: string): OutlineItem[] {
  const tree = unified().use(remarkParse).use(remarkGfm).parse(markdown) as Root;
  const slug = createSlugger();
  const items: OutlineItem[] = [];
  walk(tree, (node) => {
    if (node.type !== "heading") return;
    const text = toString(node).trim();
    // The slugger must see every heading, in order, to match the rendered ids.
    const id = slug(toString(node));
    const level = renderedLevel((node as Heading).depth);
    if (text && (level === 2 || level === 3)) items.push({ level, text, id });
  });
  return items;
}

/** Whole minutes to read at about 200 words a minute; never less than 1. */
export function readingMinutes(markdown: string): number {
  const words = markdown.split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 200));
}
