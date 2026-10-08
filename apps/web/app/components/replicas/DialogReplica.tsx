"use client";

import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { ButtonFace } from "./ButtonReplica";
import { ACTION_BUTTON, EventLog, FIELD, Formula, Group, OutputValue, pushLog } from "./parts";
import { fromPowerFx, type ReplicaApi } from "./replica";

/**
 * A web replica of lcsDialog 0.2.0 (MVP-049): Confirm, Alert, Form and Danger;
 * up to three buttons from a table; a validated text box; type-to-confirm;
 * Open() and Close(); OnButtonSelect(Key, InputText) and OnDismiss.
 */

const KINDS = ["Confirm", "Alert", "Form", "Danger"] as const;
type Kind = (typeof KINDS)[number];
type Style = "Primary" | "Secondary" | "Outline" | "Subtle" | "Danger";

export interface DialogButton {
  Key: string;
  Label: string;
  Style: Style;
}

interface Inputs {
  Kind: Kind;
  Title: string;
  Message: string;
  Buttons: DialogButton[];
  Icon: string;
  InputLabel: string;
  InputRequired: boolean;
  ConfirmWord: string;
  ShowClose: boolean;
  Theme: string;
}

const DEFAULT_BUTTONS: DialogButton[] = [
  { Key: "cancel", Label: "Cancel", Style: "Secondary" },
  { Key: "confirm", Label: "Delete", Style: "Primary" },
];

const START: Inputs = {
  Kind: "Confirm",
  Title: "Delete this request?",
  Message: "It will be removed for everyone. You can't undo this.",
  Buttons: DEFAULT_BUTTONS,
  Icon: "Auto",
  InputLabel: "Reason",
  InputRequired: true,
  ConfirmWord: "DELETE",
  ShowClose: true,
  Theme: "Light",
};

/** Reads a Buttons formula such as Table({Key: "a", Label: "A", Style: "Primary"}, …). */
export function readButtons(formula: string): DialogButton[] {
  return [...formula.matchAll(/\{([^}]*)\}/g)].map((match) => {
    const field = (name: string) =>
      match[1]!.match(new RegExp(`${name}\\s*:\\s*"((?:[^"]|"")*)"`))?.[1]?.replace(/""/g, '"') ??
      "";
    return {
      Key: field("Key"),
      Label: field("Label"),
      Style: (field("Style") || "Primary") as Style,
    };
  });
}

/** The buttons the dialog shows, left to right: Alert hides the cancel key; Danger makes confirm red. */
export function visibleButtons(inputs: Pick<Inputs, "Kind" | "Buttons">): DialogButton[] {
  return inputs.Buttons.filter((button) => !(inputs.Kind === "Alert" && button.Key === "cancel"))
    .slice(-3)
    .map((button) =>
      inputs.Kind === "Danger" && button.Key === "confirm"
        ? { ...button, Style: "Danger" }
        : button,
    );
}

const VALIDATIONS: Record<string, { formula: string; check: (text: string) => string }> = {
  none: { formula: '""', check: () => "" },
  length: {
    formula: 'If(Len(Text) < 10, "Give a reason of at least 10 characters.", "")',
    check: (text) => (text.length < 10 ? "Give a reason of at least 10 characters." : ""),
  },
};

function iconFor(inputs: Inputs): string {
  if (inputs.Icon !== "Auto") return inputs.Icon;
  return inputs.Kind === "Danger" ? "Warning" : inputs.Kind === "Form" ? "None" : "Info";
}

const ICON_PATHS: Record<string, { color: string; paths: ReactNode }> = {
  Info: {
    color: "#0f6cbd",
    paths: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 11v6M12 7.5v.5" />
      </>
    ),
  },
  Warning: {
    color: "#bc4b09",
    paths: (
      <>
        <path d="M12 3l10 18H2z" />
        <path d="M12 10v5M12 18v.5" />
      </>
    ),
  },
  Error: {
    color: "#c4314b",
    paths: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M9 9l6 6M15 9l-6 6" />
      </>
    ),
  },
  Success: {
    color: "#0e700e",
    paths: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M8 12l3 3 5-6" />
      </>
    ),
  },
};

