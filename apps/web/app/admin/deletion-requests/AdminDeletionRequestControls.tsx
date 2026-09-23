"use client";

import { useId, useState } from "react";
import type { DeletionRequestState } from "@ppu/domain-privacy";

type Status = "idle" | "submitting" | "error";

interface AdminAction {
  toState: DeletionRequestState;
  label: string;
  needsReason?: boolean;
}

const ADMIN_ACTIONS: Partial<Record<DeletionRequestState, AdminAction[]>> = {
  SUBMITTED: [{ toState: "UNDER_REVIEW", label: "Start review" }],
  UNDER_REVIEW: [
    { toState: "APPROVED", label: "Approve" },
    { toState: "DENIED", label: "Deny", needsReason: true },
  ],
  APPROVED: [{ toState: "COMPLETED", label: "Mark completed" }],
};

/**
 * The admin half of MVP-020's deletion-request workflow. Every transition
 * this renders records actor/timestamp/reason server-side (docs/final-
 * decisions.md, "MVP-020 open questions 46, 47 and 48", question 48,
 * constraint 5) — this component only supplies the reason text for DENIED;
 * actor and timestamp are never client-supplied.
 *
 * Same accessible baseline as every other control in this story: plain
 * buttons, `aria-disabled` while submitting, one `role="status"` region.
 */
export function AdminDeletionRequestControls({
  requestId,
  currentState,
}: {
  requestId: string;
  currentState: DeletionRequestState;
}) {
  const [status, setStatus] = useState<Status>("idle");
  const [reason, setReason] = useState("");
  const [appliedState, setAppliedState] = useState<DeletionRequestState | null>(null);
  const statusId = useId();
  const reasonId = useId();

  const actions = ADMIN_ACTIONS[currentState] ?? [];

  async function handleAction(toState: DeletionRequestState, needsReason: boolean) {
    if (status === "submitting") return;
    if (needsReason && reason.trim().length === 0) {
      setStatus("error");
      return;
    }
    setStatus("submitting");
    try {
      const response = await fetch(`/api/admin/deletion-requests/${requestId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ toState, ...(needsReason ? { reason } : {}) }),
      });
      if (!response.ok) {
        setStatus("error");
        return;
      }
      setAppliedState(toState);
      setStatus("idle");
    } catch {
      setStatus("error");
    }
  }

  if (appliedState) {
    return <p role="status">Updated to {appliedState}.</p>;
  }

  if (actions.length === 0) {
    return null;
  }

  return (
    <div>
      {actions.some((action) => action.needsReason) && (
        <div>
          <label htmlFor={reasonId}>Reason (required to deny)</label>
          <input
            id={reasonId}
            type="text"
            value={reason}
            onChange={(event) => setReason(event.target.value)}
          />
        </div>
      )}
      {actions.map((action) => (
        <button
          key={action.toState}
          type="button"
          onClick={() => handleAction(action.toState, Boolean(action.needsReason))}
          aria-disabled={status === "submitting"}
          aria-describedby={statusId}
        >
          {status === "submitting" ? "Saving…" : action.label}
        </button>
      ))}
      <p id={statusId} role="status">
        {status === "error" && "Something went wrong. Check the reason field and try again."}
      </p>
    </div>
  );
}
