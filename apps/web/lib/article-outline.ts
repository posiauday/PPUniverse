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
/**
 * The callout markers. TIP, NOTE and WARNING are GitHub's alert syntax
 * (MVP-027). The guide redesign adds (slice 2, MVP-041):
 * - SYMPTOMS: "> [!SYMPTOMS] Question" then a list of symptoms, each linking
 *   to the step that fixes it -- drawn as a grid of cards;
 * - DIAGRAM: "> [!DIAGRAM] Caption" then "A -> B -> C" -- drawn as stops that
 *   light up in turn, with a pause control;
 * - DO and DONT: side by side when one follows the other.
 * Anything the renderer doesn't recognise stays a plain blockquote, so the
 * Markdown still reads correctly anywhere.
 */
const CALLOUT_MARKER = /^\[!(TIP|NOTE|WARNING|SYMPTOMS|DIAGRAM|DO|DONT)\]\s*/i;

/** Between a diagram's stops in its data-stops attribute: a character no author types. */
export const STOP_SEPARATOR = String.fromCharCode(31);

/** Callouts whose marker line carries a title rather than content. */
const TITLED = new Set(["symptoms", "diagram"]);

/** The "Work through it" section (any heading level 2) that turns its ### steps into tick-off steps. */
const STEPS_HEADING = /^work through it$/i;

/**
 * remark plugin used by ArticleBody:
 * - every heading gets an id (data.hProperties.id);
 * - a blockquote whose text starts with a callout marker becomes a callout:
 *   rendered as a div with data-callout, the marker text removed;
 * - a DO callout next to a DONT one are wrapped as a pair;
 * - the ### steps under a "Work through it" heading become numbered steps
 *   with a tick box each, and a count of how many are ticked.
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
    pairDoAndDont(tree);
    wrapSteps(tree);
  };
}

function calloutKind(node: unknown): string | null {
  const data = (node as { data?: { hProperties?: Record<string, unknown> } }).data;
  const kind = data?.hProperties?.["data-callout"];
  return typeof kind === "string" ? kind : null;
}

function markCallout(quote: Blockquote): void {
  const first = quote.children[0];
  if (first?.type !== "paragraph") return;
  const lead = (first as Paragraph).children[0];
  if (lead?.type !== "text") return;
  const match = (lead as Text).value.match(CALLOUT_MARKER);
  if (!match?.[1]) return;
  const kind = match[1].toLowerCase();
  const properties: Record<string, string> = { "data-callout": kind };
  (lead as Text).value = (lead as Text).value.slice(match[0].length);

  if (TITLED.has(kind)) {
    // The rest of the marker's first line is the title; a diagram's stops
    // are the next line ("A -> B -> C").
    const text = toString(first);
    const [title = "", ...rest] = text.split(/\r?\n/);
    properties["data-title"] = title.trim();
    if (kind === "diagram") {
      const stops = rest
        .join(" ")
        .split("->")
        .map((stop) => stop.trim())
        .filter(Boolean)
        .slice(0, 8);
      if (stops.length < 2) return; // Not a diagram after all: leave the blockquote.
      properties["data-stops"] = stops.join(STOP_SEPARATOR);
      quote.children = [];
    } else {
      quote.children = quote.children.slice(1);
    }
  }
  quote.data = { ...quote.data, hName: "div", hProperties: properties };
}

type Parent = { children: Nodes[] };

/** A DO callout and a DONT callout, one right after the other, sit side by side. */
function pairDoAndDont(node: Nodes): void {
  if (!("children" in node)) return;
  const parent = node as unknown as Parent;
  for (let i = 0; i < parent.children.length - 1; i += 1) {
    const kinds = [calloutKind(parent.children[i]), calloutKind(parent.children[i + 1])];
    if (kinds.includes("do") && kinds.includes("dont")) {
      const pair = {
        type: "calloutPair",
        children: [parent.children[i], parent.children[i + 1]],
        data: { hName: "div", hProperties: { "data-callout": "pair" } },
      } as unknown as Nodes;
      parent.children.splice(i, 2, pair);
    }
  }
  // A pair is already done: going into it would pair its two cards again, forever.
  for (const child of parent.children) {
    if (calloutKind(child) !== "pair") pairDoAndDont(child);
  }
}

/**
 * Under a top-level "Work through it" heading, each ### heading starts a
 * step: the heading and what follows it, up to the next ### or ## heading.
 */
function wrapSteps(tree: Root): void {
  const children = tree.children as Nodes[];
  const start = children.findIndex(
    (node) =>
      node.type === "heading" &&
      (node as Heading).depth <= 2 &&
      STEPS_HEADING.test(toString(node).trim()),
  );
  if (start < 0) return;
  let end = children.length;
  for (let i = start + 1; i < children.length; i += 1) {
    const node = children[i]!;
    if (node.type === "heading" && (node as Heading).depth <= 2) {
      end = i;
      break;
    }
  }
  const section = children.slice(start + 1, end);
  const steps: Nodes[][] = [];
  const before: Nodes[] = [];
  for (const node of section) {
    if (node.type === "heading" && (node as Heading).depth === 3) steps.push([node]);
    else if (steps.length > 0) steps[steps.length - 1]!.push(node);
    else before.push(node);
  }
  if (steps.length < 2) return;
  const total = String(steps.length);
  const wrapped = {
    type: "guideSteps",
    data: { hName: "div", hProperties: { "data-steps": total } },
    children: [
      ...steps.map((nodes, index) => ({
        type: "guideStep",
        data: {
          hName: "section",
          hProperties: {
            "data-step": String(index + 1),
            "data-step-title": toString(nodes[0]!).trim(),
          },
        },
        children: nodes,
      })),
      {
        type: "guideStepsProgress",
        data: { hName: "p", hProperties: { "data-progress": total } },
        children: [],
      },
    ],
  } as unknown as Nodes;
  children.splice(start + 1, end - start - 1, ...before, wrapped);
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
