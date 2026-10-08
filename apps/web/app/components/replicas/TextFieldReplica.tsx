"use client";

import { useId, useState } from "react";
import { ACTION_BUTTON, EventLog, FIELD, Formula, Group, OutputValue, pushLog } from "./parts";
import { fromPowerFx, type ReplicaApi } from "./replica";

/** A web replica of lcsTextField (MVP-049): label, hint, error, count, IsValid. */

const CHECKS: Record<string, { formula: string; check: (text: string) => string }> = {
  none: { formula: '""', check: () => "" },
  email: {
    formula:
      'If(IsMatch(Text, Match.Email) || IsBlank(Text), "", "Enter an email like name@example.com.")',
    check: (text) =>
      text === "" || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(text)
        ? ""
        : "Enter an email like name@example.com.",
  },
  digits: {
    formula: 'If(IsMatch(Text, "\\d*"), "", "Use numbers only.")',
    check: (text) => (/^\d*$/.test(text) ? "" : "Use numbers only."),
  },
};

interface Inputs {
  Label: string;
  Hint: string;
  Placeholder: string;
  DefaultValue: string;
  Required: boolean;
  MaxLength: number;
  Multiline: boolean;
  ErrorMessage: string;
  Look: string;
  Theme: string;
}

const START: Inputs = {
  Label: "Full name",
  Hint: "As it appears on your badge.",
  Placeholder: "",
  DefaultValue: "",
  Required: true,
  MaxLength: 60,
  Multiline: false,
  ErrorMessage: "",
  Look: "Outline",
  Theme: "Light",
};

function TextFieldFace({
  inputs,
  value,
  error,
  dark,
  inputId,
  onChange,
  onBlur,
  interactive = true,
}: {
  inputs: Inputs;
  value: string;
  error: string;
  dark: boolean;
  inputId?: string;
  onChange?: (value: string) => void;
  onBlur?: () => void;
  interactive?: boolean;
}) {
  dark = dark || inputs.Theme === "Dark";
  const ink = dark ? "text-white" : "text-[#242424]";
  const sub = dark ? "text-[#adadad]" : "text-[#616161]";
  const errorInk = dark ? "text-[#f1707b]" : "text-[#c4314b]";
  const filled = inputs.Look === "Filled" || inputs.Look === "FilledLight";
  const box = `w-full rounded-md border ${
    dark
      ? "bg-[#292929]"
      : filled
        ? inputs.Look === "Filled"
          ? "bg-[#f0f0f0]"
          : "bg-[#fafafa]"
        : "bg-white"
  } px-3 text-sm ${ink} ${
    error
      ? dark
        ? "border-[#f1707b]"
        : "border-[#c4314b]"
      : dark
        ? "border-[#666]"
        : "border-[#d1d1d1]"
  } border-b-2 ${error ? "" : dark ? "border-b-[#479ef5]" : "border-b-[#0f6cbd]"} outline-none focus-visible:ring-2 focus-visible:ring-[#0f6cbd]`;
  const messageId = inputId ? `${inputId}-message` : undefined;
  return (
    <div
      className={`w-72 max-w-full text-left [font-family:"Segoe_UI",system-ui,sans-serif] ${ink}`}
    >
      {interactive ? (
        <label htmlFor={inputId} className="block text-sm font-semibold">
          {inputs.Label}
          {inputs.Required ? " *" : ""}
        </label>
      ) : (
        <span className="block text-sm font-semibold">
          {inputs.Label}
          {inputs.Required ? " *" : ""}
        </span>
      )}
      {interactive ? (
        inputs.Multiline ? (
          <textarea
            id={inputId}
            className={`${box} mt-1 h-24 py-1.5`}
            value={value}
            placeholder={inputs.Placeholder}
            maxLength={inputs.MaxLength > 0 ? inputs.MaxLength : undefined}
            aria-invalid={error ? true : undefined}
            aria-describedby={messageId}
            onChange={(event) => onChange?.(event.target.value)}
            onBlur={onBlur}
          />
        ) : (
          <input
            id={inputId}
            className={`${box} mt-1.5 h-10`}
            value={value}
            placeholder={inputs.Placeholder}
            maxLength={inputs.MaxLength > 0 ? inputs.MaxLength : undefined}
            aria-invalid={error ? true : undefined}
            aria-describedby={messageId}
            onChange={(event) => onChange?.(event.target.value)}
            onBlur={onBlur}
          />
        )
      ) : (
        <span
          className={`${box} mt-1.5 flex ${inputs.Multiline ? "h-16" : "h-10"} items-center ${value ? "" : sub}`}
        >
          {value || inputs.Placeholder}
        </span>
      )}
      <span id={messageId} className="mt-1.5 flex justify-between gap-2 text-xs">
        <span className={error ? errorInk : sub}>{error ? `⚠ ${error}` : inputs.Hint}</span>
        {inputs.MaxLength > 0 ? (
          <span className={sub}>
            {value.length}/{inputs.MaxLength}
          </span>
        ) : null}
      </span>
    </div>
  );
}

function errorFor(
  inputs: Inputs,
  value: string,
  touched: boolean,
  check: (text: string) => string,
) {
  if (inputs.ErrorMessage) return inputs.ErrorMessage;
  if (!touched) return "";
  if (inputs.Required && value.trim() === "") return "This field is required.";
  return check(value);
}

