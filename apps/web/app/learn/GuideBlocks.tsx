import type { ReactNode } from "react";
import { STOP_SEPARATOR } from "../../lib/article-outline";

/**
 * The guide redesign's building blocks (slice 2, MVP-041; the G2 and G3
 * boards), rendered from Markdown conventions by ArticleBody. None needs
 * JavaScript: tick boxes are real checkboxes counted with CSS, the
 * diagram's pause control is a real checkbox, and nothing is stored.
 * Styles: globals.css (.guide-*).
 */

/** "> [!SYMPTOMS] Question" then a list: each symptom a card linking to its step. */
export function SymptomCards({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section aria-label={title || "Symptoms"} className="guide-symptoms mt-6">
      {title ? <p className="font-display text-[1.375rem] font-bold">{title}</p> : null}
      {children}
    </section>
  );
}

/** One Do or Don't card. */
export function DoDontCard({ kind, children }: { kind: "do" | "dont"; children: ReactNode }) {
  return (
    <div role="note" className={`guide-${kind} rounded-[1.5rem] px-5.5 py-5`}>
      <p className="font-display text-lg font-bold">
        <span aria-hidden="true">{kind === "do" ? "✓ " : "✕ "}</span>
        {kind === "do" ? "Do" : "Don't"}
      </p>
      <div className="[&>p:first-child]:mt-1">{children}</div>
    </div>
  );
}

/** A Do card next to a Don't card. */
export function DoDontPair({ children }: { children: ReactNode }) {
  return (
    <div className="mt-6 grid grid-cols-1 gap-3.5 sm:grid-cols-2 [&>div]:mt-0">{children}</div>
  );
}

/**
 * "> [!DIAGRAM] Caption" then "A -> B -> C": the stops in order, each lighting
 * up in turn. The list is real text in order, so it reads correctly without
 * the motion; the motion stops under prefers-reduced-motion, and the Pause
 * box stops it any time (it runs longer than 5 seconds, WCAG 2.2.2).
 */
export function GuideDiagram({ title, stops }: { title: string; stops: string }) {
  const list = stops.split(STOP_SEPARATOR).filter(Boolean);
  return (
    <figure className="guide-diagram mt-6 rounded-[1.75rem] border border-border bg-card p-5.5 md:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <figcaption className="font-display text-xl leading-snug font-bold">{title}</figcaption>
        <label className="inline-flex min-h-11 cursor-pointer items-center gap-2 text-sm font-semibold">
          <input type="checkbox" className="h-5 w-5 accent-primary" />
          Pause animation
        </label>
      </div>
      <ol
        className={`guide-stops guide-stops-${list.length} mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 ${
          // One row up to five stops; more would be too narrow, so rows of four.
          list.length <= 5 ? "lg:grid-cols-[repeat(var(--stops),minmax(0,1fr))]" : "lg:grid-cols-4"
        }`}
        style={{ ["--stops" as string]: list.length }}
      >
        {list.map((stop, index) => (
          <li
            key={`${index}-${stop}`}
            className="guide-stop"
            style={{
              animationDelay: `${index * 1.4}s`,
              animationDuration: `${list.length * 1.4}s`,
            }}
          >
            <span aria-hidden="true" className="guide-stop-number">
              {index + 1}
            </span>
            {stop}
          </li>
        ))}
      </ol>
    </figure>
  );
}

/** The "Work through it" steps: a column of step cards and the ticked count after them. */
export function GuideSteps({ children }: { children: ReactNode }) {
  return <div className="guide-steps mt-6 flex flex-col gap-4">{children}</div>;
}

/** One step: its number, its heading and text, and a tick box. */
export function GuideStep({
  number,
  title,
  children,
}: {
  number: string;
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="guide-step grid grid-cols-[auto_minmax(0,1fr)] gap-4 rounded-[1.625rem] border border-border bg-card p-5 md:gap-5 md:p-6">
      <span
        aria-hidden="true"
        className="guide-step-number grid h-12 w-12 place-items-center rounded-2xl font-display text-[1.375rem] font-extrabold"
      >
        {number}
      </span>
      <div className="min-w-0 [&>h3:first-child]:mt-2">
        {children}
        <label className="mt-4 inline-flex min-h-11 cursor-pointer items-center gap-2.5 font-semibold">
          {/* Named in full, so every box says which step it ticks. */}
          <input type="checkbox" aria-label={`Done: ${title}`} className="h-6 w-6 accent-primary" />
          Done
        </label>
      </div>
    </section>
  );
}

/**
 * How many steps are ticked, counted by CSS (no script, nothing stored).
 * Decorative: each tick box already tells assistive technology its state.
 */
export function GuideProgress({ total }: { total: string }) {
  return <p aria-hidden="true" className="guide-progress" data-total={total} />;
}
