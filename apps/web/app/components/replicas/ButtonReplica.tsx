"use client";

import { useEffect, useId, useState, type ReactNode } from "react";
import { FIELD, Formula, Group } from "./parts";
import { fromPowerFx, type ReplicaApi } from "./replica";

/**
 * A web replica of lcsButton (MVP-049; docs/final-decisions.md, 2026-10-08,
 * "Previews are interactive web replicas"): it looks like the modern Power
 * Apps button and behaves like the component, property for property, so a
 * reader can try every kind before copying the YAML. The page says it is a
 * replica and that Studio may look slightly different.
 */

const APPEARANCES = ["Primary", "Secondary", "Outline", "Subtle"] as const;
type Appearance = (typeof APPEARANCES)[number];

/** Our own simple glyphs for a few Fluent icon names. */
const ICONS: Record<string, ReactNode> = {
  "": null,
  Checkmark: (
    <path
      d="M5 12l5 5L20 7"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  ),
  Send: (
    <path
      d="M3 11l18-8-8 18-2-8-8-2z"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinejoin="round"
    />
  ),
  Save: (
    <path
      d="M5 3h11l3 3v15H5zM8 3v6h8V3M8 21v-7h8v7"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
    />
  ),
  Add: <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />,
  Edit: (
    <path
      d="M4 20h4L19 9l-4-4L4 16zM14 6l4 4"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinejoin="round"
    />
  ),
  ArrowDownload: (
    <path
      d="M12 4v11M7 10l5 5 5-5M5 20h14"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  ),
  Delete: (
    <path
      d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
    />
  ),
};

const FORMATS: Record<string, (text: string) => string> = {
  Text: (text) => text,
  "Upper(Text)": (text) => text.toUpperCase(),
  "Proper(Text)": (text) =>
    text.replace(/\S+/g, (word) => word[0]!.toUpperCase() + word.slice(1).toLowerCase()),
  'Text & " →"': (text) => `${text} →`,
};

const HANDLERS: Record<string, (count: number) => { toast?: string; log?: string }> = {
  'Notify("Clicked " & Count & " times")': (count) => ({ toast: `Clicked ${count} times` }),
  "Set(varSaved, true)": () => ({ log: "varSaved = true" }),
  "false (do nothing)": () => ({}),
};

const APPEARANCE_CLASS: Record<Appearance, { light: string; dark: string }> = {
  Primary: {
    light: "bg-[#0f6cbd] text-white hover:bg-[#115ea3] active:bg-[#0c3b5e]",
    dark: "bg-[#115ea3] text-white hover:bg-[#0f6cbd] active:bg-[#0c3b5e]",
  },
  Secondary: {
    light: "border-[#d1d1d1] bg-white text-[#242424] hover:bg-[#f5f5f5]",
    dark: "border-[#666] bg-[#292929] text-white hover:bg-[#3d3d3d]",
  },
  Outline: {
    light: "border-[#d1d1d1] bg-transparent text-[#242424] hover:border-[#9e9e9e]",
    dark: "border-[#666] bg-transparent text-white hover:border-[#9e9e9e]",
  },
  Subtle: {
    light: "bg-transparent text-[#242424] hover:bg-[#f5f5f5]",
    dark: "bg-transparent text-white hover:bg-[#3d3d3d]",
  },
};

