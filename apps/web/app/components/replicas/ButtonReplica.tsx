"use client";

import { useEffect, useState, type CSSProperties, type ReactNode } from "react";
import { useNotify } from "./notify";
import { cssColor, fromPowerFx, SEGOE, type ReplicaApi } from "./replica";

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
  Warning: (
    <path
      d="M12 3l10 18H2zM12 10v5M12 18v.5"
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

/** Fluent works out hover and pressed from the brand colour (BasePaletteColor); this is close. */
const PRIMARY =
  "border-transparent bg-[var(--accent)] text-white hover:bg-[color-mix(in_srgb,var(--accent)_86%,black)] active:bg-[color-mix(in_srgb,var(--accent)_62%,black)]";

const APPEARANCE_CLASS: Record<Appearance, { light: string; dark: string }> = {
  Primary: {
    light: PRIMARY,
    dark: PRIMARY,
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
    // On a dark screen the component draws Subtle as Transparent: no hover fill under light text.
    dark: "border-transparent bg-transparent text-white",
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
  accent = "#0f6cbd",
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
  /** The brand colour (BasePaletteColor) a Primary button is filled with. */
  accent?: string;
}) {
  const off = busy || disabled;
  const look = off
    ? dark
      ? "border-[#424242] bg-[#141414] text-[#8a8a8a] cursor-not-allowed"
      : "border-[#e0e0e0] bg-[#f0f0f0] text-[#616161] cursor-not-allowed"
    : danger
      ? PRIMARY
      : APPEARANCE_CLASS[appearance][dark ? "dark" : "light"];
  const style = { "--accent": danger ? "#c4314b" : accent } as CSSProperties;
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
  if (as === "span")
    return (
      <span className={className} style={style}>
        {content}
      </span>
    );
  return (
    <button
      type="button"
      style={style}
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
  AccentColor: string;
  Theme: string;
  RequireConfirm: boolean;
  ConfirmLabel: string;
  ConfirmSeconds: number;
}

/** The inputs' defaults in the component's YAML. */
const DEFAULTS: Inputs = {
  Label: "Save",
  Appearance: "Primary",
  IconName: "",
  IsBusy: false,
  AccentColor: "#0f6cbd",
  Theme: "Light",
  RequireConfirm: false,
  ConfirmLabel: "Select again",
  ConfirmSeconds: 4,
};

function readInputs(settings: Record<string, string>): Inputs {
  const next = { ...DEFAULTS };
  for (const [key, formula] of Object.entries(settings)) {
    if (key === "AccentColor") next.AccentColor = cssColor(formula, DEFAULTS.AccentColor);
    else if (key in next) (next as unknown as Record<string, unknown>)[key] = fromPowerFx(formula);
  }
  // The component's Switch falls back to Primary for anything else.
  if (!(APPEARANCES as readonly string[]).includes(next.Appearance)) next.Appearance = "Primary";
  return next;
}

export function useButtonReplica(): ReplicaApi {
  const notify = useNotify();
  const [inputs, setInputs] = useState<Inputs>(DEFAULTS);
  const [clicks, setClicks] = useState(0);
  const [armed, setArmed] = useState(false);
  const dark = inputs.Theme === "Dark";

  // The component's timer: back to normal if the confirming select doesn't come in time.
  useEffect(() => {
    if (!armed) return;
    const timer = setTimeout(() => setArmed(false), Math.max(1, inputs.ConfirmSeconds) * 1000);
    return () => clearTimeout(timer);
  }, [armed, inputs.ConfirmSeconds]);

  return {
    screen: (
      <ButtonFace
        label={armed ? inputs.ConfirmLabel : inputs.Label}
        appearance={
          armed
            ? "Primary"
            : dark && inputs.Appearance === "Secondary"
              ? "Outline"
              : inputs.Appearance
        }
        icon={armed ? "Warning" : inputs.IconName}
        busy={inputs.IsBusy}
        dark={dark && !inputs.IsBusy}
        danger={armed}
        accent={inputs.AccentColor}
        onClick={() => {
          if (inputs.RequireConfirm && !armed) {
            setArmed(true);
            return;
          }
          setArmed(false);
          const count = clicks + 1;
          setClicks(count);
          notify(`Clicked ${count} ${count === 1 ? "time" : "times"}`, "Success");
        }}
      />
    ),
    apply: (settings) => {
      setInputs(readInputs(settings));
      setClicks(0);
      setArmed(false);
    },
    dark,
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
