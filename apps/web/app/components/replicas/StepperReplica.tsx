"use client";

import { useId, useState, type CSSProperties } from "react";
import { useNotify } from "./notify";
import { cssColor, fromPowerFx, SEGOE, type ReplicaApi, type Wiring } from "./replica";

/**
 * A web replica of lcsStepper (MVP-049; docs/final-decisions.md, 2026-10-08,
 * "One live view"), as its YAML lays it out, on a screen wired the way its
 * guide says: CanLeaveStep wants a name on step 1, and a text input and a
 * label show the current step's content under it.
 */

export interface Step {
  Title: string;
  Description: string;
}

/** Steps' default in the component's YAML. */
export const STEPS: readonly Step[] = [
  { Title: "Your details", Description: "Name and team" },
  { Title: "What you need", Description: "Items and dates" },
  { Title: "Approver", Description: "Who signs it off" },
  { Title: "Review", Description: "Check and submit" },
];

/** StepText with {n} and {total} filled in, as the YAML's Substitute does. */
export function stepLabel(format: string, n: number, total: number): string {
  return format.replaceAll("{n}", String(n)).replaceAll("{total}", String(total));
}

/**
 * GoToStep's rule: going forward stops at the first step CanLeaveStep doesn't
 * allow (from the current step up to the one before the target).
 */
export function goToStep(
  target: number,
  current: number,
  count: number,
  canLeave: (step: number) => boolean,
): { step: number; blockedAt: number } {
  const to = Math.max(1, Math.min(target, count));
  if (to > current) {
    for (let step = current; step < to; step++) {
      if (!canLeave(step)) return { step, blockedAt: step };
    }
  }
  return { step: to, blockedAt: 0 };
}

interface Inputs {
  DefaultStep: number;
  Orientation: string;
  ShowDescriptions: boolean;
  ShowButtons: boolean;
  AllowJumpBack: boolean;
  BackText: string;
  NextText: string;
  FinishText: string;
  BlockedText: string;
  StepText: string;
  DoneText: string;
  CurrentText: string;
  AccentColor: string;
  Theme: string;
}

const DEFAULTS: Inputs = {
  DefaultStep: 1,
  Orientation: "Horizontal",
  ShowDescriptions: true,
  ShowButtons: true,
  AllowJumpBack: true,
  BackText: "Back",
  NextText: "Next",
  FinishText: "Submit",
  BlockedText: "Complete this step to continue.",
  StepText: "Step {n} of {total}",
  DoneText: "completed",
  CurrentText: "current step",
  AccentColor: "#0f6cbd",
  Theme: "Light",
};

