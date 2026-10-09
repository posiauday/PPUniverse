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

/** Reads a Steps formula such as Table({Title: "Initiation", Description: "Charter"}, …). */
export function readSteps(formula: string): Step[] {
  return [...formula.matchAll(/\{([^}]*)\}/g)].map((match) => {
    const field = (name: string) =>
      match[1]!.match(new RegExp(`${name}\\s*:\\s*"((?:[^"]|"")*)"`))?.[1]?.replace(/""/g, '"') ??
      "";
    return { Title: field("Title"), Description: field("Description") };
  });
}

/** The YAML's status colours: BLUE complete; GREEN on track, AMBER at risk, RED off track. */
export const STATUS_COLORS = {
  blue: "#0f6cbd",
  green: "#107c10",
  amber: "#ffb900",
  red: "#c4314b",
} as const;

/**
 * Finished and current colours by Type, as DONE_COLOR and NOW_COLOR in the YAML: Project
 * finishes in blue and shows the current stage's Health; Approval finishes in green, waits
 * in amber and is red when rejected. Steps uses the accent colour for both.
 */
export function stageColors(
  type: string,
  health: string,
  accent: string,
): { done: string; now: string; darkInk: boolean } {
  if (type === "Project") {
    const now =
      health === "Red"
        ? STATUS_COLORS.red
        : health === "Amber"
          ? STATUS_COLORS.amber
          : STATUS_COLORS.green;
    return { done: STATUS_COLORS.blue, now, darkInk: health === "Amber" };
  }
  if (type === "Approval") {
    const rejected = health === "Red";
    return {
      done: STATUS_COLORS.green,
      now: rejected ? STATUS_COLORS.red : STATUS_COLORS.amber,
      darkInk: !rejected,
    };
  }
  return { done: accent, now: accent, darkInk: false };
}

/** The health in words, as HEALTH_WORDS in the YAML: what screen readers add to the current step. */
export function healthWords(
  type: string,
  health: string,
  complete: boolean,
  statusText: string,
): string {
  if (statusText !== "") return statusText;
  if (type === "Approval")
    return complete ? "Approved" : health === "Red" ? "Rejected" : "Waiting for approval";
  if (complete) return "Complete";
  return health === "Red" ? "Off track" : health === "Amber" ? "At risk" : "On track";
}

/**
 * The status pill's words, as STATUS_WORDS in the YAML: they name the current stage, so
 * they change at each one ("Approver · On track", "Waiting on Finance"). StatusText wins.
 */
