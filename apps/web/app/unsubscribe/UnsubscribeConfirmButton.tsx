"use client";

import { useId, useState } from "react";

type Status = "idle" | "submitting" | "done" | "error";

/**
 * The write side of the unsubscribe flow (MVP-018, FR-013). GET (the page
 * this renders on) has zero side effects — email clients and security
 * scanners prefetch links, so the actual write only ever happens from this
 * explicit button click, a real POST (docs/final-decisions.md, "MVP-018
 * open question 49"). Same accessible pattern as every other control in
 * this codebase: plain button, `aria-disabled` while submitting, one
 * `role="status"` region.
 */
export function UnsubscribeConfirmButton({ token }: { token: string }) {
  const [status, setStatus] = useState<Status>("idle");
  const statusId = useId();

  async function handleConfirm() {
    if (status === "submitting") return;
    setStatus("submitting");
    try {
      const response = await fetch("/api/unsubscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });
      if (!response.ok) {
        setStatus("error");
        return;
      }
      setStatus("done");
    } catch {
      setStatus("error");
    }
  }

  if (status === "done") {
    return <p role="status">You have been unsubscribed from marketing email.</p>;
  }

  return (
    <div>
      <button
        type="button"
        onClick={handleConfirm}
        aria-disabled={status === "submitting"}
        aria-describedby={statusId}
      >
        {status === "submitting" ? "Unsubscribing…" : "Unsubscribe from marketing email"}
      </button>
      <p id={statusId} role="status">
        {status === "error" && "Something went wrong. Please try again."}
      </p>
    </div>
  );
}
