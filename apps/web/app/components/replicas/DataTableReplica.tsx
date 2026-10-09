"use client";

import { useId, useRef, useState, type CSSProperties, type KeyboardEvent } from "react";
import { useNotify } from "./notify";
import { cssColor, fromPowerFx, SEGOE, type ReplicaApi, type Wiring } from "./replica";

/**
 * A web replica of lcsDataTable (MVP-049; docs/final-decisions.md, 2026-10-09,
 * "Data table: our own, on a gallery"), 960 by 560 as its YAML lays it out,
 * on a screen whose colOrders holds ten made-up orders and whose Rows formula
 * sorts them by the component's SortColumn, as the guide shows. Selecting a
 * row, the row menu and the bulk buttons run the screen's Notify formulas.
 */

export interface DataRow {
  Id: string;
  C1: string;
  C2: string;
  C3: string;
  C4: string;
  C5: string;
  C6: string;
}

type Kind = "Text" | "Strong" | "Badge" | "Progress";
interface Column {
  Label: string;
  Width: number;
  Kind: Kind;
}

/** The component's default Columns. */
const COLUMNS: readonly Column[] = [
  { Label: "Order", Width: 110, Kind: "Strong" },
  { Label: "Customer", Width: 200, Kind: "Text" },
  { Label: "Status", Width: 140, Kind: "Badge" },
  { Label: "Progress", Width: 190, Kind: "Progress" },
  { Label: "Due", Width: 110, Kind: "Text" },
  { Label: "Priority", Width: 110, Kind: "Badge" },
];

/** The component's default BadgeStyles (fill, ink). */
const BADGE_STYLES: Record<string, [string, string]> = {
  "in progress": ["#dbeafe", "#1e40af"],
  completed: ["#dcfce7", "#166534"],
  "on hold": ["#fef3c7", "#92400e"],
  "not started": ["#f3f4f6", "#4b5563"],
  high: ["#fee2e2", "#991b1b"],
  medium: ["#fef3c7", "#92400e"],
  low: ["#dcfce7", "#166534"],
};

interface Order {
  number: number;
  customer: string;
  status: string;
  done: number;
  total: number;
  /** Day of March 2026. */
  due: number;
  priority: string;
}

/** The screen's colOrders: made-up orders. */
const ORDERS: readonly Order[] = [
  {
    number: 1001,
    customer: "Avery Brooks",
    status: "In progress",
    done: 2,
    total: 4,
    due: 3,
    priority: "High",
  },
  {
    number: 1002,
    customer: "Jordan Lee",
    status: "Completed",
    done: 5,
    total: 5,
    due: 5,
    priority: "Medium",
  },
  {
    number: 1003,
    customer: "Priya Nair",
    status: "On hold",
    done: 1,
    total: 3,
    due: 9,
    priority: "Low",
  },
  {
    number: 1004,
    customer: "Mateo Alvarez",
    status: "Not started",
    done: 0,
    total: 4,
    due: 12,
    priority: "High",
  },
  {
    number: 1005,
    customer: "Chloé Martin",
    status: "In progress",
    done: 3,
    total: 5,
    due: 14,
    priority: "Medium",
  },
  {
    number: 1006,
    customer: "Kenji Watanabe",
    status: "Completed",
    done: 4,
    total: 4,
    due: 16,
    priority: "Low",
  },
  {
    number: 1007,
    customer: "Amara Okafor",
    status: "In progress",
    done: 1,
    total: 4,
    due: 18,
    priority: "High",
  },
  {
    number: 1008,
    customer: "Liam Walsh",
    status: "Not started",
    done: 0,
    total: 3,
    due: 20,
    priority: "Medium",
  },
  {
    number: 1009,
    customer: "Noah Fischer",
    status: "On hold",
    done: 2,
    total: 5,
    due: 22,
    priority: "Low",
  },
  {
    number: 1010,
    customer: "Sam Rivera",
    status: "In progress",
    done: 4,
    total: 5,
    due: 24,
    priority: "Medium",
  },
];