function DialogCard({
  inputs,
  dark,
  titleId,
  text,
  setText,
  problem,
  canConfirm,
  onButton,
  onClose,
  interactive = true,
}: {
  inputs: Inputs;
  dark: boolean;
  titleId?: string;
  text: string;
  setText?: (value: string) => void;
  problem: string;
  canConfirm: boolean;
  onButton?: (button: DialogButton) => void;
  onClose?: () => void;
  interactive?: boolean;
}) {
  dark = dark || inputs.Theme === "Dark";
  const ink = dark ? "text-white" : "text-[#242424]";
  const sub = dark ? "text-[#d6d6d6]" : "text-[#424242]";
  const icon = ICON_PATHS[iconFor(inputs)];
  const hasInput = inputs.Kind === "Form" || inputs.Kind === "Danger";
  const inputId = titleId ? `${titleId}-input` : undefined;
  const inputLabel =
    inputs.Kind === "Danger"
      ? `Type ${inputs.ConfirmWord} to confirm`
      : `${inputs.InputLabel}${inputs.InputRequired ? " *" : ""}`;
  return (
    <span
      className={`relative block w-full max-w-80 rounded-xl p-5 text-left shadow-xl [font-family:"Segoe_UI",system-ui,sans-serif] ${
        dark ? "bg-[#292929]" : "bg-white"
      } ${ink}`}
    >
      <span className="flex items-start gap-2.5 pr-8">
        {icon ? (
          <svg
            viewBox="0 0 24 24"
            className="mt-0.5 size-6 shrink-0"
            fill="none"
            stroke={icon.color}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            {icon.paths}
          </svg>
        ) : null}
        <span>
          <span id={titleId} className="block text-lg leading-snug font-semibold">
            {inputs.Title}
          </span>
          <span className={`mt-2 block text-sm ${sub}`}>{inputs.Message}</span>
        </span>
      </span>
      {inputs.ShowClose && interactive ? (
        <button
          type="button"
          aria-label="Close dialog"
          onClick={onClose}
          className={`absolute top-3 right-3 grid size-9 place-items-center rounded ${dark ? "hover:bg-[#3d3d3d]" : "hover:bg-[#f0f0f0]"}`}
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
      ) : null}
      {hasInput ? (
        <span className="mt-4 block">
          {interactive ? (
            <label htmlFor={inputId} className="block text-[0.8125rem] font-semibold">
              {inputLabel}
            </label>
          ) : (
            <span className="block text-[0.8125rem] font-semibold">{inputLabel}</span>
          )}
          {interactive ? (
            <input
              id={inputId}
              value={text}
              placeholder={inputs.Kind === "Danger" ? inputs.ConfirmWord : ""}
              onChange={(event) => setText?.(event.target.value)}
              aria-invalid={problem ? true : undefined}
              className={`mt-1 h-10 w-full rounded-md border px-3 text-sm ${
                dark
                  ? "border-[#666] bg-[#1f1f1f] text-white"
                  : "border-[#d1d1d1] bg-white text-[#242424]"
              }`}
            />
          ) : (
            <span
              className={`mt-1 block h-10 rounded-md border ${dark ? "border-[#666]" : "border-[#d1d1d1]"}`}
            />
          )}
          <span
            className={`mt-1 block min-h-4 text-xs ${dark ? "text-[#f1707b]" : "text-[#c4314b]"}`}
          >
            {problem ? `⚠ ${problem}` : ""}
          </span>
        </span>
      ) : null}
      <span className="mt-5 flex flex-wrap justify-end gap-2">
        {visibleButtons(inputs).map((button) => {
          const primary = button.Style === "Primary" || button.Style === "Danger";
          return (
            <ButtonFace
              key={button.Key}
              as={interactive ? "button" : "span"}
              label={button.Label}
              appearance={button.Style === "Danger" ? "Primary" : button.Style}
              danger={button.Style === "Danger"}
              disabled={primary && !canConfirm}
              icon=""
              busy={false}
              dark={dark}
              onClick={() => onButton?.(button)}
            />
          );
        })}
      </span>
    </span>
  );
}

function canConfirmWith(inputs: Inputs, text: string, check: (text: string) => string): boolean {
  if (inputs.Kind === "Danger")
    return text.trim().toUpperCase() === inputs.ConfirmWord.trim().toUpperCase();
  if (inputs.Kind === "Form")
    return !(inputs.InputRequired && text.trim() === "") && check(text) === "";
  return true;
}

function readInputs(settings: Record<string, string>): Inputs {
  const next: Inputs = { ...START, Buttons: DEFAULT_BUTTONS };
  for (const [key, formula] of Object.entries(settings)) {
    if (key === "Buttons") next.Buttons = readButtons(formula);
    else if (key in next) (next as unknown as Record<string, unknown>)[key] = fromPowerFx(formula);
  }
  return next;
}

