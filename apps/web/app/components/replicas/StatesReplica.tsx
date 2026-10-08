"use client";

import { useId, useState } from "react";
import { EventLog, FIELD, Formula, Group, OutputValue, pushLog } from "./parts";
import { ButtonFace } from "./ButtonReplica";
import { fromPowerFx, type ReplicaApi } from "./replica";

/** A web replica of lcsStates (MVP-049): Empty, Loading and Error, StateFor and OnAction. */

const STATES = ["Empty", "Loading", "Error", ""] as const;
type State = (typeof STATES)[number];

interface Inputs {
  State: State;
  Title: string;
  Message: string;
  ActionText: string;
}

const START: Inputs = {
  State: "Empty",
  Title: "No requests yet",
  Message: "Requests you create appear here.",
  ActionText: "New request",
};

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

function StatePanel({
  inputs,
  dark,
  onAction,
  interactive = true,
}: {
  inputs: Inputs;
  dark: boolean;
  onAction?: () => void;
  interactive?: boolean;
}) {
  if (inputs.State === "") {
    return (
      <span className={`block text-sm ${dark ? "text-[#adadad]" : "text-[#616161]"}`}>
        State is empty text: nothing shows, and your gallery does.
      </span>
    );
  }
  const text = DEFAULT_TEXT[inputs.State];
  const ink = dark ? "text-white" : "text-[#242424]";
  const sub = dark ? "text-[#d6d6d6]" : "text-[#616161]";
  const isError = inputs.State === "Error";
  return (
    <span
      className={`flex w-72 max-w-full flex-col items-center gap-2 text-center [font-family:"Segoe_UI",system-ui,sans-serif] ${ink}`}
    >
      {inputs.State === "Loading" ? (
        <span
          aria-hidden="true"
          className={`size-10 rounded-full border-4 motion-safe:animate-spin ${dark ? "border-[#444] border-t-[#479ef5]" : "border-[#e0e0e0] border-t-[#0f6cbd]"}`}
        />
      ) : (
        <span
          aria-hidden="true"
          className={`grid size-12 place-items-center rounded-full text-xl font-bold ${
            isError
              ? "bg-[#fde7e9] text-[#a6152e]"
              : dark
                ? "bg-[#333] text-[#d6d6d6]"
                : "bg-[#f0f0f0] text-[#424242]"
          }`}
        >
          {isError ? "!" : "○"}
        </span>
      )}
      <span className="text-base font-semibold">{inputs.Title || text.title}</span>
      <span className={`text-sm ${sub}`}>{inputs.Message || text.message}</span>
      {inputs.State !== "Loading" && inputs.ActionText ? (
        <ButtonFace
          as={interactive ? "button" : "span"}
          label={inputs.ActionText}
          appearance={isError ? "Outline" : "Primary"}
          icon=""
          busy={false}
          dark={dark}
          onClick={onAction}
        />
      ) : null}
    </span>
  );
}

function read(settings: Record<string, string>): Inputs {
  const next: Inputs = { State: "Empty", Title: "", Message: "", ActionText: "" };
  for (const [key, formula] of Object.entries(settings)) {
    if (key in next)
      (next as unknown as Record<string, string>)[key] = String(fromPowerFx(formula));
  }
  if (!(STATES as readonly string[]).includes(next.State)) next.State = "";
  return next;
}

export function useStatesReplica(): ReplicaApi {
  const id = useId();
  const [inputs, setInputs] = useState<Inputs>(START);
  const [logs, setLogs] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [failed, setFailed] = useState(false);
  const [rows, setRows] = useState(0);
  const set = <K extends keyof Inputs>(key: K, next: Inputs[K]) =>
    setInputs((current) => ({ ...current, [key]: next }));
  const computed = stateFor(loading, failed, rows);

  return {
    stage: (dark) => (
      <StatePanel
        inputs={inputs}
        dark={dark}
        onAction={() =>
          setLogs((current) => pushLog(current, `OnAction(State: "${inputs.State}")`))
        }
      />
    ),
    controls: (
      <div className="grid gap-3 lg:grid-cols-2">
        <Group kind="Input" title="Data in">
          <label htmlFor={`${id}-state`}>State</label>
          <select
            id={`${id}-state`}
            className={FIELD}
            value={inputs.State}
            onChange={(e) => set("State", e.target.value as State)}
          >
            {STATES.map((value) => (
              <option key={value} value={value}>
                {value || "(empty text)"}
              </option>
            ))}
          </select>
          <label htmlFor={`${id}-title`}>Title (empty for the default)</label>
          <input
            id={`${id}-title`}
            className={FIELD}
            value={inputs.Title}
            onChange={(e) => set("Title", e.target.value)}
          />
          <label htmlFor={`${id}-msg`}>Message (empty for the default)</label>
          <input
            id={`${id}-msg`}
            className={FIELD}
            value={inputs.Message}
            onChange={(e) => set("Message", e.target.value)}
          />
          <label htmlFor={`${id}-act`}>ActionText (empty for no button)</label>
          <input
            id={`${id}-act`}
            className={FIELD}
            value={inputs.ActionText}
            onChange={(e) => set("ActionText", e.target.value)}
          />
        </Group>
        <div className="flex flex-col gap-3">
          <Group kind="Output" title="State out">
            <p className="flex flex-wrap items-center gap-2">
              <code className="font-mono text-sm">stsRequests.IsShowing</code>
              <OutputValue>{String(inputs.State !== "")}</OutputValue>
            </p>
          </Group>
          <Group kind="OutputFunction" title="StateFor(IsLoading, HasError, RowCount)">
            <label className="flex min-h-11 items-center gap-2">
              <input
                type="checkbox"
                checked={loading}
                onChange={(e) => setLoading(e.target.checked)}
              />{" "}
              IsLoading
            </label>
            <label className="flex min-h-11 items-center gap-2">
              <input
                type="checkbox"
                checked={failed}
                onChange={(e) => setFailed(e.target.checked)}
              />{" "}
              HasError
            </label>
            <label htmlFor={`${id}-rows`}>RowCount</label>
            <input
              id={`${id}-rows`}
              type="number"
              min={0}
              className={FIELD}
              value={rows}
              onChange={(e) => setRows(Math.max(0, Number(e.target.value) || 0))}
            />
            <Formula
              name={`stsRequests.StateFor(${loading}, ${failed}, ${rows})`}
              value={JSON.stringify(computed)}
            />
            <button
              type="button"
              className="inline-flex min-h-11 w-max items-center rounded-full border-[1.5px] border-foreground px-4 font-semibold"
              onClick={() => set("State", computed)}
            >
              Use it as State
            </button>
          </Group>
        </div>
        <Group kind="Event" title="OnAction(State)">
          <EventLog entries={logs} empty="Select the panel's button." />
        </Group>
      </div>
    ),
    apply: (settings) => setInputs(read(settings)),
    thumbnail: (settings, dark) => (
      <StatePanel inputs={read(settings)} dark={dark} interactive={false} />
    ),
  };
}