const PRIORITY_ORDER: Record<string, number> = { High: 0, Medium: 1, Low: 2 };

/** The screen's Rows formula: colOrders sorted by SortColumn, then turned into text columns. */
export function rowsFor(sortColumn: number, descending: boolean): DataRow[] {
  const key = (order: Order): string | number => {
    switch (sortColumn) {
      case 1:
        return order.number;
      case 2:
        return order.customer;
      case 3:
        return order.status;
      case 4:
        return order.done / order.total;
      case 5:
        return order.due;
      case 6:
        return PRIORITY_ORDER[order.priority] ?? 9;
      default:
        return order.number;
    }
  };
  const sorted = [...ORDERS].sort((a, b) => {
    const [x, y] = [key(a), key(b)];
    const order = typeof x === "number" ? x - (y as number) : x.localeCompare(y as string);
    return sortColumn > 0 && descending ? -order : order;
  });
  return sorted.map((order) => ({
    Id: String(order.number),
    C1: `#${order.number}`,
    C2: order.customer,
    C3: order.status,
    C4: `${order.done}/${order.total}`,
    C5: `Mar ${order.due}`,
    C6: order.priority,
  }));
}

/** A Progress cell's "2/4": segments done and in all, at most ten. */
export function progressParts(text: string): { done: number; total: number } {
  const [done, total] = text.split("/").map((part) => Number(part.trim()));
  return {
    done: Number.isFinite(done) ? Math.max(0, done!) : 0,
    total: Math.max(1, Math.min(10, Number.isFinite(total) ? total! : 1)),
  };
}

/** A Badge pill's colours from BadgeStyles, grey for text with no style. */
export function badgeColours(text: string, dark: boolean): [string, string] {
  return (
    BADGE_STYLES[text.trim().toLowerCase()] ??
    (dark ? ["#3d3d3d", "#e6e6e6"] : ["#f3f4f6", "#4b5563"])
  );
}

const cellOf = (row: DataRow, column: number) =>
  (row as unknown as Record<string, string>)[`C${column}`] ?? "";

interface Inputs {
  View: string;
  ShowViewToggle: boolean;
  TitleColumn: number;
  SubtitleColumn: number;
  Sortable: boolean;
  Selectable: boolean;
  BulkActions: string;
  RowActions: string;
  Density: string;
  Loading: boolean;
  EmptyTitle: string;
  EmptyText: string;
  Empty: boolean;
  AccentColor: string;
  Theme: string;
}

const DEFAULTS: Inputs = {
  View: "Table",
  ShowViewToggle: true,
  TitleColumn: 2,
  SubtitleColumn: 1,
  Sortable: true,
  Selectable: true,
  BulkActions: "",
  RowActions: "View,Edit,Delete",
  Density: "Comfortable",
  Loading: false,
  EmptyTitle: "No items found",
  EmptyText: "Try changing your search or filters.",
  Empty: false,
  AccentColor: "#0f6cbd",
  Theme: "Light",
};

const VIEWS = ["Table", "Cards", "List"] as const;
const split = (text: string) =>
  text
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean)
    .slice(0, 3);

function Pill({ text, dark, maxWidth }: { text: string; dark: boolean; maxWidth?: number }) {
  if (!text) return null;
  const [fill, ink] = badgeColours(text, dark);
  return (
    <span
      style={{ backgroundColor: fill, color: ink, maxWidth }}
      className="inline-flex h-[26px] shrink-0 items-center truncate rounded-full px-2.5 text-xs font-semibold"
    >
      {text}
    </span>
  );
}

function Progress({ text, dark }: { text: string; dark: boolean }) {
  const { done, total } = progressParts(text);
  return (
    <span className="flex min-w-0 items-center gap-2">
      <span className="flex h-2 min-w-0 flex-1 gap-[3px]" aria-hidden="true">
        {Array.from({ length: total }, (_, index) => (
          <span
            key={index}
            className="h-2 flex-1 rounded-[3px]"
            style={{
              backgroundColor: index < done ? "var(--accent)" : dark ? "#4a4a4a" : "#e2e8f0",
            }}
          />
        ))}
      </span>
      <span className={`w-10 shrink-0 text-xs ${dark ? "text-[#adadad]" : "text-[#616161]"}`}>
        {text}
      </span>
    </span>
  );
}

