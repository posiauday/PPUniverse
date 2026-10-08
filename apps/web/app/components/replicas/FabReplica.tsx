"use client";

import { useState, type ReactNode } from "react";
import { readButtons } from "./DialogReplica";
import { useNotify } from "./notify";
import { fromPowerFx, SEGOE, type ReplicaApi } from "./replica";

/**
 * A web replica of lcsFab 0.2.0 (MVP-049; docs/final-decisions.md, 2026-10-08,
 * "One live view"): the floating action button in the corner of the screen,
 * 40, 56 or 72 pixels, extended with its label, disabled, or a speed dial whose
 * menu opens up or down. Without a speed dial a click runs OnSelect; with one it
 * opens the menu, and choosing an item runs OnItemSelect(Key, Label). The
 * preview screen wires both to Notify.
 */

interface Item {
  Key: string;
  Icon: string;
  Label: string;
}

interface Inputs {
  Icon: string;
  Label: string;
  Extended: boolean;
  Size: string;
  SpeedDial: boolean;
  Items: Item[];
  HiddenKeys: string;
  DisabledKeys: string;
  Direction: string;
  Disabled: boolean;
}

/** The inputs' defaults in the component's YAML. */
const DEFAULTS: Inputs = {
  Icon: "Add",
  Label: "Add new",
  Extended: false,
  Size: "Regular",
  SpeedDial: false,
  Items: [
    { Key: "note", Icon: "Edit", Label: "New note" },
    { Key: "photo", Icon: "Camera", Label: "Take a photo" },
    { Key: "upload", Icon: "Upload", Label: "Upload a file" },
  ],
  HiddenKeys: "",
  DisabledKeys: "",
  Direction: "Up",
  Disabled: false,
};

/** IconSvg, the component's own glyphs; anything else is a plus. */
const ICONS: Record<string, ReactNode> = {
  Edit: (
    <>
      <path d="M4 20h4L19 9l-4-4L4 16z" />
      <path d="M13 7l4 4" />
    </>
  ),
  Send: <path d="M3 11l18-8-8 18-2-8z" />,
  Search: (
    <>
      <circle cx="11" cy="11" r="7" />
      <path d="M20 20l-4-4" />
    </>
  ),
  Upload: <path d="M12 16V4M7 9l5-5 5 5M4 20h16" />,
  Download: <path d="M12 4v12M7 11l5 5 5-5M4 20h16" />,
  Camera: (
    <>
      <path d="M4 8h4l2-3h4l2 3h4v11H4z" />
      <circle cx="12" cy="13" r="3" />
    </>
  ),
  Check: <path d="M5 12l5 5 9-10" />,
  Share: (
    <>
      <circle cx="6" cy="12" r="2" />
      <circle cx="18" cy="6" r="2" />
      <circle cx="18" cy="18" r="2" />
      <path d="M8 11l8-4M8 13l8 4" />
    </>
  ),
  Chat: <path d="M4 5h16v11H9l-5 4z" />,
  Close: <path d="M6 6l12 12M18 6L6 18" />,
};

function Glyph({ name, size, color }: { name: string; size: number; color: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className="shrink-0"
    >
      {ICONS[name] ?? <path d="M12 5v14M5 12h14" />}
    </svg>
  );
}

/** Size: the button's side, its corner radius, its icon and its label size. */
const SIZES: Record<string, { side: number; radius: number; icon: number; text: string }> = {
  Small: { side: 40, radius: 12, icon: 20, text: "text-[13px]" },
  Regular: { side: 56, radius: 16, icon: 24, text: "text-sm" },
  Large: { side: 72, radius: 22, icon: 32, text: "text-base" },
};

/** "a, b" -> ["a", "b"], as Split and Trim read HiddenKeys and DisabledKeys. */
function keys(list: string): string[] {
  return list
    .split(",")
    .map((key) => key.trim())
    .filter((key) => key !== "");
}

function read(settings: Record<string, string>): Inputs {
  const next = { ...DEFAULTS };
  for (const [key, formula] of Object.entries(settings)) {
    if (key === "Items")
      next.Items = readButtons(formula).map((row) => ({
        Key: row.Key,
        Label: row.Label,
        Icon: formula.match(new RegExp(`Key:\\s*"${row.Key}"[^}]*Icon:\\s*"([^"]*)"`))?.[1] ?? "",
      }));
    else if (key in next) (next as unknown as Record<string, unknown>)[key] = fromPowerFx(formula);
  }
  return next;
}

