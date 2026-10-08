"use client";

import { useState } from "react";
import { ButtonFace } from "./ButtonReplica";
import { useNotify } from "./notify";
import { fromPowerFx, SEGOE, type ReplicaApi } from "./replica";

/**
 * A web replica of lcsToast (MVP-049; docs/final-decisions.md, 2026-10-08,
 * "One live view"): hidden until Show(Message, Kind), 64 pixels high, the
 * colours, symbol and buttons of its YAML. Its action button and its close
 * button hide it and run OnAction or OnDismiss. Buttons on the preview screen
 * call Show(), as they would in an app.
 */

type Kind = "Success" | "Info" | "Warning" | "Error";

/** The component's Switch: symbol, text and border colour, and fill, per kind. */
const LOOK: Record<Kind, { symbol: string; className: string }> = {
  Success: { symbol: "✓", className: "border-[#0e700e] bg-[#dff6dd] text-[#0e700e]" },
  Info: { symbol: "i", className: "border-[#0f548c] bg-[#ebf3fc] text-[#0f548c]" },
  Warning: { symbol: "!", className: "border-[#834b00] bg-[#fff4ce] text-[#834b00]" },
  Error: { symbol: "✕", className: "border-[#a6152e] bg-[#fde7e9] text-[#a6152e]" },
};

interface Inputs {
  ActionText: string;
  ToastWidth: number;
}

/** The inputs' defaults in the component's YAML. */
const DEFAULTS: Inputs = { ActionText: "", ToastWidth: 420 };

/** The two messages the preview screen's buttons send. */
const SAVED = { message: "Request saved.", kind: "Success" as Kind };
const FAILED = { message: "Couldn't save. Try again.", kind: "Error" as Kind };

function ToastBar({
  inputs,
  message,
  kind,
  onAction,
  onClose,
}: {
  inputs: Inputs;
  message: string;
  kind: Kind;
  onAction: () => void;
  onClose: () => void;
}) {
  const look = LOOK[kind];
  return (
    <div
      style={{ width: `min(${inputs.ToastWidth}px, 100%)` }}
      className={`relative flex h-16 items-center rounded-md border pl-4 text-sm font-semibold ${SEGOE} ${look.className} ${
        inputs.ActionText ? "pr-[140px]" : "pr-[52px]"
      }`}
    >
      <span className="line-clamp-2">
        {look.symbol} {message}
      </span>
      {inputs.ActionText ? (
        <span className="absolute top-1/2 right-12 -translate-y-1/2">
          <ButtonFace
            label={inputs.ActionText}
            appearance="Outline"
            icon=""
            busy={false}
            dark={false}
            size="h-8 w-[84px]"
            onClick={onAction}
          />
        </span>
      ) : null}
      <button
        type="button"
        aria-label="Close message"
        onClick={onClose}
        className="absolute top-1/2 right-2 grid size-8 -translate-y-1/2 place-items-center rounded text-[#242424] hover:bg-black/5"
      >
        <svg
          viewBox="0 0 24 24"
          className="size-4"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          aria-hidden="true"
        >
          <path d="M6 6l12 12M18 6L6 18" />
        </svg>
      </button>
    </div>
  );
}

export function useToastReplica(): ReplicaApi {
  const notify = useNotify();
  const [inputs, setInputs] = useState<Inputs>(DEFAULTS);
  const [shown, setShown] = useState<{ message: string; kind: Kind } | null>(null);

  return {
    screen: (
      <>
        <div className="flex flex-wrap justify-center gap-3">
          <ButtonFace
            label="Save"
            appearance="Primary"
            icon=""
            busy={false}
            dark={false}
            onClick={() => setShown(SAVED)}
          />
          <ButtonFace
            label="Fail to save"
            appearance="Secondary"
            icon=""
            busy={false}
            dark={false}
            onClick={() => setShown(FAILED)}
          />
        </div>
        <div role="status" className="absolute inset-x-4 bottom-4 flex justify-center">
          {shown ? (
            <ToastBar
              inputs={inputs}
              message={shown.message}
              kind={shown.kind}
              onAction={() => {
                setShown(null);
                notify(`${inputs.ActionText} selected`);
              }}
              onClose={() => {
                setShown(null);
                notify("Message closed");
              }}
            />
          ) : null}
        </div>
      </>
    ),
    apply: (settings) => {
      const next = { ...DEFAULTS };
      if ("ActionText" in settings) next.ActionText = String(fromPowerFx(settings["ActionText"]!));
      if ("ToastWidth" in settings) {
        const width = fromPowerFx(settings["ToastWidth"]!);
        if (typeof width === "number" && width > 0) next.ToastWidth = width;
      }
      setInputs(next);
      setShown(null);
    },
    dark: false,
    wiring: [
      {
        control: "Button1",
        property: "OnSelect",
        formula: `lcsToast_1.Show("${SAVED.message}", "${SAVED.kind}")`,
      },
      {
        control: "Button2",
        property: "OnSelect",
        formula: `lcsToast_1.Show("${FAILED.message}", "${FAILED.kind}")`,
      },
      {
        control: "lcsToast_1",
        property: "OnAction",
        formula: 'Notify(lcsToast_1.ActionText & " selected")',
      },
      { control: "lcsToast_1", property: "OnDismiss", formula: 'Notify("Message closed")' },
    ],
  };
}
