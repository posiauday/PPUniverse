import type { ReactNode } from "react";

/**
 * The picture on each card in the component library (MVP-049; docs/final-decisions.md,
 * 2026-10-10, "Component cards: two looks, alive on hover"): two small, faithful
 * drawings of the component fanned like cards, its standard look behind and your brand
 * colour in front. Hovering the card fans them apart and the front one is used, as the
 * component would be: a pointer selects, and the component answers. Every state shown is
 * one the component has. Without hover (touch, reduced motion) it stays a still picture.
 * Decorative: the card's own text names and describes the component.
 */

const SEGOE = '[font-family:"Segoe_UI",system-ui,sans-serif]';
const BLUE = "#0f6cbd";
const PURPLE = "#7c3aed";
/** One transition for every moving part; hovering adds each part's own delay. */
const T = "motion-safe:transition-all motion-safe:duration-500 motion-safe:ease-out";
/** Text that types itself in: its width grows at a steady pace. */
const TYPE =
  "inline-block max-w-0 overflow-hidden whitespace-nowrap align-bottom motion-safe:transition-[max-width] motion-safe:duration-700 motion-safe:ease-linear";

function Glyph({ d, className = "size-3.5" }: { d: string; className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={`shrink-0 ${className}`}
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

const D = {
  check: "M5 12l5 5L20 7",
  plus: "M12 5v14M5 12h14",
  cross: "M6 6l12 12M18 6L6 18",
  left: "M15 6l-6 6 6 6",
  right: "M9 6l6 6-6 6",
  calendar: "M4 6h16v14H4zM4 10h16M8 3v4M16 3v4",
  search: "M10.5 4.5a6 6 0 1 1 0 12 6 6 0 0 1 0-12zM15 15l5 5",
  warning: "M12 3l10 18H2zM12 10v5M12 18v.5",
  home: "M4 11l8-7 8 7v9h-5v-6H9v6H4z",
  cart: "M3 4h3l2 11h11l2-8H7M10 20h.01M17 20h.01",
  people:
    "M8 11a3 3 0 100-6 3 3 0 000 6zM2 20c0-3 3-5 6-5s6 2 6 5M16 5a3 3 0 010 6M18 15c2 .5 4 2 4 5",
  report: "M7 3h7l5 5v13H7zM14 3v5h5",
  note: "M5 4h14v16H5zM8 9h8M8 13h8M8 17h5",
  camera: "M4 8h3l2-3h6l2 3h3v11H4zM12 17a3.5 3.5 0 100-7 3.5 3.5 0 000 7z",
};

function Spinner() {
  return (
    <svg viewBox="0 0 24 24" className="size-3 motion-safe:animate-spin">
      <circle
        cx="12"
        cy="12"
        r="9"
        fill="none"
        stroke="currentColor"
        strokeWidth="3"
        strokeDasharray="38 20"
        strokeLinecap="round"
      />
    </svg>
  );
}

/** A white mini screen or card in the component's own light colours. */
function Sheet({
  children,
  className = "",
  front = false,
}: {
  children: ReactNode;
  className?: string;
  front?: boolean;
}) {
  return (
    <span
      className={`relative block overflow-hidden rounded-xl border border-[#e5e7eb] bg-white text-[11px] text-[#242424] ${
        front
          ? "shadow-[0_16px_34px_-14px_rgba(76,29,149,0.55)]"
          : "shadow-[0_8px_20px_-12px_rgba(46,16,101,0.4)]"
      } ${className}`}
    >
      {children}
    </span>
  );
}

/** The pointer that uses the front drawing: hidden at rest, it appears on hover and glides to its target. */
function Pointer({ className }: { className: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={`pointer-events-none absolute z-10 size-4 opacity-0 drop-shadow-[0_1px_1px_rgba(0,0,0,0.35)] ${T} group-hover:opacity-100 ${className}`}
    >
      <path
        d="M5 3l14 8-6 1.5L10 19z"
        fill="#242424"
        stroke="#fff"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** Two drawings fanned like cards: they spread on hover, and the front one straightens. */
function Deck({
  back,
  front,
  backWidth = "w-[168px]",
  frontWidth = "w-[192px]",
}: {
  back: ReactNode;
  front: ReactNode;
  backWidth?: string;
  frontWidth?: string;
}) {
  return (
    <span className={`relative block h-[140px] w-[272px] translate-y-[19px] text-left ${SEGOE}`}>
      <span
        className={`absolute top-0 left-0 ${backWidth} -rotate-6 ${T} group-hover:-translate-x-3 group-hover:-rotate-[10deg]`}
      >
        {back}
      </span>
      <span
        className={`absolute top-4 right-0 ${frontWidth} rotate-2 ${T} group-hover:-translate-y-1 group-hover:rotate-0`}
      >
        {front}
      </span>
    </span>
  );
}

/** Two layers in one place: the first shows at rest, the second on hover, after a delay. */
function Swap({
  rest,
  hover,
  delay,
  className = "",
}: {
  rest: ReactNode;
  hover: ReactNode;
  delay: string;
  className?: string;
}) {
  return (
    <span className={`relative inline-grid ${className}`}>
      <span className={`col-start-1 row-start-1 ${T} ${delay} group-hover:opacity-0`}>{rest}</span>
      <span className={`col-start-1 row-start-1 opacity-0 ${T} ${delay} group-hover:opacity-100`}>
        {hover}
      </span>
    </span>
  );
}

function Bars({ widths, className = "" }: { widths: number[]; className?: string }) {
  return (
    <span className={`flex flex-col gap-1.5 ${className}`}>
      {widths.map((width, index) => (
        <span key={index} className="flex items-center gap-1.5">
          <span className="size-2.5 shrink-0 rounded-full bg-[#ececec]" />
          <span className="h-1.5 rounded bg-[#ececec]" style={{ width: `${width}%` }} />
        </span>
      ))}
    </span>
  );
}

/* Tree view rows ---------------------------------------------------------------------------- */

const FOLDER = "M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z";
const FILE = "M7 3h7l5 5v12a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1zM14 3v5h5";

function Node({
  label,
  folder = false,
  open,
  count,
  depth = 0,
  accent,
  tint = false,
  chevron = "",
  pill = "",
  ink = "",
}: {
  label: string;
  folder?: boolean;
  open?: boolean;
  count?: number;
  depth?: number;
  accent: string;
  tint?: boolean;
  chevron?: string;
  pill?: string;
  ink?: string;
}) {
  return (
    <span className="relative flex h-5 items-center gap-0.5" style={{ paddingLeft: depth * 12 }}>
      <span className="grid w-3.5 shrink-0 place-items-center text-[#616161]">
        {open === undefined ? null : (
          <Glyph d={D.right} className={`size-[10px] ${open ? "rotate-90" : ""} ${T} ${chevron}`} />
        )}
      </span>
      {pill ? (
        <span
          className={`absolute inset-y-0 right-0 rounded-md ${pill}`}
          style={{ left: depth * 12 + 14 }}
        />
      ) : null}
      <span
        className={`relative flex h-full min-w-0 flex-1 items-center gap-1.5 rounded-md px-1 ${T} ${ink}`}
        style={tint ? { background: `color-mix(in srgb, ${accent} 14%, white)` } : undefined}
      >
        <svg
          viewBox="0 0 24 24"
          className="size-3 shrink-0"
          style={{ color: folder ? "#d97706" : accent }}
          fill={folder ? "currentColor" : "none"}
          stroke="currentColor"
          strokeWidth={folder ? 1.4 : 1.9}
          strokeLinejoin="round"
        >
          <path d={folder ? FOLDER : FILE} />
        </svg>
        <span className="min-w-0 flex-1 truncate">{label}</span>
        {count ? <span className="text-[9px] text-[#616161]">{count}</span> : null}
      </span>
    </span>
  );
}

const Guide = ({ children }: { children: ReactNode }) => (
  <span className="ml-[7px] block border-l border-[#e2e8f0] pl-[5px]">{children}</span>
);

/* The pictures -------------------------------------------------------------------------------- */

const ART: Record<string, ReactNode> = {
  lcsButton: (
    <Deck
      back={
        <Sheet className="flex flex-col gap-1.5 p-3">
          <span className="flex gap-1.5">
            <span className="flex h-7 flex-1 items-center justify-center gap-1 rounded bg-[#0f6cbd] font-semibold text-white">
              <Glyph d={D.check} className="size-3" />
              Save
            </span>
            <span className="flex h-7 flex-1 items-center justify-center rounded border border-[#d1d1d1] font-semibold">
              Cancel
            </span>
          </span>
          <span className="flex h-7 w-[72px] items-center justify-center rounded border border-[#d1d1d1] font-semibold">
            Export
          </span>
        </Sheet>
      }
      front={
        <Sheet front className="p-3.5">
          <span className="block font-semibold">New request</span>
          <Bars widths={[86, 62]} className="mt-2" />
          <span className="mt-3 flex items-center justify-end gap-1.5">
            <span className="px-2 font-semibold text-[#616161]">Cancel</span>
            <span
              className={`relative grid h-8 w-[88px] place-items-center rounded bg-[#7c3aed] font-semibold ${T} group-hover:bg-[#f0f0f0] group-hover:delay-500`}
            >
              <Swap
                delay="group-hover:delay-500"
                rest={<span className="text-white">Submit</span>}
                hover={
                  <span className="flex items-center gap-1 text-[#616161]">
                    <Spinner />
                    Working…
                  </span>
                }
              />
            </span>
          </span>
          <Pointer className="top-[64px] left-[44px] group-hover:top-[86px] group-hover:left-[140px]" />
        </Sheet>
      }
    />
  ),
  lcsFab: (
    <Deck
      backWidth="w-[150px]"
      frontWidth="w-[184px]"
      back={
        <Sheet className="h-[118px] p-3">
          <span className="block font-semibold">Notes</span>
          <Bars widths={[80, 64, 72]} className="mt-2" />
          <span className="absolute right-2.5 bottom-2.5 grid size-9 place-items-center rounded-full bg-[#0f6cbd] text-white shadow-[0_4px_10px_rgba(15,108,189,0.45)]">
            <Glyph d={D.plus} className="size-4" />
          </span>
        </Sheet>
      }
      front={
        <Sheet front className="h-[124px] p-3">
          <span className="block font-semibold">Requests</span>
          <Bars widths={[82, 60, 70]} className="mt-2" />
          {[
            {
              label: "New note",
              d: D.note,
              delay: "group-hover:delay-[650ms]",
              bottom: "bottom-[48px]",
            },
            {
              label: "Take a photo",
              d: D.camera,
              delay: "group-hover:delay-500",
              bottom: "bottom-[76px]",
            },
          ].map((action) => (
            <span
              key={action.label}
              className={`absolute right-2.5 ${action.bottom} flex translate-y-2 items-center gap-1 rounded-full bg-white px-2 py-1 font-semibold opacity-0 shadow-[0_1px_4px_rgba(0,0,0,0.2)] ${T} ${action.delay} group-hover:translate-y-0 group-hover:opacity-100`}
            >
              <Glyph d={action.d} className="size-3 text-[#7c3aed]" />
              {action.label}
            </span>
          ))}
          <span className="absolute right-2.5 bottom-2.5 flex h-8 items-center gap-1 rounded-2xl bg-[#7c3aed] pr-3 pl-2.5 font-semibold text-white shadow-[0_4px_12px_rgba(124,58,237,0.5)]">
            <Glyph
              d={D.plus}
              className={`size-3.5 ${T} group-hover:rotate-45 group-hover:delay-300`}
            />
            New
          </span>
          <Pointer className="top-[30px] left-[40px] group-hover:top-[104px] group-hover:left-[150px]" />
        </Sheet>
      }
    />
  ),
  lcsTextField: (
    <Deck
      back={
        <Sheet className="p-3">
          <span className="block font-semibold">Name *</span>
          <span className="mt-1 flex h-7 items-center rounded border border-[#d1d1d1] px-2">
            Avery Brooks
          </span>
          <span className="mt-1 block text-[9.5px] text-[#616161]">As on your badge.</span>
        </Sheet>
      }
      front={
        <Sheet front className="p-3.5">
          <span className="block font-semibold">Work email *</span>
          <span className="relative mt-1 flex h-8 items-center rounded-md border border-[#d1d1d1] px-2">
            <span
              className={`absolute left-2 text-[#8a8a8a] ${T} group-hover:opacity-0 group-hover:delay-300`}
            >
              name@example.com
            </span>
            <span className={`${TYPE} group-hover:max-w-[130px] group-hover:delay-500`}>
              avery@contoso.com
            </span>
            <span
              className={`absolute inset-x-1 -bottom-px h-0.5 origin-left scale-x-0 rounded-full bg-[#7c3aed] ${T} group-hover:scale-x-100 group-hover:delay-300`}
            />
          </span>
          <span className="mt-1 flex justify-between text-[9.5px] text-[#616161]">
            <span>For the confirmation.</span>
            <Swap delay="group-hover:delay-[1200ms]" rest="0/100" hover="17/100" />
          </span>
          <Pointer className="top-[58px] left-[150px] group-hover:top-[38px] group-hover:left-[70px]" />
        </Sheet>
      }
    />
  ),
  lcsDialog: (
    <Deck
      back={
        <Sheet className="p-3">
          <span className="block font-semibold">Delete this request?</span>
          <span className="mt-0.5 block text-[9.5px] text-[#616161]">
            You can&apos;t undo this.
          </span>
          <span className="mt-3 flex justify-end gap-1.5 font-semibold">
            <span className="rounded border border-[#d1d1d1] px-2 py-1">Cancel</span>
            <span className="rounded bg-[#0f6cbd] px-2 py-1 text-white">Delete</span>
          </span>
        </Sheet>
      }
      frontWidth="w-[196px]"
      front={
        <Sheet front className="p-3">
          <span className="flex items-center gap-1.5 font-semibold">
            <Glyph d={D.warning} className="size-3.5 text-[#bc4b09]" />
            Delete all 48 requests?
          </span>
          <span className="mt-1 block text-[9.5px] text-[#616161]">Type DELETE to confirm.</span>
          <span className="relative mt-1 flex h-6 items-center rounded border border-[#d1d1d1] px-2">
            <span className={`${TYPE} group-hover:max-w-[60px] group-hover:delay-500`}>DELETE</span>
            <span
              className={`absolute inset-x-1 -bottom-px h-0.5 origin-left scale-x-0 rounded-full bg-[#7c3aed] ${T} group-hover:scale-x-100 group-hover:delay-300`}
            />
          </span>
          <span className="mt-2 flex justify-end gap-1.5 font-semibold">
            <span className="rounded border border-[#d1d1d1] px-2 py-0.5">Cancel</span>
            <span
              className={`rounded bg-[#f0f0f0] px-2 py-0.5 text-[#8a8a8a] ${T} group-hover:bg-[#c4314b] group-hover:text-white group-hover:delay-[1200ms]`}
            >
              Delete
            </span>
          </span>
          <Pointer className="top-[86px] left-[40px] group-hover:top-[46px] group-hover:left-[56px]" />
        </Sheet>
      }
    />
  ),
  lcsToast: (
    <Deck
      backWidth="w-[176px]"
      back={
        <Sheet className="p-2.5">
          <span className="flex h-8 items-center gap-1.5 rounded-md border border-[#0e700e] bg-[#dff6dd] pr-1.5 pl-2 font-semibold text-[#0e700e]">
            <span className="flex-1">✓ Request saved.</span>
            <span className="rounded border border-[#0e700e] px-1 text-[9.5px]">Undo</span>
          </span>
          <Bars widths={[78, 58]} className="mt-2.5 px-1" />
        </Sheet>
      }
      front={
        <Sheet front className="h-[120px] p-3">
          <span className="block font-semibold">Requests</span>
          <Bars widths={[80, 62, 72]} className="mt-2" />
          <span className="absolute right-3 bottom-2.5 rounded border border-[#d1d1d1] px-2 py-0.5 font-semibold">
            Sync
          </span>
          <span
            className={`absolute inset-x-2 top-2 flex h-8 -translate-y-12 items-center gap-1.5 rounded-md border border-[#7c3aed] bg-[color-mix(in_srgb,#7c3aed_10%,white)] pr-1.5 pl-2 font-semibold opacity-0 ${T} group-hover:translate-y-0 group-hover:opacity-100 group-hover:delay-500`}
          >
            <span className="flex-1">ⓘ 3 requests synced.</span>
            <span className="rounded border border-[#616161] px-1 text-[9.5px]">View</span>
            <Glyph d={D.cross} className="size-2.5" />
          </span>
          <Pointer className="top-[40px] left-[60px] group-hover:top-[100px] group-hover:left-[164px]" />
        </Sheet>
      }
    />
  ),
  lcsTabs: (
    <Deck
      back={
        <Sheet className="p-3">
          <span className="flex gap-2 font-semibold">
            <span className="border-b-2 border-[#0f6cbd] pb-1">Overview</span>
            <span className="pb-1">Details</span>
            <span className="pb-1">History</span>
          </span>
          <Bars widths={[84, 66]} className="mt-2.5" />
        </Sheet>
      }
      front={
        <Sheet front className="p-3.5">
          <span className="relative flex rounded-md bg-[#f0f0f0] p-0.5 font-semibold">
            <span
              className={`absolute top-0.5 left-0.5 h-6 w-[54px] rounded bg-[#7c3aed] ${T} group-hover:translate-x-[54px] group-hover:delay-300`}
            />
            {[
              { label: "Open", count: "3", on: "text-white group-hover:text-[#242424]" },
              { label: "Waiting", count: "", on: "group-hover:text-white" },
              { label: "Done", count: "", on: "" },
            ].map((tab) => (
              <span
                key={tab.label}
                className={`relative grid h-6 w-[54px] place-items-center ${T} group-hover:delay-300 ${tab.on}`}
              >
                <span>
                  {tab.label}
                  {tab.count ? (
                    <span className="ml-0.5 text-[9px] opacity-80">{tab.count}</span>
                  ) : null}
                </span>
              </span>
            ))}
          </span>
          <Bars widths={[88, 70, 56]} className="mt-3" />
          <Pointer className="top-[70px] left-[150px] group-hover:top-[22px] group-hover:left-[96px]" />
        </Sheet>
      }
    />
  ),
  lcsDatePicker: (
    <Deck
      back={
        <Sheet className="p-3">
          <span className="block font-semibold">Due date</span>
          <span className="mt-1 flex h-7 items-center justify-between rounded border border-[#d1d1d1] px-2">
            Mar 6, 2026
            <Glyph d={D.calendar} className="size-3 text-[#616161]" />
          </span>
          <span className="mt-1.5 grid grid-cols-7 gap-0.5 text-center text-[8.5px]">
            {Array.from({ length: 7 }, (_, index) => (
              <span
                key={index}
                className={`rounded-sm py-0.5 ${index === 5 ? "bg-[#0f6cbd] text-white" : ""}`}
              >
                {index + 1}
              </span>
            ))}
          </span>
        </Sheet>
      }
      frontWidth="w-[196px]"
      front={
        <Sheet front className="p-3">
          <span className="flex items-center justify-between font-semibold">
            Leave
            <span className="flex gap-1 text-[9px]">
              <span className="rounded border border-[#d1d1d1] px-1.5">Today</span>
              <span className="rounded border border-[#d1d1d1] px-1.5">This week</span>
            </span>
          </span>
          <span className="mt-1.5 flex gap-1.5 text-[10px]">
            <span className="flex h-7 flex-1 items-center rounded border border-[#d1d1d1] px-1.5">
              Mar 2, 2026
            </span>
            <span className="flex h-7 flex-1 items-center rounded border border-[#d1d1d1] px-1.5">
              <Swap
                delay="group-hover:delay-[1000ms]"
                rest={<span className="text-[#8a8a8a]">End date</span>}
                hover="Mar 6, 2026"
              />
            </span>
          </span>
          <span className="mt-1.5 grid grid-cols-7 gap-0.5 text-center text-[9px]">
            {Array.from({ length: 7 }, (_, index) => {
              const day = index + 1;
              const delays = [
                "",
                "",
                "group-hover:delay-300",
                "group-hover:delay-[450ms]",
                "group-hover:delay-[600ms]",
                "group-hover:delay-[750ms]",
                "",
              ];
              return (
                <span
                  key={day}
                  className={`rounded-sm py-1 ${T} ${
                    day === 2
                      ? "bg-[#7c3aed] font-semibold text-white"
                      : day === 6
                        ? `${delays[index]} group-hover:bg-[#7c3aed] group-hover:font-semibold group-hover:text-white`
                        : day > 2 && day < 6
                          ? `${delays[index]} group-hover:bg-[color-mix(in_srgb,#7c3aed_16%,white)]`
                          : "text-[#8a8a8a]"
                  }`}
                >
                  {day}
                </span>
              );
            })}
          </span>
          <Pointer className="top-[56px] left-[30px] group-hover:top-[100px] group-hover:left-[136px]" />
        </Sheet>
      }
    />
  ),
  lcsPeoplePicker: (
    <Deck
      back={
        <Sheet className="p-3">
          <span className="block font-semibold">Approvers</span>
          <span className="mt-1.5 flex gap-1">
            {[
              ["AB", "Avery", BLUE],
              ["JL", "Jordan", "#bc4b09"],
            ].map(([letters, name, colour]) => (
              <span
                key={name}
                className="flex h-6 items-center gap-1 rounded-full bg-[#f0f0f0] pr-2 pl-0.5 text-[10px]"
              >
                <span
                  style={{ backgroundColor: colour }}
                  className="grid size-5 place-items-center rounded-full text-[8px] font-semibold text-white"
                >
                  {letters}
                </span>
                {name}
              </span>
            ))}
          </span>
        </Sheet>
      }
      frontWidth="w-[196px]"
      front={
        <Sheet front className="p-2.5">
          <span className="flex items-center justify-between font-semibold">
            Approvers
            <span className="text-[9.5px] text-[#7c3aed]">+ Add me</span>
          </span>
          <span className="mt-1 flex gap-1 text-[10px]">
            <span className="flex h-5 items-center gap-1 rounded-full bg-[#f0f0f0] pr-2 pl-0.5">
              <span className="grid size-4 place-items-center rounded-full bg-[#0f6cbd] text-[7px] font-semibold text-white">
                AB
              </span>
              Avery
            </span>
            <span
              className={`flex h-5 scale-0 items-center gap-1 rounded-full bg-[#f0f0f0] pr-2 pl-0.5 opacity-0 ${T} group-hover:scale-100 group-hover:opacity-100 group-hover:delay-700`}
            >
              <span className="grid size-4 place-items-center rounded-full bg-[#0d8076] text-[7px] font-semibold text-white">
                PN
              </span>
              Priya
            </span>
          </span>
          <span className="mt-1 flex h-6 items-center gap-1 rounded border border-[#d1d1d1] border-b-[#616161] px-1.5 text-[10px]">
            <Glyph d={D.search} className="size-3 text-[#616161]" />
            <span className={`${T} group-hover:opacity-0 group-hover:delay-700`}>pri</span>
          </span>
          <span
            className={`mt-1 flex h-6 items-center gap-1.5 rounded bg-[#f5f5f5] px-1 text-[10px] ${T} group-hover:opacity-0 group-hover:delay-[600ms]`}
          >
            <span className="grid size-4 place-items-center rounded-full bg-[#0d8076] text-[7px] font-semibold text-white">
              PN
            </span>
            <span className="font-semibold">Priya Nair</span>
            <span className="text-[#616161]">Developer</span>
          </span>
          <Pointer className="top-[30px] left-[150px] group-hover:top-[84px] group-hover:left-[70px]" />
        </Sheet>
      }
    />
  ),
  lcsPagination: (
    <Deck
      back={
        <Sheet className="p-3 text-center">
          <span className="flex items-center justify-center gap-2 font-semibold">
            <Glyph d={D.left} className="size-3 text-[#616161]" />
            Page 4 of 32
            <Glyph d={D.right} className="size-3" />
          </span>
          <span className="mt-1 block text-[9.5px] text-[#616161]">31–40 of 312 orders</span>
          <Bars widths={[80, 64]} className="mt-2" />
        </Sheet>
      }
      frontWidth="w-[204px]"
      front={
        <Sheet front className="p-3">
          <Bars widths={[86, 70, 78]} />
          <span className="relative mt-3 flex items-center font-semibold">
            <Glyph d={D.left} className="mr-0.5 size-3 text-[#616161]" />
            <span
              className={`absolute top-0 left-[calc(14px+60px)] h-5 w-5 rounded bg-[#7c3aed] ${T} group-hover:translate-x-5 group-hover:delay-300`}
            />
            {["1", "…", "3", "4", "5", "…", "32"].map((label, index) => (
              <span
                key={index}
                className={`relative grid h-5 w-5 place-items-center ${T} group-hover:delay-300 ${
                  label === "4"
                    ? "text-white group-hover:text-[#242424]"
                    : label === "5"
                      ? "group-hover:text-white"
                      : ""
                }`}
              >
                {label}
              </span>
            ))}
            <Glyph d={D.right} className="ml-0.5 size-3" />
          </span>
          <span className="mt-1.5 block text-[9.5px] text-[#616161]">
            <Swap
              delay="group-hover:delay-500"
              rest="31–40 of 312 orders"
              hover="41–50 of 312 orders"
            />
          </span>
          <Pointer className="top-[30px] left-[160px] group-hover:top-[62px] group-hover:left-[106px]" />
        </Sheet>
      }
    />
  ),
  lcsDataTable: (
    <Deck
      back={
        <Sheet className="grid grid-cols-2 gap-1.5 p-2.5 text-[9.5px]">
          {[
            ["#1001", "In progress", "#dbeafe", "#1e40af", 2],
            ["#1002", "Completed", "#dcfce7", "#166534", 4],
          ].map(([order, status, fill, ink, done]) => (
            <span key={order as string} className="rounded-lg border border-[#e5e7eb] p-1.5">
              <span className="block font-semibold">{order}</span>
              <span
                style={{ backgroundColor: fill as string, color: ink as string }}
                className="mt-1 inline-block rounded-full px-1 text-[8px] font-semibold whitespace-nowrap"
              >
                {status}
              </span>
              <span className="mt-1.5 flex gap-0.5">
                {[0, 1, 2, 3].map((segment) => (
                  <span
                    key={segment}
                    className={`h-1 flex-1 rounded-sm ${segment < (done as number) ? "bg-[#0f6cbd]" : "bg-[#e2e8f0]"}`}
                  />
                ))}
              </span>
            </span>
          ))}
        </Sheet>
      }
      frontWidth="w-[204px]"
      front={
        <Sheet front className="h-[122px] text-[9.5px]">
          <span
            className={`grid grid-rows-[0fr] ${T} group-hover:grid-rows-[1fr] group-hover:delay-[600ms]`}
          >
            <span className="overflow-hidden">
              <span className="flex items-center justify-between bg-[color-mix(in_srgb,#7c3aed_8%,white)] px-2 py-1.5 font-semibold">
                1 selected
                <span className="rounded bg-[#7c3aed] px-1.5 py-0.5 text-white">Approve</span>
              </span>
            </span>
          </span>
          <span className="flex items-center gap-2 bg-[#f9fafb] px-2 py-1.5 font-semibold text-[#616161]">
            <span className="size-3 rounded-sm border border-[#8a8a8a] bg-white" />
            <span className="w-10">Order</span>
            <span>Status</span>
          </span>
          {[
            ["#1001", "In progress", "#dbeafe", "#1e40af"],
            ["#1002", "Completed", "#dcfce7", "#166534"],
            ["#1003", "On hold", "#fef3c7", "#92400e"],
          ].map(([order, status, fill, ink], index) => (
            <span
              key={order}
              className={`flex items-center gap-2 border-t border-[#f0f0f0] px-2 py-1.5 ${T} ${
                index === 0
                  ? "group-hover:bg-[color-mix(in_srgb,#7c3aed_8%,white)] group-hover:delay-[400ms]"
                  : ""
              }`}
            >
              <span
                className={`grid size-3 place-items-center rounded-sm border border-[#8a8a8a] bg-white text-white ${T} ${
                  index === 0
                    ? "group-hover:border-[#7c3aed] group-hover:bg-[#7c3aed] group-hover:delay-[400ms]"
                    : ""
                }`}
              >
                {index === 0 ? <Glyph d={D.check} className="size-2.5" /> : null}
              </span>
              <span className="w-10 font-semibold">{order}</span>
              <span
                style={{ backgroundColor: fill, color: ink }}
                className="rounded-full px-1.5 font-semibold"
              >
                {status}
              </span>
            </span>
          ))}
          <Pointer className="top-[70px] left-[150px] group-hover:top-[34px] group-hover:left-[12px]" />
        </Sheet>
      }
    />
  ),
  lcsNavShell: (
    <Deck
      backWidth="w-[150px]"
      back={
        <Sheet className="flex h-[118px]">
          <span className="flex w-9 flex-col items-center gap-2 border-r border-[#e5e7eb] bg-[#fafafa] py-2 text-[#424242]">
            <span className="grid size-5 place-items-center rounded bg-[#0f6cbd] text-[9px] font-semibold text-white">
              M
            </span>
            <span className="grid size-6 place-items-center rounded bg-[#dfeaf6] text-[#0b5190]">
              <Glyph d={D.home} className="size-3" />
            </span>
            <Glyph d={D.cart} className="size-3" />
            <Glyph d={D.people} className="size-3" />
            <Glyph d={D.report} className="size-3" />
          </span>
          <span className="flex-1 p-2">
            <span className="block font-semibold">Home</span>
            <Bars widths={[80, 60, 70]} className="mt-2" />
          </span>
        </Sheet>
      }
      frontWidth="w-[206px]"
      front={
        <Sheet front className="flex h-[124px]">
          <span className="relative flex w-[104px] flex-col gap-0.5 border-r border-[#e5e7eb] p-1.5">
            <span className="mb-1 flex items-center gap-1.5 px-1 font-semibold">
              <span className="grid size-4 place-items-center rounded bg-[#7c3aed] text-[8px] text-white">
                M
              </span>
              My app
            </span>
            <span
              className={`absolute top-[29px] right-1.5 left-1.5 h-5 rounded-md bg-[#7c3aed] ${T} group-hover:translate-y-[22px] group-hover:delay-300`}
            />
            {[
              { label: "Home", d: D.home, on: "text-white group-hover:text-[#242424]" },
              { label: "Orders", d: D.cart, badge: "3", on: "group-hover:text-white" },
              { label: "Customers", d: D.people, on: "" },
              { label: "Reports", d: D.report, on: "" },
            ].map((item) => (
              <span
                key={item.label}
                className={`relative flex h-5 items-center gap-1.5 px-1 font-semibold ${T} group-hover:delay-300 ${item.on}`}
              >
                <Glyph d={item.d} className="size-3" />
                <span className="flex-1">{item.label}</span>
                {item.badge ? (
                  <span className="grid size-3.5 place-items-center rounded-full bg-[#7c3aed] text-[8px] text-white ring-1 ring-white">
                    {item.badge}
                  </span>
                ) : null}
              </span>
            ))}
          </span>
          <span className="flex-1 p-2">
            <Swap
              delay="group-hover:delay-500"
              className="font-semibold"
              rest="Home"
              hover="Orders"
            />
            <Bars widths={[84, 60, 72]} className="mt-2" />
          </span>
          <Pointer className="top-[90px] left-[150px] group-hover:top-[56px] group-hover:left-[40px]" />
        </Sheet>
      }
    />
  ),
  lcsTreeView: (
    <Deck
      back={
        <Sheet className="px-1.5 pb-2">
          <span className="block px-1.5 pt-2 pb-1 font-semibold">Files</span>
          <Node label="Documents" folder open count={2} accent={BLUE} />
          <Guide>
            <Node label="Plans" folder open={false} count={2} accent={BLUE} />
            <Node label="Budget.xlsx" accent={BLUE} tint ink="font-semibold text-[#0b5190]" />
          </Guide>
          <Node label="Images" folder open={false} count={1} accent={BLUE} />
        </Sheet>
      }
      front={
        <Sheet front className="h-[124px] px-1.5">
          <span className="flex items-center gap-1.5 px-1.5 pt-2 pb-1 font-semibold">
            <span className="grid size-4 place-items-center rounded bg-[#7c3aed] text-[8px] text-white">
              F
            </span>
            Files
          </span>
          <Node label="Documents" folder open count={2} accent={PURPLE} />
          <Guide>
            <Node
              label="Plans"
              folder
              open={false}
              count={2}
              accent={PURPLE}
              chevron="group-hover:rotate-90 group-hover:delay-200"
            />
            <span
              className={`grid grid-rows-[0fr] ${T} group-hover:grid-rows-[1fr] group-hover:delay-300`}
            >
              <span className="overflow-hidden">
                <Guide>
                  <Node
                    label="Q3 plan.docx"
                    accent={PURPLE}
                    pill={`bg-[#7c3aed] opacity-0 ${T} group-hover:opacity-100 group-hover:delay-[800ms]`}
                    ink="group-hover:font-semibold group-hover:text-white group-hover:delay-[800ms]"
                  />
                  <Node label="Roadmap.pptx" accent={PURPLE} />
                </Guide>
              </span>
            </span>
            <Node
              label="Budget.xlsx"
              accent={PURPLE}
              pill={`bg-[#7c3aed] ${T} group-hover:opacity-0 group-hover:delay-[800ms]`}
              ink="font-semibold text-white group-hover:font-normal group-hover:text-[#242424] group-hover:delay-[800ms]"
            />
          </Guide>
          <Node label="Images" folder open={false} count={1} accent={PURPLE} />
          <Pointer className="top-[96px] left-[160px] group-hover:top-[50px] group-hover:left-[22px]" />
        </Sheet>
      }
    />
  ),
  lcsStepper: (
    <Deck
      back={
        <Sheet className="p-3">
          <span className="flex items-center">
            {[0, 1, 2, 3].map((index) => (
              <span key={index} className="flex flex-1 items-center last:flex-none">
                <span
                  className={`grid size-5 shrink-0 place-items-center rounded-full text-[9px] font-semibold ${
                    index < 2
                      ? "bg-[#0f6cbd] text-white"
                      : index === 2
                        ? "border-2 border-[#0f6cbd] text-[#0b5190]"
                        : "border border-[#d1d5db] text-[#616161]"
                  }`}
                >
                  {index < 2 ? "✓" : index + 1}
                </span>
                {index < 3 ? (
                  <span
                    className={`mx-1 h-0.5 flex-1 ${index < 2 ? "bg-[#0f6cbd]" : "bg-[#d1d5db]"}`}
                  />
                ) : null}
              </span>
            ))}
          </span>
          <span className="mt-1.5 flex justify-between text-[8.5px] text-[#616161]">
            <span>Details</span>
            <span>Items</span>
            <span className="font-semibold text-[#242424]">Approver</span>
            <span>Review</span>
          </span>
          <Bars widths={[80]} className="mt-2.5" />
        </Sheet>
      }
      frontWidth="w-[200px]"
      front={
        <Sheet front className="p-3">
          <span className="flex items-center">
            <span className="grid size-6 shrink-0 place-items-center rounded-full bg-[#7c3aed] text-[10px] font-semibold text-white">
              ✓
            </span>
            <span className="mx-1 h-0.5 flex-1 bg-[#7c3aed]" />
            <span
              className={`grid size-6 shrink-0 place-items-center rounded-full bg-[#7c3aed] text-[10px] font-semibold text-white shadow-[0_0_0_4px_color-mix(in_srgb,#7c3aed_22%,white)] ${T} group-hover:shadow-none group-hover:delay-500`}
            >
              <Swap delay="group-hover:delay-500" rest="2" hover="✓" />
            </span>
            <span className="relative mx-1 h-0.5 flex-1 bg-[#d1d5db]">
              <span
                className={`absolute inset-0 origin-left scale-x-0 bg-[#7c3aed] ${T} group-hover:scale-x-100 group-hover:delay-500`}
              />
            </span>
            <span
              className={`grid size-6 shrink-0 place-items-center rounded-full border border-[#d1d5db] text-[10px] font-semibold text-[#616161] ${T} group-hover:border-[#7c3aed] group-hover:bg-[#7c3aed] group-hover:text-white group-hover:shadow-[0_0_0_4px_color-mix(in_srgb,#7c3aed_22%,white)] group-hover:delay-700`}
            >
              3
            </span>
            <span className="mx-1 h-0.5 flex-1 bg-[#d1d5db]" />
            <span className="grid size-6 shrink-0 place-items-center rounded-full border border-[#d1d5db] text-[10px] font-semibold text-[#616161]">
              4
            </span>
          </span>
          <span className="mt-3 flex items-center justify-between border-t border-[#e5e7eb] pt-2">
            <span className="flex flex-col gap-1">
              <Swap
                delay="group-hover:delay-700"
                className="text-[9.5px] font-semibold"
                rest="Step 2 of 4"
                hover="Step 3 of 4"
              />
              <span className="block h-1 w-16 overflow-hidden rounded-full bg-[#e5e7eb]">
                <span
                  className={`block h-full w-1/2 rounded-full bg-[#7c3aed] ${T} group-hover:w-3/4 group-hover:delay-700`}
                />
              </span>
            </span>
            <span className="flex gap-1 font-semibold">
              <span className="rounded border border-[#d1d1d1] px-1.5 py-0.5">Back</span>
              <span className="rounded bg-[#7c3aed] px-1.5 py-0.5 text-white">Next</span>
            </span>
          </span>
          <Pointer className="top-[20px] left-[100px] group-hover:top-[62px] group-hover:left-[170px]" />
        </Sheet>
      }
    />
  ),
  lcsStates: (
    <Deck
      back={
        <Sheet className="flex flex-col items-center p-3 text-center">
          <span className="grid size-7 place-items-center rounded-full bg-[#f0f0f0] text-[#424242]">
            <Glyph d={D.report} className="size-3.5" />
          </span>
          <span className="mt-1.5 font-semibold">No requests yet</span>
          <span className="text-[9.5px] text-[#616161]">Requests you create appear here.</span>
          <span className="mt-2 rounded bg-[#0f6cbd] px-2 py-1 font-semibold text-white">
            New request
          </span>
        </Sheet>
      }
      front={
        <Sheet front className="h-[120px] p-3">
          <span
            className={`absolute inset-0 flex flex-col items-center justify-center text-center ${T} group-hover:opacity-0 group-hover:delay-500`}
          >
            <span className="grid size-7 place-items-center rounded-full bg-[#fde7e9] text-[#a6152e]">
              <Glyph d={D.warning} className="size-3.5" />
            </span>
            <span className="mt-1.5 font-semibold">Couldn&apos;t load requests</span>
            <span className="text-[9.5px] text-[#616161]">Check your connection.</span>
            <span className="mt-2 rounded border border-[#7c3aed] px-2 py-0.5 font-semibold text-[#5b21b6]">
              Try again
            </span>
          </span>
          <span
            className={`absolute inset-3 flex flex-col justify-center gap-2.5 opacity-0 ${T} group-hover:opacity-100 group-hover:delay-[600ms]`}
          >
            {[86, 64, 76].map((width) => (
              <span key={width} className="flex items-center gap-2 motion-safe:animate-pulse">
                <span className="size-5 shrink-0 rounded-full bg-[#ececec]" />
                <span className="flex flex-1 flex-col gap-1">
                  <span className="h-1.5 rounded bg-[#ececec]" style={{ width: `${width}%` }} />
                  <span className="h-1.5 w-1/2 rounded bg-[#f3f3f3]" />
                </span>
              </span>
            ))}
          </span>
          <Pointer className="top-[30px] left-[150px] group-hover:top-[98px] group-hover:left-[104px]" />
        </Sheet>
      }
    />
  ),
};

/** Whether a component has its own picture (otherwise the card shows a plain tile). */
export function hasComponentArt(componentName: string): boolean {
  return Object.hasOwn(ART, componentName);
}

export function ComponentArt({ componentName }: { componentName: string }) {
  return (
    <span aria-hidden="true" className="block">
      {ART[componentName] ?? (
        <span className="grid size-14 place-items-center rounded-2xl bg-[#0f6cbd] text-white">
          <Glyph d={D.plus} className="size-6" />
        </span>
      )}
    </span>
  );
}
