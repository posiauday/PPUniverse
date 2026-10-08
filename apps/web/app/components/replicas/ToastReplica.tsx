"use client";

import { useId, useState } from "react";
import { ACTION_BUTTON, EventLog, FIELD, Formula, Group, OutputValue, pushLog } from "./parts";
import { fromPowerFx, type ReplicaApi } from "./replica";

/** A web replica of lcsToast (MVP-049): Show(Message, Kind), Hide(), the buttons and events. */

const KINDS = ["Success", "Info", "Warning", "Error"] as const;
type Kind = (typeof KINDS)[number];

const LOOK: Record<Kind, { symbol: string; className: string }> = {
  Success: { symbol: "✓", className: "border-[#0e700e] bg-[#dff6dd] text-[#0e700e]" },
  Info: { symbol: "i", className: "border-[#0f548c] bg-[#ebf3fc] text-[#0f548c]" },
  Warning: { symbol: "!", className: "border-[#834b00] bg-[#fff4ce] text-[#834b00]" },
  Error: { symbol: "✕", className: "border-[#a6152e] bg-[#fde7e9] text-[#a6152e]" },
};

const FORMATS: Record<string, (message: string, kind: Kind) => string> = {
  Message: (message) => message,
  'Kind & ": " & Message': (message, kind) => `${kind}: ${message}`,
  "Upper(Message)": (message) => message.toUpperCase(),
};

function ToastBar({
  message,
  kind,
  actionText,
  onAction,
  onClose,
  interactive = true,
}: {
  message: string;
  kind: Kind;
  actionText: string;
  onAction?: () => void;
  onClose?: () => void;
  interactive?: boolean;
}) {
  const look = LOOK[kind];
  const Button = interactive ? "button" : "span";
  return (
    <span
      className={`flex w-full max-w-80 items-center gap-2 rounded-md border px-3 py-2 text-left text-sm font-semibold [font-family:"Segoe_UI",system-ui,sans-serif] ${look.className}`}
    >
      <span aria-hidden="true">{look.symbol}</span>
      <span className="flex-1">{message}</span>
      {actionText ? (
        <Button
          {...(interactive ? { type: "button" as const, onClick: onAction } : {})}
          className="rounded border border-current px-2 py-1 text-xs"
        >
          {actionText}
        </Button>
      ) : null}
      <Button
        {...(interactive
          ? { type: "button" as const, onClick: onClose, "aria-label": "Close message" }
          : {})}
        className="grid size-7 place-items-center rounded hover:bg-black/5"
      >
        <span aria-hidden="true">✕</span>
      </Button>
    </span>
  );
}

export function useToastReplica(): ReplicaApi {
  const id = useId();
  const [open, setOpen] = useState(true);
  const [message, setMessage] = useState("Request saved.");
  const [kind, setKind] = useState<Kind>("Success");
  const [draftMessage, setDraftMessage] = useState("Couldn't save. Try again.");
  const [draftKind, setDraftKind] = useState<Kind>("Error");
  const [actionText, setActionText] = useState("Undo");
  const [format, setFormat] = useState("Message");
  const [logs, setLogs] = useState<string[]>([]);
  const shown = (FORMATS[format] ?? FORMATS["Message"]!)(message, kind);

  return {
    stage: (dark) => (
      <div className="flex min-h-24 w-full items-start justify-center">
        <p role="status" className="w-full">
          {open ? (
            <span className="flex justify-center">
              <ToastBar
                message={shown}
                kind={kind}
                actionText={actionText}
                onAction={() => {
                  setOpen(false);
                  setLogs((current) => pushLog(current, "OnAction()"));
                }}
                onClose={() => {
                  setOpen(false);
                  setLogs((current) => pushLog(current, "OnDismiss()"));
                }}
              />
            </span>
          ) : (
            <span
              className={`block text-center text-sm ${dark ? "text-[#adadad]" : "text-[#616161]"}`}
            >
              Closed. Call Show() in the playground to see it again.
            </span>
          )}
        </p>
      </div>
    ),
    controls: (
      <div className="grid gap-3 lg:grid-cols-2">
        <Group kind="Action" title="Show(Message, Kind)">
          <label htmlFor={`${id}-msg`}>Message</label>
          <input
            id={`${id}-msg`}
            className={FIELD}
            value={draftMessage}
            onChange={(e) => setDraftMessage(e.target.value)}
          />
          <label htmlFor={`${id}-kind`}>Kind</label>
          <select
            id={`${id}-kind`}
            className={FIELD}
            value={draftKind}
            onChange={(e) => setDraftKind(e.target.value as Kind)}
          >
            {KINDS.map((value) => (
              <option key={value}>{value}</option>
            ))}
          </select>
          <span className="flex flex-wrap gap-2">
            <button
              type="button"
              className={ACTION_BUTTON}
              onClick={() => {
                setMessage(draftMessage);
                setKind(draftKind);
                setOpen(true);
                setLogs((current) =>
                  pushLog(current, `Show(${JSON.stringify(draftMessage)}, "${draftKind}")`),
                );
              }}
            >
              Call tstMain.Show(…)
            </button>
            <button
              type="button"
              className={ACTION_BUTTON}
              onClick={() => {
                setOpen(false);
                setLogs((current) => pushLog(current, "Hide()"));
              }}
            >
              Call tstMain.Hide()
            </button>
          </span>
          <Formula
            name="tstMain.Show"
            value={`(${JSON.stringify(draftMessage)}, "${draftKind}")`}
          />
        </Group>
        <div className="flex flex-col gap-3">
          <Group kind="Input" title="Data in">
            <label htmlFor={`${id}-act`}>ActionText (empty for none)</label>
            <input
              id={`${id}-act`}
              className={FIELD}
              value={actionText}
              onChange={(e) => setActionText(e.target.value)}
            />
          </Group>
          <Group kind="Output" title="State out">
            <p className="flex flex-wrap items-center gap-2">
              <code className="font-mono text-sm">tstMain.IsOpen</code>
              <OutputValue>{String(open)}</OutputValue>
            </p>
            <p className="flex flex-wrap items-center gap-2">
              <code className="font-mono text-sm">tstMain.CurrentKind</code>
              <OutputValue>{JSON.stringify(kind)}</OutputValue>
            </p>
          </Group>
        </div>
        <Group kind="InputFunction" title="FormatMessage(Message, Kind)">
          <label htmlFor={`${id}-fmt`}>Formula in your app</label>
          <select
            id={`${id}-fmt`}
            className={FIELD}
            value={format}
            onChange={(e) => setFormat(e.target.value)}
          >
            {Object.keys(FORMATS).map((value) => (
              <option key={value}>{value}</option>
            ))}
          </select>
        </Group>
        <Group kind="Event" title="OnAction and OnDismiss">
          <EventLog entries={logs} empty="Use the toast's buttons." />
        </Group>
      </div>
    ),
    apply: (settings) => {
      if ("ActionText" in settings) setActionText(String(fromPowerFx(settings["ActionText"]!)));
      setOpen(true);
    },
    thumbnail: (settings) => (
      <ToastBar
        message="Request saved."
        kind="Success"
        actionText={String(fromPowerFx(settings["ActionText"] ?? '""'))}
        interactive={false}
      />
    ),
  };
}
