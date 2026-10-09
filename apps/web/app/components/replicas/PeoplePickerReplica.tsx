"use client";

import { useEffect, useId, useRef, useState, type CSSProperties } from "react";
import { useNotify } from "./notify";
import { cssColor, fromPowerFx, SEGOE, type ReplicaApi, type Wiring } from "./replica";

/**
 * A web replica of lcsPeoplePicker (MVP-049; docs/final-decisions.md, 2026-10-08,
 * "One live view"), 360 by 380, as its YAML lays it out, on a screen wired the
 * way its guide's "no connection yet" example is: a small table of made-up
 * people (colStaff), searched in OnSearch. As in Power Apps, the search box's
 * Text catches up only after you pause typing (TriggerOutput.Delayed), and the
 * component's timer then runs OnSearch once for each new search.
 */

export interface Person {
  DisplayName: string;
  Mail: string;
  JobTitle: string;
}

/** The preview screen's colStaff: made-up people at example.com. */
export const STAFF: readonly Person[] = [
  { DisplayName: "Avery Brooks", Mail: "avery.brooks@example.com", JobTitle: "Finance manager" },
  { DisplayName: "Jordan Lee", Mail: "jordan.lee@example.com", JobTitle: "Product owner" },
  { DisplayName: "Priya Nair", Mail: "priya.nair@example.com", JobTitle: "Developer" },
  { DisplayName: "Sam Rivera", Mail: "sam.rivera@example.com", JobTitle: "Maker" },
  { DisplayName: "Mateo Alvarez", Mail: "mateo.alvarez@example.com", JobTitle: "Support lead" },
  { DisplayName: "Chloé Martin", Mail: "chloe.martin@example.com", JobTitle: "Designer" },
  { DisplayName: "Kenji Watanabe", Mail: "kenji.watanabe@example.com", JobTitle: "Data analyst" },
  { DisplayName: "Amara Okafor", Mail: "amara.okafor@example.com", JobTitle: "HR partner" },
  { DisplayName: "Liam Walsh", Mail: "liam.walsh@example.com", JobTitle: "IT administrator" },
  { DisplayName: "Noah Fischer", Mail: "noah.fischer@example.com", JobTitle: "Sales manager" },
];

/** The screen's Me: LookUp(colStaff, Mail = "sam.rivera@example.com"). */
const ME = STAFF[3]!;
/** The screen's Suggestions: FirstN(colStaff, 3). */
const SUGGESTIONS = STAFF.slice(0, 3);

/** TriggerOutput.Delayed: how long after the last key the box's Text catches up. */
const TEXT_DELAY_MS = 500;
/** About half the component's 400 ms timer, the average wait for its next tick. */
const TIMER_WAIT_MS = 200;

interface Inputs {
  Label: string;
  Hint: string;
  Placeholder: string;
  MaxPeople: number;
  MinSearchLength: number;
  Required: boolean;
  AccentColor: string;
  Theme: string;
}

/** The inputs' defaults in the component's YAML. */
const DEFAULTS: Inputs = {
  Label: "People",
  Hint: "",
  Placeholder: "Search by name or email",
  MaxPeople: 0,
  MinSearchLength: 2,
  Required: false,
  AccentColor: "#0f6cbd",
  Theme: "Light",
};

/** Power Fx Trim: no spaces at either end, and single spaces between words. */
const trim = (text: string) => text.trim().replace(/ {2,}/g, " ");

/** Search(colStaff, Query, DisplayName, Mail): either column contains the text, ignoring case. */
export function searchStaff(staff: readonly Person[], query: string): Person[] {
  const needle = query.toLowerCase();
  return staff.filter(
    (person) =>
      person.DisplayName.toLowerCase().includes(needle) ||
      person.Mail.toLowerCase().includes(needle),
  );
}

/** The avatar's letters: the first letters of the first and last words. */
export function initials(name: string): string {
  const words = trim(name).split(" ");
  const last = words.length > 1 ? words[words.length - 1]!.charAt(0) : "";
  return (trim(name).charAt(0) + last).toUpperCase();
}

/**
 * The avatar's colour, Switch(Mod(Len(name) + 3 * Len(first name), 6), ...):
 * the same name always the same colour, and names of one length still differ.
 */
const AVATAR_COLOURS = ["#7c3aed", "#0f6cbd", "#0d8076", "#c22978", "#bc4b09", "#107c10"] as const;
export function avatarColour(name: string): string {
  const first = trim(name).split(" ")[0]!;
  return AVATAR_COLOURS[([...name].length + 3 * [...first].length) % 6]!;
}

const sameMail = (a: Person, b: Person) => a.Mail.toLowerCase() === b.Mail.toLowerCase();