export function useDataTableReplica(): ReplicaApi {
  const id = useId();
  const notify = useNotify();
  const [inputs, setInputs] = useState<Inputs>(DEFAULTS);
  const [chosenView, setChosenView] = useState<string | null>(null);
  const [sortColumn, setSortColumn] = useState(0);
  const [descending, setDescending] = useState(false);
  const [selected, setSelected] = useState<string[]>([]);
  const [menuRow, setMenuRow] = useState<string | null>(null);
  const tabRefs = useRef<Array<HTMLButtonElement | null>>([]);

  const dark = inputs.Theme === "Dark";
  const view = chosenView ?? (VIEWS.includes(inputs.View as never) ? inputs.View : "Table");
  const rows = inputs.Empty ? [] : rowsFor(sortColumn, descending);
  const actions = split(inputs.RowActions);
  const bulk = split(inputs.BulkActions);
  const bulkOn = inputs.Selectable && bulk.length > 0;
  const showToolbar = inputs.ShowViewToggle || bulkOn;
  const rowHeight = inputs.Density === "Compact" ? 44 : 60;
  const title = (row: DataRow) => cellOf(row, inputs.TitleColumn);
  const subtitle = (row: DataRow) => cellOf(row, inputs.SubtitleColumn);
  const badgeColumns = COLUMNS.map((column, index) => ({ column, n: index + 1 })).filter(
    ({ column }) => column.Kind === "Badge",
  );
  const progressColumn = COLUMNS.findIndex((column) => column.Kind === "Progress") + 1;
  const metaColumn =
    COLUMNS.findIndex(
      (column, index) =>
        column.Kind === "Text" &&
        index + 1 !== inputs.TitleColumn &&
        index + 1 !== inputs.SubtitleColumn,
    ) + 1;
  const isSelected = (row: DataRow) => selected.includes(row.Id);
  const allSelected = rows.length > 0 && rows.every(isSelected);

  const ink = dark ? "text-white" : "text-[#242424]";
  const sub = dark ? "text-[#adadad]" : "text-[#616161]";
  const line = dark ? "border-[#424242]" : "border-[#e5e7eb]";
  const hover = dark ? "hover:bg-white/[0.06]" : "hover:bg-black/[0.035]";
  const subtle = dark
    ? "text-white hover:bg-white/10 active:bg-white/15"
    : "text-[#242424] hover:bg-[#f5f5f5] active:bg-[#e0e0e0]";
  const selectedFill = dark
    ? "bg-[color-mix(in_srgb,var(--accent)_30%,#242424)]"
    : "bg-[color-mix(in_srgb,var(--accent)_10%,white)]";

  const toggle = (row: DataRow) =>
    setSelected((current) =>
      current.includes(row.Id) ? current.filter((idOf) => idOf !== row.Id) : [...current, row.Id],
    );
  const open = (row: DataRow) => notify(`Open order ${row.C1}`);
  const act = (action: string, row: DataRow) => {
    setMenuRow(null);
    notify(`${action} order ${row.C1}`);
  };
  const sortBy = (column: number) => {
    const nextDescending = sortColumn === column ? !descending : false;
    setSortColumn(column);
    setDescending(nextDescending);
  };
  const chooseView = (next: string) => {
    setChosenView(next);
    setMenuRow(null);
  };
  const onTabKey = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
    const step = event.key === "ArrowRight" ? 1 : event.key === "ArrowLeft" ? -1 : 0;
    if (!step) return;
    event.preventDefault();
    const next = (index + step + VIEWS.length) % VIEWS.length;
    tabRefs.current[next]?.focus();
    chooseView(VIEWS[next]!);
  };

  const checkbox = (row: DataRow, className = "") =>
    inputs.Selectable ? (
      <input
        type="checkbox"
        aria-label={`Select ${title(row)}`}
        checked={isSelected(row)}
        onChange={() => toggle(row)}
        className={`z-10 size-6 accent-[var(--accent)] ${className || "relative"}`}
      />
    ) : null;

  const wiring: Wiring[] = [
    {
      control: "Screen1",
      property: "OnVisible",
      formula: `ClearCollect(colOrders, ${ORDERS.map(
        (order) =>
          `{OrderNumber: ${order.number}, Customer: "${order.customer}", Status: "${order.status}", StepsDone: ${order.done}, StepsTotal: ${order.total}, DueDate: Date(2026, 3, ${order.due}), Priority: "${order.priority}"}`,
      ).join(", ")})`,
    },
    {
      control: "lcsDataTable_1",
      property: "Rows",
      formula:
        'ForAll(Switch(lcsDataTable_1.SortColumn, 2, SortByColumns(colOrders, Customer, If(lcsDataTable_1.SortDescending, SortOrder.Descending, SortOrder.Ascending)), 5, SortByColumns(colOrders, DueDate, If(lcsDataTable_1.SortDescending, SortOrder.Descending, SortOrder.Ascending)), colOrders), {Id: Text(OrderNumber), C1: "#" & OrderNumber, C2: Customer, C3: Status, C4: StepsDone & "/" & StepsTotal, C5: Text(DueDate, "mmm d"), C6: Priority})',
    },
    {
      control: "lcsDataTable_1",
      property: "OnRowSelect",
      formula: 'Notify("Open order #" & RowId)',
    },
    {
      control: "lcsDataTable_1",
      property: "OnRowAction",
      formula: 'Notify(Action & " order #" & RowId)',
    },
    ...(bulkOn
      ? [
          {
            control: "lcsDataTable_1",
            property: "OnBulkAction",
            formula: 'Notify(Action & ": " & RowIds)',
          },
        ]
      : []),
  ];

  const toolbar = showToolbar ? (
    <div className="flex min-h-14 shrink-0 flex-wrap items-center justify-between gap-2 px-1 py-2">
      {bulkOn ? (
        <div className="flex flex-wrap items-center gap-2">
          <span className="w-32 text-sm font-semibold">
            {selected.length === 0 ? "Select rows" : `${selected.length} selected`}
          </span>
          {bulk.map((action, index) => (
            <button
              key={action}
              type="button"
              disabled={selected.length === 0}
              aria-label={`${action}, ${selected.length} selected`}
              onClick={() => notify(`${action}: ${selected.join(";")}`)}
              className={`h-9 w-[104px] rounded border text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-50 ${
                index === 0
                  ? "border-transparent bg-[var(--accent)] text-white"
                  : dark
                    ? "border-[#666] bg-[#292929] text-white"
                    : "border-[#d1d1d1] bg-white text-[#242424]"
              }`}
            >
              {action}
            </button>
          ))}
          {selected.length > 0 ? (
            <button
              type="button"
              onClick={() => setSelected([])}
              className={`h-9 rounded px-3 text-[13px] font-semibold ${subtle}`}
            >
              Clear selection
            </button>
          ) : null}
        </div>
      ) : (
        <span />
      )}
      {inputs.ShowViewToggle ? (
        <div role="tablist" aria-label="View" className="flex gap-1">
          {VIEWS.map((option, index) => {
            const on = option === view;
            return (
              <button
                key={option}
                ref={(element) => {
                  tabRefs.current[index] = element;
                }}
                type="button"
                role="tab"
                aria-selected={on}
                tabIndex={on ? 0 : -1}
                onKeyDown={(event) => onTabKey(event, index)}
                onClick={() => chooseView(option)}
                className={`h-10 rounded-md px-4 text-sm ${
                  on
                    ? `font-semibold ${dark ? "bg-white/10 text-white" : "bg-[#ebf3fc] text-[var(--accent)]"}`
                    : `${sub} ${dark ? "hover:bg-white/5" : "hover:bg-[#f5f5f5]"}`
                }`}
              >
                {option}
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  ) : null;

  let body;
  if (inputs.Loading) {
    body = (
      <ul aria-label="Loading" className="flex-1 overflow-hidden pt-2">
        {Array.from({ length: 6 }, (_, index) => (
          <li key={index} className="flex items-center" style={{ height: rowHeight }}>
            {COLUMNS.map((column, columnIndex) => (
              <span key={column.Label} className="px-3" style={{ width: column.Width }}>
                <span
                  className={`block h-3 rounded-sm motion-safe:animate-pulse ${dark ? "bg-[#3d3d3d]" : "bg-[#ebebeb]"}`}
                  style={{ width: `${(index + columnIndex + 1) % 3 === 0 ? 55 : 85}%` }}
                />
              </span>
            ))}
          </li>
        ))}
      </ul>
    );
  } else if (rows.length === 0) {
    body = (
      <div className="grid flex-1 place-items-center text-center">
        <div>
          <svg
            viewBox="0 0 24 24"
            aria-hidden="true"
            className="mx-auto size-12"
            fill="none"
            stroke="#9ca3af"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <path d="M14 2v6h6M9 15h6" />
          </svg>
          <p className="mt-3 text-base font-semibold">{inputs.EmptyTitle}</p>
          <p className={`mt-1 text-[13px] ${sub}`}>{inputs.EmptyText}</p>
        </div>
      </div>
    );
  } else if (view === "Cards") {
    body = (
      <ul
        aria-label="Cards"
        tabIndex={0}
        className="grid flex-1 grid-cols-[repeat(auto-fill,minmax(16rem,1fr))] content-start overflow-y-auto p-1"
      >
        {rows.map((row) => {
          const firstBadge = badgeColumns[0] ? cellOf(row, badgeColumns[0].n) : "";
          const secondBadge = badgeColumns[1] ? cellOf(row, badgeColumns[1].n) : "";
          return (
            <li key={row.Id} className="h-[220px] p-2">
              <div
                className={`relative flex h-full flex-col rounded-xl border p-4 shadow-[0_2px_8px_-4px_rgb(0_0_0/0.15)] motion-safe:transition-shadow motion-safe:duration-200 hover:shadow-[0_10px_24px_-12px_rgb(0_0_0/0.3)] ${line} ${
                  isSelected(row) ? selectedFill : dark ? "bg-[#242424]" : "bg-white"
                }`}
              >
                <button
                  type="button"
                  aria-label={title(row)}
                  onClick={() => open(row)}
                  className={`absolute inset-0 rounded-xl ${hover}`}
                />
                <div className="pointer-events-none relative flex items-start justify-between gap-2">
                  <span className={`truncate text-xs ${sub}`}>{subtitle(row)}</span>
                </div>
                <p className="pointer-events-none relative mt-1 line-clamp-2 text-base font-semibold">
                  {title(row)}
                </p>
                <p className="pointer-events-none relative mt-3 flex gap-2">
                  <Pill text={firstBadge} dark={dark} maxWidth={120} />
                  <Pill text={secondBadge} dark={dark} maxWidth={100} />
                </p>
                {progressColumn > 0 ? (
                  <div className="pointer-events-none relative mt-4">
                    <Progress text={cellOf(row, progressColumn)} dark={dark} />
                  </div>
                ) : null}
                {metaColumn > 0 ? (
                  <p className={`pointer-events-none relative mt-2 text-[13px] ${sub}`}>
                    {COLUMNS[metaColumn - 1]!.Label}: {cellOf(row, metaColumn)}
                  </p>
                ) : null}
                <div className="relative mt-auto flex gap-1">
                  {actions.map((action) => (
                    <button
                      key={action}
                      type="button"
                      aria-label={`${action} ${title(row)}`}
                      onClick={() => act(action, row)}
                      className={`h-8 rounded px-3 text-[13px] ${subtle}`}
                    >
                      {action}
                    </button>
                  ))}
                </div>
                {checkbox(row, "absolute top-4 right-4")}
              </div>
            </li>
          );
        })}
      </ul>
    );
  } else if (view === "List") {
    body = (
      <ul aria-label="List" tabIndex={0} className="flex-1 overflow-y-auto">
        {rows.map((row) => {
          const firstBadge = badgeColumns[0] ? cellOf(row, badgeColumns[0].n) : "";
          const secondBadge = badgeColumns[1] ? cellOf(row, badgeColumns[1].n) : "";
          const [fill, inkColour] = badgeColours(firstBadge, dark);
          return (
            <li
              key={row.Id}
              className={`relative flex h-[76px] items-center gap-4 border-b px-4 ${line} ${isSelected(row) ? selectedFill : ""}`}
            >
              {checkbox(row)}
              <button
                type="button"
                aria-label={title(row)}
                onClick={() => open(row)}
                className={`absolute inset-y-0 right-0 ${inputs.Selectable ? "left-12" : "left-0"} ${hover}`}
              />
              <span
                aria-hidden="true"
                style={{ backgroundColor: fill, color: inkColour }}
                className="pointer-events-none relative grid size-11 shrink-0 place-items-center rounded-xl text-base font-semibold"
              >
                {title(row).trim().charAt(0).toUpperCase()}
              </span>
              <span className="pointer-events-none relative min-w-0 flex-1">
                <span className="block truncate text-[15px] font-semibold">{title(row)}</span>
                <span className={`block truncate text-xs ${sub}`}>{subtitle(row)}</span>
              </span>
              <span className="pointer-events-none relative hidden gap-2 sm:flex">
                <Pill text={firstBadge} dark={dark} maxWidth={110} />
                <Pill text={secondBadge} dark={dark} maxWidth={90} />
              </span>
              <svg
                viewBox="0 0 24 24"
                aria-hidden="true"
                className="pointer-events-none relative size-5 shrink-0"
                fill="none"
                stroke="#9ca3af"
                strokeWidth="2"
                strokeLinecap="round"
              >
                <path d="M9 6l6 6-6 6" />
              </svg>
            </li>
          );
        })}
      </ul>
    );
  } else {
    body = (
      <div
        tabIndex={0}
        aria-label="Table"
        role="group"
        className="flex min-h-0 flex-1 flex-col overflow-auto"
      >
        <div
          className={`flex h-11 w-max min-w-full shrink-0 items-center border-b ${line} ${dark ? "bg-[#2e2e2e]" : "bg-[#f9fafb]"}`}
        >
          <span className="flex w-12 shrink-0 justify-center">
            {inputs.Selectable ? (
              <input
                type="checkbox"
                aria-label="Select all rows"
                checked={allSelected}
                onChange={() =>
                  setSelected(
                    allSelected ? [] : [...new Set([...selected, ...rows.map((row) => row.Id)])],
                  )
                }
                className="size-6 accent-[var(--accent)]"
              />
            ) : null}
          </span>
          {COLUMNS.map((column, index) => {
            const n = index + 1;
            const sorted = sortColumn === n;
            return inputs.Sortable ? (
              <button
                key={column.Label}
                type="button"
                style={{ width: column.Width }}
                aria-label={`${column.Label}, sort${sorted ? (descending ? ", sorted descending" : ", sorted ascending") : ""}`}
                onClick={() => sortBy(n)}
                className={`h-11 shrink-0 rounded px-3 text-left text-[13px] font-semibold ${sub} ${dark ? "hover:bg-white/5" : "hover:bg-black/5"}`}
              >
                {column.Label}
                {sorted ? (descending ? " ↓" : " ↑") : ""}
              </button>
            ) : (
              <span
                key={column.Label}
                style={{ width: column.Width }}
                className={`shrink-0 px-3 text-[13px] font-semibold ${sub}`}
              >
                {column.Label}
              </span>
            );
          })}
        </div>
        <ul aria-label="Rows" className="w-max min-w-full">
          {rows.map((row) => {
            const open_ = menuRow === row.Id;
            return (
              <li
                key={row.Id}
                style={{ height: rowHeight }}
                className={`relative flex items-center border-b ${line} ${isSelected(row) ? selectedFill : ""}`}
              >
                <span className="flex w-12 shrink-0 justify-center">{checkbox(row)}</span>
                <button
                  type="button"
                  aria-label={title(row)}
                  onClick={() => open(row)}
                  className={`absolute inset-y-0 ${inputs.Selectable ? "left-12" : "left-0"} ${actions.length ? "right-[52px]" : "right-0"} ${hover}`}
                />
                {COLUMNS.map((column, index) => {
                  const text = cellOf(row, index + 1);
                  return (
                    <span
                      key={column.Label}
                      style={{ width: column.Width }}
                      className={`pointer-events-none relative shrink-0 truncate px-3 text-sm ${column.Kind === "Strong" ? "font-semibold" : ""}`}
                    >
                      {column.Kind === "Badge" ? (
                        <Pill text={text} dark={dark} maxWidth={column.Width - 24} />
                      ) : column.Kind === "Progress" ? (
                        <Progress text={text} dark={dark} />
                      ) : (
                        text
                      )}
                    </span>
                  );
                })}
                {actions.length ? (
                  <span className="relative ml-auto flex shrink-0 items-center gap-1 pr-2">
                    {open_ ? (
                      <span
                        className={`flex gap-1 rounded-[10px] border p-1 shadow-[0_8px_20px_-10px_rgb(0_0_0/0.35)] motion-safe:animate-[lcs-screen-in_160ms_ease-out] ${line} ${dark ? "bg-[#242424]" : "bg-white"}`}
                      >
                        {actions.map((action) => (
                          <button
                            key={action}
                            type="button"
                            aria-label={`${action} ${title(row)}`}
                            onClick={() => act(action, row)}
                            className={`h-8 w-20 rounded text-[13px] ${subtle}`}
                          >
                            {action}
                          </button>
                        ))}
                      </span>
                    ) : null}
                    <button
                      type="button"
                      aria-label={`${open_ ? "Close the menu for" : "Actions for"} ${title(row)}`}
                      aria-expanded={open_}
                      onClick={() => setMenuRow(open_ ? null : row.Id)}
                      className={`grid size-9 place-items-center rounded ${subtle}`}
                    >
                      <svg
                        viewBox="0 0 24 24"
                        aria-hidden="true"
                        className="size-5"
                        fill="currentColor"
                      >
                        {open_ ? (
                          <path d="M6.4 5 5 6.4 10.6 12 5 17.6 6.4 19l5.6-5.6 5.6 5.6 1.4-1.4-5.6-5.6L19 6.4 17.6 5 12 10.6z" />
                        ) : (
                          <>
                            <circle cx="5" cy="12" r="1.8" />
                            <circle cx="12" cy="12" r="1.8" />
                            <circle cx="19" cy="12" r="1.8" />
                          </>
                        )}
                      </svg>
                    </button>
                  </span>
                ) : null}
              </li>
            );
          })}
        </ul>
      </div>
    );
  }

  return {
    screen: (
      <div
        id={id}
        style={{ "--accent": inputs.AccentColor } as CSSProperties}
        className={`flex h-[560px] w-[960px] max-w-full flex-col overflow-hidden rounded-md text-left ${SEGOE} ${ink} ${dark ? "bg-[#242424]" : "bg-white"}`}
      >
        {toolbar}
        {body}
      </div>
    ),
    apply: (settings) => {
      const next = { ...DEFAULTS };
      for (const [key, formula] of Object.entries(settings)) {
        if (key === "AccentColor") next.AccentColor = cssColor(formula, DEFAULTS.AccentColor);
        else if (key === "Rows") next.Empty = /FirstN\(.*,\s*0\)\s*$/.test(formula.trim());
        else if (key in next)
          (next as unknown as Record<string, unknown>)[key] = fromPowerFx(formula);
      }
      setInputs(next);
      setChosenView(null);
      setSortColumn(0);
      setDescending(false);
      setSelected([]);
      setMenuRow(null);
    },
    dark,
    wiring,
  };
}
