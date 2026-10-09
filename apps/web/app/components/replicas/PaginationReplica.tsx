"use client";

import { useState, type CSSProperties, type ReactNode } from "react";
import { useNotify } from "./notify";
import { cssColor, fromPowerFx, SEGOE, type ReplicaApi, type Wiring } from "./replica";

/**
 * A web replica of lcsPagination (MVP-049; docs/final-decisions.md, 2026-10-08,
 * "One live view"), as its YAML lays it out, under a gallery wired the way its
 * guide says: Items is LastN(FirstN(colOrders, LastRow), RowsOnPage), on a
 * screen whose colOrders holds 312 made-up orders.
 */

/** The screen's colOrders: ForAll(Sequence(312), {Title: "Order " & (1000 + Value)}). */
const ORDERS = 312;

interface Inputs {
  TotalItems: number;
  DefaultPageSize: number;
  PageSizes: string;
  DefaultPage: number;
  ItemLabel: string;
  ShowFirstLast: boolean;
  ShowSummary: boolean;
  ShowPageSize: boolean;
  Compact: boolean;
  AccentColor: string;
  Theme: string;
}

/** The inputs' defaults in the component's YAML, with TotalItems as the screen wires it. */
const DEFAULTS: Inputs = {
  TotalItems: ORDERS,
  DefaultPageSize: 10,
  PageSizes: "10,25,50",
  DefaultPage: 1,
  ItemLabel: "items",
  ShowFirstLast: true,
  ShowSummary: true,
  ShowPageSize: true,
  Compact: false,
  AccentColor: "#0f6cbd",
  Theme: "Light",
};

/** The seven page buttons, as the gallery's Items works them out: page numbers, 0 for an ellipsis. */
export function pageSlots(page: number, pages: number): number[] {
  if (pages <= 7) return Array.from({ length: pages }, (_, index) => index + 1);
  if (page <= 4) return [1, 2, 3, 4, 5, 0, pages];
  if (page >= pages - 3) return [1, 0, pages - 4, pages - 3, pages - 2, pages - 1, pages];
  return [1, 0, page - 1, page, page + 1, 0, pages];
}

/** The component's page arithmetic, from its outputs' formulas. */
export function paging(total: number, size: number, chosenPage: number) {
  const pageCount = Math.max(1, Math.ceil(total / size));
  const page = Math.max(1, Math.min(chosenPage, pageCount));
  const firstRow = total <= 0 ? 0 : (page - 1) * size + 1;
  const lastRow = Math.min(page * size, Math.max(0, total));
  const rowsOnPage = total <= 0 ? 0 : lastRow - (page - 1) * size;
  return { page, pageCount, firstRow, lastRow, rowsOnPage };
}

const thousands = (value: number) => value.toLocaleString("en-US");

/** lblSummary: "21–40 of 312 orders", or "No orders". */
export function summary(total: number, size: number, page: number, label: string): string {
  if (total <= 0) return `No ${label}`;
  const { firstRow, lastRow } = paging(total, size, page);
  return `${thousands(firstRow)}–${thousands(lastRow)} of ${thousands(total)} ${label}`;
}

const GLYPHS: Record<string, ReactNode> = {
  ArrowPrevious: <path d="M6 5v14M18 6l-7 6 7 6" />,
  ChevronLeft: <path d="M15 6l-6 6 6 6" />,
  ChevronRight: <path d="M9 6l6 6-6 6" />,
  ArrowNext: <path d="M18 5v14M6 6l7 6-7 6" />,
};

