"use client";

import { useId, useState } from "react";

type Status = "idle" | "submitting" | "granted" | "error";

/**
 * The interactive half of the free-entitlement flow (MVP-010, FR-005) — the
 * button a signed-in user without an existing entitlement sees. Whether the
 * visitor is signed in, and whether they already have an entitlement, is
 * decided server-side by the page that renders this (never here); this
 * component only exists for the "not yet entitled, signed in" state.
 *
 * A plain button, not a `<form>`: unlike the sign-in flow, there is no field
 * to collect, so there is no native-form-submission surface at all to
 * reason about here.
 *
 * `aria-disabled`, not the `disabled` HTML attribute, while submitting — a
 * genuinely disabled button loses focus to the document body, the same
 * defect already fixed elsewhere in this codebase (BUG-005).
 */
export function FreeDownloadControl({ productSlug }: { productSlug: string }) {
  const [status, setStatus] = useState<Status>("idle");
  const [reused, setReused] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const statusId = useId();

  async function handleClick() {
    if (status === "submitting") return;
    setStatus("submitting");
    setError(null);
    try {
      const response = await fetch(`/api/products/${productSlug}/entitlement`, {
        method: "POST",
      });
      if (!response.ok) {
        setStatus("error");
        setError(
          response.status === 401
            ? "Sign in to get this for free."
            : "Something went wrong. Please try again.",
        );
        return;
      }
      const body = (await response.json()) as { granted: boolean; reused: boolean };
      setReused(body.reused);
      setStatus("granted");
    } catch {
      setStatus("error");
      setError("Something went wrong. Please try again.");
    }
  }

  return (
    <div>
      <button
        type="button"
        onClick={handleClick}
        aria-disabled={status === "submitting"}
        aria-describedby={statusId}
        className="rounded-card bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
      >
        {status === "submitting" ? "Getting…" : "Get for free"}
      </button>
      <p id={statusId} role="status" className="mt-2 text-sm">
        {status === "granted" &&
          (reused ? "You already have this." : "You now have this for free.")}
        {status === "error" && error}
      </p>
    </div>
  );
}
