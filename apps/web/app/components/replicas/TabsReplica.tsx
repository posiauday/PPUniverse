"use client";

import { useId, useRef, useState, type KeyboardEvent } from "react";
import { ACTION_BUTTON, EventLog, FIELD, Formula, Group, OutputValue, pushLog } from "./parts";
import { fromPowerFx, type ReplicaApi } from "./replica";

/** A web replica of lcsTabs (MVP-049): the four looks, SelectedTab, OnChange, SelectTab, ItemsFromText. */

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

function TabStrip({
  items,
  selected,
  look,
  dark,
  label,
  onSelect,
  interactive = true,
}: {
  items: readonly string[];
  selected: string;
  look: Look;
  dark: boolean;
  label: string;
  onSelect?: (tab: string) => void;
  interactive?: boolean;
}) {
  const refs = useRef<Array<HTMLButtonElement | null>>([]);
  const ink = dark ? "text-white" : "text-[#242424]";
  const filledOn = dark ? "bg-[#115ea3] text-white" : "bg-[#0f6cbd] text-white";
  const underlineOn = dark ? "border-[#479ef5]" : "border-[#0f6cbd]";

  function onKey(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    const next =
      event.key === "ArrowRight"
        ? (index + 1) % items.length
        : event.key === "ArrowLeft"
          ? (index - 1 + items.length) % items.length
          : null;
    if (next === null) return;
    event.preventDefault();
    onSelect?.(items[next]!);
    refs.current[next]?.focus();
  }

  const tabClass = (current: boolean) => {
    const base = "min-h-9 px-3 text-sm font-semibold [font-family:'Segoe_UI',system-ui,sans-serif]";
    if (look === "Filled")
      return `${base} rounded ${current ? filledOn : dark ? "bg-[#333] text-white" : "bg-[#f0f0f0] text-[#242424]"}`;
    if (look === "Subtle")
      return `${base} rounded ${current ? (dark ? "bg-[#3d3d3d]" : "bg-[#e6e6e6]") : ""} ${ink}`;
    if (look === "Transparent")
      return `${base} ${ink} ${current ? "underline underline-offset-4" : ""}`;
    return `${base} border-b-[3px] ${current ? underlineOn : "border-transparent"} ${ink}`;
  };

  if (!interactive) {
    return (
      <span className="flex flex-wrap gap-1">
        {items.map((item) => (
          <span key={item} className={tabClass(item === selected)}>
            {item}
          </span>
        ))}
      </span>
    );
  }
  return (
    <div role="tablist" aria-label={label} className="flex flex-wrap gap-1">
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
          onClick={() => onSelect?.(item)}
          onKeyDown={(event) => onKey(event, index)}
          className={tabClass(item === selected)}
        >
          {item}
        </button>
      ))}
    </div>
  );
}

export function useTabsReplica(): ReplicaApi {
  const id = useId();
  const [list, setList] = useState("Overview, Details, History");
  const [look, setLook] = useState<Look>("Underline");
  const [selected, setSelected] = useState("Overview");
  const [target, setTarget] = useState("History");
  const [logs, setLogs] = useState<string[]>([]);
  const items = itemsFromText(list);
  const current = items.includes(selected) ? selected : (items[0] ?? "");

  const choose = (tab: string) => {
    if (tab === current) return;
    setSelected(tab);
    setLogs((entries) => pushLog(entries, `OnChange(Tab: "${tab}")`));
  };

  return {
    stage: (dark) => (
      <div className="w-full max-w-md">
        <TabStrip
          items={items}
          selected={current}
          look={look}
          dark={dark}
          label="Sections"
          onSelect={choose}
        />
        <p
          className={`mt-4 rounded border p-3 text-sm ${dark ? "border-[#444] text-white" : "border-[#e0e0e0] text-[#242424]"}`}
        >
          Content for <strong>{current}</strong>
        </p>
      </div>
    ),
    controls: (
      <div className="grid gap-3 lg:grid-cols-2">
        <Group kind="Input" title="Data in">
          <label htmlFor={`${id}-items`}>Items (comma-separated here)</label>
          <input
            id={`${id}-items`}
            className={FIELD}
            value={list}
            onChange={(e) => setList(e.target.value)}
          />
          <label htmlFor={`${id}-look`}>Look</label>
          <select
            id={`${id}-look`}
            className={FIELD}
            value={look}
            onChange={(e) => setLook(e.target.value as Look)}
          >
            {LOOKS.map((value) => (
              <option key={value}>{value}</option>
            ))}
          </select>
        </Group>
        <div className="flex flex-col gap-3">
          <Group kind="Output" title="State out">
            <p className="flex flex-wrap items-center gap-2">
              <code className="font-mono text-sm">tabsRequest.SelectedTab</code>
              <OutputValue>{JSON.stringify(current)}</OutputValue>
            </p>
          </Group>
          <Group kind="OutputFunction" title="ItemsFromText(List)">
            <Formula
              name={`tabsRequest.ItemsFromText(${JSON.stringify(list)})`}
              value={`[${items.map((item) => JSON.stringify(item)).join(", ")}]`}
            />
          </Group>
        </div>
        <Group kind="Event" title="OnChange(Tab)">
          <EventLog entries={logs} empty="Pick a tab, or use the arrow keys." />
        </Group>
        <Group kind="Action" title="SelectTab(Tab)">
          <label htmlFor={`${id}-target`}>Tab</label>
          <select
            id={`${id}-target`}
            className={FIELD}
            value={target}
            onChange={(e) => setTarget(e.target.value)}
          >
            {items.map((item) => (
              <option key={item}>{item}</option>
            ))}
          </select>
          <button
            type="button"
            className={ACTION_BUTTON}
            onClick={() => {
              setSelected(target);
              setLogs((entries) => pushLog(entries, `SelectTab("${target}")`));
            }}
          >
            Call tabsRequest.SelectTab(…)
          </button>
        </Group>
      </div>
    ),
    apply: (settings) => {
      if ("Items" in settings) setList(readItems(settings["Items"]!).join(", "));
      if ("Look" in settings) {
        const value = String(fromPowerFx(settings["Look"]!));
        if ((LOOKS as readonly string[]).includes(value)) setLook(value as Look);
      }
      if ("DefaultTab" in settings) setSelected(String(fromPowerFx(settings["DefaultTab"]!)));
    },
    thumbnail: (settings, dark) => {
      const items = settings["Items"]
        ? readItems(settings["Items"])
        : ["Overview", "Details", "History"];
      const lookValue = String(fromPowerFx(settings["Look"] ?? '"Underline"'));
      const thumbLook = (LOOKS as readonly string[]).includes(lookValue)
        ? (lookValue as Look)
        : "Underline";
      const selected = settings["DefaultTab"]
        ? String(fromPowerFx(settings["DefaultTab"]))
        : (items[0] ?? "");
      return (
        <TabStrip
          items={items}
          selected={selected}
          look={thumbLook}
          dark={dark}
          label="Sections"
          interactive={false}
        />
      );
    },
  };
}
