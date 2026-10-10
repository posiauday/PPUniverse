"use client";

import { useEffect, useId, useRef, useState, type CSSProperties, type KeyboardEvent } from "react";
import { ThemedButton } from "./themed";
import { useNotify } from "./notify";
import { cssColor, fromPowerFx, SEGOE, type ReplicaApi } from "./replica";

/**
 * A web replica of lcsDatePicker 0.1.0 (MVP-049; docs/final-decisions.md,
 * 2026-10-08, "One live view"): the modern date picker's field and calendar,
 * in Date, DateTime (with the time list) and Range modes, the quick picks, the
 * earliest and latest dates, weekends and blocked dates refused with the
 * component's messages, and the time zone in the hint. The preview screen
 * wires OnChange to Notify and shows Days and WorkingDays in a label.
 */

type Mode = "Date" | "DateTime" | "Range";

interface Inputs {
  Label: string;
  Hint: string;
  Mode: Mode;
  TimeStep: number;
  Use24Hour: boolean;
  DefaultTime: string;
  BlockWeekends: boolean;
  Required: boolean;
  ShowPresets: boolean;
  ShowTimeZone: boolean;
  StartOfWeek: string;
  MinToday: boolean;
  AccentColor: string;
  Theme: string;
}

/** The inputs' defaults in the component's YAML (MinDate 1900 and MaxDate 2100 need no switch here). */
const DEFAULTS: Inputs = {
  Label: "Due date",
  Hint: "",
  Mode: "Date",
  TimeStep: 15,
  Use24Hour: false,
  DefaultTime: "09:00",
  BlockWeekends: false,
  Required: false,
  ShowPresets: true,
  ShowTimeZone: true,
  StartOfWeek: "Sunday",
  MinToday: false,
  AccentColor: "#0f6cbd",
  Theme: "Light",
};

const DAY_MS = 86_400_000;
const atMidnight = (date: Date) => new Date(date.getFullYear(), date.getMonth(), date.getDate());
const addDays = (date: Date, days: number) =>
  new Date(date.getFullYear(), date.getMonth(), date.getDate() + days);
const sameDay = (a: Date, b: Date) => atMidnight(a).getTime() === atMidnight(b).getTime();
/** Weekday(date, StartOfWeek.Monday): Monday 1 to Sunday 7. */
const isoWeekday = (date: Date) => ((date.getDay() + 6) % 7) + 1;