/** What lblListMessage says under the search box, in its Switch's order. */
export function listMessage(state: {
  full: boolean;
  typed: string;
  minSearchLength: number;
  lastSearch: string;
  shown: number;
  found: number;
}): string {
  const searching = state.typed.length >= Math.max(1, state.minSearchLength);
  if (state.full) return "";
  if (state.typed.length > 0 && !searching)
    return `Type at least ${state.minSearchLength} characters to search.`;
  if (searching && state.lastSearch === state.typed && state.shown === 0)
    return state.found > 0
      ? "Everyone found is already chosen."
      : `No one found for "${state.typed}".`;
  return "";
}

/** What lblMessage says at the bottom: the error, then the limit, then the hint. */
export function fieldMessage(inputs: Inputs, count: number, touched: boolean): string {
  if (touched && inputs.Required && count === 0) return "⚠ Choose at least one person.";
  if (inputs.MaxPeople > 1 && count >= inputs.MaxPeople)
    return `That's the most this field allows (${inputs.MaxPeople}).`;
  return inputs.Hint;
}

function Avatar({ name, size }: { name: string; size: 28 | 32 }) {
  return (
    <span
      aria-hidden="true"
      style={{ backgroundColor: avatarColour(name) }}
      className={`grid shrink-0 place-items-center rounded-full font-semibold text-white ${
        size === 28 ? "size-7 text-[11px]" : "size-8 text-xs"
      }`}
    >
      {initials(name)}
    </span>
  );
}

function PersonRows({
  label,
  people,
  rows,
  dark,
  onAdd,
}: {
  label: string;
  people: Person[];
  rows: number;
  dark: boolean;
  onAdd: (person: Person) => void;
}) {
  return (
    <ul
      aria-label={label}
      style={{ maxHeight: rows * 48 }}
      className="overflow-y-auto motion-safe:animate-[lcs-screen-in_160ms_ease-out]"
    >
      {people.map((person) => (
        <li key={person.Mail}>
          <button
            type="button"
            title={person.Mail}
            aria-label={`Add ${person.DisplayName}`}
            onClick={() => onAdd(person)}
            className={`flex h-12 w-full items-center gap-3 rounded-md px-2 text-left ${
              dark
                ? "hover:bg-white/[0.08] active:bg-white/[0.12]"
                : "hover:bg-black/5 active:bg-black/10"
            }`}
          >
            <Avatar name={person.DisplayName} size={32} />
            <span className="min-w-0">
              <span className="block truncate text-sm font-semibold">{person.DisplayName}</span>
              <span
                className={`block truncate text-xs ${dark ? "text-[#adadad]" : "text-[#616161]"}`}
              >
                {person.JobTitle ? `${person.JobTitle} · ${person.Mail}` : person.Mail}
              </span>
            </span>
          </button>
        </li>
      ))}
    </ul>
  );
}

