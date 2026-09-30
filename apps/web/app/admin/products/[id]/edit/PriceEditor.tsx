"use client";

import { useId, useState } from "react";
import { useRouter } from "next/navigation";

interface PriceEditorProps {
  productId: string;
  /** The current price as display text (e.g. "$49.00 USD"), or null when
   * the product is free. Formatted server-side. */
  currentPriceLabel: string | null;
}

type Status = "idle" | "submitting" | "error" | "saved" | "cleared";

/**
 * Sets or clears the product's single price (MVP-007 slice 2). The typed
 * amount is sent as-is and parsed on the server, which is the only place
 * that decides what a valid price is. Most products stay free: an empty
 * price means free, and "Make free" removes an existing price.
 */
export function PriceEditor({ productId, currentPriceLabel }: PriceEditorProps) {
  const router = useRouter();
  const [price, setPrice] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [fieldError, setFieldError] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const priceFieldId = useId();
  const hintId = useId();
  const errorId = useId();

  async function send(method: "PUT" | "DELETE") {
    if (status === "submitting") return;
    setStatus("submitting");
    setFieldError(null);
    setErrorMessage(null);
    try {
      const response = await fetch(`/api/admin/products/${productId}/price`, {
        method,
        headers: method === "PUT" ? { "Content-Type": "application/json" } : undefined,
        body: method === "PUT" ? JSON.stringify({ price }) : undefined,
      });
      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as {
          message?: string;
          fieldErrors?: Record<string, string[]>;
        } | null;
        setFieldError(payload?.fieldErrors?.["price"]?.[0] ?? null);
        setErrorMessage(payload?.message ?? "Something went wrong. Please try again.");
        setStatus("error");
        return;
      }
      setPrice("");
      setStatus(method === "PUT" ? "saved" : "cleared");
      router.refresh();
    } catch {
      setErrorMessage("Something went wrong. Please try again.");
      setStatus("error");
    }
  }

  return (
    <div>
      <p>{currentPriceLabel ? `Current price: ${currentPriceLabel}` : "This product is free."}</p>
      <form
        noValidate
        onSubmit={(event) => {
          event.preventDefault();
          void send("PUT");
        }}
      >
        <label htmlFor={priceFieldId}>
          {currentPriceLabel ? "New price (US dollars)" : "Set a price (US dollars)"}
        </label>
        <input
          id={priceFieldId}
          type="text"
          inputMode="decimal"
          autoComplete="off"
          value={price}
          onChange={(event) => setPrice(event.target.value)}
          aria-invalid={Boolean(fieldError)}
          aria-describedby={fieldError ? `${hintId} ${errorId}` : hintId}
        />
        <p id={hintId}>For example 49 or 49.99. All sales are final.</p>
        {fieldError ? <p id={errorId}>{fieldError}</p> : null}
        <button type="submit" aria-disabled={status === "submitting"}>
          {status === "submitting" ? "Saving…" : "Save price"}
        </button>
      </form>
      {currentPriceLabel ? (
        <button
          type="button"
          onClick={() => void send("DELETE")}
          aria-disabled={status === "submitting"}
        >
          Make free
        </button>
      ) : null}
      <p role="status">
        {status === "saved"
          ? "Price saved."
          : status === "cleared"
            ? "This product is now free."
            : status === "error"
              ? errorMessage
              : null}
      </p>
    </div>
  );
}
