"use client";

import { useEffect, useId, useRef, useState } from "react";

/**
 * Agree to the Terms of use and the Privacy notice (docs/final-decisions.md,
 * 2026-10-08, "Accounts accept the Terms when they're made"). The server
 * records it against the current Terms version (/api/account/consent), then
 * the reader goes on to `next`.
 */
export function AcceptTermsForm({ next }: { next: string }) {
  const [agreed, setAgreed] = useState(false);
  const [problem, setProblem] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [focusCount, setFocusCount] = useState(0);
  const boxRef = useRef<HTMLInputElement>(null);
  const boxId = useId();
  const problemId = useId();

  // After an error, focus goes back to the box once the message shows (WCAG 3.3.1, 2.4.3).
  useEffect(() => {
    if (focusCount > 0) boxRef.current?.focus();
  }, [focusCount]);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    if (!agreed) {
      setProblem("Tick the box to agree, then select Continue.");
      setFocusCount((count) => count + 1);
      return;
    }
    setBusy(true);
    const status = await fetch("/api/account/consent", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ category: "TERMS_OF_SERVICE", granted: true }),
      credentials: "same-origin",
    })
      .then((response) => response.status)
      .catch(() => 0);
    if (status === 201) {
      window.location.assign(next);
      return;
    }
    setBusy(false);
    setProblem("Something went wrong saving that. Please try again.");
    setFocusCount((count) => count + 1);
  }

  return (
    <form onSubmit={submit} noValidate className="mt-6 flex flex-col gap-4">
      <div className="flex items-start gap-3">
        <input
          ref={boxRef}
          id={boxId}
          type="checkbox"
          required
          checked={agreed}
          onChange={(event) => setAgreed(event.target.checked)}
          aria-invalid={problem !== null}
          aria-describedby={problem ? problemId : undefined}
          className="mt-1 size-5 shrink-0 accent-primary"
        />
        <label htmlFor={boxId} className="font-semibold">
          I agree to the Terms of use and the Privacy notice
        </label>
      </div>
      {problem ? (
        <p id={problemId} className="font-medium">
          ⚠ {problem}
        </p>
      ) : null}
      <div>
        <button
          type="submit"
          aria-disabled={busy}
          className="inline-flex min-h-11 items-center rounded-full bg-primary px-6 font-semibold text-primary-foreground"
        >
          {busy ? "Saving…" : "Continue"}
        </button>
      </div>
    </form>
  );
}
