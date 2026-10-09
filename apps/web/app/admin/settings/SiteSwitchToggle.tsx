"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";

/**
 * One site switch on the admin's Settings page (docs/final-decisions.md,
 * 2026-10-09, "Component library: a switch in the admin, and Coming soon").
 * It changes the live site for everyone, so it asks first: "Turn off" opens a
 * confirmation, and only "Yes, turn it off" sends the change. The server
 * decides and records it; the page then refreshes with the new state.
 */
export function SiteSwitchToggle({
  switchKey,
  name,
  labelId,
  on,
}: {
  switchKey: string;
  name: string;
  /** The id of the switch's visible name on the card, which names this control. */
  labelId: string;
  on: boolean;
}) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const confirmRef = useRef<HTMLButtonElement>(null);
  const toggleRef = useRef<HTMLButtonElement>(null);
  const next = !on;

  async function apply() {
    if (busy) return;
    setBusy(true);
    setMessage("");
    try {
      const response = await fetch("/api/admin/site-switches", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: switchKey, enabled: next }),
      });
      if (!response.ok) throw new Error(String(response.status));
      setConfirming(false);
      setMessage(`${name} is now ${next ? "on" : "off"}.`);
      router.refresh();
      toggleRef.current?.focus();
    } catch {
      setMessage("That didn't work. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mt-3 flex flex-col gap-2">
      {confirming ? (
        <div className="flex flex-wrap items-center gap-2 rounded-xl bg-muted p-3">
          <p className="w-full font-semibold">
            Turn {name.toLowerCase()} {next ? "on" : "off"} for everyone?
          </p>
          <button
            ref={confirmRef}
            type="button"
            onClick={apply}
            aria-disabled={busy}
            className="inline-flex min-h-11 items-center rounded-full bg-foreground px-4 font-semibold text-background"
          >
            {busy ? "Saving…" : `Yes, turn it ${next ? "on" : "off"}`}
          </button>
          <button
            type="button"
            onClick={() => {
              setConfirming(false);
              toggleRef.current?.focus();
            }}
            className="inline-flex min-h-11 items-center rounded-full border-[1.5px] border-foreground px-4 font-semibold"
          >
            Cancel
          </button>
        </div>
      ) : (
        <button
          ref={toggleRef}
          type="button"
          role="switch"
          aria-checked={on}
          aria-labelledby={labelId}
          onClick={() => {
            setMessage("");
            setConfirming(true);
            // Move to the confirmation, so a keyboard or screen reader user lands on the choice.
            requestAnimationFrame(() => confirmRef.current?.focus());
          }}
          className="group inline-flex min-h-11 w-fit items-center gap-3 rounded-full py-1 pr-3 pl-1 font-semibold hover:bg-muted"
        >
          <span
            aria-hidden="true"
            className={`relative h-7 w-12 rounded-full border-[1.5px] border-foreground transition-colors motion-reduce:transition-none ${
              on ? "bg-foreground" : "bg-card"
            }`}
          >
            <span
              className={`absolute top-0.5 size-5 rounded-full transition-transform motion-reduce:transition-none ${
                on ? "translate-x-[1.375rem] bg-background" : "translate-x-0.5 bg-foreground"
              }`}
            />
          </span>
          {/* The state is aria-checked; this word repeats it for sighted readers. */}
          <span aria-hidden="true">{on ? "On" : "Off"}</span>
        </button>
      )}
      <p role="status" className="text-sm">
        {message}
      </p>
    </div>
  );
}