export function useDialogReplica(): ReplicaApi {
  const id = useId();
  const [inputs, setInputs] = useState<Inputs>(START);
  const [open, setOpen] = useState(false);
  const [result, setResult] = useState("");
  const [text, setText] = useState("");
  const [validation, setValidation] = useState("none");
  const [logs, setLogs] = useState<string[]>([]);
  const dialogRef = useRef<HTMLDivElement>(null);
  const check = VALIDATIONS[validation]!.check;
  const problem = inputs.Kind === "Form" && text !== "" ? check(text) : "";
  const canConfirm = canConfirmWith(inputs, text, check);
  const set = <K extends keyof Inputs>(key: K, next: Inputs[K]) =>
    setInputs((current) => ({ ...current, [key]: next }));

  // On the web the replica can do what Studio can't: move focus into the dialog.
  useEffect(() => {
    if (open) dialogRef.current?.querySelector<HTMLElement>("input, button")?.focus();
  }, [open]);

  const openDialog = () => {
    setText("");
    setResult("");
    setOpen(true);
    setLogs((current) => pushLog(current, "Open()"));
  };
  const dismiss = () => {
    setOpen(false);
    setResult("");
    setLogs((current) => pushLog(current, "OnDismiss()"));
  };
  const answer = (button: DialogButton) => {
    setOpen(false);
    setResult(button.Key);
    setLogs((current) =>
      pushLog(current, `OnButtonSelect(Key: "${button.Key}", InputText: ${JSON.stringify(text)})`),
    );
    setText("");
  };

  return {
    stage: (dark) => (
      <div className="relative grid min-h-80 w-full max-w-md place-items-center overflow-hidden rounded-lg">
        <ButtonFace
          label="Delete request"
          appearance="Secondary"
          icon="Delete"
          busy={false}
          dark={dark}
          onClick={openDialog}
        />
        {open ? (
          <div
            className="absolute inset-0 grid place-items-center bg-black/45 p-3"
            onClick={(event) => {
              if (event.target === event.currentTarget && inputs.ShowClose) dismiss();
            }}
          >
            <div
              ref={dialogRef}
              role="dialog"
              aria-modal="true"
              aria-labelledby={`${id}-title`}
              onKeyDown={(event) => {
                if (event.key === "Escape" && inputs.ShowClose) dismiss();
              }}
            >
              <DialogCard
                inputs={inputs}
                dark={dark}
                titleId={`${id}-title`}
                text={text}
                setText={setText}
                problem={problem}
                canConfirm={canConfirm}
                onButton={answer}
                onClose={dismiss}
              />
            </div>
          </div>
        ) : null}
      </div>
    ),
    controls: (
      <div className="grid gap-3 lg:grid-cols-2">
        <Group kind="Input" title="Data in">
          <label htmlFor={`${id}-kind`}>Kind</label>
          <select
            id={`${id}-kind`}
            className={FIELD}
            value={inputs.Kind}
            onChange={(e) => set("Kind", e.target.value as Kind)}
          >
            {KINDS.map((value) => (
              <option key={value}>{value}</option>
            ))}
          </select>
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
          <label htmlFor={`${id}-w`}>ConfirmWord (Danger)</label>
          <input
            id={`${id}-w`}
            className={FIELD}
            value={inputs.ConfirmWord}
            onChange={(e) => set("ConfirmWord", e.target.value)}
          />
          <label className="flex min-h-11 items-center gap-2">
            <input
              type="checkbox"
              checked={inputs.ShowClose}
              onChange={(e) => set("ShowClose", e.target.checked)}
            />{" "}
            ShowClose
          </label>
          <Formula
            name="dlgDelete.Buttons"
            value={`Table(${inputs.Buttons.map((b) => `{Key: "${b.Key}", Label: "${b.Label}", Style: "${b.Style}"}`).join(", ")})`}
          />
        </Group>
        <div className="flex flex-col gap-3">
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
        </div>
        <Group kind="InputFunction" title="ValidateInput(Text)">
          <label htmlFor={`${id}-v`}>Formula in your app (Form)</label>
          <select
            id={`${id}-v`}
            className={FIELD}
            value={validation}
            onChange={(e) => setValidation(e.target.value)}
          >
            <option value="none">No extra check</option>
            <option value="length">At least 10 characters</option>
          </select>
          <Formula name="dlgReject.ValidateInput" value={VALIDATIONS[validation]!.formula} />
        </Group>
        <Group kind="Event" title="OnButtonSelect and OnDismiss">
          <EventLog entries={logs} empty="Open the dialog and answer it." />
        </Group>
      </div>
    ),
    apply: (settings) => {
      setInputs(readInputs(settings));
      setText("");
      setResult("");
      setOpen(true);
    },
    thumbnail: (settings, dark) => {
      const next = readInputs(settings);
      return (
        <DialogCard
          inputs={{ ...next, ShowClose: false }}
          dark={dark}
          text=""
          problem=""
          canConfirm={next.Kind !== "Danger" && next.Kind !== "Form"}
          interactive={false}
        />
      );
    },
  };
}