export function useTextFieldReplica(): ReplicaApi {
  const id = useId();
  const [inputs, setInputs] = useState<Inputs>(START);
  const [value, setValue] = useState(START.DefaultValue);
  const [touched, setTouched] = useState(false);
  const [check, setCheck] = useState("none");
  const [logs, setLogs] = useState<string[]>([]);
  const validate = CHECKS[check]!.check;
  const error = errorFor(inputs, value, touched, validate);
  const isValid =
    !inputs.ErrorMessage && !(inputs.Required && value.trim() === "") && validate(value) === "";
  const set = <K extends keyof Inputs>(key: K, next: Inputs[K]) =>
    setInputs((current) => ({ ...current, [key]: next }));

  function applySettings(settings: Record<string, string>) {
    const next: Inputs = { ...START, Hint: "", Required: false, MaxLength: 100 };
    for (const [key, formula] of Object.entries(settings)) {
      const parsed = fromPowerFx(formula);
      if (key in next) (next as unknown as Record<string, unknown>)[key] = parsed;
    }
    return next;
  }

  return {
    stage: (dark) => (
      <TextFieldFace
        inputs={inputs}
        value={value}
        error={error}
        dark={dark}
        inputId={`${id}-stage`}
        onChange={setValue}
        onBlur={() => {
          setTouched(true);
          setLogs((current) => pushLog(current, `OnChange(Value: ${JSON.stringify(value)})`));
        }}
      />
    ),
    controls: (
      <div className="grid gap-3 lg:grid-cols-2">
        <Group kind="Input" title="Data in">
          <label htmlFor={`${id}-label`}>Label</label>
          <input
            id={`${id}-label`}
            className={FIELD}
            value={inputs.Label}
            onChange={(e) => set("Label", e.target.value)}
          />
          <label htmlFor={`${id}-hint`}>Hint</label>
          <input
            id={`${id}-hint`}
            className={FIELD}
            value={inputs.Hint}
            onChange={(e) => set("Hint", e.target.value)}
          />
          <label htmlFor={`${id}-max`}>MaxLength</label>
          <input
            id={`${id}-max`}
            type="number"
            min={0}
            className={FIELD}
            value={inputs.MaxLength}
            onChange={(e) => set("MaxLength", Math.max(0, Number(e.target.value) || 0))}
          />
          <label htmlFor={`${id}-server`}>ErrorMessage</label>
          <input
            id={`${id}-server`}
            className={FIELD}
            value={inputs.ErrorMessage}
            onChange={(e) => set("ErrorMessage", e.target.value)}
          />
          <label className="flex min-h-11 items-center gap-2">
            <input
              type="checkbox"
              checked={inputs.Required}
              onChange={(e) => set("Required", e.target.checked)}
            />{" "}
            Required
          </label>
          <label className="flex min-h-11 items-center gap-2">
            <input
              type="checkbox"
              checked={inputs.Multiline}
              onChange={(e) => set("Multiline", e.target.checked)}
            />{" "}
            Multiline
          </label>
          <Formula name="txtName.Required" value={String(inputs.Required)} />
        </Group>
        <div className="flex flex-col gap-3">
          <Group kind="Output" title="State out">
            <p className="flex flex-wrap items-center gap-2">
              <code className="font-mono text-sm">txtName.Value</code>
              <OutputValue>{JSON.stringify(value)}</OutputValue>
            </p>
            <p className="flex flex-wrap items-center gap-2">
              <code className="font-mono text-sm">txtName.IsValid</code>
              <OutputValue>{String(isValid)}</OutputValue>
            </p>
          </Group>
          <Group kind="InputFunction" title="Validate(Text)">
            <label htmlFor={`${id}-check`}>Formula in your app</label>
            <select
              id={`${id}-check`}
              className={FIELD}
              value={check}
              onChange={(e) => setCheck(e.target.value)}
            >
              <option value="none">No extra check</option>
              <option value="email">Email format</option>
              <option value="digits">Numbers only</option>
            </select>
            <Formula name="txtName.Validate" value={CHECKS[check]!.formula} />
          </Group>
        </div>
        <Group kind="Event" title="OnChange(Value)">
          <p className="text-sm text-muted-foreground">
            Type in the field, then leave it: OnChange runs on blur.
          </p>
          <EventLog entries={logs} empty="Nothing yet." />
        </Group>
        <Group kind="Action" title="Reset()">
          <button
            type="button"
            className={ACTION_BUTTON}
            onClick={() => {
              setValue(inputs.DefaultValue);
              setTouched(false);
              setLogs((current) => pushLog(current, "Reset()"));
            }}
          >
            Call txtName.Reset()
          </button>
        </Group>
      </div>
    ),
    apply: (settings) => {
      const next = applySettings(settings);
      setInputs(next);
      setValue(next.DefaultValue);
      setTouched(false);
    },
    thumbnail: (settings, dark) => {
      const next = applySettings(settings);
      return (
        <TextFieldFace
          inputs={next}
          value={next.DefaultValue}
          error={next.ErrorMessage}
          dark={dark}
          interactive={false}
        />
      );
    },
  };
}