export function usePeoplePickerReplica(): ReplicaApi {
  const id = useId();
  const notify = useNotify();
  const [inputs, setInputs] = useState<Inputs>(DEFAULTS);
  // null until the user changes anything: the component shows DefaultPeople (none here) till then.
  const [chosen, setChosen] = useState<Person[] | null>(null);
  const [draft, setDraft] = useState("");
  const [text, setText] = useState("");
  const [lastSearch, setLastSearch] = useState("");
  const [results, setResults] = useState<Person[]>([]);
  const searchRef = useRef<HTMLInputElement>(null);
  const [refocus, setRefocus] = useState(0);

  const dark = inputs.Theme === "Dark";
  const touched = chosen !== null;
  const people = chosen ?? [];
  const full = inputs.MaxPeople > 0 && people.length >= inputs.MaxPeople;
  const typed = trim(text);
  const searching = typed.length >= Math.max(1, inputs.MinSearchLength);
  const notChosen = (list: readonly Person[]) =>
    list.filter((person) => !people.some((other) => sameMail(person, other)));
  const shown = notChosen(results);
  const suggested = notChosen(SUGGESTIONS).slice(0, 3);
  const showSuggested = !full && typed === "" && suggested.length > 0;
  const showAddMe = !full && !people.some((other) => sameMail(other, ME));
  const message = fieldMessage(inputs, people.length, touched);
  const invalid = message.startsWith("⚠");
  const sub = dark ? "text-[#adadad]" : "text-[#616161]";

  // TriggerOutput.Delayed: Text follows the box once typing pauses.
  useEffect(() => {
    if (draft === text) return;
    const wait = setTimeout(() => setText(draft), TEXT_DELAY_MS);
    return () => clearTimeout(wait);
  }, [draft, text]);

  // tmrSearch: a new search, long enough, runs OnSearch, which fills Results from colStaff.
  useEffect(() => {
    if (typed === lastSearch || !searching) return;
    const tick = setTimeout(() => {
      setLastSearch(typed);
      setResults(searchStaff(STAFF, typed));
    }, TIMER_WAIT_MS);
    return () => clearTimeout(tick);
  }, [typed, lastSearch, searching]);

  // Power Apps leaves focus nowhere when the row or chip you used goes away; the
  // replica puts it back in the search box, so keyboard users aren't lost.
  useEffect(() => {
    if (refocus > 0) searchRef.current?.focus();
  }, [refocus]);

  const changed = (next: Person[]) => {
    setChosen(next);
    const emails = next.map((person) => person.Mail).join(";");
    notify(`Chosen: ${emails || "nobody"}`);
  };

  const add = (person: Person) => {
    if (!full && !people.some((other) => sameMail(other, person))) changed([...people, person]);
    else changed(people);
    setDraft("");
    setText("");
    setLastSearch("");
    setRefocus((count) => count + 1);
  };

  const remove = (person: Person) => {
    changed(people.filter((other) => !sameMail(other, person)));
    setRefocus((count) => count + 1);
  };

  const wiring: Wiring[] = [
    {
      control: "Screen1",
      property: "OnVisible",
      formula: `ClearCollect(colStaff, ${STAFF.map(
        (person) =>
          `{DisplayName: "${person.DisplayName}", Mail: "${person.Mail}", JobTitle: "${person.JobTitle}"}`,
      ).join(", ")})`,
    },
    {
      control: "lcsPeoplePicker_1",
      property: "OnSearch",
      formula: "ClearCollect(colFound, Search(colStaff, Query, DisplayName, Mail))",
    },
    { control: "lcsPeoplePicker_1", property: "Results", formula: "colFound" },
    { control: "lcsPeoplePicker_1", property: "Suggestions", formula: "FirstN(colStaff, 3)" },
    {
      control: "lcsPeoplePicker_1",
      property: "Me",
      formula: `LookUp(colStaff, Mail = "${ME.Mail}")`,
    },
    {
      control: "lcsPeoplePicker_1",
      property: "OnChange",
      formula: 'Notify("Chosen: " & If(IsBlank(ChosenEmails), "nobody", ChosenEmails))',
    },
    {
      control: "Text1",
      property: "Text",
      formula: '"Count: " & lcsPeoplePicker_1.Count & "   IsValid: " & lcsPeoplePicker_1.IsValid',
    },
    ...(dark ? [{ control: "Text1", property: "Color", formula: "RGBA(255, 255, 255, 1)" }] : []),
  ];

  const isValid = !(inputs.Required && people.length === 0);
  const listNote = listMessage({
    full,
    typed,
    minSearchLength: inputs.MinSearchLength,
    lastSearch,
    shown: shown.length,
    found: results.length,
  });
  const searchId = `${id}-search`;
  const messageId = `${id}-message`;

  return {
    screen: (
      <div
        style={{ "--accent": inputs.AccentColor } as CSSProperties}
        className={`w-[360px] max-w-full self-start text-left ${SEGOE} ${dark ? "text-white" : "text-[#242424]"}`}
      >
        <div className="flex h-[380px] flex-col">
          <div className="flex h-6 items-center justify-between gap-2">
            <label htmlFor={searchId} className="truncate text-sm font-semibold">
              {inputs.Label}
              {inputs.Required ? " *" : ""}
            </label>
            {showAddMe ? (
              <button
                type="button"
                aria-label={`Add me to ${inputs.Label}`}
                onClick={() => add(ME)}
                className={`inline-flex h-6 shrink-0 items-center gap-1 rounded px-2 text-xs font-semibold ${
                  dark
                    ? "text-white hover:bg-white/10"
                    : "text-[var(--accent)] hover:bg-[#f5f5f5] active:bg-[#e0e0e0]"
                }`}
              >
                <svg
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                  className="size-4"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                >
                  <circle cx="10" cy="8" r="4" />
                  <path d="M3 20c0-3.5 3-6 7-6 1.2 0 2.3.2 3.2.6M18 14v6M15 17h6" />
                </svg>
                Add me
              </button>
            ) : null}
          </div>

          {people.length > 0 ? (
            <ul
              aria-label={`${inputs.Label}, chosen`}
              className={`mt-1.5 grid max-h-20 gap-x-1.5 overflow-y-auto ${inputs.MaxPeople === 1 ? "grid-cols-1" : "grid-cols-2"}`}
            >
              {people.map((person) => (
                <li
                  key={person.Mail}
                  title={person.Mail}
                  className={`my-0.5 flex h-9 min-w-0 items-center gap-2 rounded-full pr-1 pl-1 motion-safe:animate-[lcs-screen-in_200ms_ease-out] ${
                    dark ? "bg-[#3d3d3d]" : "bg-[#f0f0f0]"
                  }`}
                >
                  <Avatar name={person.DisplayName} size={28} />
                  <span className="min-w-0 flex-1 truncate text-[13px]">{person.DisplayName}</span>
                  <button
                    type="button"
                    aria-label={`Remove ${person.DisplayName}`}
                    onClick={() => remove(person)}
                    className={`grid size-7 shrink-0 place-items-center rounded-full ${
                      dark ? "hover:bg-white/10" : "hover:bg-black/10"
                    }`}
                  >
                    <svg
                      viewBox="0 0 24 24"
                      aria-hidden="true"
                      className="size-3.5"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                    >
                      <path d="M6 6l12 12M18 6L6 18" />
                    </svg>
                  </button>
                </li>
              ))}
            </ul>
          ) : null}

          {!full ? (
            <div
              className={`group relative mt-1.5 flex h-10 shrink-0 items-center rounded-md border ${
                dark ? "bg-[#292929]" : "bg-white"
              } ${
                invalid
                  ? dark
                    ? "border-[#f1707b]"
                    : "border-[#c4314b]"
                  : dark
                    ? "border-[#666] border-b-[#adadad]"
                    : "border-[#d1d1d1] border-b-[#616161]"
              }`}
            >
              <svg
                viewBox="0 0 24 24"
                aria-hidden="true"
                className={`pointer-events-none absolute left-2.5 size-4 ${sub}`}
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
              >
                <circle cx="10.5" cy="10.5" r="6" />
                <path d="M15 15l5 5" />
              </svg>
              <input
                ref={searchRef}
                id={searchId}
                type="text"
                role="searchbox"
                autoComplete="off"
                value={draft}
                placeholder={inputs.Placeholder}
                aria-invalid={invalid || undefined}
                aria-describedby={messageId}
                aria-label={`${inputs.Label}, search people${people.length > 0 ? `, ${people.length} chosen` : ""}`}
                onChange={(event) => setDraft(event.target.value)}
                className={`h-full w-full rounded-md bg-transparent pr-10 pl-8 text-sm ${
                  dark ? "placeholder:text-[#8a8a8a]" : "placeholder:text-[#707070]"
                }`}
              />
              {draft ? (
                <button
                  type="button"
                  aria-label="Clear search"
                  onClick={() => {
                    setDraft("");
                    setText("");
                    searchRef.current?.focus();
                  }}
                  className={`absolute right-1 grid size-8 place-items-center rounded ${dark ? "hover:bg-white/10" : "hover:bg-black/5"}`}
                >
                  <svg
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                    className="size-3.5"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                  >
                    <path d="M6 6l12 12M18 6L6 18" />
                  </svg>
                </button>
              ) : null}
              {/* Fluent's focus underline grows from the middle in the accent colour. */}
              <span
                aria-hidden="true"
                className="pointer-events-none absolute inset-x-1 -bottom-px h-0.5 scale-x-0 rounded-full bg-[var(--accent)] group-focus-within:scale-x-100 motion-safe:transition-transform motion-safe:duration-200 motion-safe:ease-out"
              />
            </div>
          ) : null}

          <div className="mt-1.5 min-h-0">
            {!full && searching && shown.length > 0 ? (
              <PersonRows
                key={lastSearch}
                label="Search results"
                people={shown}
                rows={4}
                dark={dark}
                onAdd={add}
              />
            ) : null}
            {showSuggested ? (
              <>
                <p className={`h-5 pl-2 text-xs font-semibold ${sub}`}>Suggested</p>
                <PersonRows
                  label="Suggested people"
                  people={suggested}
                  rows={3}
                  dark={dark}
                  onAdd={add}
                />
              </>
            ) : null}
            <p role="status" className={`pl-2 text-[13px] ${sub}`}>
              {listNote}
            </p>
          </div>

          <p
            id={messageId}
            className={`mt-auto h-5 truncate text-xs ${invalid ? (dark ? "text-[#f1707b]" : "text-[#c4314b]") : sub}`}
          >
            {message}
          </p>
        </div>
        <p className="mt-6 text-sm">
          Count: {people.length} IsValid: {String(isValid)}
        </p>
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
      setChosen(null);
      setDraft("");
      setText("");
      setLastSearch("");
      setResults([]);
    },
    dark,
    wiring,
  };
}
