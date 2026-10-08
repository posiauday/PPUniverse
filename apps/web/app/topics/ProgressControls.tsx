"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

/**
 * Learn progress controls (MVP-048; docs/final-decisions.md, 2026-10-08):
 * mark a lesson done (or undo it), and clear all progress from the profile.
 * Signed-in readers only; the server decides whose progress it is.
 */

async function send(method: "POST" | "DELETE", body: Record<string, string>): Promise<boolean> {
  try {
    const response = await fetch("/api/learn/progress", {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    return response.ok;
  } catch {
    return false;
  }
}

export function MarkDoneButton({
  topic,
  lesson,
  done: initiallyDone,
}: {
  topic: string;
  lesson: string;
  done: boolean;
}) {
  const router = useRouter();
  const [done, setDone] = useState(initiallyDone);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(false);

  async function toggle() {
    if (busy) return;
    setBusy(true);
    setError(false);
    const ok = await send("POST", { topic, lesson, done: String(!done) });
    setBusy(false);
    if (!ok) return setError(true);
    setDone(!done);
    router.refresh();
  }

  return (
    <div className="mt-12 flex flex-wrap items-center gap-3 rounded-[1.25rem] border border-border bg-card p-5">
      <p className="font-display text-lg font-bold">
        {done ? "You've finished this lesson." : "Finished reading?"}
      </p>
      <button
        type="button"
        onClick={toggle}
        aria-pressed={done}
        aria-disabled={busy}
        className={`motion-press ml-auto inline-flex min-h-11 items-center gap-2 rounded-full px-5 font-semibold ${
          done
            ? "border-[1.5px] border-foreground bg-card text-foreground"
            : "bg-primary text-primary-foreground"
        }`}
      >
        {done ? (
          <>
            <span aria-hidden="true">✓</span> Done · undo
          </>
        ) : (
          "Mark as done"
        )}
      </button>
      <p role="status" className="w-full text-sm text-coral empty:hidden">
        {error ? "That didn't save. Please try again." : ""}
      </p>
    </div>
  );
}

export function ClearProgressButton() {
  const router = useRouter();
  const [state, setState] = useState<"idle" | "confirm" | "busy" | "error">("idle");

  async function clear() {
    setState("busy");
    const ok = await send("DELETE", {});
    if (!ok) return setState("error");
    setState("idle");
    router.refresh();
  }

  return (
    <div className="mt-4 flex flex-wrap items-center gap-3">
      {state === "confirm" ? (
        <>
          <span>Clear every lesson you've marked done?</span>
          <button
            type="button"
            onClick={clear}
            className="rounded-full bg-primary px-4 py-2 font-semibold text-primary-foreground"
          >
            Yes, clear it
          </button>
          <button
            type="button"
            onClick={() => setState("idle")}
            className="underline underline-offset-4"
          >
            Keep it
          </button>
        </>
      ) : (
        <button
          type="button"
          onClick={() => setState("confirm")}
          aria-disabled={state === "busy"}
          className="rounded-full border-[1.5px] border-foreground px-4 py-2 font-semibold"
        >
          {state === "busy" ? "Clearing…" : "Clear my Learn progress"}
        </button>
      )}
      <p role="status" className="w-full text-sm text-coral empty:hidden">
        {state === "error" ? "That didn't work. Please try again." : ""}
      </p>
    </div>
  );
}
