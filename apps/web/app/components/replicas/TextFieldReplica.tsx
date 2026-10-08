"use client";

import { useId, useRef, useState } from "react";
import { useNotify } from "./notify";
import { cssColor, fromPowerFx, SEGOE, type ReplicaApi, type Wiring } from "./replica";

/**
 * A web replica of lcsTextField (MVP-049; docs/final-decisions.md, 2026-10-08,
 * "One live view"): label, modern text input, hint or error, and count, 340
 * wide, as its YAML lays them out. As in Power Apps, the count and Value change
 * on every key, but OnChange runs only when you leave the box after changing
 * it, and that's also when a required or invalid value first shows its error.
 */

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
  AccentColor: string;
  Theme: string;
}

/** The inputs' defaults in the component's YAML. */
const DEFAULTS: Inputs = {
  Label: "Full name",
  Hint: "As it appears on your badge.",
  Placeholder: "Jordan Lee",
  DefaultValue: "",
  Required: false,
  MaxLength: 100,
  Multiline: false,
  ErrorMessage: "",
  Look: "Outline",
  AccentColor: "#0f6cbd",
  Theme: "Light",
};

function read(settings: Record<string, string>): Inputs {
  const next = { ...DEFAULTS };
  for (const [key, formula] of Object.entries(settings)) {
    if (key === "AccentColor") next.AccentColor = cssColor(formula, DEFAULTS.AccentColor);
    else if (key in next) (next as unknown as Record<string, unknown>)[key] = fromPowerFx(formula);
  }
  return next;
}

/** The component's error rule: ErrorMessage first, then required, once the box has changed. */
function problemFor(inputs: Inputs, value: string, touched: boolean): string {
  if (inputs.ErrorMessage) return inputs.ErrorMessage;
  if (!touched) return "";
  if (inputs.Required && value.trim() === "") return "This field is required.";
  return "";
}

export function useTextFieldReplica(): ReplicaApi {
  const id = useId();
  const notify = useNotify();
  const [inputs, setInputs] = useState<Inputs>(DEFAULTS);
  const [value, setValue] = useState(DEFAULTS.DefaultValue);
  const [touched, setTouched] = useState(false);
  const atFocus = useRef(value);

  const dark = inputs.Theme === "Dark";
  const problem = problemFor(inputs, value, touched);
  const isValid = !inputs.ErrorMessage && !(inputs.Required && value.trim() === "");
  const fill = dark
    ? inputs.Look === "Outline"
      ? "bg-[#292929]"
      : "bg-[#1f1f1f]"
    : inputs.Look === "Outline"
      ? "bg-white"
      : inputs.Look === "Filled"
        ? "bg-[#f0f0f0]"
        : "bg-[#fafafa]";
  const border = problem
    ? dark
      ? "border-[#f1707b]"
      : "border-[#c4314b]"
    : inputs.Look === "Outline"
      ? dark
        ? "border-[#666] border-b-[#adadad]"
        : "border-[#d1d1d1] border-b-[#616161]"
      : "border-transparent";
  const sub = dark ? "text-[#adadad]" : "text-[#616161]";
  const messageId = `${id}-message`;
  const field = {
    id: `${id}-input`,
    value,
    placeholder: inputs.Placeholder,
    maxLength: inputs.MaxLength > 0 ? inputs.MaxLength : undefined,
    "aria-invalid": problem ? true : undefined,
    "aria-describedby": messageId,
    onFocus: () => {
      atFocus.current = value;
    },
    onChange: (event: { target: { value: string } }) => setValue(event.target.value),
    onBlur: () => {
      if (value === atFocus.current) return;
      setTouched(true);
      notify(`Changed to "${value}"`);
    },
    className: `block w-full rounded-md bg-transparent px-3 text-sm ${dark ? "placeholder:text-[#8a8a8a]" : "placeholder:text-[#707070]"}`,
  };

  const wiring: Wiring[] = [
    {
      control: "Text1",
      property: "Text",
      formula: '"Value: " & lcsTextField_1.Value & "   IsValid: " & lcsTextField_1.IsValid',
    },
    ...(dark ? [{ control: "Text1", property: "Color", formula: "RGBA(255, 255, 255, 1)" }] : []),
    {
      control: "lcsTextField_1",
      property: "OnChange",
      formula: 'Notify("Changed to """ & Value & """")',
    },
  ];

  return {
    screen: (
      <div className={`w-[340px] max-w-full text-left ${SEGOE}`}>
        <label
          htmlFor={field.id}
          className={`block text-sm font-semibold ${dark ? "text-white" : "text-[#242424]"}`}
        >
          {inputs.Label}
          {inputs.Required ? " *" : ""}
        </label>
        {/* Fluent's focus underline grows from the middle in the accent colour, as the modern input does. */}
        <div
          style={{ ["--accent" as string]: inputs.AccentColor }}
          className={`group relative mt-1.5 rounded-md border ${fill} ${border} ${dark ? "text-white" : "text-[#242424]"}`}
        >
          {inputs.Multiline ? (
            <textarea {...field} rows={4} className={`${field.className} h-24 resize-none py-2`} />
          ) : (
            <input {...field} className={`${field.className} h-10`} />
          )}
          <span
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-1 -bottom-px h-0.5 scale-x-0 rounded-full bg-[var(--accent)] group-focus-within:scale-x-100 motion-safe:transition-transform motion-safe:duration-200 motion-safe:ease-out"
          />
        </div>
        <p id={messageId} className="mt-1.5 flex min-h-5 justify-between gap-3 text-xs">
          <span className={problem ? (dark ? "text-[#f1707b]" : "text-[#c4314b]") : sub}>
            {problem ? `⚠ ${problem}` : inputs.Hint}
          </span>
          {inputs.MaxLength > 0 ? (
            <span className={`${sub} shrink-0`}>
              {value.length}/{inputs.MaxLength}
            </span>
          ) : null}
        </p>
        <p className={`mt-6 text-sm break-words ${dark ? "text-white" : "text-[#242424]"}`}>
          Value: {value} IsValid: {String(isValid)}
        </p>
      </div>
    ),
    apply: (settings) => {
      const next = read(settings);
      setInputs(next);
      setValue(next.DefaultValue);
      setTouched(false);
    },
    dark,
    wiring,
  };
}
