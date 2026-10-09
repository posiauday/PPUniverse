import type { ReactNode } from "react";

/**
 * The picture on each card in the component library (MVP-049; docs/final-decisions.md,
 * 2026-10-08, "One live view"): a small, still drawing of the component in its
 * best-known use, in the colours its YAML gives it, on a white mini screen like
 * Studio's, so those light-theme colours keep their contrast when the page is
 * dark. Decorative: the card's own text names and describes the component.
 */

const SEGOE = '[font-family:"Segoe_UI",system-ui,sans-serif]';

function Pill({ children, className }: { children: ReactNode; className: string }) {
  return (
    <span
      className={`inline-flex h-8 items-center justify-center gap-1.5 rounded px-3 text-[13px] font-semibold ${className}`}
    >
      {children}
    </span>
  );
}

function Glyph({ d, className = "size-3.5" }: { d: string; className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d={d} />
    </svg>
  );
}

const ART: Record<string, ReactNode> = {
  lcsButton: (
    <span className="flex flex-col items-center gap-2">
      <span className="flex gap-2">
        <Pill className="w-24 bg-[#0f6cbd] text-white shadow-sm">
          <Glyph d="M5 12l5 5L20 7" />
          Save
        </Pill>
        <Pill className="w-24 border border-[#d1d1d1] bg-white text-[#242424]">Cancel</Pill>
      </span>
      <span className="flex gap-2">
        <Pill className="w-24 border border-[#d1d1d1] text-[#242424]">
          <Glyph d="M12 4v11M7 10l5 5 5-5M5 20h14" />
          Export
        </Pill>
        <Pill className="w-24 bg-[#f0f0f0] text-[#616161]">Working…</Pill>
      </span>
    </span>
  ),
  lcsFab: (
    <span className="relative block h-32 w-44">
      <span className="absolute right-3 bottom-[4.25rem] flex flex-col items-end gap-1.5">
        {["New note", "Take a photo"].map((label) => (
          <span
            key={label}
            className="rounded-full bg-white px-2.5 py-1 text-[11px] font-semibold text-[#242424] shadow-[0_1px_3px_rgba(0,0,0,0.18)]"
          >
            {label}
          </span>
        ))}
      </span>
      <span className="absolute right-3 bottom-3 grid size-12 place-items-center rounded-2xl bg-[#0f6cbd] text-white shadow-[0_4px_12px_rgba(15,108,189,0.45)]">
        <Glyph d="M6 6l12 12M18 6L6 18" className="size-5" />
      </span>
    </span>
  ),
  lcsTextField: (
    <span className="block w-52 text-left">
      <span className="block text-[13px] font-semibold text-[#242424]">Work email *</span>
      <span className="relative mt-1 flex h-9 items-center rounded-md border border-[#d1d1d1] bg-white px-2.5 text-[13px] text-[#242424]">
        name@example.com
        <span className="absolute inset-x-1 -bottom-px h-0.5 rounded-full bg-[#0f6cbd]" />
      </span>
      <span className="mt-1 flex justify-between text-[11px] text-[#616161]">
        <span>We&apos;ll send the confirmation here.</span>
        <span>16/100</span>
      </span>
    </span>
  ),
  lcsDialog: (
    <span className="block w-52 rounded-xl bg-white p-3.5 text-left shadow-[0_8px_24px_rgba(0,0,0,0.18)]">
      <span className="flex items-start gap-2">
        <span className="text-[#bc4b09]">
          <Glyph d="M12 3l10 18H2zM12 10v5M12 18v.5" className="size-4" />
        </span>
        <span className="text-[13px] leading-tight font-semibold text-[#242424]">
          Delete all 48 requests?
        </span>
      </span>
      <span className="mt-2 block h-6 rounded border border-[#d1d1d1] px-2 text-[11px] leading-6 text-[#242424]">
        DELETE
      </span>
      <span className="mt-2.5 flex justify-end gap-1.5">
        <span className="rounded border border-[#d1d1d1] px-2 py-0.5 text-[11px] font-semibold text-[#242424]">
          Cancel
        </span>
        <span className="rounded bg-[#c4314b] px-2 py-0.5 text-[11px] font-semibold text-white">
          Delete
        </span>
      </span>
    </span>
  ),
  lcsToast: (
    <span className="flex flex-col items-center gap-2">
      <span className="flex h-10 w-56 items-center gap-2 rounded-md border border-[#0e700e] bg-[#dff6dd] pr-2 pl-3 text-[12px] font-semibold text-[#0e700e]">
        <span className="flex-1 text-left">✓ Request saved.</span>
        <span className="rounded border border-[#0e700e] px-1.5 py-0.5 text-[11px]">Undo</span>
        <span className="text-[#242424]">✕</span>
      </span>
      <span className="flex h-10 w-56 items-center gap-2 rounded-md border border-[#a6152e] bg-[#fde7e9] pr-2 pl-3 text-[12px] font-semibold text-[#a6152e]">
        <span className="flex-1 text-left">✕ Couldn&apos;t save. Try again.</span>
        <span className="text-[#242424]">✕</span>
      </span>
    </span>
  ),
  lcsTabs: (
    <span className="flex flex-col items-center gap-3">
      <span className="flex gap-1 text-[13px] font-semibold text-[#242424]">
        <span className="border-b-[3px] border-[#0f6cbd] px-2 pb-1">Overview</span>
        <span className="border-b-[3px] border-transparent px-2 pb-1">Details</span>
        <span className="border-b-[3px] border-transparent px-2 pb-1">History</span>
      </span>
      <span className="flex gap-1 text-[12px] font-semibold">
        <span className="rounded bg-[#0f6cbd] px-2.5 py-1 text-white">Open</span>
        <span className="rounded bg-[#f0f0f0] px-2.5 py-1 text-[#242424]">Waiting</span>
        <span className="rounded bg-[#f0f0f0] px-2.5 py-1 text-[#242424]">Done</span>
      </span>
    </span>
  ),
  lcsDatePicker: (
    <span className="block w-48 text-left">
      <span className="block text-[12px] font-semibold text-[#242424]">Leave</span>
      <span className="mt-1 flex gap-1.5">
        <span className="flex h-7 flex-1 items-center justify-between rounded border border-[#d1d1d1] px-1.5 text-[10px] text-[#242424]">
          Mar 2, 2026
          <Glyph d="M4 6h16v14H4zM4 10h16M8 3v4M16 3v4" className="size-3" />
        </span>
        <span className="flex h-7 flex-1 items-center rounded border border-[#d1d1d1] px-1.5 text-[10px] text-[#242424]">
          Mar 6, 2026
        </span>
      </span>
      <span className="mt-1.5 grid grid-cols-7 gap-0.5 rounded-md bg-white p-1.5 text-center text-[8px] text-[#242424] shadow-[0_4px_12px_rgba(0,0,0,0.15)]">
        {Array.from({ length: 14 }, (_, index) => (
          <span
            key={index}
            className={`rounded-sm py-0.5 ${index >= 1 && index <= 5 ? "bg-[#0f6cbd] text-white" : ""}`}
          >
            {index + 1}
          </span>
        ))}
      </span>
    </span>
  ),
  lcsPeoplePicker: (
    <span className="block w-48 text-left">
      <span className="flex items-center justify-between text-[12px] font-semibold">
        <span className="text-[#242424]">Approvers</span>
        <span className="text-[10px] text-[#0f6cbd]">+ Add me</span>
      </span>
      <span className="mt-1 grid grid-cols-2 gap-1">
        {[
          ["AB", "Avery", "#0f6cbd"],
          ["JL", "Jordan", "#bc4b09"],
        ].map(([letters, name, colour]) => (
          <span
            key={name}
            className="flex h-6 items-center gap-1 rounded-full bg-[#f0f0f0] pr-1.5 pl-0.5 text-[10px] text-[#242424]"
          >
            <span
              style={{ backgroundColor: colour }}
              className="grid size-5 place-items-center rounded-full text-[8px] font-semibold text-white"
            >
              {letters}
            </span>
            <span className="flex-1 truncate">{name}</span>
            <span>✕</span>
          </span>
        ))}
      </span>
      <span className="mt-1 flex h-6 items-center gap-1 rounded border border-[#d1d1d1] border-b-[#616161] px-1.5 text-[10px] text-[#242424]">
        <Glyph d="M10.5 4.5a6 6 0 1 1 0 12 6 6 0 0 1 0-12zM15 15l5 5" className="size-3" />
        pri
      </span>
      <span className="mt-1 flex items-center gap-1.5 rounded bg-[#f5f5f5] px-1 py-1">
        <span className="grid size-5 place-items-center rounded-full bg-[#0d8076] text-[8px] font-semibold text-white">
          PN
        </span>
        <span className="text-[10px] leading-tight">
          <span className="block font-semibold text-[#242424]">Priya Nair</span>
          <span className="block text-[#616161]">Developer</span>
        </span>
      </span>
    </span>
  ),
  lcsPagination: (
    <span className="flex flex-col items-center gap-2 text-[12px] font-semibold text-[#242424]">
      <span className="flex items-center gap-0.5">
        <Glyph d="M15 6l-6 6 6 6" className="size-3.5 text-[#616161]" />
        {["1", "…", "4", "5", "6", "…", "32"].map((label, index) => (
          <span
            key={index}
            className={`grid size-6 place-items-center rounded ${label === "5" ? "bg-[#0f6cbd] text-white" : ""}`}
          >
            {label}
          </span>
        ))}
        <Glyph d="M9 6l6 6-6 6" className="size-3.5" />
      </span>
      <span className="text-[11px] font-normal text-[#616161]">41–50 of 312 orders</span>
    </span>
  ),
  lcsDataTable: (
    <span className="block w-52 overflow-hidden rounded-lg border border-[#e5e7eb] text-left text-[9px] text-[#242424]">
      <span className="flex bg-[#f9fafb] px-2 py-1 font-semibold text-[#616161]">
        <span className="w-12">Order</span>
        <span className="w-16">Status</span>
        <span className="flex-1">Progress</span>
      </span>
      {[
        ["#1001", "In progress", "#dbeafe", "#1e40af", 2],
        ["#1002", "Completed", "#dcfce7", "#166534", 4],
        ["#1003", "On hold", "#fef3c7", "#92400e", 1],
      ].map(([order, status, fill, ink, done]) => (
        <span
          key={order as string}
          className="flex items-center border-t border-[#f0f0f0] px-2 py-1.5"
        >
          <span className="w-12 font-semibold">{order}</span>
          <span className="w-16">
            <span
              style={{ backgroundColor: fill as string, color: ink as string }}
              className="rounded-full px-1.5 py-0.5 font-semibold"
            >
              {status}
            </span>
          </span>
          <span className="flex flex-1 gap-0.5">
            {[0, 1, 2, 3].map((segment) => (
              <span
                key={segment}
                className={`h-1.5 flex-1 rounded-sm ${segment < (done as number) ? "bg-[#0f6cbd]" : "bg-[#e2e8f0]"}`}
              />
            ))}
          </span>
        </span>
      ))}
    </span>
  ),
  lcsNavShell: (
    <span className="flex h-24 w-52 overflow-hidden rounded-lg border border-[#e5e7eb] text-left text-[10px] text-[#242424]">
      <span className="flex w-20 flex-col gap-0.5 border-r border-[#e5e7eb] bg-[#fafafa] p-1.5">
        <span className="mb-1 px-1 text-[11px] font-semibold">My app</span>
        {["Home", "Orders", "Customers", "Reports"].map((label) => (
          <span
            key={label}
            className={`relative flex items-center justify-between rounded px-1.5 py-1 ${label === "Orders" ? "bg-[#dfeaf6] font-semibold text-[#0b5190]" : ""}`}
          >
            {label === "Orders" ? (
              <span className="absolute top-1 bottom-1 left-0 w-0.5 bg-[#0f6cbd]" />
            ) : null}
            {label}
            {label === "Orders" ? (
              <span className="grid size-3.5 place-items-center rounded-full bg-[#0f6cbd] text-[8px] text-white">
                3
              </span>
            ) : null}
          </span>
        ))}
      </span>
      <span className="flex flex-1 flex-col gap-1.5 p-2">
        <span className="text-[11px] font-semibold">Orders</span>
        <span className="h-1.5 w-[90%] rounded bg-[#ededed]" />
        <span className="h-1.5 w-[70%] rounded bg-[#ededed]" />
        <span className="h-1.5 w-[80%] rounded bg-[#ededed]" />
      </span>
    </span>
  ),
  lcsTreeView: (
    <span className="flex w-44 flex-col gap-0.5 text-left text-[11px] text-[#242424]">
      {[
        { label: "Documents", depth: 0, open: true },
        { label: "Plans", depth: 1, open: true },
        { label: "Q3 plan.docx", depth: 2, current: true },
        { label: "Budget.xlsx", depth: 1 },
        { label: "Images", depth: 0, open: false },
      ].map((node) => (
        <span
          key={node.label}
          style={{ paddingLeft: node.depth * 14 }}
          className="flex items-center gap-1"
        >
          <span className="w-3 text-[#616161]">
            {node.open === undefined ? "" : node.open ? "⌄" : "›"}
          </span>
          <span
            className={`flex-1 truncate rounded px-1.5 py-0.5 ${node.current ? "bg-[#dfeaf6] font-semibold text-[#0b5190]" : ""}`}
          >
            {node.label}
          </span>
        </span>
      ))}
    </span>
  ),
  lcsStates: (
    <span className="flex flex-col items-center text-center">
      <span className="grid size-10 place-items-center rounded-full bg-[#f0f0f0] text-lg font-bold text-[#424242]">
        ○
      </span>
      <span className="mt-2 text-[13px] font-semibold text-[#242424]">No requests yet</span>
      <span className="text-[11px] text-[#616161]">Requests you create appear here.</span>
      <Pill className="mt-2 h-7 bg-[#0f6cbd] text-[12px] text-white">New request</Pill>
    </span>
  ),
};

export function ComponentArt({ componentName }: { componentName: string }) {
  return (
    <span
      aria-hidden="true"
      className={`grid min-h-32 min-w-44 place-items-center rounded-xl bg-white p-4 shadow-[0_8px_24px_-12px_rgba(46,16,101,0.35)] ring-1 ring-black/5 ${SEGOE}`}
    >
      {ART[componentName] ?? (
        <span className="grid size-14 place-items-center rounded-2xl bg-[#0f6cbd] text-white">
          <Glyph d="M12 5v14M5 12h14" className="size-6" />
        </span>
      )}
    </span>
  );
}
