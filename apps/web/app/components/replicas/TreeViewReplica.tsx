"use client";

import { useState, type CSSProperties, type ReactNode } from "react";
import { useNotify } from "./notify";
import { cssColor, fromPowerFx, SEGOE, type ReplicaApi, type Wiring } from "./replica";

/**
 * A web replica of lcsTreeView (MVP-049; docs/final-decisions.md, 2026-10-08,
 * "One live view"), as its YAML lays it out, on a screen wired the way its
 * guide says: Nodes from colNodes, and OnExpand loading Archive's children the
 * first time it opens.
 */

export interface TreeNode {
  Key: string;
  ParentKey: string;
  Label: string;
  Icon: string;
  HasChildren: boolean;
}

/** The screen's colNodes, as Screen1.OnVisible collects them: the component's default Nodes. */
export const NODES: readonly TreeNode[] = [
  { Key: "docs", ParentKey: "", Label: "Documents", Icon: "Folder", HasChildren: true },
  { Key: "plans", ParentKey: "docs", Label: "Plans", Icon: "Folder", HasChildren: true },
  { Key: "q3", ParentKey: "plans", Label: "Q3 plan.docx", Icon: "Document", HasChildren: false },
  { Key: "q4", ParentKey: "plans", Label: "Q4 plan.docx", Icon: "Document", HasChildren: false },
  { Key: "budget", ParentKey: "docs", Label: "Budget.xlsx", Icon: "Document", HasChildren: false },
  { Key: "images", ParentKey: "", Label: "Images", Icon: "Folder", HasChildren: true },
  { Key: "logo", ParentKey: "images", Label: "Logo.png", Icon: "Document", HasChildren: false },
  { Key: "archive", ParentKey: "", Label: "Archive", Icon: "Folder", HasChildren: true },
];

/** What OnExpand collects the first time Archive opens. */
const ARCHIVE: readonly TreeNode[] = [
  { Key: "a2025", ParentKey: "archive", Label: "2025", Icon: "Folder", HasChildren: false },
  { Key: "a2024", ParentKey: "archive", Label: "2024", Icon: "Folder", HasChildren: false },
];

const LEVELS = 5;

export interface TreeRow {
  Key: string;
  Label: string;
  Icon: string;
  HasKids: boolean;
  /** How many children it has in Nodes now. */
  Kids: number;
  Depth: number;
  Path: string;
}

/**
 * The gallery's rows, as its Items formula works them out: the top level, then
 * level by level the children of open nodes, up to five levels, sorted by a path
 * of three-digit places so each child sits under its parent.
 */
export function visibleRows(nodes: readonly TreeNode[], open: ReadonlySet<string>): TreeRow[] {
  const childrenOf = (key: string) => nodes.filter((node) => node.ParentKey === key);
  const toRow = (node: TreeNode, depth: number, path: string): TreeRow => ({
    Key: node.Key,
    Label: node.Label,
    Icon: node.Icon,
    HasKids: node.HasChildren || childrenOf(node.Key).length > 0,
    Kids: childrenOf(node.Key).length,
    Depth: depth,
    Path: path,
  });
  const place = (index: number) => String(index + 1).padStart(3, "0");
  let level = nodes
    .filter((node) => node.ParentKey === "")
    .map((node, index) => toRow(node, 0, place(index)));
  const all = [...level];
  for (let depth = 1; depth < LEVELS; depth++) {
    level = level
      .filter((parent) => open.has(parent.Key))
      .flatMap((parent) =>
        childrenOf(parent.Key).map((node, index) => toRow(node, depth, parent.Path + place(index))),
      );
    all.push(...level);
  }
  return all.sort((a, b) => (a.Path < b.Path ? -1 : a.Path > b.Path ? 1 : 0));
}

const GLYPHS: Record<string, ReactNode> = {
  Folder: <path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />,
  Document: (
    <>
      <path d="M7 3h7l5 5v12a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1z" />
      <path d="M14 3v5h5" />
    </>
  ),
  ChevronRight: <path d="M9 6l6 6-6 6" />,
  ChevronDown: <path d="M6 9l6 6 6-6" />,
};

