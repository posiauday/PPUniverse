"use client";

import type { ComponentVariation } from "@ppu/domain-content";
import Link from "next/link";
import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type ComponentType,
  type KeyboardEvent,
  type ReactNode,
} from "react";
import { FormulaList } from "./FormulaList";
import { useButtonReplica } from "./replicas/ButtonReplica";
import { useDataTableReplica } from "./replicas/DataTableReplica";
import { useDatePickerReplica } from "./replicas/DatePickerReplica";
import { useDialogReplica } from "./replicas/DialogReplica";
import { useFabReplica } from "./replicas/FabReplica";
import {
  NOTIFY_TIMEOUT_MS,
  NotificationBanner,
  NotifyProvider,
  type Notification,
  type NotificationType,
} from "./replicas/notify";
import { useNavShellReplica } from "./replicas/NavShellReplica";
import { usePaginationReplica } from "./replicas/PaginationReplica";
import { usePeoplePickerReplica } from "./replicas/PeoplePickerReplica";
import type { ReplicaApi } from "./replicas/replica";
import { useStatesReplica } from "./replicas/StatesReplica";
import { useStepperReplica } from "./replicas/StepperReplica";
import { useTabsReplica } from "./replicas/TabsReplica";
import { useTextFieldReplica } from "./replicas/TextFieldReplica";
import { useToastReplica } from "./replicas/ToastReplica";
import { useTreeViewReplica } from "./replicas/TreeViewReplica";

/**
 * The interactive part of a component page (MVP-049; docs/final-decisions.md,
 * 2026-10-08, "One live view"): one live preview, where the component sits on a
 * Power Apps screen and behaves exactly as it does after it's pasted, with its
 * variations to load and the formulas that screen uses; and the YAML, with Copy
 * YAML (or "Sign in to copy" for members-only components, whose YAML the server
 * never sends to a guest).
 */

type Host = ComponentType<{ children: (api: ReplicaApi) => ReactNode }>;

/** Wraps a replica hook as a component, so each page calls exactly one hook. */
function hostFor(useReplica: () => ReplicaApi): Host {
  function ReplicaHost({ children }: { children: (api: ReplicaApi) => ReactNode }) {
    return <>{children(useReplica())}</>;
  }
  return ReplicaHost;
}

/** The components that have a web replica, by their Power Apps name. */
const REPLICAS: Record<string, Host> = {
  lcsButton: hostFor(useButtonReplica),
  lcsTextField: hostFor(useTextFieldReplica),
  lcsDialog: hostFor(useDialogReplica),
  lcsToast: hostFor(useToastReplica),
  lcsTabs: hostFor(useTabsReplica),
  lcsStates: hostFor(useStatesReplica),
  lcsFab: hostFor(useFabReplica),
  lcsDatePicker: hostFor(useDatePickerReplica),
  lcsPeoplePicker: hostFor(usePeoplePickerReplica),
  lcsPagination: hostFor(usePaginationReplica),
  lcsDataTable: hostFor(useDataTableReplica),
  lcsNavShell: hostFor(useNavShellReplica),
  lcsTreeView: hostFor(useTreeViewReplica),
  lcsStepper: hostFor(useStepperReplica),
};

export function hasReplica(componentName: string): boolean {
  return componentName in REPLICAS;
}

const TABS = [
  { id: "preview", name: "Preview" },
  { id: "yaml", name: "YAML" },
] as const;
type TabId = (typeof TABS)[number]["id"];

/** The first chip: the component exactly as pasted. */
const DEFAULT_VARIATION: ComponentVariation = {
  name: "Default",
  description: "As it is when you paste it, with every input at its default.",
  settings: {},
};

const PRIMARY_BUTTON =
  "inline-flex min-h-11 items-center gap-2 rounded-full bg-foreground px-5 font-semibold text-background no-underline shadow-sm hover:shadow-md motion-safe:transition-shadow";

function CopyYaml({ yaml }: { yaml: string }) {
  const [state, setState] = useState<"idle" | "copied" | "failed">("idle");
  async function copy() {
    try {
      await navigator.clipboard.writeText(yaml);
      setState("copied");
    } catch {
      setState("failed");
    }
    setTimeout(() => setState("idle"), 2500);
  }
  return (
    <span className="inline-flex flex-wrap items-center justify-end gap-x-3 gap-y-1">
      <span role="status" className="text-sm text-muted-foreground">
        {state === "copied"
          ? "Copied. Paste it in Studio's Components tab."
          : state === "failed"
            ? "Couldn't copy: open the YAML tab and copy it from there."
            : ""}
      </span>
      <button type="button" onClick={copy} className={PRIMARY_BUTTON}>
        <svg
          viewBox="0 0 24 24"
          className="size-4"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          {state === "copied" ? (
            <path d="M5 12l5 5L20 7" />
          ) : (
            <>
              <rect x="9" y="9" width="11" height="11" rx="2" />
              <path d="M5 15V5a2 2 0 0 1 2-2h8" />
            </>
          )}
        </svg>
        {state === "copied" ? "Copied" : "Copy YAML"}
      </button>
    </span>
  );
}

