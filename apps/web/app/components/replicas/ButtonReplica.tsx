"use client";

import { useState, type ReactNode } from "react";
import { useNotify } from "./notify";
import { fromPowerFx, SEGOE, type ReplicaApi } from "./replica";

/**
 * A web replica of lcsButton (MVP-049; docs/final-decisions.md, 2026-10-08,
 * "One live view"): the modern Power Apps button inside the component, 160 by
 * 40, as Studio shows it after the YAML is pasted. IsBusy shows "Working…" and
 * disables it; each click adds to ClickCount and runs OnClick(Count), which
 * the preview screen wires to Notify. The page says it is a replica and that
 * Studio may look slightly different.
 */

const APPEARANCES = ["Primary", "Secondary", "Outline", "Subtle"] as const;
type Appearance = (typeof APPEARANCES)[number];

/** Our own simple glyphs for a few Fluent icon names. */
const ICONS: Record<string, ReactNode> = {
  "": null,
  Checkmark: (
    <path
      d="M5 12l5 5L20 7"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  ),
  Send: (
    <path
      d="M3 11l18-8-8 18-2-8-8-2z"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinejoin="round"
    />
  ),
  Save: (
    <path
      d="M5 3h11l3 3v15H5zM8 3v6h8V3M8 21v-7h8v7"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
    />
  ),
  Add: <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />,
  Edit: (
    <path
      d="M4 20h4L19 9l-4-4L4 16zM14 6l4 4"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinejoin="round"
    />
  ),
  ArrowDownload: (
    <path
      d="M12 4v11M7 10l5 5 5-5M5 20h14"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  ),
  Delete: (
    <path
      d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
    />
  ),
};

const APPEARANCE_CLASS: Record<Appearance, { light: string; dark: string }> = {
  Primary: {
    light: "border-transparent bg-[#0f6cbd] text-white hover:bg-[#115ea3] active:bg-[#0c3b5e]",
    dark: "border-transparent bg-[#115ea3] text-white hover:bg-[#0f6cbd] active:bg-[#0c3b5e]",
  },
  Secondary: {
    light: "border-[#d1d1d1] bg-white text-[#242424] hover:bg-[#f5f5f5] active:bg-[#e0e0e0]",
    dark: "border-[#666] bg-[#292929] text-white hover:bg-[#3d3d3d] active:bg-[#1f1f1f]",
  },
  Outline: {
    light:
      "border-[#d1d1d1] bg-transparent text-[#242424] hover:border-[#9e9e9e] active:border-[#757575]",
    dark: "border-[#666] bg-transparent text-white hover:border-[#9e9e9e] active:border-[#adadad]",
  },
  Subtle: {
    light:
      "border-transparent bg-transparent text-[#242424] hover:bg-[#f5f5f5] active:bg-[#e0e0e0]",
    dark: "border-transparent bg-transparent text-white hover:bg-[#3d3d3d] active:bg-[#1f1f1f]",
  },
};

/** The button as it looks in Studio, for one set of inputs. */
export function ButtonFace({
  label,
  appearance,
  icon,
  busy,
  dark,
  onClick,
  as = "button",
  danger = false,
  disabled = false,
  size = "h-10 w-40",
}: {
  label: string;
  appearance: Appearance;
  icon: string;
  busy: boolean;
  dark: boolean;
  onClick?: () => void;
  as?: "button" | "span";
  /** A destructive action: red instead of the brand colour. */
  danger?: boolean;
  /** Greyed and unselectable. */
  disabled?: boolean;
  /** Size classes; the component's own button is 160 by 40. */
  size?: string;
}) {
  const off = busy || disabled;
  const look = off
    ? dark
      ? "border-[#424242] bg-[#141414] text-[#8a8a8a] cursor-not-allowed"
      : "border-[#e0e0e0] bg-[#f0f0f0] text-[#616161] cursor-not-allowed"
    : danger
      ? "border-transparent bg-[#c4314b] text-white hover:bg-[#a52a40]"
      : APPEARANCE_CLASS[appearance][dark ? "dark" : "light"];
  const className = `inline-flex max-w-full shrink-0 items-center justify-center gap-1.5 rounded border px-3 text-sm font-semibold ${SEGOE} motion-safe:transition-colors motion-safe:duration-100 ${size} ${look}`;
  const content = (
    <>
      {ICONS[icon] ? (
        <svg viewBox="0 0 24 24" className="size-[18px]" aria-hidden="true">
          {ICONS[icon]}
        </svg>
      ) : null}
      <span className="truncate">{busy ? "Working…" : label}</span>
    </>
  );
  if (as === "span") return <span className={className}>{content}</span>;
  return (
    <button
      type="button"
      className={className}
      aria-disabled={off || undefined}
      onClick={off ? undefined : onClick}
    >
      {content}
    </button>
  );
}

interface Inputs {
  Label: string;
  Appearance: Appearance;
  IconName: string;
  IsBusy: boolean;
}

/** The inputs' defaults in the component's YAML. */
const DEFAULTS: Inputs = { Label: "Save", Appearance: "Primary", IconName: "", IsBusy: false };

function readInputs(settings: Record<string, string>): Inputs {
  const next = { ...DEFAULTS };
  if ("Label" in settings) next.Label = String(fromPowerFx(settings["Label"]!));
  const appearance = String(fromPowerFx(settings["Appearance"] ?? '"Primary"'));
  // The component's Switch falls back to Primary for anything else.
  next.Appearance = (APPEARANCES as readonly string[]).includes(appearance)
    ? (appearance as Appearance)
    : "Primary";
  if ("IconName" in settings) next.IconName = String(fromPowerFx(settings["IconName"]!));
  if ("IsBusy" in settings) next.IsBusy = fromPowerFx(settings["IsBusy"]!) === true;
  return next;
}

export function useButtonReplica(): ReplicaApi {
  const notify = useNotify();
  const [inputs, setInputs] = useState<Inputs>(DEFAULTS);
  const [clicks, setClicks] = useState(0);

  return {
    screen: (
      <ButtonFace
        label={inputs.Label}
        appearance={inputs.Appearance}
        icon={inputs.IconName}
        busy={inputs.IsBusy}
        dark={false}
        onClick={() => {
          const count = clicks + 1;
          setClicks(count);
          notify(`Clicked ${count} ${count === 1 ? "time" : "times"}`, "Success");
        }}
      />
    ),
    apply: (settings) => {
      setInputs(readInputs(settings));
      setClicks(0);
    },
    dark: false,
    wiring: [
      {
        control: "lcsButton_1",
        property: "OnClick",
        formula:
          'Notify("Clicked " & Count & If(Count = 1, " time", " times"), NotificationType.Success)',
      },
    ],
  };
}