export function usePaginationReplica(): ReplicaApi {
  const notify = useNotify();
  const [inputs, setInputs] = useState<Inputs>(DEFAULTS);
  // locPage: blank until the user picks a page. chosenSize: the dropdown's choice, if any.
  const [chosenPage, setChosenPage] = useState<number | null>(null);
  const [chosenSize, setChosenSize] = useState<string | null>(null);

  const dark = inputs.Theme === "Dark";
  const sizes = inputs.PageSizes.split(",").map((entry) => entry.trim());
  const defaultChoice = sizes.includes(String(inputs.DefaultPageSize))
    ? String(inputs.DefaultPageSize)
    : "";
  const selected = chosenSize ?? defaultChoice;
  const size = Math.max(1, Number(selected) || inputs.DefaultPageSize);
  const { page, pageCount, lastRow, rowsOnPage } = paging(
    inputs.TotalItems,
    size,
    chosenPage ?? inputs.DefaultPage,
  );
  const rows = Array.from(
    { length: Math.max(0, rowsOnPage) },
    (_, index) => 1000 + lastRow - rowsOnPage + index + 1,
  );
  const ink = dark ? "text-white" : "text-[#242424]";
  const sub = dark ? "text-[#adadad]" : "text-[#616161]";
  const subtle = dark
    ? "text-white hover:bg-white/10 active:bg-white/15"
    : "text-[#242424] hover:bg-[#f5f5f5] active:bg-[#e0e0e0]";
  const off = dark ? "text-[#5c5c5c]" : "text-[#bdbdbd]";

  const go = (to: number, toSize = size) => {
    setChosenPage(to);
    notify(`Page ${to} of ${Math.max(1, Math.ceil(inputs.TotalItems / toSize))}`);
  };

  const arrow = (label: string, icon: string, atEdge: boolean, to: number) => (
    <button
      type="button"
      aria-label={label}
      title={label}
      disabled={atEdge}
      onClick={() => go(to)}
      className={`grid size-10 shrink-0 place-items-center rounded ${atEdge ? `${off} cursor-not-allowed` : subtle}`}
    >
      <svg
        viewBox="0 0 24 24"
        aria-hidden="true"
        className="size-5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        {GLYPHS[icon]}
      </svg>
    </button>
  );

  const wiring: Wiring[] = [
    {
      control: "Screen1",
      property: "OnVisible",
      formula: 'ClearCollect(colOrders, ForAll(Sequence(312), {Title: "Order " & (1000 + Value)}))',
    },
    ...(inputs.TotalItems === ORDERS
      ? [{ control: "lcsPagination_1", property: "TotalItems", formula: "CountRows(colOrders)" }]
      : []),
    {
      control: "Gallery1",
      property: "Items",
      formula: "LastN(FirstN(colOrders, lcsPagination_1.LastRow), lcsPagination_1.RowsOnPage)",
    },
    {
      control: "lcsPagination_1",
      property: "OnPageChange",
      formula: 'Notify("Page " & NewPage & " of " & lcsPagination_1.PageCount)',
    },
  ];

  return {
    screen: (
      <div
        style={{ "--accent": inputs.AccentColor } as CSSProperties}
        className={`w-[560px] max-w-full text-left text-sm ${SEGOE} ${ink}`}
      >
        {/* Gallery1: a fixed height, so a long page scrolls inside it, as a gallery does. */}
        <ul
          aria-label="Gallery1"
          // A gallery takes keyboard focus, so a long page can be scrolled with the arrow keys.
          tabIndex={0}
          className={`mb-4 max-h-[13.5rem] overflow-y-auto rounded-md border ${dark ? "border-[#424242]" : "border-[#e0e0e0]"}`}
        >
          {rows.map((order) => (
            <li
              key={order}
              className={`flex h-9 items-center border-b px-3 last:border-b-0 ${dark ? "border-[#333]" : "border-[#f0f0f0]"}`}
            >
              Order {order}
            </li>
          ))}
        </ul>

        <div className="overflow-x-auto">
          <div className="flex h-10 w-max items-center gap-1">
            {inputs.ShowFirstLast ? arrow("First page", "ArrowPrevious", page <= 1, 1) : null}
            {arrow("Previous page", "ChevronLeft", page <= 1, page - 1)}
            {inputs.Compact ? (
              <p className="w-[132px] text-center">
                Page {page} of {pageCount}
              </p>
            ) : (
              <ul aria-label="Pages" className="flex">
                {pageSlots(page, pageCount).map((slot, index) => {
                  const current = slot === page;
                  return (
                    <li key={index}>
                      <button
                        type="button"
                        disabled={slot === 0}
                        aria-label={
                          slot === 0
                            ? "More pages"
                            : `Page ${slot}${current ? ", current page" : ""}`
                        }
                        aria-current={current ? "page" : undefined}
                        onClick={() => go(slot)}
                        className={`size-10 rounded font-semibold ${
                          current
                            ? "bg-[var(--accent)] text-white hover:bg-[color-mix(in_srgb,var(--accent)_86%,black)]"
                            : slot === 0
                              ? `${sub} cursor-default`
                              : subtle
                        }`}
                      >
                        {slot === 0 ? "…" : slot}
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
            {arrow("Next page", "ChevronRight", page >= pageCount, page + 1)}
            {inputs.ShowFirstLast
              ? arrow("Last page", "ArrowNext", page >= pageCount, pageCount)
              : null}
          </div>
        </div>

        {inputs.ShowSummary || inputs.ShowPageSize ? (
          <div className="mt-2 flex min-h-10 flex-wrap items-center justify-between gap-x-4 gap-y-1">
            <p className={`pl-1 text-[13px] ${sub}`}>
              {inputs.ShowSummary ? summary(inputs.TotalItems, size, page, inputs.ItemLabel) : null}
            </p>
            {inputs.ShowPageSize ? (
              <span className="flex items-center gap-2">
                <span className={`text-[13px] ${sub}`} aria-hidden="true">
                  Rows per page
                </span>
                <select
                  aria-label="Rows per page"
                  value={selected}
                  onChange={(event) => {
                    const next = Math.max(1, Number(event.target.value) || inputs.DefaultPageSize);
                    setChosenSize(event.target.value);
                    go(1, next);
                  }}
                  className={`h-10 w-[92px] rounded-md border px-2 ${
                    dark
                      ? "border-[#666] bg-[#292929] text-white"
                      : "border-[#d1d1d1] border-b-[#616161] bg-white text-[#242424]"
                  }`}
                >
                  {selected === "" ? <option value="" /> : null}
                  {sizes.map((entry) => (
                    <option key={entry}>{entry}</option>
                  ))}
                </select>
              </span>
            ) : null}
          </div>
        ) : null}
      </div>
    ),
    apply: (settings) => {
      const next = { ...DEFAULTS };
      for (const [key, formula] of Object.entries(settings)) {
        if (key === "AccentColor") next.AccentColor = cssColor(formula, DEFAULTS.AccentColor);
        else if (key in next)
          (next as unknown as Record<string, unknown>)[key] = fromPowerFx(formula);
      }
      setInputs(next);
      setChosenPage(null);
      setChosenSize(null);
    },
    dark,
    wiring,
  };
}
