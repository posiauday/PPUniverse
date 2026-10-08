"use client";

import { useEffect, useId, useRef, useState } from "react";
import { ACTION_BUTTON, EventLog, FIELD, Group, OutputValue, pushLog } from "./parts";
import { ButtonFace } from "./ButtonReplica";
import { fromPowerFx, type ReplicaApi } from "./replica";

/** A web replica of lcsDialog (MVP-049): open, confirm, cancel, IsOpen and Result. */

interface Inputs {
  Title: string;
  Message: string;
  ConfirmText: string;
  CancelText: string;
}

const START: Inputs = {
  Title: "Delete this request?",
  Message: "It will be removed for everyone. You can't undo this.",
  ConfirmText: "Delete",
  CancelText: "Cancel",
};

function DialogCard({
  inputs,
  dark,
  titleId,
  onConfirm,
  onCancel,
  interactive = true,
}: {
  inputs: Inputs;
  dark: boolean;
  titleId?: string;
  onConfirm?: () => void;
  onCancel?: () => void;
  interactive?: boolean;
}) {
  const ink = dark ? "text-white" : "text-[#242424]";
  const sub = dark ? "text-[#d6d6d6]" : "text-[#424242]";
  return (
    <span
      className={`block w-72 max-w-full rounded-lg p-5 text-left shadow-xl [font-family:"Segoe_UI",system-ui,sans-serif] ${
        dark ? "bg-[#292929]" : "bg-white"
      } ${ink}`}
    >
      <span id={titleId} className="block text-lg leading-snug font-semibold">
        {inputs.Title}
      </span>
      <span className={`mt-2 block text-sm ${sub}`}>{inputs.Message}</span>
      <span className="mt-5 flex justify-end gap-2">
        {inputs.CancelText ? (
          <ButtonFace
            as={interactive ? "button" : "span"}
            label={inputs.CancelText}
            appearance="Outline"
            icon=""
            busy={false}
            dark={dark}
            onClick={onCancel}
          />
        ) : null}
        <ButtonFace
          as={interactive ? "button" : "span"}
          label={inputs.ConfirmText}
          appearance="Primary"
          icon=""
          busy={false}
          dark={dark}
          onClick={onConfirm}
        />
      </span>
    </span>
  );
}

export function useDialogReplica(): ReplicaApi {
  const id = useId();
  const [inputs, setInputs] = useState<Inputs>(START);
  const [open, setOpen] = useState(false);
  const [result, setResult] = useState("");
  const [logs, setLogs] = useState<string[]>([]);
  const dialogRef = useRef<HTMLDivElement>(null);
  const set = <K extends keyof Inputs>(key: K, next: Inputs[K]) =>
    setInputs((current) => ({ ...current, [key]: next }));

  // On the web the replica can do what Studio can't: move focus into the dialog.
  useEffect(() => {
    if (open) dialogRef.current?.querySelector<HTMLButtonElement>("button")?.focus();
  }, [open]);

  const answer = (value: "Confirmed" | "Cancelled") => {
    setOpen(false);
    setResult(value);
    setLogs((current) => pushLog(current, value === "Confirmed" ? "OnConfirm()" : "OnCancel()"));
  };
  const openDialog = () => {
    setResult("");
    setOpen(true);
    setLogs((current) => pushLog(current, "Open()"));
  };

  return {
    stage: (dark) => (
      <div className="relative grid h-64 w-full max-w-md place-items-center overflow-hidden rounded-lg">
        <ButtonFace
          label="Delete request"
          appearance="Secondary"
          icon="Delete"
          busy={false}
          dark={dark}
          onClick={openDialog}
        />
        {open ? (
          <div className="absolute inset-0 grid place-items-center bg-black/45 p-3">
            <div
              ref={dialogRef}
              role="dialog"
              aria-modal="true"
              aria-labelledby={`${id}-title`}
              onKeyDown={(event) => {
                if (event.key === "Escape") answer("Cancelled");
              }}
            >
              <DialogCard
                inputs={inputs}
                dark={dark}
                titleId={`${id}-title`}
                onConfirm={() => answer("Confirmed")}
                onCancel={() => answer("Cancelled")}
              />
            </div>
          </div>
        ) : null}
      </div>
    ),
    controls: (
      <div className="grid gap-3 lg:grid-cols-2">
        <Group kind="Input" title="Data in">
          <label htmlFor={`${id}-t`}>Title</label>
          <input
            id={`${id}-t`}
            className={FIELD}
            value={inputs.Title}
            onChange={(e) => set("Title", e.target.value)}
          />
          <label htmlFor={`${id}-m`}>Message</label>
          <input
            id={`${id}-m`}
            className={FIELD}
            value={inputs.Message}
            onChange={(e) => set("Message", e.target.value)}
          />
          <label htmlFor={`${id}-c`}>ConfirmText</label>
          <input
            id={`${id}-c`}
            className={FIELD}
            value={inputs.ConfirmText}
            onChange={(e) => set("ConfirmText", e.target.value)}
          />
          <label htmlFor={`${id}-x`}>CancelText (empty for an alert)</label>
          <input
            id={`${id}-x`}
            className={FIELD}
            value={inputs.CancelText}
            onChange={(e) => set("CancelText", e.target.value)}
          />
        </Group>
        <div className="flex flex-col gap-3">
          <Group kind="Output" title="State out">
            <p className="flex flex-wrap items-center gap-2">
              <code className="font-mono text-sm">dlgDelete.IsOpen</code>
              <OutputValue>{String(open)}</OutputValue>
            </p>
            <p className="flex flex-wrap items-center gap-2">
              <code className="font-mono text-sm">dlgDelete.Result</code>
              <OutputValue>{JSON.stringify(result)}</OutputValue>
            </p>
          </Group>
          <Group kind="Action" title="Open() and Close()">
            <span className="flex flex-wrap gap-2">
              <button type="button" className={ACTION_BUTTON} onClick={openDialog}>
                Call dlgDelete.Open()
              </button>
              <button
                type="button"
                className={ACTION_BUTTON}
                onClick={() => {
                  setOpen(false);
                  setLogs((current) => pushLog(current, "Close()"));
                }}
              >
                Call dlgDelete.Close()
              </button>
            </span>
          </Group>
          <Group kind="Event" title="OnConfirm and OnCancel">
            <EventLog entries={logs} empty="Open the dialog and answer it." />
          </Group>
        </div>
      </div>
    ),
    apply: (settings) => {
      const next = { ...START };
      for (const [key, formula] of Object.entries(settings)) {
        if (key in next) (next as Record<string, string>)[key] = String(fromPowerFx(formula));
      }
      setInputs(next);
      setOpen(true);
      setResult("");
    },
    thumbnail: (settings, dark) => {
      const next = { ...START };
      for (const [key, formula] of Object.entries(settings)) {
        if (key in next) (next as Record<string, string>)[key] = String(fromPowerFx(formula));
      }
      return <DialogCard inputs={next} dark={dark} interactive={false} />;
    },
  };
}