export function useStepperReplica(): ReplicaApi {
  const id = useId();
  const notify = useNotify();
  const [inputs, setInputs] = useState<Inputs>(DEFAULTS);
  // locStep and locBlockedAt inside the component; TextInput1 on the screen.
  const [chosen, setChosen] = useState<number | null>(null);
  const [blockedAt, setBlockedAt] = useState(0);
  const [name, setName] = useState("");

  const dark = inputs.Theme === "Dark";
  const vertical = inputs.Orientation === "Vertical";
  const count = Math.max(1, STEPS.length);
  const step = Math.max(1, Math.min(chosen ?? inputs.DefaultStep, count));
  // The screen's CanLeaveStep: If(Step = 1, !IsBlank(TextInput1.Value), true).
  const canLeave = (from: number) => from !== 1 || name.trim() !== "";

  const ink = dark ? "text-white" : "text-[#242424]";
  const sub = dark ? "text-[#adadad]" : "text-[#616161]";
  const line = dark ? "bg-[#525252]" : "bg-[#d1d5db]";
  const danger = dark ? "text-[#ff99a4]" : "text-[#c4314b]";
  const accentInk = dark
    ? "text-[color-mix(in_srgb,var(--accent)_55%,white)]"
    : "text-[color-mix(in_srgb,var(--accent)_80%,black)]";

  const go = (to: number) => {
    const from = step;
    setChosen(to);
    setBlockedAt(0);
    if (to !== from) notify(`Step ${to}`);
  };
  const next = () => {
    if (!canLeave(step)) {
      setBlockedAt(step);
      return;
    }
    if (step >= count) {
      setBlockedAt(0);
      notify("Submitted", "Success");
      return;
    }
    go(step + 1);
  };

  const circle = (n: number) => {
    const done = n < step;
    const current = n === step;
    return (
      <span
        aria-hidden="true"
        className={`grid size-8 shrink-0 place-items-center rounded-full text-[13px] font-semibold ${
          done
            ? "bg-[var(--accent)] text-white"
            : current
              ? `border-2 border-[var(--accent)] ${dark ? "bg-[#242424]" : "bg-white"} ${accentInk}`
              : `border ${dark ? "border-[#525252] bg-[#242424]" : "border-[#d1d5db] bg-white"} ${sub}`
        }`}
      >
        {done ? "✓" : n}
      </span>
    );
  };

  const steps = (
    <ol
      aria-label={stepLabel(inputs.StepText, step, count)}
      className={vertical ? "flex flex-col" : "grid"}
      style={vertical ? undefined : { gridTemplateColumns: `repeat(${count}, minmax(0, 1fr))` }}
    >
      {STEPS.map((item, index) => {
        const n = index + 1;
        const done = n < step;
        const current = n === step;
        const label = `${item.Title}, ${stepLabel(inputs.StepText, n, count)}${
          done ? `, ${inputs.DoneText}` : current ? `, ${inputs.CurrentText}` : ""
        }`;
        const canGo = inputs.AllowJumpBack && done;
        return (
          <li key={item.Title} className={`relative ${vertical ? "h-[72px]" : "h-[88px]"}`}>
            {vertical ? (
              n < count ? (
                <span
                  aria-hidden="true"
                  className={`absolute top-[42px] left-[23px] h-[calc(100%-44px)] w-0.5 ${done ? "bg-[var(--accent)]" : line}`}
                />
              ) : null
            ) : (
              <>
                {n > 1 ? (
                  <span
                    aria-hidden="true"
                    className={`absolute top-[23px] left-0 h-0.5 w-[calc(50%-22px)] ${n <= step ? "bg-[var(--accent)]" : line}`}
                  />
                ) : null}
                {n < count ? (
                  <span
                    aria-hidden="true"
                    className={`absolute top-[23px] right-0 h-0.5 w-[calc(50%-22px)] ${done ? "bg-[var(--accent)]" : line}`}
                  />
                ) : null}
              </>
            )}
            <button
              type="button"
              aria-label={label}
              aria-current={current ? "step" : undefined}
              disabled={!canGo}
              onClick={() => go(n)}
              className={`absolute inset-0 flex text-left ${
                vertical ? "items-start gap-3 pt-1 pl-2" : "flex-col items-center pt-2"
              } ${canGo ? "cursor-pointer" : "cursor-default"}`}
            >
              {circle(n)}
              <span className={`min-w-0 ${vertical ? "" : "mt-1.5 w-full px-1 text-center"}`}>
                <span
                  className={`block truncate text-[13px] ${current ? "font-semibold" : ""} ${n > step ? sub : ink}`}
                >
                  {item.Title}
                </span>
                {inputs.ShowDescriptions ? (
                  <span className={`block truncate text-[11px] ${sub}`}>{item.Description}</span>
                ) : null}
              </span>
            </button>
          </li>
        );
      })}
    </ol>
  );

  const wiring: Wiring[] = [
    {
      control: "lcsStepper_1",
      property: "CanLeaveStep",
      formula: "If(Step = 1, !IsBlank(TextInput1.Value), true)",
    },
    { control: "lcsStepper_1", property: "OnStepChange", formula: 'Notify("Step " & NewStep)' },
    {
      control: "lcsStepper_1",
      property: "OnFinish",
      formula: 'Notify("Submitted", NotificationType.Success)',
    },
    { control: "TextInput1", property: "Visible", formula: "lcsStepper_1.CurrentStep = 1" },
    { control: "Label1", property: "Text", formula: "lcsStepper_1.CurrentTitle" },
  ];

  return {
    screen: (
      <div
        style={{ "--accent": inputs.AccentColor } as CSSProperties}
        className={`w-[720px] max-w-full text-left ${SEGOE} ${ink}`}
      >
        <div className={vertical ? "max-w-[320px]" : ""}>{steps}</div>
        {inputs.ShowButtons ? (
          <div className="mt-3 flex flex-wrap items-center justify-end gap-2">
            <p
              role="status"
              className={`mr-auto min-h-10 flex-1 basis-40 py-2.5 text-[13px] ${blockedAt === step ? `${danger} font-semibold` : sub}`}
            >
              {blockedAt === step ? inputs.BlockedText : stepLabel(inputs.StepText, step, count)}
            </p>
            <button
              type="button"
              disabled={step <= 1}
              onClick={() => go(Math.max(1, step - 1))}
              className={`h-10 w-[104px] rounded border text-sm font-semibold ${
                dark
                  ? "border-[#666] bg-[#292929] text-white hover:bg-[#333] disabled:border-[#3d3d3d] disabled:text-[#5c5c5c]"
                  : "border-[#d1d1d1] bg-white text-[#242424] hover:bg-[#f5f5f5] disabled:border-[#e0e0e0] disabled:text-[#bdbdbd]"
              } disabled:cursor-not-allowed`}
            >
              {inputs.BackText}
            </button>
            <button
              type="button"
              onClick={next}
              className="h-10 w-28 rounded bg-[var(--accent)] text-sm font-semibold text-white hover:bg-[color-mix(in_srgb,var(--accent)_86%,black)]"
            >
              {step >= count ? inputs.FinishText : inputs.NextText}
            </button>
          </div>
        ) : null}
        {/* The screen under the component: TextInput1 on step 1, Label1 with the step's title. */}
        <div
          className={`mt-5 rounded-md border p-4 ${dark ? "border-[#424242]" : "border-[#e0e0e0]"}`}
        >
          <p className="text-base font-semibold">{STEPS[step - 1]?.Title}</p>
          {step === 1 ? (
            <div className="mt-3 flex flex-col gap-1">
              <label htmlFor={`${id}-name`} className="text-[13px]">
                Your name
              </label>
              <input
                id={`${id}-name`}
                value={name}
                onChange={(event) => setName(event.target.value)}
                autoComplete="off"
                className={`h-8 max-w-xs rounded border px-2 text-sm ${
                  dark
                    ? "border-[#666] bg-[#292929] text-white"
                    : "border-[#d1d1d1] border-b-[#616161] bg-white text-[#242424]"
                }`}
              />
            </div>
          ) : (
            <p className={`mt-2 text-[13px] ${sub}`}>{STEPS[step - 1]?.Description}</p>
          )}
        </div>
      </div>
    ),
    apply: (settings) => {
      const next = { ...DEFAULTS };
      for (const [key, formula] of Object.entries(settings)) {
        if (key === "AccentColor") next.AccentColor = cssColor(formula, DEFAULTS.AccentColor);
        else if (key in next)
          (next as unknown as Record<string, unknown>)[key] = fromPowerFx(formula);
      }
      setInputs(next);
      setChosen(null);
      setBlockedAt(0);
      setName("");
    },
    dark,
    wiring,
  };
}
