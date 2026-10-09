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
  { Key: "logo", ParentKey: "images", Label: "Logo.png", Icon: "Image", HasChildren: false },
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
  FolderOpen: (
    <path d="M3 17V7a2 2 0 0 1 2-2h4l2 2h6a2 2 0 0 1 2 2v1M3 17l2.6-6.2A1.5 1.5 0 0 1 7 10h13.2a1 1 0 0 1 .9 1.4L18.6 18a1.5 1.5 0 0 1-1.4 1H5a2 2 0 0 1-2-2z" />
  ),
  Document: (
    <>
      <path d="M7 3h7l5 5v12a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1z" />
      <path d="M14 3v5h5" />
    </>
  ),
  Image: (
    <>
      <rect x="3.5" y="4.5" width="17" height="15" rx="2" />
      <circle cx="9" cy="10" r="1.6" />
      <path d="M20 16l-5-5-8 8" />
    </>
  ),
  ChevronRight: <path d="M9 6l6 6-6 6" />,
  ChevronDown: <path d="M6 9l6 6 6-6" />,
};

function Glyph({ name, filled = false }: { name: string; filled?: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className="size-5 shrink-0"
      fill={filled ? "currentColor" : "none"}
      fillOpacity={filled ? 0.18 : 0}
      stroke="currentColor"
      strokeWidth={filled ? 2 : 1.7}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {GLYPHS[name] ?? null}
    </svg>
  );
}

interface Inputs {
  Empty: boolean;
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
  const hover = dark ? "hover:bg-white/[0.06]" : "hover:bg-black/[0.04]";

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
          className={`h-[400px] overflow-hidden rounded-md ${dark ? "bg-[#242424] ring-1 ring-white/10" : "bg-white ring-1 ring-black/10"}`}
        >
          {rows.length === 0 && shown.length === 0 ? (
            <p className={`pt-4 text-center text-[13px] ${sub}`}>{inputs.EmptyText}</p>
          ) : (
            <ul aria-label={inputs.TreeLabel} className="h-full overflow-y-auto py-1">
              {rows.map((row) => {
                const isOpen = openSet.has(row.Key);
                const isCurrent = row.Key === current;
                const indent = 4 + row.Depth * inputs.IndentSize;
                const action = `${isOpen ? inputs.CollapseText : inputs.ExpandText} ${row.Label}`;
                const icon = row.Icon === "Folder" && isOpen ? "FolderOpen" : row.Icon;
                return (
                  <li key={row.Key} className="relative h-10">
                    {isCurrent ? (
                      <span
                        aria-hidden="true"
                        className={`absolute inset-x-1 inset-y-0.5 rounded-md ${tint}`}
                      />
                    ) : null}
                    {row.HasKids ? (
                      <button
                        type="button"
                        aria-label={action}
                        title={action}
                        onClick={() => toggle(row)}
                        style={{ left: indent }}
                        className={`absolute top-1 grid size-8 place-items-center rounded ${sub} ${hover}`}
                      >
                        <Glyph name={isOpen ? "ChevronDown" : "ChevronRight"} />
                      </button>
                    ) : null}
                    <button
                      type="button"
                      aria-label={`${row.Label}, ${inputs.LevelText} ${row.Depth + 1}`}
                      onClick={() => choose(row)}
                      style={{ left: indent + 34, right: 6 }}
                      className={`absolute top-0.5 bottom-0.5 flex items-center gap-2 rounded-md pl-1.5 text-sm ${
                        isCurrent ? `${currentInk} font-semibold` : `${ink} ${hover}`
                      }`}
                    >
                      {inputs.ShowIcons ? <Glyph name={icon} filled={isCurrent} /> : null}
                      <span className="truncate">{row.Label}</span>
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