/** IconStyle.Filled draws the shape solid; Outline draws its line. Chevrons are 16 pixels, nodes 18. */
function Glyph({
  name,
  filled = false,
  small = false,
}: {
  name: string;
  filled?: boolean;
  small?: boolean;
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className={`${small ? "size-4" : "size-[18px]"} shrink-0`}
      fill={filled ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth={filled ? 1.4 : 1.7}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {GLYPHS[name] ?? null}
    </svg>
  );
}

interface Inputs {
  Empty: boolean;
  Title: string;
  ShowTitle: boolean;
  ShowCounts: boolean;
  ShowGuides: boolean;
  Look: string;
  DefaultExpandedKeys: string;
  CurrentKey: string;
  ShowIcons: boolean;
  IndentSize: number;
  TreeLabel: string;
  ExpandText: string;
  CollapseText: string;
  LevelText: string;
  EmptyText: string;
  AccentColor: string;
  Theme: string;
}

const DEFAULTS: Inputs = {
  Empty: false,
  Title: "Files",
  ShowTitle: true,
  ShowCounts: true,
  ShowGuides: true,
  Look: "Standard",
  DefaultExpandedKeys: "docs",
  CurrentKey: "",
  ShowIcons: true,
  IndentSize: 20,
  TreeLabel: "Folders",
  ExpandText: "Expand",
  CollapseText: "Collapse",
  LevelText: "level",
  EmptyText: "Nothing here yet",
  AccentColor: "#0f6cbd",
  Theme: "Light",
};

const keysOf = (text: string) =>
  text
    .split(",")
    .map((key) => key.trim())
    .filter(Boolean);

const NODE_RECORD = (node: TreeNode) =>
  `{Key: "${node.Key}", ParentKey: "${node.ParentKey}", Label: "${node.Label}", Icon: "${node.Icon}", HasChildren: ${node.HasChildren}}`;

export function useTreeViewReplica(): ReplicaApi {
  const notify = useNotify();
  const [inputs, setInputs] = useState<Inputs>(DEFAULTS);
  // colNodes on the screen; locExpanded and locSelected inside the component.
  const [nodes, setNodes] = useState<readonly TreeNode[]>(NODES);
  const [openChoice, setOpenChoice] = useState<string[] | null>(null);
  const [selected, setSelected] = useState<string | null>(null);

  const dark = inputs.Theme === "Dark";
  const premium = inputs.Look === "Premium";
  const open = openChoice ?? keysOf(inputs.DefaultExpandedKeys);
  const openSet = new Set(open);
  const shown = inputs.Empty ? [] : nodes;
  const rows = visibleRows(shown, openSet);
  const current = inputs.CurrentKey || selected;

  const ink = dark ? "text-white" : "text-[#242424]";
  const sub = dark ? "text-[#adadad]" : "text-[#616161]";
  const currentInk = dark ? "text-white" : "text-[color-mix(in_srgb,var(--accent)_75%,black)]";
  const tint = dark
    ? "bg-[color-mix(in_srgb,var(--accent)_45%,#242424)]"
    : "bg-[color-mix(in_srgb,var(--accent)_14%,white)]";
  // The classic buttons' HoverFill in the YAML: 8% white on dark, 5% black on light.
  const hover = dark ? "hover:bg-white/[0.08]" : "hover:bg-black/[0.05]";

  const toggle = (row: TreeRow) => {
    if (openSet.has(row.Key)) {
      setOpenChoice(open.filter((key) => key !== row.Key));
      return;
    }
    setOpenChoice([...open, row.Key]);
    // The screen's OnExpand: Archive's children, collected the first time it opens.
    if (row.Key === "archive" && !nodes.some((node) => node.ParentKey === "archive")) {
      setNodes([...nodes, ...ARCHIVE]);
    }
  };
  const choose = (row: TreeRow) => {
    setSelected(row.Key);
    notify(`Open ${row.Label}`);
  };

  const wiring: Wiring[] = [
    {
      control: "Screen1",
      property: "OnVisible",
      formula: `ClearCollect(colNodes, ${NODES.map(NODE_RECORD).join(", ")})`,
    },
    { control: "lcsTreeView_1", property: "Nodes", formula: "colNodes" },
    {
      control: "lcsTreeView_1",
      property: "OnNodeSelect",
      formula: 'Notify("Open " & LookUp(colNodes, Key = NodeKey).Label)',
    },
    {
      control: "lcsTreeView_1",
      property: "OnExpand",
      formula: `If(NodeKey = "archive" && IsEmpty(Filter(colNodes, ParentKey = "archive")), Collect(colNodes, ${ARCHIVE.map(NODE_RECORD).join(", ")}))`,
    },
    { control: "Label1", property: "Text", formula: '"Open: " & lcsTreeView_1.ExpandedKeys' },
  ];

  return {
    screen: (
      <div
        style={{ "--accent": inputs.AccentColor } as CSSProperties}
        className={`w-[320px] max-w-full text-left ${SEGOE} ${ink}`}
      >
        <div
          className={`flex h-[400px] flex-col overflow-hidden rounded-xl border ${
            dark ? "border-[#424242] bg-[#202020]" : "border-[#e5e7eb] bg-white"
          } ${premium ? "m-2 shadow-[0_10px_30px_-12px_rgba(16,24,40,0.4)]" : ""}`}
        >
          {inputs.ShowTitle ? (
            <p className="shrink-0 px-4 pt-3.5 pb-3 text-[15px] leading-6 font-semibold">
              {inputs.Title}
            </p>
          ) : (
            <span className="h-2 shrink-0" />
          )}
          {rows.length === 0 && shown.length === 0 ? (
            <p className={`pt-6 text-center text-[13px] ${sub}`}>{inputs.EmptyText}</p>
          ) : (
            <ul aria-label={inputs.TreeLabel} className="flex-1 overflow-y-auto px-2 pb-2">
              {rows.map((row) => {
                const isOpen = openSet.has(row.Key);
                const isCurrent = row.Key === current;
                const pill = isCurrent && premium;
                const indent = 4 + row.Depth * inputs.IndentSize;
                const action = `${isOpen ? inputs.CollapseText : inputs.ExpandText} ${row.Label}`;
                const iconInk = pill
                  ? "text-white"
                  : row.Icon === "Folder"
                    ? dark
                      ? "text-[#fbbf24]"
                      : "text-[#d97706]"
                    : dark
                      ? "text-[color-mix(in_srgb,var(--accent)_55%,white)]"
                      : "text-[var(--accent)]";
                const showCount = inputs.ShowCounts && row.Kids > 0;
                return (
                  <li key={row.Key} className="relative h-9">
                    {inputs.ShowGuides
                      ? Array.from({ length: Math.min(row.Depth, LEVELS - 1) }, (_, level) => (
                          <span
                            key={level}
                            aria-hidden="true"
                            className={`absolute inset-y-0 w-px ${dark ? "bg-[#424242]" : "bg-[#e2e8f0]"}`}
                            style={{ left: 4 + level * inputs.IndentSize + 13 }}
                          />
                        ))
                      : null}
                    {isCurrent ? (
                      <span
                        aria-hidden="true"
                        className={`absolute inset-y-0.5 right-0.5 rounded-lg ${pill ? "bg-[var(--accent)]" : tint}`}
                        style={{ left: indent + 26 }}
                      />
                    ) : null}
                    {row.HasKids ? (
                      <button
                        type="button"
                        aria-label={action}
                        title={action}
                        onClick={() => toggle(row)}
                        style={{ left: indent }}
                        className={`absolute top-1 grid size-7 place-items-center rounded-md ${sub} ${hover}`}
                      >
                        <Glyph name={isOpen ? "ChevronDown" : "ChevronRight"} small />
                      </button>
                    ) : null}
                    <button
                      type="button"
                      aria-label={`${row.Label}, ${inputs.LevelText} ${row.Depth + 1}${row.Kids > 0 ? `, ${row.Kids}` : ""}`}
                      onClick={() => choose(row)}
                      style={{ left: indent + 26, right: 2 }}
                      className={`absolute top-0.5 bottom-0.5 flex items-center gap-2 rounded-lg pr-2 pl-1.5 text-left text-[13px] ${
                        pill
                          ? "font-semibold text-white"
                          : isCurrent
                            ? `${currentInk} font-semibold`
                            : `${ink} ${hover}`
                      }`}
                    >
                      {inputs.ShowIcons ? (
                        <span className={iconInk}>
                          <Glyph name={row.Icon} filled={isCurrent || row.Icon === "Folder"} />
                        </span>
                      ) : null}
                      <span className="min-w-0 flex-1 truncate">{row.Label}</span>
                      {showCount ? (
                        <span
                          aria-hidden="true"
                          className={`text-[11px] font-normal ${pill ? "text-white" : sub}`}
                        >
                          {row.Kids}
                        </span>
                      ) : null}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
        {/* Label1: the component's ExpandedKeys output. */}
        <p className={`mt-3 text-[13px] ${sub}`}>Open: {open.join(",")}</p>
      </div>
    ),
    apply: (settings) => {
      const next = { ...DEFAULTS };
      for (const [key, formula] of Object.entries(settings)) {
        if (key === "AccentColor") next.AccentColor = cssColor(formula, DEFAULTS.AccentColor);
        else if (key === "Nodes") next.Empty = true;
        else if (key in next)
          (next as unknown as Record<string, unknown>)[key] = fromPowerFx(formula);
      }
      setInputs(next);
      setNodes(NODES);
      setOpenChoice(null);
      setSelected(null);
    },
    dark,
    wiring,
  };
}
