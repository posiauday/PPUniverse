"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useId, useState } from "react";
import { LocalTime } from "./LocalTime";

/**
 * Scheduled publishing and the preview for a draft guide or update (MVP-050;
 * docs/final-decisions.md, 2026-10-09). The admin picks a date and time in
 * their own time zone; it is sent as UTC. The item stays a draft until the
 * first visit after that time publishes it. The server checks everything
 * again and its messages are shown as they come.
 */

const BUTTON =
  "inline-flex min-h-11 items-center rounded-full border-[1.5px] border-foreground px-4 font-semibold";

/** "2026-10-12T09:00" in the browser's zone, for a datetime-local input. */
function toLocalInput(date: Date): string {
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(
    date.getHours(),
  )}:${pad(date.getMinutes())}`;
}

interface SchedulePanelProps {
  /** e.g. /api/admin/content/abc/schedule */
  endpoint: string;
  /** e.g. /preview/guides/abc */
  previewHref: string;
  /** "guide" or "update", in sentences. */
  noun: string;
  scheduledFor: string | null;
}

export function SchedulePanel({ endpoint, previewHref, noun, scheduledFor }: SchedulePanelProps) {
  const router = useRouter();
  const baseId = useId();
  const [scheduled, setScheduled] = useState(scheduledFor);
  const [value, setValue] = useState("");
  const [zone, setZone] = useState<string | null>(null);
  const [min, setMin] = useState<string | undefined>(undefined);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState("");

  // The browser's zone and the earliest time are only known in the browser.
  useEffect(() => {
    setZone(Intl.DateTimeFormat().resolvedOptions().timeZone);
    setMin(toLocalInput(new Date(Date.now() + 2 * 60 * 1000)));
    if (scheduledFor) setValue(toLocalInput(new Date(scheduledFor)));
  }, [scheduledFor]);

  async function send(method: "PUT" | "DELETE", body?: unknown) {
    setBusy(true);
    setError(null);
    setStatus("");
    try {
      const response = await fetch(endpoint, {
        method,
        headers: body === undefined ? undefined : { "Content-Type": "application/json" },
        body: body === undefined ? undefined : JSON.stringify(body),
      });
      const payload = (await response.json().catch(() => null)) as {
        message?: string;
        fieldErrors?: Record<string, string[]>;
        article?: { scheduledFor: string | null };
        update?: { scheduledFor: string | null };
      } | null;
      if (!response.ok) {
        setError(
          payload?.fieldErrors?.["publishAt"]?.[0] ??
            payload?.message ??
            "Something went wrong. Please try again.",
        );
        return;
      }
      const next = (payload?.article ?? payload?.update)?.scheduledFor ?? null;
      setScheduled(next);
      setStatus(next ? `Scheduled. The ${noun} goes live at that time.` : "Schedule cancelled.");
      router.refresh();
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  function submit(event: React.FormEvent) {
    event.preventDefault();
    if (busy) return;
    const at = value ? new Date(value) : null;
    if (!at || Number.isNaN(at.getTime())) {
      setError("Enter a date and time.");
      return;
    }
    void send("PUT", { publishAt: at.toISOString() });
  }

  const fieldId = `${baseId}-when`;
  return (
    <section
      aria-labelledby={`${baseId}-heading`}
      className="flex flex-col gap-4 rounded-[1.5rem] border border-border bg-card p-5"
    >
      <h2 id={`${baseId}-heading`} className="font-display text-xl font-bold">
        Publishing
      </h2>
      <p>
        {scheduled ? (
          <>
            Scheduled for{" "}
            <strong>
              <LocalTime iso={scheduled} />
            </strong>
            . It goes live on the first visit after that time, and stays a draft until then.
          </>
        ) : (
          <>A draft, not scheduled. Publish it from the list, or choose a time for it to go live.</>
        )}
      </p>
      <p>
        <Link href={previewHref} className="font-semibold underline underline-offset-4">
          Preview this {noun}
        </Link>{" "}
        <span className="text-muted-foreground">(only admins can open it)</span>
      </p>
      <form onSubmit={submit} className="flex flex-col gap-2" noValidate>
        <label htmlFor={fieldId} className="font-semibold">
          {scheduled ? "Change the time" : "Publish on"}
        </label>
        <p id={`${fieldId}-hint`} className="text-sm text-muted-foreground">
          In your time zone{zone ? ` (${zone})` : ""}. At least a minute from now, and within a
          year.
        </p>
        <input
          id={fieldId}
          type="datetime-local"
          value={value}
          min={min}
          onChange={(event) => setValue(event.target.value)}
          aria-invalid={error !== null}
          aria-describedby={`${fieldId}-hint${error ? ` ${fieldId}-error` : ""}`}
          className="min-h-11 max-w-xs rounded-xl border border-border bg-card px-3"
        />
        {error ? (
          <p id={`${fieldId}-error`} className="text-sm text-coral">
            {error}
          </p>
        ) : null}
        <div className="flex flex-wrap items-center gap-3">
          <button type="submit" className={BUTTON} aria-disabled={busy}>
            {busy ? "Saving…" : scheduled ? "Save the new time" : "Schedule"}
          </button>
          {scheduled ? (
            <button
              type="button"
              className={BUTTON}
              aria-disabled={busy}
              onClick={() => {
                if (!busy) void send("DELETE");
              }}
            >
              Cancel the schedule
            </button>
          ) : null}
        </div>
      </form>
      <p role="status" className="text-sm">
        {status}
      </p>
    </section>
  );
}
