"use client";

import type { ComponentVariation } from "@ppu/domain-content";
import Link from "next/link";
import {
  useId,
  useRef,
  useState,
  type ComponentType,
  type KeyboardEvent,
  type ReactNode,
} from "react";
import { useButtonReplica } from "./replicas/ButtonReplica";
import type { ReplicaApi } from "./replicas/replica";

/**
 * The interactive part of a component page (MVP-049, design "A · Docs"):
 * Preview, Playground and YAML tabs over one live web replica, the light and
 * dark stage, Copy YAML (or "Sign in to copy" for members-only components,
 * whose YAML the server never sends to a guest), and the variations, which
 * set the replica's inputs when chosen.
 */

type Host = ComponentType<{ children: (api: ReplicaApi) => ReactNode }>;

function ButtonHost({ children }: { children: (api: ReplicaApi) => ReactNode }) {
  return <>{children(useButtonReplica())}</>;
}

/** The components that have a web replica, by their Power Apps name. */
const REPLICAS: Record<string, Host> = {
  lcsButton: ButtonHost,
};

export function hasReplica(componentName: string): boolean {
  return componentName in REPLICAS;
}

const TABS = [
  { id: "preview", name: "Preview" },
  { id: "playground", name: "Playground" },
  { id: "yaml", name: "YAML" },
] as const;
type TabId = (typeof TABS)[number]["id"];

const PILL_BUTTON =
  "inline-flex min-h-11 items-center gap-2 rounded-full border-[1.5px] border-foreground px-4 font-semibold";

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
    <span className="inline-flex flex-wrap items-center gap-2">
      <button
        type="button"
        onClick={copy}
        className={`${PILL_BUTTON} bg-foreground text-background`}
      >
        Copy YAML
      </button>
      <span role="status" className="text-sm">
        {state === "copied"
          ? "Copied. Paste it in the Components tab."
          : state === "failed"
            ? "Couldn't copy: open the YAML tab and copy it from there."
            : ""}
      </span>
    </span>
  );
}

function Stage({ dark, children }: { dark: boolean; children: ReactNode }) {
  return (
    <div
      className={`grid min-h-48 place-items-center rounded-2xl p-6 pt-16 [background-size:14px_14px] ${
        dark
          ? "bg-[#1f1f1f] [background-image:radial-gradient(#2c2c2c_1px,transparent_1px)]"
          : "bg-white [background-image:radial-gradient(#e7e5ef_1px,transparent_1px)]"
      }`}
    >
      {children}
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
  const [dark, setDark] = useState(false);
  const tabRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const Host = REPLICAS[componentName];

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
    <Link href={signInHref} className={`${PILL_BUTTON} bg-foreground text-background no-underline`}>
      Sign in to copy (free)
    </Link>
  );

  const body = (api: ReplicaApi | null) => (
    <>
      <div
        role="tablist"
        aria-label={`${title}: preview, playground and YAML`}
        className="flex w-max max-w-full flex-wrap gap-1 rounded-xl bg-muted p-1"
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
            className={`min-h-11 rounded-lg px-4 font-semibold ${tab === entry.id ? "bg-card shadow-sm" : ""}`}
          >
            {entry.name}
          </button>
        ))}
      </div>

      <div className="mt-3 rounded-[1.5rem] border border-border bg-card p-4 sm:p-5">
        {TABS.map((entry) => (
          <div
            key={entry.id}
            role="tabpanel"
            id={`${baseId}-panel-${entry.id}`}
            aria-labelledby={`${baseId}-tab-${entry.id}`}
            hidden={tab !== entry.id}
            tabIndex={0}
          >
            {entry.id === "yaml" ? (
              yaml ? (
                <pre className="max-h-96 overflow-auto rounded-2xl bg-code p-4 font-mono text-[0.8125rem] leading-relaxed text-code-foreground">
                  <code>{yaml}</code>
                </pre>
              ) : (
                <p>
                  This component is free with an account. <Link href={signInHref}>Sign in</Link> to
                  see and copy its YAML.
                </p>
              )
            ) : (
              <>
                {api ? (
                  <Stage dark={dark}>{api.stage(dark)}</Stage>
                ) : (
                  <p className="rounded-2xl bg-muted p-6">
                    The live preview for this component is on its way.
                  </p>
                )}
                <div className="mt-3 flex flex-wrap items-center gap-3">
                  {api ? (
                    <button
                      type="button"
                      aria-pressed={dark}
                      onClick={() => setDark((value) => !value)}
                      className={PILL_BUTTON}
                    >
                      Dark stage
                    </button>
                  ) : null}
                  <span className="flex-1" />
                  {copyArea}
                </div>
                {entry.id === "playground" && api ? (
                  <div className="mt-4">{api.controls}</div>
                ) : null}
              </>
            )}
          </div>
        ))}
        <p className="mt-3 text-sm text-muted-foreground">
          A web replica for trying it out. In Power Apps Studio it uses Microsoft&apos;s controls,
          which can look slightly different.
        </p>
      </div>

      {variations.length > 0 ? (
        <section aria-labelledby="component_variations" className="mt-8">
          <h2 id="component_variations" className="font-display text-2xl font-bold">
            Variations
          </h2>
          <p className="mt-1 text-muted-foreground">
            {api
              ? "Choose one to load its settings into the preview."
              : "Ready-made settings for common uses."}
          </p>
          <ul className="mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {variations.map((variation) => {
              const content = (
                <>
                  {api ? (
                    <span
                      className="grid min-h-24 place-items-center rounded-xl bg-white"
                      aria-hidden="true"
                    >
                      {api.thumbnail(variation.settings, false)}
                    </span>
                  ) : null}
                  <span className="mt-2 block font-semibold">{variation.name}</span>
                  <span className="block text-sm text-muted-foreground">
                    {variation.description}
                  </span>
                  <code className="mt-2 block font-mono text-[0.75rem] break-words">
                    {Object.entries(variation.settings)
                      .map(([key, value]) => `${key}: ${value}`)
                      .join(" · ")}
                  </code>
                </>
              );
              return (
                <li key={variation.name}>
                  {api ? (
                    <button
                      type="button"
                      onClick={() => {
                        api.apply(variation.settings);
                        setTab("preview");
                        tabRefs.current[0]?.focus();
                      }}
                      className="block h-full w-full rounded-2xl border border-border bg-card p-3 text-left hover:border-foreground motion-safe:transition-colors"
                    >
                      {content}
                    </button>
                  ) : (
                    <div className="h-full rounded-2xl border border-border bg-card p-3">
                      {content}
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        </section>
      ) : null}
    </>
  );

  return Host ? <Host>{(api) => body(api)}</Host> : body(null);
}
