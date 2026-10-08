"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import { ButtonFace } from "./ButtonReplica";
import { useNotify } from "./notify";
import { cssColor, fromPowerFx, SEGOE, type ReplicaApi } from "./replica";

/**
 * A web replica of lcsToast 0.2.0 (MVP-049; docs/final-decisions.md, 2026-10-08,
 * "One live view"): hidden until Show(Message, Kind), 64 pixels high, the
 * colours, symbol and buttons of its YAML, light or dark, Info in the brand
 * colour. It closes itself after Duration seconds, and a Show while one is open
 * queues behind it ("1 more"). Its action and close buttons run OnAction or
 * OnDismiss, then show the next message. Buttons on the preview screen call
 * Show(), as they would in an app.
 */

type Kind = "Success" | "Info" | "Warning" | "Error";

/** The component's Switch: symbol, text and border colour, and fill, per kind and theme. */
const LOOK: Record<Exclude<Kind, "Info">, { symbol: string; light: string; dark: string }> = {
  Success: {
    symbol: "✓",
    light: "border-[#0e700e] bg-[#dff6dd] text-[#0e700e]",
    dark: "border-[#9fd89f] bg-[#052505] text-[#9fd89f]",
  },
  Warning: {
    symbol: "!",
    light: "border-[#834b00] bg-[#fff4ce] text-[#834b00]",
    dark: "border-[#faa06b] bg-[#4a1e04] text-[#faa06b]",
  },
  Error: {
    symbol: "✕",
    light: "border-[#a6152e] bg-[#fde7e9] text-[#a6152e]",
    dark: "border-[#f1707b] bg-[#3f1011] text-[#f1707b]",
  },
};

/** Info: the brand colour's border, and a tint of it (ColorFade 0.9, or -0.75 when dark). */
const INFO = {
  light: "border-[var(--accent)] bg-[color-mix(in_srgb,var(--accent)_10%,white)] text-[#242424]",
  dark: "border-[var(--accent)] bg-[color-mix(in_srgb,var(--accent)_25%,black)] text-white",
};

interface Inputs {
  ActionText: string;
  ToastWidth: number;
  Duration: number;
  AccentColor: string;
  Theme: string;
}

/** The inputs' defaults in the component's YAML. */
const DEFAULTS: Inputs = {
  ActionText: "",
  ToastWidth: 420,
  Duration: 6,
  AccentColor: "#0f6cbd",
  Theme: "Light",
};

interface Message {
  id: number;
  message: string;
  kind: Kind;
}

/** The three messages the preview screen's buttons send. */
const SENDS: { button: string; message: string; kind: Kind }[] = [
  { button: "Save", message: "Request saved.", kind: "Success" },
  { button: "Fail to save", message: "Couldn't save. Try again.", kind: "Error" },
  { button: "Show info", message: "Sync runs every hour.", kind: "Info" },
];

function ToastBar({
  inputs,
  shown,
  waiting,
  onAction,
  onClose,
}: {
  inputs: Inputs;
  shown: Message;
  waiting: number;
  onAction: () => void;
  onClose: () => void;
}) {
  const dark = inputs.Theme === "Dark";
  const look =
    shown.kind === "Info"
      ? { symbol: "i", className: INFO[dark ? "dark" : "light"] }
      : { symbol: LOOK[shown.kind].symbol, className: LOOK[shown.kind][dark ? "dark" : "light"] };
  const style = {
    width: `min(${inputs.ToastWidth}px, 100%)`,
    "--accent": inputs.AccentColor,
  } as CSSProperties;
  return (
    <div
      style={style}
      className={`relative flex h-16 items-center rounded-md border pl-4 text-sm font-semibold ${SEGOE} ${look.className} ${
        inputs.ActionText ? "pr-[140px]" : "pr-[52px]"
      }`}
    >
      <span className="line-clamp-2">
        {look.symbol} {shown.message}
        {waiting > 0 ? `  (${waiting} more)` : ""}
      </span>
      {inputs.ActionText ? (
        <span className="absolute top-1/2 right-12 -translate-y-1/2">
          <ButtonFace
            label={inputs.ActionText}
            appearance="Outline"
            icon=""
            busy={false}
            dark={dark}
            size="h-8 w-[84px]"
            onClick={onAction}
          />
        </span>
      ) : null}
      <button
        type="button"
        aria-label="Close message"
        onClick={onClose}
        className={`absolute top-1/2 right-2 grid size-8 -translate-y-1/2 place-items-center rounded ${
          dark ? "text-white hover:bg-white/10" : "text-[#242424] hover:bg-black/5"
        }`}
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
  const [{ shown, queue }, setMessages] = useState<{ shown: Message | null; queue: Message[] }>({
    shown: null,
    queue: [],
  });
  const ids = useRef(0);

  /** What the component does after a close, an action or its timer: the next queued message, or closed. */
  const next = () =>
    setMessages((current) => ({ shown: current.queue[0] ?? null, queue: current.queue.slice(1) }));

  // The component's timer: after Duration seconds, the next message or closed.
  useEffect(() => {
    if (!shown || inputs.Duration <= 0) return;
    const timer = setTimeout(
      () =>
        setMessages((current) => ({
          shown: current.queue[0] ?? null,
          queue: current.queue.slice(1),
        })),
      inputs.Duration * 1000,
    );
    return () => clearTimeout(timer);
  }, [shown, inputs.Duration]);

  const show = (message: string, kind: Kind) => {
    ids.current += 1;
    const entry = { id: ids.current, message, kind };
    setMessages((current) =>
      current.shown
        ? { shown: current.shown, queue: [...current.queue, entry] }
        : { shown: entry, queue: current.queue },
    );
  };

  return {
    screen: (
      <>
        <div className="flex flex-wrap justify-center gap-3">
          {SENDS.map((send, index) => (
            <ButtonFace
              key={send.button}
              label={send.button}
              appearance={index === 0 ? "Primary" : "Secondary"}
              icon=""
              busy={false}
              dark={false}
              onClick={() => show(send.message, send.kind)}
            />
          ))}
        </div>
        <div role="status" className="absolute inset-x-4 bottom-4 flex justify-center">
          {shown ? (
            <ToastBar
              inputs={inputs}
              shown={shown}
              waiting={queue.length}
              onAction={() => {
                notify(`${inputs.ActionText} selected`);
                next();
              }}
              onClose={() => {
                notify("Message closed");
                next();
              }}
            />
          ) : null}
        </div>
      </>
    ),
    apply: (settings) => {
      const read = { ...DEFAULTS };
      for (const [key, formula] of Object.entries(settings)) {
        if (key === "AccentColor") read.AccentColor = cssColor(formula, DEFAULTS.AccentColor);
        else if (key in read)
          (read as unknown as Record<string, unknown>)[key] = fromPowerFx(formula);
      }
      setInputs(read);
      setMessages({ shown: null, queue: [] });
    },
    dark: inputs.Theme === "Dark",
    wiring: [
      ...SENDS.map((send, index) => ({
        control: `Button${index + 1}`,
        property: "OnSelect",
        formula: `lcsToast_1.Show("${send.message}", "${send.kind}")`,
      })),
      {
        control: "lcsToast_1",
        property: "OnAction",
        formula: 'Notify(lcsToast_1.ActionText & " selected")',
      },
      { control: "lcsToast_1", property: "OnDismiss", formula: 'Notify("Message closed")' },
    ],
  };
}