export function statusWords(
  type: string,
  health: string,
  complete: boolean,
  statusText: string,
  title: string,
): string {
  if (statusText !== "") return statusText;
  if (type === "Approval")
    return complete
      ? "Approved"
      : health === "Red"
        ? `Rejected at ${title}`
        : `Waiting on ${title}`;
  if (complete) return "Complete";
  return `${title} · ${healthWords(type, health, false, "")}`;
}

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
  Steps: readonly Step[];
  Type: string;
  Health: string;
  StatusText: string;
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
  Steps: STEPS,
  Type: "Steps",
  Health: "Green",
  StatusText: "",
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
  const steps = inputs.Steps;
  const count = Math.max(1, steps.length);
  // Project and Approval can go one past the last step: all finished.
  const tracker = inputs.Type === "Project" || inputs.Type === "Approval";
  const maxStep = count + (tracker ? 1 : 0);
  const step = Math.max(1, Math.min(chosen ?? inputs.DefaultStep, maxStep));
  const complete = step > count;
  const shown = Math.min(step, count);
  const colors = stageColors(inputs.Type, inputs.Health, inputs.AccentColor);
  const rejected = inputs.Type === "Approval" && inputs.Health === "Red";
  const status = statusWords(
    inputs.Type,
    inputs.Health,
    complete,
    inputs.StatusText,
    steps[step - 1]?.Title ?? "",
  );
  const health = healthWords(inputs.Type, inputs.Health, complete, inputs.StatusText);
  const statusColor = complete ? colors.done : colors.now;
  const showFooter = inputs.ShowButtons || tracker;
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
  const premium = inputs.Look === "Premium";
  const accentTitle = dark
    ? "text-[color-mix(in_srgb,var(--accent)_55%,white)]"
    : "text-[color-mix(in_srgb,var(--accent)_80%,black)]";

  const circle = (n: number) => {
    const done = n < step;
    const current = n === step;
    return (
      <span className="relative grid size-9 shrink-0 place-items-center" aria-hidden="true">
        {current ? (
          <span
            className={`absolute -inset-[5px] rounded-full ${
              dark
                ? "bg-[color-mix(in_srgb,var(--now)_40%,#242424)]"
                : "bg-[color-mix(in_srgb,var(--now)_18%,white)]"
            }`}
          />
        ) : null}
        <span
          className={`relative grid size-9 place-items-center rounded-full text-sm font-semibold ${
            done
              ? "bg-[var(--done)] text-white"
              : current
                ? `bg-[var(--now)] ${colors.darkInk ? "text-[#242424]" : "text-white"}`
                : `border-2 ${dark ? "border-[#525252] bg-[#242424]" : "border-[#d1d5db] bg-white"} ${sub}`
          }`}
        >
          {done ? "✓" : current && rejected ? "✕" : n}
        </span>
      </span>
    );
  };

  const stepList = (
    <ol
      aria-label={stepLabel(inputs.StepText, shown, count)}
      className={vertical ? "flex flex-col" : "grid"}
      style={vertical ? undefined : { gridTemplateColumns: `repeat(${count}, minmax(0, 1fr))` }}
    >
      {steps.map((item, index) => {
        const n = index + 1;
        const done = n < step;
        const current = n === step;
        const label = `${item.Title}, ${stepLabel(inputs.StepText, n, count)}${
          done
            ? `, ${inputs.DoneText}`
            : current
              ? `, ${inputs.CurrentText}${tracker ? `, ${health}` : ""}`
              : ""
        }`;
        const canGo = inputs.AllowJumpBack && done;
        return (
          <li
            key={`${n}-${item.Title}`}
            className={`relative ${vertical ? "h-[72px]" : "h-[92px]"}`}
          >
            {vertical ? (
              n < count ? (
                <span
                  aria-hidden="true"
                  className={`absolute top-12 h-[calc(100%-52px)] rounded ${premium ? "left-[22.5px] w-[3px]" : "left-[23px] w-0.5"} ${done ? "bg-[var(--done)]" : line}`}
                />
              ) : null
            ) : (
              <>
                {n > 1 ? (
                  <span
                    aria-hidden="true"
                    className={`absolute left-0 w-[calc(50%-28px)] rounded ${premium ? "top-[22.5px] h-[3px]" : "top-[23px] h-0.5"} ${n <= step ? "bg-[var(--done)]" : line}`}
                  />
                ) : null}
                {n < count ? (
                  <span
                    aria-hidden="true"
                    className={`absolute right-0 w-[calc(50%-28px)] rounded ${premium ? "top-[22.5px] h-[3px]" : "top-[23px] h-0.5"} ${done ? "bg-[var(--done)]" : line}`}
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
                  className={`block truncate text-[13px] ${current ? "font-semibold" : ""} ${current && premium && !tracker ? accentTitle : n > step ? sub : ink}`}
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
        style={
          {
            "--accent": inputs.AccentColor,
            "--done": colors.done,
            "--now": colors.now,
            "--status": statusColor,
          } as CSSProperties
        }
        className={`w-[720px] max-w-full text-left ${SEGOE} ${ink}`}
      >
        <div
          className={`border p-5 ${cardLine} ${dark ? "bg-[#242424]" : "bg-white"} ${
            premium
              ? "m-2 rounded-[20px] shadow-[0_10px_30px_-12px_rgba(16,24,40,0.4)]"
              : "rounded-2xl"
          }`}
        >
          <div className={vertical ? "max-w-[320px]" : ""}>{stepList}</div>
          {showFooter ? (
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
                      {stepLabel(inputs.StepText, shown, count)}
                    </p>
                    <span
                      aria-hidden="true"
                      className={`mt-1.5 block w-[140px] overflow-hidden rounded ${premium ? "h-1.5" : "h-1"} ${line}`}
                    >
                      <span
                        className="block h-full rounded bg-[var(--status)] motion-safe:transition-[width] motion-safe:duration-300"
                        style={{ width: `${(140 * shown) / count}px` }}
                      />
                    </span>
                  </>
                )}
              </div>
              {tracker && blockedAt !== step ? (
                <span
                  className={`inline-flex h-7 max-w-[276px] min-w-[120px] items-center gap-2 rounded-full px-3 text-xs font-semibold ${
                    dark
                      ? "bg-[color-mix(in_srgb,var(--status)_30%,black)] text-white"
                      : "bg-[color-mix(in_srgb,var(--status)_15%,white)] text-[#242424]"
                  }`}
                >
                  <span
                    aria-hidden="true"
                    className="size-2 shrink-0 rounded-full bg-[var(--status)]"
                  />
                  <span className="truncate">{status}</span>
                </span>
              ) : null}
              {inputs.ShowButtons ? (
                <>
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
                </>
              ) : null}
            </div>
          ) : null}
        </div>
        {/* The screen under the component: TextInput1 on step 1, Label1 with the step's title. */}
        <div
          className={`mt-5 rounded-md border p-4 ${dark ? "border-[#424242]" : "border-[#e0e0e0]"}`}
        >
          <p className="text-base font-semibold">{complete ? status : steps[step - 1]?.Title}</p>
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
            <p className={`mt-2 text-[13px] ${sub}`}>{steps[step - 1]?.Description}</p>
          )}
        </div>
      </div>
    ),
    apply: (settings) => {
      const next = { ...DEFAULTS };
      for (const [key, formula] of Object.entries(settings)) {
        if (key === "AccentColor") next.AccentColor = cssColor(formula, DEFAULTS.AccentColor);
        else if (key === "Steps") {
          const parsed = readSteps(formula);
          next.Steps = parsed.length > 0 ? parsed : STEPS;
        } else if (key in next)
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
