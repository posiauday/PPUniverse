"use client";

import { useId, useState, type ReactNode } from "react";
import { ButtonFace } from "./ButtonReplica";
import { ThemedButton, themedHover } from "./themed";
import { useNotify } from "./notify";
import { fromPowerFx, SEGOE, type ReplicaApi } from "./replica";

/**
 * A web replica of lcsDialog 0.2.0 (MVP-049; docs/final-decisions.md, 2026-10-08,
 * "One live view"): Confirm, Alert, Form and Danger; up to three buttons from a
 * table; type-to-confirm; OnButtonSelect(Key, InputText) and OnDismiss. Like the
 * component it starts closed and sized to the screen, and a button on the
 * screen calls Open(). As in Studio, opening it doesn't move keyboard focus and
 * Escape doesn't close it: Tab reaches it next, because it's last on the screen.
 */

type Kind = "Confirm" | "Alert" | "Form" | "Danger";
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
  InputPlaceholder: string;
  InputRequired: boolean;
  ConfirmWord: string;
  ShowClose: boolean;
  Theme: string;
}

const DEFAULT_BUTTONS: DialogButton[] = [
  { Key: "cancel", Label: "Cancel", Style: "Secondary" },
  { Key: "confirm", Label: "Delete", Style: "Primary" },
];

/** The inputs' defaults in the component's YAML. */
const START: Inputs = {
  Kind: "Confirm",
  Title: "Delete this request?",
  Message: "It will be removed for everyone. You can't undo this.",
  Buttons: DEFAULT_BUTTONS,
  Icon: "Auto",
  InputLabel: "Reason",
  InputPlaceholder: "",
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

/** The card, laid out as the component's YAML places it: 24 pixels in, buttons on the right. */
function DialogCard({
  inputs,
  titleId,
  text,
  setText,
  canConfirm,
  onButton,
  onClose,
}: {
  inputs: Inputs;
  titleId: string;
  text: string;
  setText: (value: string) => void;
  canConfirm: boolean;
  onButton: (button: DialogButton) => void;
  onClose: () => void;
}) {
  const dark = inputs.Theme === "Dark";
  const icon = ICON_PATHS[iconFor(inputs)];
  const hasInput = inputs.Kind === "Form" || inputs.Kind === "Danger";
  const inputId = `${titleId}-input`;
  const field = `mt-1 w-full rounded-md border px-3 text-sm ${
    dark ? "border-[#666] bg-[#1f1f1f] text-white" : "border-[#d1d1d1] bg-white text-[#242424]"
  }`;
  return (
    <div
      className={`relative w-full rounded-xl p-6 text-left shadow-[0_8px_28px_rgba(0,0,0,0.22)] ${SEGOE} ${
        dark ? "bg-[#292929] text-white" : "bg-white text-[#242424]"
      }`}
    >
      <div className={`flex items-start gap-2.5 ${inputs.ShowClose ? "pr-8" : ""}`}>
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
        <div className="min-w-0">
          <p id={titleId} className="text-lg leading-snug font-semibold">
            {inputs.Title}
          </p>
          <p className={`mt-2 text-sm ${dark ? "text-[#d6d6d6]" : "text-[#424242]"}`}>
            {inputs.Message}
          </p>
        </div>
      </div>
      {inputs.ShowClose ? (
        <button
          type="button"
          aria-label="Close dialog"
          onClick={onClose}
          className={`absolute top-4 right-4 grid size-9 place-items-center rounded ${themedHover(dark)}`}
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
        <div className="mt-4">
          <label htmlFor={inputId} className="block text-[0.8125rem] font-semibold">
            {inputs.Kind === "Danger"
              ? `Type ${inputs.ConfirmWord} to confirm`
              : `${inputs.InputLabel}${inputs.InputRequired ? " *" : ""}`}
          </label>
          {inputs.Kind === "Form" ? (
            <textarea
              id={inputId}
              value={text}
              placeholder={inputs.InputPlaceholder}
              onChange={(event) => setText(event.target.value)}
              className={`${field} h-[72px] resize-none py-2`}
            />
          ) : (
            <input
              id={inputId}
              value={text}
              placeholder={inputs.ConfirmWord}
              onChange={(event) => setText(event.target.value)}
              className={`${field} h-10`}
            />
          )}
        </div>
      ) : null}
      <div className={`flex flex-wrap justify-end gap-2 ${hasInput ? "mt-9" : "mt-6"}`}>
        {visibleButtons(inputs).map((button) => {
          const primary = button.Style === "Primary" || button.Style === "Danger";
          return (
            <ThemedButton
              key={button.Key}
              label={button.Label}
              appearance={button.Style === "Danger" ? "Primary" : button.Style}
              fill={button.Style === "Danger" ? "#c4314b" : "#0f6cbd"}
              disabled={primary && !canConfirm}
              dark={dark}
              onClick={() => onButton(button)}
            />
          );
        })}
      </div>
    </div>
  );
}

/** The component's DisplayMode rule for its Primary and Danger buttons (ValidateInput at its default). */
function canConfirmWith(inputs: Inputs, text: string): boolean {
  if (inputs.Kind === "Danger")
    return text.trim().toUpperCase() === inputs.ConfirmWord.trim().toUpperCase();
  if (inputs.Kind === "Form") return !(inputs.InputRequired && text.trim() === "");
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
  const notify = useNotify();
  const [inputs, setInputs] = useState<Inputs>(START);
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");

  const dismiss = () => {
    setOpen(false);
    notify("Closed without an answer");
  };

  return {
    screen: (
      <>
        <ButtonFace
          label="Open dialog"
          appearance="Primary"
          icon=""
          busy={false}
          dark={false}
          onClick={() => {
            setText("");
            setOpen(true);
          }}
        />
        {open ? (
          <div
            className="absolute inset-0 z-10 grid place-items-center bg-black/45 p-4"
            onClick={(event) => {
              if (event.target === event.currentTarget && inputs.ShowClose) dismiss();
            }}
          >
            <div role="dialog" aria-labelledby={`${id}-title`} className="w-full max-w-[440px]">
              <DialogCard
                inputs={inputs}
                titleId={`${id}-title`}
                text={text}
                setText={setText}
                canConfirm={canConfirmWith(inputs, text)}
                onButton={(button) => {
                  setOpen(false);
                  notify(`You chose ${button.Key}${text.trim() ? `: ${text}` : ""}`);
                  setText("");
                }}
                onClose={dismiss}
              />
            </div>
          </div>
        ) : null}
      </>
    ),
    apply: (settings) => {
      setInputs(readInputs(settings));
      setText("");
      setOpen(false);
    },
    dark: inputs.Theme === "Dark",
    wiring: [
      { control: "lcsDialog_1", property: "Width", formula: "Parent.Width" },
      { control: "lcsDialog_1", property: "Height", formula: "Parent.Height" },
      { control: "Button1", property: "OnSelect", formula: "lcsDialog_1.Open()" },
      {
        control: "lcsDialog_1",
        property: "OnButtonSelect",
        formula: 'Notify("You chose " & Key & If(IsBlank(InputText), "", ": " & InputText))',
      },
      {
        control: "lcsDialog_1",
        property: "OnDismiss",
        formula: 'Notify("Closed without an answer")',
      },
    ],
  };
}