/**
 * The Power Apps screen the component sits on. The screen has a plain fill,
 * so focus outlines are measured against it, and sets its own ring colour so
 * the ring keeps its contrast whichever theme the page and the screen are in.
 * Notify's banner runs across its top.
 */
function Screen({
  dark,
  fill = false,
  notification,
  onCloseNotification,
  children,
}: {
  dark: boolean;
  /** Edge to edge, for a whole-screen component (ReplicaApi.fill). */
  fill?: boolean;
  notification: Notification | null;
  onCloseNotification: () => void;
  children: ReactNode;
}) {
  return (
    <div className="relative isolate overflow-hidden bg-stage px-3 py-8 sm:px-8 sm:py-12">
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10 [background-image:radial-gradient(color-mix(in_oklab,var(--color-foreground)_14%,transparent)_1px,transparent_1px)] [background-size:16px_16px] [mask-image:radial-gradient(ellipse_at_center,black_35%,transparent_80%)]"
      />
      <div className="mx-auto w-full max-w-[44rem]">
        <p
          aria-hidden="true"
          className="mb-2 flex items-center gap-2 font-mono text-xs text-muted-foreground"
        >
          <span className="size-2 rounded-full bg-[#107c10]" />
          Screen1
        </p>
        <div
          className={`relative grid grid-cols-[minmax(0,1fr)] overflow-hidden rounded-2xl shadow-[0_2px_6px_rgba(16,24,40,0.06),0_28px_56px_-28px_rgba(46,16,101,0.45)] ring-1 ring-black/5 motion-safe:transition-colors motion-safe:duration-300 ${
            fill ? "" : "min-h-[24rem] place-items-center px-4 py-20"
          } ${dark ? "bg-[#1f1f1f] [--color-ring:#c4b5fd]" : "bg-white [--color-ring:#5b21b6]"}`}
        >
          <NotificationBanner notification={notification} onClose={onCloseNotification} />
          {children}
        </div>
      </div>
    </div>
  );
}

