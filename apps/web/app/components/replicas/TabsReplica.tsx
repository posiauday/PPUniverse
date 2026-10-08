"use client";

import { useRef, useState, type KeyboardEvent } from "react";
import { useNotify } from "./notify";
import { fromPowerFx, SEGOE, type ReplicaApi } from "./replica";

/**
 * A web replica of lcsTabs (MVP-049; docs/final-decisions.md, 2026-10-08,
 * "One live view"): the modern tab list inside the component, 480 by 48, in its
 * four looks. Choosing a tab changes SelectedTab and runs OnChange(Tab); the
 * preview screen shows SelectedTab in a text label and wires OnChange to Notify.
 */

const LOOKS = ["Underline", "Filled", "Subtle", "Transparent"] as const;
type Look = (typeof LOOKS)[number];

/** ItemsFromText, as the component computes it: split on commas, trim each. */
export function itemsFromText(list: string): string[] {
  return list
    .split(",")
    .map((item) => item.trim())
    .filter((item) => item !== "");
}

/** Reads a Power Fx table of text, such as ["Open", "Done"], into strings. */
function readItems(formula: string): string[] {
  return [...formula.matchAll(/"((?:[^"]|"")*)"/g)].map((match) => match[1]!.replace(/""/g, '"'));
}

interface Inputs {
  Items: string[];
  DefaultTab: string;
  Look: Look;
  AccessibleName: string;
}

/** The inputs' defaults in the component's YAML. */
const DEFAULTS: Inputs = {
  Items: ["Overview", "Details", "History"],
  DefaultTab: "Overview",
  Look: "Underline",
  AccessibleName: "Sections",
};

function TabStrip({
  items,
  selected,
  look,
  label,
  onSelect,
}: {
  items: readonly string[];
  selected: string;
  look: Look;
  label: string;
  onSelect: (tab: string) => void;
}) {
  const refs = useRef<Array<HTMLButtonElement | null>>([]);

  function onKey(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    const next =
      event.key === "ArrowRight"
        ? (index + 1) % items.length
        : event.key === "ArrowLeft"
          ? (index - 1 + items.length) % items.length
          : null;
    if (next === null) return;
    event.preventDefault();
    onSelect(items[next]!);
    refs.current[next]?.focus();
  }

  const tabClass = (current: boolean) => {
    const base = `min-h-9 px-3 text-sm font-semibold ${SEGOE}`;
    if (look === "Filled")
      return `${base} rounded ${current ? "bg-[#0f6cbd] text-white" : "bg-[#f0f0f0] text-[#242424] hover:bg-[#e6e6e6]"}`;
    if (look === "Subtle")
      return `${base} rounded text-[#242424] ${current ? "bg-[#e6e6e6]" : "hover:bg-[#f5f5f5]"}`;
    if (look === "Transparent")
      return `${base} text-[#242424] ${current ? "underline underline-offset-4" : "hover:underline"}`;
    return `${base} border-b-[3px] text-[#242424] ${current ? "border-[#0f6cbd]" : "border-transparent hover:border-[#d1d1d1]"}`;
  };

  return (
    <div role="tablist" aria-label={label} className="flex h-12 flex-wrap items-center gap-1">
      {items.map((item, index) => (
        <button
          key={item}
          ref={(element) => {
            refs.current[index] = element;
          }}
          type="button"
          role="tab"
          aria-selected={item === selected}
          tabIndex={item === selected ? 0 : -1}
          onClick={() => onSelect(item)}
          onKeyDown={(event) => onKey(event, index)}
          className={`${tabClass(item === selected)} motion-safe:transition-colors motion-safe:duration-100`}
        >
          {item}
        </button>
      ))}
    </div>
  );
}

export function useTabsReplica(): ReplicaApi {
  const notify = useNotify();
  const [inputs, setInputs] = useState<Inputs>(DEFAULTS);
  const [selected, setSelected] = useState(DEFAULTS.DefaultTab);
  const current = inputs.Items.includes(selected) ? selected : (inputs.Items[0] ?? "");

  return {
    screen: (
      <div className={`w-[480px] max-w-full ${SEGOE}`}>
        <TabStrip
          items={inputs.Items}
          selected={current}
          look={inputs.Look}
          label={inputs.AccessibleName}
          onSelect={(tab) => {
            if (tab === current) return;
            setSelected(tab);
            notify(`Switched to ${tab}`);
          }}
        />
        <p className="mt-6 text-sm text-[#242424]">Showing: {current}</p>
      </div>
    ),
    apply: (settings) => {
      const next = { ...DEFAULTS };
      if ("Items" in settings) next.Items = readItems(settings["Items"]!);
      if ("DefaultTab" in settings) next.DefaultTab = String(fromPowerFx(settings["DefaultTab"]!));
      if ("AccessibleName" in settings)
        next.AccessibleName = String(fromPowerFx(settings["AccessibleName"]!));
      const look = String(fromPowerFx(settings["Look"] ?? '"Underline"'));
      // The component's Switch falls back to Underline for anything else.
      next.Look = (LOOKS as readonly string[]).includes(look) ? (look as Look) : "Underline";
      setInputs(next);
      setSelected(next.DefaultTab);
    },
    dark: false,
    wiring: [
      { control: "Text1", property: "Text", formula: '"Showing: " & lcsTabs_1.SelectedTab' },
      { control: "lcsTabs_1", property: "OnChange", formula: 'Notify("Switched to " & Tab)' },
    ],
  };
}