function Spinner() {
  return (
    <svg viewBox="0 0 24 24" className="size-[18px] motion-safe:animate-spin" aria-hidden="true">
      <circle
        cx="12"
        cy="12"
        r="9"
        fill="none"
        stroke="currentColor"
        strokeOpacity=".3"
        strokeWidth="2.5"
      />
      <path
        d="M21 12a9 9 0 0 0-9-9"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

/** The button as it looks in Studio, for one set of inputs. */
export function ButtonFace({
  label,
  appearance,
  icon,
  busy,
  dark,
  onClick,
  as = "button",
  danger = false,
  disabled = false,
}: {
  label: string;
  appearance: Appearance;
  icon: string;
  busy: boolean;
  dark: boolean;
  onClick?: () => void;
  as?: "button" | "span";
  /** A destructive action: red instead of the brand colour. */
  danger?: boolean;
  /** Greyed and unselectable, without the busy spinner. */
  disabled?: boolean;
}) {
  const off = busy || disabled;
  const look = off
    ? dark
      ? "border-[#424242] bg-[#141414] text-[#8a8a8a] cursor-not-allowed"
      : "border-[#e0e0e0] bg-[#f0f0f0] text-[#616161] cursor-not-allowed"
    : danger
      ? "bg-[#c4314b] text-white hover:bg-[#a52a40]"
      : APPEARANCE_CLASS[appearance][dark ? "dark" : "light"];
  const className = `inline-flex h-10 min-w-24 items-center justify-center gap-1.5 rounded border border-transparent px-3.5 text-sm font-semibold [font-family:"Segoe_UI",system-ui,sans-serif] motion-safe:transition-colors ${look}`;
  const content = (
    <>
      {busy ? (
        <Spinner />
      ) : ICONS[icon] ? (
        <svg viewBox="0 0 24 24" className="size-[18px]" aria-hidden="true">
          {ICONS[icon]}
        </svg>
      ) : null}
      <span>{busy ? "Working…" : label}</span>
    </>
  );
  if (as === "span") return <span className={className}>{content}</span>;
  return (
    <button
      type="button"
      className={className}
      aria-disabled={off || undefined}
      onClick={off ? undefined : onClick}
    >
      {content}
    </button>
  );
}

export function useButtonReplica(): ReplicaApi {
  const id = useId();
  const [label, setLabel] = useState("Save");
  const [appearance, setAppearance] = useState<Appearance>("Primary");
  const [icon, setIcon] = useState("Checkmark");
  const [busy, setBusy] = useState(false);
  const [clicks, setClicks] = useState(0);
  const [format, setFormat] = useState("Text");
  const [handler, setHandler] = useState(Object.keys(HANDLERS)[0]!);
  const [test, setTest] = useState("Save");
  const [logs, setLogs] = useState<string[]>([]);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 2200);
    return () => clearTimeout(timer);
  }, [toast]);

  const log = (message: string) => setLogs((current) => [message, ...current].slice(0, 20));

  function click() {
    const count = clicks + 1;
    setClicks(count);
    log(`OnClick(Count: ${count})`);
    const result = HANDLERS[handler]!(count);
    if (result.log) log(result.log);
    if (result.toast) setToast(result.toast);
  }

  const shownLabel = (FORMATS[format] ?? FORMATS["Text"]!)(label);
  const validTest = test.trim() !== "" && test.length <= 40;

  return {
    stage: (dark) => (
      <div className="relative">
        <ButtonFace
          label={shownLabel}
          appearance={appearance}
          icon={icon}
          busy={busy}
          dark={dark}
          onClick={click}
        />
        <p role="status" className="absolute -top-14 left-1/2 w-max max-w-[16rem] -translate-x-1/2">
          {toast ? (
            <span className="block rounded bg-[#dff6dd] px-3 py-2 text-[0.8125rem] font-semibold text-[#0e700e] shadow">
              ✓ {toast}
            </span>
          ) : null}
        </p>
      </div>
    ),
    controls: (
      <div className="grid gap-3 lg:grid-cols-2">
        <Group kind="Input" title="Data in">
          <label htmlFor={`${id}-label`}>Label</label>
          <input
            id={`${id}-label`}
            className={FIELD}
            value={label}
            onChange={(e) => setLabel(e.target.value)}
          />
          <label htmlFor={`${id}-appearance`}>Appearance</label>
          <select
            id={`${id}-appearance`}
            className={FIELD}
            value={appearance}
            onChange={(e) => setAppearance(e.target.value as Appearance)}
          >
            {APPEARANCES.map((value) => (
              <option key={value}>{value}</option>
            ))}
          </select>
          <label htmlFor={`${id}-icon`}>IconName</label>
          <select
            id={`${id}-icon`}
            className={FIELD}
            value={icon}
            onChange={(e) => setIcon(e.target.value)}
          >
            {Object.keys(ICONS).map((value) => (
              <option key={value} value={value}>
                {value || "(none)"}
              </option>
            ))}
          </select>
          <label className="flex min-h-11 items-center gap-2">
            <input type="checkbox" checked={busy} onChange={(e) => setBusy(e.target.checked)} />{" "}
            IsBusy
          </label>
          <Formula name="MyButton.Label" value={JSON.stringify(label)} />
          <Formula name="MyButton.Appearance" value={JSON.stringify(appearance)} />
          <Formula name="MyButton.IsBusy" value={String(busy)} />
        </Group>
        <div className="flex flex-col gap-3">
          <Group kind="Output" title="State out">
            <p className="flex flex-wrap items-center gap-2">
              <code className="font-mono text-sm">MyButton.ClickCount</code>
              <span className="rounded-lg bg-tech-dataverse px-2 py-0.5 font-mono font-semibold text-tech-dataverse-ink">
                {clicks}
              </span>
              <span className="text-sm text-muted-foreground">Click the button to change it.</span>
            </p>
          </Group>
          <Group kind="Event" title="OnClick(Count)">
            <label htmlFor={`${id}-handler`}>Formula in your app</label>
            <select
              id={`${id}-handler`}
              className={FIELD}
              value={handler}
              onChange={(e) => setHandler(e.target.value)}
            >
              {Object.keys(HANDLERS).map((value) => (
                <option key={value}>{value}</option>
              ))}
            </select>
            <div
              role="log"
              aria-label="Event log"
              className="max-h-32 overflow-auto rounded-xl bg-muted px-3 py-2 font-mono text-[0.8125rem]"
            >
              {logs.length === 0 ? (
                <p>Click the button: each OnClick appears here.</p>
              ) : (
                logs.map((entry, index) => <p key={`${index}-${entry}`}>{entry}</p>)
              )}
            </div>
          </Group>
          <Group kind="Action" title="ResetCount()">
            <button
              type="button"
              className="inline-flex min-h-11 w-max items-center rounded-full border-[1.5px] border-foreground px-4 font-semibold"
              onClick={() => {
                setClicks(0);
                log("ResetCount()");
              }}
            >
              Call MyButton.ResetCount()
            </button>
          </Group>
        </div>
        <Group kind="InputFunction" title="FormatLabel(Text)">
          <label htmlFor={`${id}-format`}>Formula in your app</label>
          <select
            id={`${id}-format`}
            className={FIELD}
            value={format}
            onChange={(e) => setFormat(e.target.value)}
          >
            {Object.keys(FORMATS).map((value) => (
              <option key={value}>{value}</option>
            ))}
          </select>
        </Group>
        <Group kind="OutputFunction" title="IsValidLabel(Text)">
          <label htmlFor={`${id}-test`}>Try a label</label>
          <input
            id={`${id}-test`}
            className={FIELD}
            value={test}
            onChange={(e) => setTest(e.target.value)}
          />
          <p className="flex flex-wrap items-center gap-2">
            <code className="font-mono text-sm break-all">
              MyButton.IsValidLabel({JSON.stringify(test)})
            </code>
            <span className="rounded-lg bg-tech-dataverse px-2 py-0.5 font-mono font-semibold text-tech-dataverse-ink">
              {String(validTest)}
            </span>
          </p>
        </Group>
      </div>
    ),
    apply: (settings) => {
      if ("Label" in settings) setLabel(String(fromPowerFx(settings["Label"]!)));
      if ("Appearance" in settings) {
        const value = String(fromPowerFx(settings["Appearance"]!));
        if ((APPEARANCES as readonly string[]).includes(value)) setAppearance(value as Appearance);
      }
      setIcon("IconName" in settings ? String(fromPowerFx(settings["IconName"]!)) : "");
      setBusy("IsBusy" in settings ? fromPowerFx(settings["IsBusy"]!) === true : false);
    },
    thumbnail: (settings, dark) => (
      <ButtonFace
        as="span"
        label={String(fromPowerFx(settings["Label"] ?? '"Save"'))}
        appearance={
          (APPEARANCES as readonly string[]).includes(
            String(fromPowerFx(settings["Appearance"] ?? '"Primary"')),
          )
            ? (String(fromPowerFx(settings["Appearance"] ?? '"Primary"')) as Appearance)
            : "Primary"
        }
        icon={String(fromPowerFx(settings["IconName"] ?? '""'))}
        busy={fromPowerFx(settings["IsBusy"] ?? "false") === true}
        dark={dark}
      />
    ),
  };
}
