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
  Look: string;
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
  Look: "Standard",
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

  // The classic buttons' HoverFill in the YAML: 8% white on dark, 5% black on light.
  const hover = dark ? "hover:bg-white/[0.08]" : "hover:bg-black/[0.05]";
  const cardLine = dark ? "border-[#424242]" : "border-[#e5e7eb]";

  const circle = (n: number) => {
    const done = n < step;
    const current = n === step;
    return (
      <span className="relative grid size-9 shrink-0 place-items-center" aria-hidden="true">
        {current ? (
          <span
            className={`absolute -inset-[5px] rounded-full ${
              dark
                ? "bg-[color-mix(in_srgb,var(--accent)_40%,#242424)]"
                : "bg-[color-mix(in_srgb,var(--accent)_18%,white)]"
            }`}
          />
        ) : null}
        <span
          className={`relative grid size-9 place-items-center rounded-full text-sm font-semibold ${
            done || current
              ? "bg-[var(--accent)] text-white"
              : `border-2 ${dark ? "border-[#525252] bg-[#242424]" : "border-[#d1d5db] bg-white"} ${sub}`
          }`}
        >
          {done ? "✓" : n}
        </span>
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
          <li key={item.Title} className={`relative ${vertical ? "h-[72px]" : "h-[92px]"}`}>
            {vertical ? (
              n < count ? (
                <span
                  aria-hidden="true"
                  className={`absolute top-12 left-[23px] h-[calc(100%-52px)] w-0.5 rounded ${done ? "bg-[var(--accent)]" : line}`}
                />
              ) : null
            ) : (
              <>
                {n > 1 ? (
                  <span
                    aria-hidden="true"
                    className={`absolute top-[23px] left-0 h-0.5 w-[calc(50%-28px)] rounded ${n <= step ? "bg-[var(--accent)]" : line}`}
                  />
                ) : null}
                {n < count ? (
                  <span
                    aria-hidden="true"
                    className={`absolute top-[23px] right-0 h-0.5 w-[calc(50%-28px)] rounded ${done ? "bg-[var(--accent)]" : line}`}
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
              className={`absolute inset-0 flex rounded-[10px] text-left ${
                vertical ? "items-start gap-3.5 pt-1 pl-1.5" : "flex-col items-center pt-1.5"
              } ${canGo ? `cursor-pointer ${hover}` : "cursor-default"}`}
            >
              {circle(n)}
              <span className={`min-w-0 ${vertical ? "" : "mt-2 w-full px-1 text-center"}`}>
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
        <div
          className={`rounded-2xl border p-5 ${cardLine} ${dark ? "bg-[#242424]" : "bg-white"} ${
            inputs.Look === "Premium" ? "shadow-[0_10px_30px_-12px_rgba(16,24,40,0.4)]" : ""
          }`}
        >
          <div className={vertical ? "max-w-[320px]" : ""}>{steps}</div>
          {inputs.ShowButtons ? (
            <div
              className={`mt-3 flex flex-wrap items-center justify-end gap-3 border-t pt-4 ${cardLine}`}
            >
              <div role="status" className="mr-auto min-h-10 flex-1 basis-40">
                {blockedAt === step ? (
                  <p className={`py-2.5 text-[13px] font-semibold ${danger}`}>
                    {inputs.BlockedText}
                  </p>
                ) : (
                  <>
                    <p className={`text-[13px] leading-5 font-semibold ${sub}`}>
                      {stepLabel(inputs.StepText, step, count)}
                    </p>
                    <span
                      aria-hidden="true"
                      className={`mt-1.5 block h-1 w-[140px] overflow-hidden rounded ${line}`}
                    >
                      <span
                        className="block h-full rounded bg-[var(--accent)] motion-safe:transition-[width] motion-safe:duration-300"
                        style={{ width: `${(140 * step) / count}px` }}
                      />
                    </span>
                  </>
                )}
              </div>
              <button
                type="button"
                disabled={step <= 1}
                onClick={() => go(Math.max(1, step - 1))}
                className={`h-10 w-[104px] rounded-lg border text-sm font-semibold ${
                  dark
                    ? `border-[#525252] text-white ${hover} disabled:border-[#424242] disabled:text-[#6e6e6e]`
                    : `border-[#d1d5db] text-[#242424] ${hover} disabled:border-[#e5e7eb] disabled:text-[#aaaaaa]`
                } disabled:cursor-not-allowed disabled:hover:bg-transparent`}
              >
                {inputs.BackText}
              </button>
              <button
                type="button"
                onClick={next}
                className="h-10 w-[116px] rounded-lg bg-[var(--accent)] text-sm font-semibold text-white hover:bg-[color-mix(in_srgb,var(--accent)_88%,black)] active:bg-[color-mix(in_srgb,var(--accent)_76%,black)]"
              >
                {step >= count ? inputs.FinishText : inputs.NextText}
              </button>
            </div>
          ) : null}
        </div>
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
