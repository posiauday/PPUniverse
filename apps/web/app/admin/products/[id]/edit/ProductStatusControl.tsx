"use client";

import { useId, useState } from "react";
import { useRouter } from "next/navigation";

const STATUS_LABELS: Record<string, string> = {
  PUBLISHED: "Reinstate (make public again)",
  SUSPENDED: "Suspend (temporarily hide)",
  ARCHIVED: "Archive (permanently retire)",
};

/** Valid `toStatus` options for each current status -- mirrors
 * ALLOWED_STATUS_CHANGE_TRANSITIONS in packages/domain/catalog/src/product.ts
 * exactly, so the UI never offers an option the server would reject. The
 * server re-validates this again authoritatively; this list only avoids
 * showing a button that could never succeed. */
const OPTIONS_BY_CURRENT_STATUS: Record<string, string[]> = {
  PUBLISHED: ["SUSPENDED", "ARCHIVED"],
  SUSPENDED: ["PUBLISHED", "ARCHIVED"],
  ARCHIVED: [],
};

interface ProductStatusControlProps {
  productId: string;
  currentStatus: string;
}

type Status = "idle" | "submitting" | "error" | "changed";

/**
 * Suspend, archive, or reinstate a Product (MVP-019, FR-015/NFR-009). Only
 * rendered for a PUBLISHED or SUSPENDED product -- a DRAFT product has
 * nothing to suspend/retire yet (use the publish control instead), and an
 * ARCHIVED product is terminal (docs/final-decisions.md, "MVP-019
 * operations console and audit" -- question 1). A reason is always
 * required (NFR-009) -- the submit button stays disabled until one is
 * entered, but the server is the actual authority: a request with a blank
 * reason is rejected there too, not just here.
 */
export function ProductStatusControl({ productId, currentStatus }: ProductStatusControlProps) {
  const router = useRouter();
  const options = OPTIONS_BY_CURRENT_STATUS[currentStatus] ?? [];
  const [toStatus, setToStatus] = useState<string>(options[0] ?? "");
  const [reason, setReason] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const selectId = useId();
  const reasonId = useId();

  if (options.length === 0) {
    return null;
  }

  const canSubmit = toStatus.length > 0 && reason.trim().length > 0;

  async function handleSubmit() {
    if (status === "submitting" || !canSubmit) return;
    setStatus("submitting");
    try {
      const response = await fetch(`/api/admin/products/${productId}/status`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ toStatus, reason }),
      });
      if (!response.ok) {
        setStatus("error");
        return;
      }
      setStatus("changed");
      router.refresh();
    } catch {
      setStatus("error");
    }
  }

  if (status === "changed") {
    return <p role="status">Status updated.</p>;
  }

  return (
    <div>
      <label htmlFor={selectId}>Change status to</label>
      <select id={selectId} value={toStatus} onChange={(event) => setToStatus(event.target.value)}>
        {options.map((option) => (
          <option key={option} value={option}>
            {STATUS_LABELS[option] ?? option}
          </option>
        ))}
      </select>

      <label htmlFor={reasonId}>Reason (required)</label>
      <textarea id={reasonId} value={reason} onChange={(event) => setReason(event.target.value)} />

      <button
        type="button"
        onClick={handleSubmit}
        aria-disabled={status === "submitting" || !canSubmit}
      >
        {status === "submitting" ? "Saving…" : "Change status"}
      </button>
      <p role="status">{status === "error" ? "Something went wrong. Please try again." : null}</p>
    </div>
  );
}
