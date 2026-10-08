"use client";

import { useState } from "react";
import { ButtonFace } from "./ButtonReplica";
import { useNotify } from "./notify";
import { fromPowerFx, SEGOE, type ReplicaApi } from "./replica";

/**
 * A web replica of lcsStates (MVP-049; docs/final-decisions.md, 2026-10-08,
 * "One live view"): the Empty, Loading and Error panels, 360 by 240, with the
 * component's own default texts when Title or Message is empty. Its button
 * runs OnAction(State), which the preview screen wires to Notify.
 */

const STATES = ["Empty", "Loading", "Error", ""] as const;
type State = (typeof STATES)[number];

interface Inputs {
  State: State;
  Title: string;
  Message: string;
  ActionText: string;
}

/** The inputs' defaults in the component's YAML. */
const DEFAULTS: Inputs = { State: "Empty", Title: "", Message: "", ActionText: "New request" };

/** The component's texts when Title or Message is left empty. */
const DEFAULT_TEXT: Record<Exclude<State, "">, { title: string; message: string }> = {
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

function StatePanel({ inputs, onAction }: { inputs: Inputs; onAction: () => void }) {
  if (inputs.State === "") return <div className="h-60 w-[360px] max-w-full" />;
  const text = DEFAULT_TEXT[inputs.State];
  const isError = inputs.State === "Error";
  const title = inputs.Title || text.title;
  return (
    <div
      className={`flex h-60 w-[360px] max-w-full flex-col items-center px-4 pt-6 text-center text-[#242424] ${SEGOE}`}
    >
      {inputs.State === "Loading" ? (
        <span role="progressbar" aria-label={title} className="grid h-12 place-items-center">
          <span className="size-8 rounded-full border-[3px] border-[#e0e0e0] border-t-[#0f6cbd] motion-safe:animate-spin" />
        </span>
      ) : (
        <span
          aria-hidden="true"
          className={`grid size-12 place-items-center rounded-full text-[22px] font-bold ${
            isError ? "bg-[#fde7e9] text-[#a6152e]" : "bg-[#f0f0f0] text-[#424242]"
          }`}
        >
          {isError ? "!" : "○"}
        </span>
      )}
      <p className="mt-3 text-base font-semibold">{title}</p>
      <p className="mt-1 text-[13px] text-[#616161]">{inputs.Message || text.message}</p>
      {inputs.State !== "Loading" && inputs.ActionText ? (
        <span className="mt-3">
          <ButtonFace
            label={inputs.ActionText}
            appearance={isError ? "Outline" : "Primary"}
            icon=""
            busy={false}
            dark={false}
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
    if (key in next)
      (next as unknown as Record<string, string>)[key] = String(fromPowerFx(formula));
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
    dark: false,
    wiring: [
      {
        control: "lcsStates_1",
        property: "OnAction",
        formula: 'Notify(lcsStates_1.ActionText & " selected (" & State & ")")',
      },
    ],
  };
}
