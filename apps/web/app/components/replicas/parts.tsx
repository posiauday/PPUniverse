import type { ReactNode } from "react";

/** Shared pieces of the component playgrounds (MVP-049). */

const KIND_CHIP: Record<string, string> = {
  Input: "bg-tech-automate text-tech-automate-ink",
  Output: "bg-tech-dataverse text-tech-dataverse-ink",
  InputFunction: "bg-tech-bi text-tech-bi-ink",
  OutputFunction: "bg-tech-bi text-tech-bi-ink",
  Event: "bg-tech-pages text-tech-pages-ink",
  Action: "bg-tech-apps text-tech-apps-ink",
};

export function KindChip({ kind }: { kind: string }) {
  return (
    <span
      className={`rounded-md px-1.5 py-1 font-mono text-[0.6875rem] leading-none font-semibold tracking-wider uppercase ${KIND_CHIP[kind] ?? "bg-muted"}`}
    >
      {kind}
    </span>
  );
}

export function Group({
  kind,
  title,
  children,
}: {
  kind: string;
  title: string;
  children: ReactNode;
}) {
  return (
    <fieldset className="min-w-0 rounded-2xl border border-border bg-card p-4">
      <legend className="sr-only">
        {kind}: {title}
      </legend>
      <p aria-hidden="true" className="flex items-center gap-2 font-display font-bold">
        <KindChip kind={kind} /> {title}
      </p>
      <div className="mt-2 flex flex-col gap-2 text-[0.9375rem]">{children}</div>
    </fieldset>
  );
}

export function Formula({ name, value }: { name: string; value: string }) {
  return (
    <code className="block rounded-xl bg-code px-3 py-2 font-mono text-[0.8125rem] break-all whitespace-pre-wrap text-code-foreground">
      {name} = {value}
    </code>
  );
}

export const FIELD = "min-h-11 w-full rounded-xl border-[1.5px] border-border bg-background px-3";

/** A pill button for calling actions in a playground. */
export const ACTION_BUTTON =
  "inline-flex min-h-11 w-max items-center rounded-full border-[1.5px] border-foreground px-4 font-semibold";

/** An output's current value. */
export function OutputValue({ children }: { children: ReactNode }) {
  return (
    <span className="rounded-lg bg-tech-dataverse px-2 py-0.5 font-mono font-semibold break-all text-tech-dataverse-ink">
      {children}
    </span>
  );
}

/** The event log: the newest call first. */
export function EventLog({ entries, empty }: { entries: readonly string[]; empty: string }) {
  return (
    <div
      role="log"
      aria-label="Event log"
      className="max-h-32 overflow-auto rounded-xl bg-muted px-3 py-2 font-mono text-[0.8125rem]"
    >
      {entries.length === 0 ? (
        <p>{empty}</p>
      ) : (
        entries.map((entry, index) => <p key={`${index}-${entry}`}>{entry}</p>)
      )}
    </div>
  );
}

/** Keeps the newest entries first, at most 20. */
export function pushLog(entries: readonly string[], entry: string): string[] {
  return [entry, ...entries].slice(0, 20);
}
