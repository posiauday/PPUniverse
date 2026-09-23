"use client";

import { useId, useState } from "react";
import type { ConsentCategory } from "@ppu/domain-privacy";

type Status = "idle" | "submitting" | "saved" | "error";

/**
 * One consent category's control (MVP-020, FR-004). Mirrors
 * FreeDownloadControl's pattern (MVP-010): a plain button, not a form (no
 * field to collect), `aria-disabled` while submitting rather than the
 * native `disabled` attribute (BUG-005 precedent — a genuinely disabled
 * button loses focus to the document body), and a `role="status"` region
 * that announces the outcome without moving focus.
 *
 * Always inserts a new ConsentRecord row server-side, never updates an
 * earlier one — this component just reflects the latest known state, it
 * never assumes it is the only writer.
 */
export function ConsentToggle({
  category,
  label,
  granted,
}: {
  category: ConsentCategory;
  label: string;
  granted: boolean;
}) {
  const [current, setCurrent] = useState(granted);
  const [status, setStatus] = useState<Status>("idle");
  const statusId = useId();

  async function handleToggle() {
    if (status === "submitting") return;
    const next = !current;
    setStatus("submitting");
    try {
      const response = await fetch("/api/account/consent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ category, granted: next }),
      });
      if (!response.ok) {
        setStatus("error");
        return;
      }
      setCurrent(next);
      setStatus("saved");
    } catch {
      setStatus("error");
    }
  }

  return (
    <div>
      <button
        type="button"
        onClick={handleToggle}
        aria-disabled={status === "submitting"}
        aria-describedby={statusId}
      >
        {status === "submitting" ? "Saving…" : current ? `Withdraw: ${label}` : `Accept: ${label}`}
      </button>
      <p id={statusId} role="status">
        {status === "saved" && "Saved."}
        {status === "error" && "Something went wrong. Please try again."}
      </p>
    </div>
  );
}