export function ComponentWorkbench({
  componentName,
  title,
  yaml,
  signInHref,
  variations,
}: {
  componentName: string;
  title: string;
  /** Null when the reader must sign in to copy it. */
  yaml: string | null;
  signInHref: string;
  variations: ComponentVariation[];
}) {
  const baseId = useId();
  const [tab, setTab] = useState<TabId>("preview");
  const [chosen, setChosen] = useState(0);
  const [notification, setNotification] = useState<Notification | null>(null);
  const notices = useRef(0);
  const tabRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const Host = REPLICAS[componentName];
  const presets = [DEFAULT_VARIATION, ...variations];
  const preset = presets[chosen] ?? DEFAULT_VARIATION;
  const instance = `${componentName}_1`;

  const notify = useCallback((message: string, type: NotificationType = "Information") => {
    notices.current += 1;
    setNotification({ id: notices.current, message, type });
  }, []);

  useEffect(() => {
    if (!notification) return;
    const timer = setTimeout(() => setNotification(null), NOTIFY_TIMEOUT_MS);
    return () => clearTimeout(timer);
  }, [notification]);

  function onTabKey(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    const last = TABS.length - 1;
    const next =
      event.key === "ArrowRight"
        ? index === last
          ? 0
          : index + 1
        : event.key === "ArrowLeft"
          ? index === 0
            ? last
            : index - 1
          : event.key === "Home"
            ? 0
            : event.key === "End"
              ? last
              : null;
    if (next === null) return;
    event.preventDefault();
    setTab(TABS[next]!.id);
    tabRefs.current[next]?.focus();
  }

  const copyArea = yaml ? (
    <CopyYaml yaml={yaml} />
  ) : (
    <Link href={signInHref} className={PRIMARY_BUTTON}>
      Sign in to copy (free)
    </Link>
  );

  const preview = (api: ReplicaApi | null) =>
    api ? (
      <>
        <div className="px-4 pt-4 pb-3 sm:px-5">
          <p id={`${baseId}-variations`} className="text-sm font-semibold">
            Variations
          </p>
          <div
            role="group"
            aria-labelledby={`${baseId}-variations`}
            className="mt-2 flex flex-wrap gap-2"
          >
            {presets.map((variation, index) => (
              <button
                key={variation.name}
                type="button"
                aria-pressed={index === chosen}
                onClick={() => {
                  api.apply(variation.settings);
                  setChosen(index);
                  setNotification(null);
                }}
                className={`min-h-10 rounded-full border px-4 text-sm font-semibold motion-safe:transition-[background-color,color,border-color,transform] motion-safe:duration-200 motion-safe:active:scale-[0.97] ${
                  index === chosen
                    ? "border-foreground bg-foreground text-background"
                    : "border-border bg-card hover:border-foreground"
                }`}
              >
                {variation.name}
              </button>
            ))}
          </div>
          <p className="mt-2 text-sm text-muted-foreground">{preset.description}</p>
        </div>
        <Screen
          dark={api.dark}
          fill={api.fill ?? false}
          notification={notification}
          onCloseNotification={() => setNotification(null)}
        >
          {/* Keyed by the variation, so choosing one fades the screen in fresh. */}
          <div
            key={chosen}
            className="grid w-full grid-cols-[minmax(0,1fr)] place-items-center motion-safe:animate-[lcs-screen-in_420ms_var(--ease-out-soft)]"
          >
            {api.screen}
          </div>
        </Screen>
        <div className="border-t border-border px-4 py-4 sm:px-5">
          <p className="text-sm font-semibold">Formulas on this screen</p>
          <p className="text-sm text-muted-foreground">
            Set the same ones in Studio and it behaves the same way. The instance names are the ones
            Studio gives the first copy on a screen.
          </p>
          <FormulaList
            lines={[
              ...Object.entries(preset.settings).map(([property, formula]) => ({
                control: instance,
                property,
                formula: formula.replace(/^=/, ""),
              })),
              ...(api.dark
                ? [{ control: "Screen1", property: "Fill", formula: "RGBA(31, 31, 31, 1)" }]
                : []),
              // A preset's input replaces the screen's formula for it, as it would in Studio.
              ...api.wiring.filter(
                (line) => !(line.control === instance && line.property in preset.settings),
              ),
            ]}
          />
        </div>
      </>
    ) : (
      <div className="px-4 py-5 sm:px-5">
        <p className="rounded-2xl bg-muted p-6">
          The live preview for this component is on its way.
        </p>
        {variations.length > 0 ? (
          <>
            <p className="mt-5 text-sm font-semibold">Variations</p>
            <ul className="mt-2 grid gap-3 sm:grid-cols-2">
              {variations.map((variation) => (
                <li
                  key={variation.name}
                  className="rounded-2xl border border-border bg-card p-3 text-sm"
                >
                  <span className="block font-semibold">{variation.name}</span>
                  <span className="block text-muted-foreground">{variation.description}</span>
                  <code className="mt-2 block font-mono text-[0.75rem] break-words">
                    {Object.entries(variation.settings)
                      .map(([key, value]) => `${key}: ${value}`)
                      .join(" · ")}
                  </code>
                </li>
              ))}
            </ul>
          </>
        ) : null}
      </div>
    );

  const body = (api: ReplicaApi | null) => (
    <>
      <div className="overflow-hidden rounded-[1.75rem] border border-border bg-card shadow-[0_30px_60px_-36px_rgba(46,16,101,0.4)]">
        <div className="flex flex-wrap items-center gap-3 border-b border-border px-3 py-3 sm:px-4">
          <div
            role="tablist"
            aria-label={`${title}: preview and YAML`}
            className="flex gap-1 rounded-full bg-muted p-1"
          >
            {TABS.map((entry, index) => (
              <button
                key={entry.id}
                ref={(element) => {
                  tabRefs.current[index] = element;
                }}
                type="button"
                role="tab"
                id={`${baseId}-tab-${entry.id}`}
                aria-selected={tab === entry.id}
                aria-controls={`${baseId}-panel-${entry.id}`}
                tabIndex={tab === entry.id ? 0 : -1}
                onClick={() => setTab(entry.id)}
                onKeyDown={(event) => onTabKey(event, index)}
                className={`min-h-10 rounded-full px-5 font-semibold motion-safe:transition-colors ${
                  tab === entry.id ? "bg-card shadow-sm" : "text-muted-foreground"
                }`}
              >
                {entry.name}
              </button>
            ))}
          </div>
          <span className="flex-1" />
          {copyArea}
        </div>
        {TABS.map((entry) => (
          <div
            key={entry.id}
            role="tabpanel"
            id={`${baseId}-panel-${entry.id}`}
            aria-labelledby={`${baseId}-tab-${entry.id}`}
            hidden={tab !== entry.id}
            tabIndex={0}
          >
            {/* Only the open tab is rendered, so the live replica and its ids are on the page once. */}
            {tab !== entry.id ? null : entry.id === "preview" ? (
              preview(api)
            ) : yaml ? (
              <pre
                role="region"
                tabIndex={0}
                aria-label={`${title} YAML`}
                className="max-h-[32rem] overflow-auto bg-code p-5 font-mono text-[0.8125rem] leading-relaxed text-code-foreground"
              >
                <code>{yaml}</code>
              </pre>
            ) : (
              <p className="px-5 py-6">
                This component is free with an account. <Link href={signInHref}>Sign in</Link> to
                see and copy its YAML.
              </p>
            )}
          </div>
        ))}
      </div>
      <p className="mt-3 text-sm text-muted-foreground">
        A web replica that behaves as the component does in Power Apps. In Studio it uses
        Microsoft&apos;s controls, which can look slightly different.
      </p>
    </>
  );

  return (
    <NotifyProvider value={notify}>
      {Host ? <Host>{(api) => body(api)}</Host> : body(null)}
    </NotifyProvider>
  );
}