export function useFabReplica(): ReplicaApi {
  const notify = useNotify();
  const [inputs, setInputs] = useState<Inputs>(DEFAULTS);
  const [open, setOpen] = useState(false);

  const size = SIZES[inputs.Size] ?? SIZES["Regular"]!;
  const down = inputs.Direction === "Down";
  const menuOpen = open && inputs.SpeedDial;
  const hidden = keys(inputs.HiddenKeys);
  const disabled = keys(inputs.DisabledKeys);
  const items = inputs.Items.filter((item) => !hidden.includes(item.Key));
  const accent = "#0f6cbd";

  const fab = (
    <button
      type="button"
      aria-label={`${inputs.Label}${inputs.SpeedDial ? (menuOpen ? ", close menu" : ", open menu") : ""}`}
      aria-expanded={inputs.SpeedDial ? menuOpen : undefined}
      aria-disabled={inputs.Disabled || undefined}
      title={inputs.Label}
      onClick={() => {
        if (inputs.Disabled) return;
        if (inputs.SpeedDial) setOpen((value) => !value);
        else notify(`${inputs.Label} selected`);
      }}
      style={{ height: size.side, minWidth: size.side, borderRadius: size.radius }}
      className={`relative inline-flex shrink-0 items-center overflow-hidden font-semibold ${SEGOE} ${size.text} ${
        inputs.Extended ? "gap-2 pr-4" : "justify-center"
      } ${
        inputs.Disabled
          ? "cursor-not-allowed bg-[#e0e0e0] text-[#707070]"
          : "bg-[#0f6cbd] text-white shadow-[0_2px_4px_rgba(0,0,0,0.14),0_6px_14px_rgba(0,0,0,0.18)] after:absolute after:inset-0 after:bg-white after:opacity-0 hover:after:opacity-[0.12] active:after:opacity-[0.24]"
      }`}
    >
      <span
        style={{ width: size.side, height: size.side }}
        className="grid shrink-0 place-items-center"
      >
        <Glyph
          name={menuOpen ? "Close" : inputs.Icon}
          size={size.icon}
          color={inputs.Disabled ? "#8a8a8a" : "#ffffff"}
        />
      </span>
      {inputs.Extended ? (
        <span className="-ml-3 max-w-[200px] truncate">{inputs.Label}</span>
      ) : null}
    </button>
  );

  const menu = menuOpen ? (
    <ul className={`flex flex-col items-end ${down ? "mt-3" : "mb-3"}`}>
      {items.map((item) => {
        const off = disabled.includes(item.Key);
        return (
          <li key={item.Key} className="py-1">
            <button
              type="button"
              aria-disabled={off || undefined}
              onClick={() => {
                if (off) return;
                setOpen(false);
                notify(`You chose ${item.Label} (${item.Key})`);
              }}
              className={`flex h-10 items-center gap-3 rounded-full bg-white pr-3 pl-4 text-sm font-semibold shadow-[0_1px_3px_rgba(0,0,0,0.12),0_4px_10px_rgba(0,0,0,0.12)] ${SEGOE} ${
                off
                  ? "cursor-not-allowed text-[#707070]"
                  : "text-[#242424] hover:bg-[#f3f8fc] active:bg-[#e7f0f9]"
              }`}
            >
              {item.Label}
              <Glyph name={item.Icon} size={20} color={accent} />
            </button>
          </li>
        );
      })}
    </ul>
  ) : null;

  return {
    screen: (
      <div
        className={`absolute right-6 isolate flex flex-col items-end ${down ? "top-6" : "bottom-6"}`}
      >
        {menuOpen ? (
          <button
            type="button"
            aria-label="Close menu"
            onClick={() => setOpen(false)}
            className="absolute inset-0 -z-10 cursor-default"
          />
        ) : null}
        {down ? (
          <>
            {fab}
            {menu}
          </>
        ) : (
          <>
            {menu}
            {fab}
          </>
        )}
      </div>
    ),
    apply: (settings) => {
      setInputs(read(settings));
      setOpen(false);
    },
    dark: false,
    wiring: [
      {
        control: "lcsFab_1",
        property: "OnSelect",
        formula: 'Notify(lcsFab_1.Label & " selected")',
      },
      {
        control: "lcsFab_1",
        property: "OnItemSelect",
        formula: 'Notify("You chose " & Label & " (" & Key & ")")',
      },
    ],
  };
}