/** The date picker's LongAbbreviated format, such as Jan 15, 2026. */
export function formatDate(date: Date): string {
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

/** The time list: every TimeStep minutes from midnight, as the component's Text format writes them. */
export function timeList(step: number, use24Hour: boolean): string[] {
  const every = Math.max(5, step);
  return Array.from({ length: Math.floor(1440 / every) }, (_, index) => {
    const minutes = index * every;
    const hour = Math.floor(minutes / 60);
    const minute = String(minutes % 60).padStart(2, "0");
    if (use24Hour) return `${String(hour).padStart(2, "0")}:${minute}`;
    return `${hour % 12 === 0 ? 12 : hour % 12}:${minute} ${hour < 12 ? "AM" : "PM"}`;
  });
}

/** WorkingDays(Start, End): Monday to Friday, both ends included. */
export function workingDays(start: Date, end: Date): number {
  let count = 0;
  for (let day = atMidnight(start); day <= atMidnight(end); day = addDays(day, 1))
    if (isoWeekday(day) <= 5) count += 1;
  return count;
}

/**
 * The quick picks: [label, start, end] for the mode, as the component's buttons
 * set them. With weekends blocked, a weekend start moves on to Monday and a
 * weekend end back to Friday, so a quick pick is never refused.
 */
export function presets(
  mode: Mode,
  today: Date,
  blockWeekends = false,
): Array<[string, Date, Date | null]> {
  const day = atMidnight(today);
  const forward = (date: Date) =>
    blockWeekends && isoWeekday(date) > 5 ? addDays(date, 8 - isoWeekday(date)) : date;
  const back = (date: Date) =>
    blockWeekends && isoWeekday(date) > 5 ? addDays(date, 5 - isoWeekday(date)) : date;
  if (mode === "Range") {
    const monday = addDays(day, 1 - isoWeekday(day));
    return [
      ["This week", forward(monday), back(addDays(monday, 6))],
      ["Next 7 days", forward(day), back(addDays(day, 6))],
      ["Last 30 days", forward(addDays(day, -29)), back(day)],
    ];
  }
  return [
    ["Today", forward(day), null],
    ["Tomorrow", forward(addDays(day, 1)), null],
    ["In a week", forward(addDays(day, 7)), null],
  ];
}

/** The component's checks, in its order. Empty text when it's fine. */
export function dateProblem(
  inputs: Pick<Inputs, "Mode" | "Required" | "BlockWeekends">,
  start: Date | null,
  end: Date | null,
): string {
  if (inputs.Required && !start) return "Choose a date.";
  if (inputs.Mode === "Range" && inputs.Required && !end) return "Choose an end date.";
  if (inputs.Mode === "Range" && start && end && end < start)
    return "The end date must be on or after the start date.";
  const weekend = (date: Date | null) => date !== null && isoWeekday(date) > 5;
  if (inputs.BlockWeekends && (weekend(start) || (inputs.Mode === "Range" && weekend(end))))
    return "Choose a weekday. Weekends aren't available.";
  return "";
}

const CalendarIcon = () => (
  <svg
    viewBox="0 0 24 24"
    className="size-4 shrink-0"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    aria-hidden="true"
  >
    <rect x="3.5" y="5" width="17" height="15" rx="2" />
    <path d="M3.5 9.5h17M8 3v4M16 3v4" />
  </svg>
);

function Calendar({
  value,
  min,
  onPick,
  onClose,
  mondayFirst,
  dark,
}: {
  value: Date | null;
  min: Date | null;
  onPick: (date: Date) => void;
  onClose: () => void;
  mondayFirst: boolean;
  dark: boolean;
}) {
  const [focus, setFocus] = useState(() => value ?? atMidnight(new Date()));
  const gridRef = useRef<HTMLDivElement>(null);
  const today = atMidnight(new Date());
  const first = new Date(focus.getFullYear(), focus.getMonth(), 1);
  const lead = mondayFirst ? (first.getDay() + 6) % 7 : first.getDay();
  const days = Array.from({ length: 42 }, (_, index) => addDays(first, index - lead));
  const names = mondayFirst
    ? ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"]
    : ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

  useEffect(() => {
    gridRef.current?.querySelector<HTMLButtonElement>(`[data-day="${focus.getTime()}"]`)?.focus();
  }, [focus]);

  function onKey(event: KeyboardEvent<HTMLDivElement>) {
    const move: Record<string, number> = {
      ArrowLeft: -1,
      ArrowRight: 1,
      ArrowUp: -7,
      ArrowDown: 7,
    };
    if (event.key in move) {
      event.preventDefault();
      setFocus((current) => addDays(current, move[event.key]!));
    } else if (event.key === "Escape") {
      event.preventDefault();
      onClose();
    }
  }

  const month = (delta: number) =>
    setFocus((current) => new Date(current.getFullYear(), current.getMonth() + delta, 1));

  return (
    <div
      className={`absolute top-full left-0 z-20 mt-1 w-[17.5rem] rounded-lg p-3 shadow-[0_8px_24px_rgba(0,0,0,0.18)] ${SEGOE} ${
        dark ? "bg-[#292929] text-white" : "bg-white text-[#242424]"
      }`}
    >
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold" aria-live="polite">
          {first.toLocaleDateString("en-US", { month: "long", year: "numeric" })}
        </p>
        <span className="flex gap-1">
          {[
            ["Previous month", -1, "M15 6l-6 6 6 6"],
            ["Next month", 1, "M9 6l6 6-6 6"],
          ].map(([label, delta, path]) => (
            <button
              key={label as string}
              type="button"
              aria-label={label as string}
              onClick={() => month(delta as number)}
              className={`grid size-8 place-items-center rounded ${dark ? "hover:bg-[#3d3d3d]" : "hover:bg-[#f0f0f0]"}`}
            >
              <svg
                viewBox="0 0 24 24"
                className="size-4"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                aria-hidden="true"
              >
                <path d={path as string} />
              </svg>
            </button>
          ))}
        </span>
      </div>
      <div className="mt-2 grid grid-cols-7 text-center text-xs" aria-hidden="true">
        {names.map((name) => (
          <span key={name} className={dark ? "text-[#adadad]" : "text-[#616161]"}>
            {name}
          </span>
        ))}
      </div>
      <div ref={gridRef} onKeyDown={onKey} className="mt-1 grid grid-cols-7 gap-0.5">
        {days.map((day) => {
          const outside = day.getMonth() !== first.getMonth();
          const disabled = min !== null && day < min;
          const selected = value !== null && sameDay(day, value);
          return (
            <button
              key={day.getTime()}
              type="button"
              data-day={day.getTime()}
              tabIndex={sameDay(day, focus) ? 0 : -1}
              aria-label={day.toLocaleDateString("en-US", {
                weekday: "long",
                month: "long",
                day: "numeric",
                year: "numeric",
              })}
              aria-pressed={selected}
              aria-disabled={disabled || undefined}
              onClick={() => (disabled ? undefined : onPick(day))}
              style={selected ? { background: "var(--accent)", color: "#fff" } : undefined}
              className={`grid h-8 place-items-center rounded text-[13px] ${
                disabled
                  ? "cursor-not-allowed text-[#bdbdbd] line-through"
                  : outside
                    ? dark
                      ? "text-[#8a8a8a]"
                      : "text-[#707070]"
                    : ""
              } ${!selected && !disabled ? (dark ? "hover:bg-[#3d3d3d]" : "hover:bg-[#f0f0f0]") : ""} ${
                sameDay(day, today) && !selected ? "ring-1 ring-[var(--accent)] ring-inset" : ""
              }`}
            >
              {day.getDate()}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function DateBox({
  label,
  value,
  min,
  invalid,
  onPick,
  mondayFirst,
  dark,
  className,
}: {
  label: string;
  value: Date | null;
  min: Date | null;
  invalid: boolean;
  onPick: (date: Date) => void;
  mondayFirst: boolean;
  dark: boolean;
  className: string;
}) {
  const [open, setOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const boxRef = useRef<HTMLDivElement>(null);
  const close = () => {
    setOpen(false);
    buttonRef.current?.focus();
  };

  // Like the modern date picker, a click anywhere else closes the calendar.
  useEffect(() => {
    if (!open) return;
    const away = (event: MouseEvent) => {
      if (!boxRef.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", away);
    return () => document.removeEventListener("mousedown", away);
  }, [open]);

  return (
    <div ref={boxRef} className={`relative ${className}`}>
      <button
        ref={buttonRef}
        type="button"
        aria-label={`${label}: ${value ? formatDate(value) : "no date chosen"}`}
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
        className={`flex h-10 w-full items-center justify-between gap-2 rounded-md border px-3 text-left text-sm ${
          dark ? "bg-[#292929] text-white" : "bg-white text-[#242424]"
        } ${invalid ? "border-[#c4314b]" : dark ? "border-[#666]" : "border-[#d1d1d1] border-b-[#616161]"}`}
      >
        <span className={value ? "" : dark ? "text-[#adadad]" : "text-[#707070]"}>
          {value ? formatDate(value) : "Select a date"}
        </span>
        <CalendarIcon />
      </button>
      {open ? (
        <Calendar
          value={value}
          min={min}
          mondayFirst={mondayFirst}
          dark={dark}
          onClose={close}
          onPick={(date) => {
            onPick(date);
            close();
          }}
        />
      ) : null}
    </div>
  );
}

function timeZoneLabel(): string {
  const offset = -new Date().getTimezoneOffset() / 60;
  return `Times are in your time zone (UTC${offset >= 0 ? "+" : "-"}${Math.abs(offset)}).`;
}

export function useDatePickerReplica(): ReplicaApi {
  const id = useId();
  const notify = useNotify();
  const [inputs, setInputs] = useState<Inputs>(DEFAULTS);
  const [start, setStart] = useState<Date | null>(null);
  const [end, setEnd] = useState<Date | null>(null);
  const [time, setTime] = useState(() => timeList(DEFAULTS.TimeStep, DEFAULTS.Use24Hour)[36]!);
  const [touched, setTouched] = useState(false);
  const [zone, setZone] = useState("");

  // The time zone is the reader's own, known only in the browser.
  useEffect(() => setZone(timeZoneLabel()), []);

  const dark = inputs.Theme === "Dark";
  const times = timeList(inputs.TimeStep, inputs.Use24Hour);
  const problem = touched ? dateProblem(inputs, start, end) : "";
  const min = inputs.MinToday ? atMidnight(new Date()) : null;
  const mondayFirst = inputs.StartOfWeek === "Monday";
  const hint = [inputs.Hint, inputs.Mode === "DateTime" && inputs.ShowTimeZone ? zone : ""]
    .filter(Boolean)
    .join(" ");
  const messageId = `${id}-message`;

  const announce = (from: Date | null, to: Date | null, at: string) => {
    if (!from) return;
    const when = inputs.Mode === "DateTime" ? `${formatDate(from)} ${at}` : formatDate(from);
    notify(`Chosen: ${when}${to ? ` to ${formatDate(to)}` : ""}`);
  };

  const days =
    inputs.Mode === "Range" && start && end
      ? Math.round((end.getTime() - start.getTime()) / DAY_MS) + 1
      : 0;

  return {
    // The screen keeps room below the field for the calendar, which Studio draws above everything else.
    screen: (
      <div
        style={{ "--accent": inputs.AccentColor } as CSSProperties}
        className={`min-h-[25rem] w-[340px] max-w-full self-start text-left ${SEGOE} ${dark ? "text-white" : "text-[#242424]"}`}
      >
        <p className="text-sm font-semibold">
          {inputs.Label}
          {inputs.Required ? " *" : ""}
        </p>
        {inputs.ShowPresets ? (
          <div className="mt-1 flex flex-wrap gap-2">
            {presets(inputs.Mode, new Date(), inputs.BlockWeekends).map(([label, from, to]) => (
              <ThemedButton
                key={label}
                label={label}
                appearance="Secondary"
                dark={dark}
                size="h-8 w-[104px] text-xs"
                onClick={() => {
                  setStart(from);
                  setEnd(to);
                  setTouched(true);
                  announce(from, to, time);
                }}
              />
            ))}
          </div>
        ) : null}
        <div className="mt-1.5 flex gap-2">
          <DateBox
            label={inputs.Mode === "Range" ? `${inputs.Label}, start date` : inputs.Label}
            value={start}
            min={min}
            invalid={problem !== ""}
            mondayFirst={mondayFirst}
            dark={dark}
            className="min-w-0 flex-1"
            onPick={(date) => {
              setStart(date);
              setTouched(true);
              announce(date, inputs.Mode === "Range" ? end : null, time);
            }}
          />
          {inputs.Mode === "Range" ? (
            <DateBox
              label={`${inputs.Label}, end date`}
              value={end}
              min={min}
              invalid={problem !== ""}
              mondayFirst={mondayFirst}
              dark={dark}
              className="min-w-0 flex-1"
              onPick={(date) => {
                setEnd(date);
                setTouched(true);
                announce(start, date, time);
              }}
            />
          ) : null}
          {inputs.Mode === "DateTime" ? (
            <select
              aria-label={`${inputs.Label}, time`}
              value={times.includes(time) ? time : times[0]}
              onChange={(event) => {
                setTime(event.target.value);
                setTouched(true);
                announce(start, null, event.target.value);
              }}
              className={`h-10 w-28 shrink-0 rounded-md border px-2 text-sm ${
                dark
                  ? "border-[#666] bg-[#292929] text-white"
                  : "border-[#d1d1d1] bg-white text-[#242424]"
              }`}
            >
              {times.map((entry) => (
                <option key={entry}>{entry}</option>
              ))}
            </select>
          ) : null}
        </div>
        <p
          id={messageId}
          role="status"
          className={`mt-1.5 min-h-5 text-xs ${problem ? (dark ? "text-[#f1707b]" : "text-[#c4314b]") : dark ? "text-[#adadad]" : "text-[#616161]"}`}
        >
          {problem ? `⚠ ${problem}` : hint}
        </p>
        {inputs.Mode === "Range" ? (
          <p className={`mt-5 text-sm ${dark ? "text-white" : "text-[#242424]"}`}>
            Days: {days} Working days: {start && end && end >= start ? workingDays(start, end) : 0}
          </p>
        ) : null}
      </div>
    ),
    apply: (settings) => {
      const next = { ...DEFAULTS };
      for (const [key, formula] of Object.entries(settings)) {
        if (key === "AccentColor") next.AccentColor = cssColor(formula, DEFAULTS.AccentColor);
        else if (key === "MinDate") next.MinToday = /Today\(\)/.test(formula);
        else if (key in next)
          (next as unknown as Record<string, unknown>)[key] = fromPowerFx(formula);
      }
      if (!["Date", "DateTime", "Range"].includes(next.Mode)) next.Mode = "Date";
      const list = timeList(next.TimeStep, next.Use24Hour);
      const [hour, minute] = next.DefaultTime.split(":").map(Number);
      const index = Math.round(((hour ?? 9) * 60 + (minute ?? 0)) / Math.max(5, next.TimeStep));
      setInputs(next);
      setTime(list[Math.min(index, list.length - 1)] ?? list[0]!);
      setStart(null);
      setEnd(null);
      setTouched(false);
    },
    dark: inputs.Theme === "Dark",
    wiring: [
      {
        control: "lcsDatePicker_1",
        property: "OnChange",
        formula:
          'Notify("Chosen: " & Text(Start, If(lcsDatePicker_1.Mode = "DateTime", "mmm d, yyyy h:mm AM/PM", "mmm d, yyyy")) & If(IsBlank(End), "", " to " & Text(End, "mmm d, yyyy")))',
      },
      ...(inputs.Mode === "Range"
        ? [
            {
              control: "Text1",
              property: "Text",
              formula:
                '"Days: " & lcsDatePicker_1.Days & "   Working days: " & lcsDatePicker_1.WorkingDays(lcsDatePicker_1.Value, lcsDatePicker_1.EndValue)',
            },
          ]
        : []),
    ],
  };
}
