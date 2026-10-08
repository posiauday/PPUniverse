"use client";

import { useState } from "react";
import { ButtonFace } from "./ButtonReplica";
import { useNotify } from "./notify";
import { cssColor, fromPowerFx, SEGOE, type ReplicaApi } from "./replica";

/**
 * A web replica of lcsStates 0.2.0 (MVP-049; docs/final-decisions.md, 2026-10-08,
 * "One live view"): the Empty, Loading, Skeleton and Error panels, 360 by 240,
 * with the component's own default texts when Title or Message is empty, its
 * brand colour and dark theme. Its button runs OnAction(State), which the
 * preview screen wires to Notify.
 */

const STATES = ["Empty", "Loading", "Skeleton", "Error", ""] as const;
type State = (typeof STATES)[number];

interface Inputs {
  State: State;
  Title: string;
  Message: string;
  ActionText: string;
  SkeletonRows: number;
  AccentColor: string;
  Theme: string;
}

/** The inputs' defaults in the component's YAML. */
const DEFAULTS: Inputs = {
  State: "Empty",
  Title: "",
  Message: "",
  ActionText: "New request",
  SkeletonRows: 4,
  AccentColor: "#0f6cbd",
  Theme: "Light",
};

/** The component's texts when Title or Message is left empty. */
const DEFAULT_TEXT: Record<"Empty" | "Loading" | "Error", { title: string; message: string }> = {
  Empty: { title: "Nothing here yet", message: "When there's something to show, it appears here." },
  Loading: { title: "Loading…", message: "This only takes a moment." },
  Error: { title: "Something went wrong", message: "Check your connection, then try again." },
};

/** StateFor, as the component computes it. */
export function stateFor(isLoading: boolean, hasError: boolean, rowCount: number): State {
  if (isLoading) return "Loading";
  if (hasError) return "Error";
  return rowCount === 0 ? "Empty" : "";
}

/** As many rows as the 240-pixel panel fits below the title, as the component's gallery does. */
export function skeletonRows(requested: number): number {
  return Math.max(1, Math.min(requested, Math.floor((240 - 36) / 48)));
}

function Skeleton({ inputs }: { inputs: Inputs }) {
  const dark = inputs.Theme === "Dark";
  const bar = dark ? "bg-[#333333]" : "bg-[#ebebeb]";
  const subBar = dark ? "bg-[#292929]" : "bg-[#f3f3f3]";
  const title = inputs.Title || "Loading…";
  return (
    <div
      role="progressbar"
      aria-label={title}
      className={`h-60 w-[360px] max-w-full px-4 pt-2 text-left ${SEGOE}`}
    >
      <p className={`h-5 text-[13px] ${dark ? "text-[#adadad]" : "text-[#616161]"}`}>{title}</p>
      <div aria-hidden="true" className="mt-2">
        {Array.from({ length: skeletonRows(inputs.SkeletonRows) }, (_, index) => (
          <div key={index} className="relative h-12">
            <span className={`absolute top-2 left-0 size-8 rounded-full ${bar}`} />
            <span
              className={`absolute top-[11px] left-11 h-2.5 rounded-[5px] ${bar}`}
              style={{ width: `calc((100% - 44px) * ${(index + 1) % 2 === 0 ? 0.6 : 0.85})` }}
            />
            <span
              className={`absolute top-7 left-11 h-2 w-[calc((100%-44px)*0.4)] rounded ${subBar}`}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

function StatePanel({ inputs, onAction }: { inputs: Inputs; onAction: () => void }) {
  if (inputs.State === "") return <div className="h-60 w-[360px] max-w-full" />;
  if (inputs.State === "Skeleton") return <Skeleton inputs={inputs} />;
  const dark = inputs.Theme === "Dark";
  const text = DEFAULT_TEXT[inputs.State];
  const isError = inputs.State === "Error";
  const title = inputs.Title || text.title;
  return (
    <div
      className={`flex h-60 w-[360px] max-w-full flex-col items-center px-4 pt-6 text-center ${SEGOE} ${
        dark ? "text-white" : "text-[#242424]"
      }`}
    >
      {inputs.State === "Loading" ? (
        <span role="progressbar" aria-label={title} className="grid h-12 place-items-center">
          <span
            style={{ borderTopColor: inputs.AccentColor }}
            className={`size-8 rounded-full border-[3px] motion-safe:animate-spin ${dark ? "border-[#444]" : "border-[#e0e0e0]"}`}
          />
        </span>
      ) : (
        <span
          aria-hidden="true"
          className={`grid size-12 place-items-center rounded-full text-[22px] font-bold ${
            isError
              ? dark
                ? "bg-[#3f1011] text-[#f1707b]"
                : "bg-[#fde7e9] text-[#a6152e]"
              : dark
                ? "bg-[#333333] text-[#d6d6d6]"
                : "bg-[#f0f0f0] text-[#424242]"
          }`}
        >
          {isError ? "!" : "○"}
        </span>
      )}
      <p className="mt-3 text-base font-semibold">{title}</p>
      <p className={`mt-1 text-[13px] ${dark ? "text-[#adadad]" : "text-[#616161]"}`}>
        {inputs.Message || text.message}
      </p>
      {inputs.State !== "Loading" && inputs.ActionText ? (
        <span className="mt-3">
          <ButtonFace
            label={inputs.ActionText}
            appearance={isError ? "Outline" : "Primary"}
            icon=""
            busy={false}
            dark={dark}
            accent={inputs.AccentColor}
            size="h-9 min-w-[120px] px-4"
            onClick={onAction}
          />
        </span>
      ) : null}
    </div>
  );
}

function read(settings: Record<string, string>): Inputs {
  const next = { ...DEFAULTS };
  for (const [key, formula] of Object.entries(settings)) {
    if (key === "AccentColor") next.AccentColor = cssColor(formula, DEFAULTS.AccentColor);
    else if (key in next) (next as unknown as Record<string, unknown>)[key] = fromPowerFx(formula);
  }
  if (!(STATES as readonly string[]).includes(next.State)) next.State = "";
  return next;
}

export function useStatesReplica(): ReplicaApi {
  const notify = useNotify();
  const [inputs, setInputs] = useState<Inputs>(DEFAULTS);

  return {
    screen: (
      <StatePanel
        inputs={inputs}
        onAction={() => notify(`${inputs.ActionText} selected (${inputs.State})`)}
      />
    ),
    apply: (settings) => setInputs(read(settings)),
    dark: inputs.Theme === "Dark",
    wiring: [
      {
        control: "lcsStates_1",
        property: "OnAction",
        formula: 'Notify(lcsStates_1.ActionText & " selected (" & State & ")")',
      },
    ],
  };
}
