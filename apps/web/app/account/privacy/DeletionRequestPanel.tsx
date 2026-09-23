"use client";

import { useId, useState } from "react";
import type { DeletionRequestState } from "@ppu/domain-privacy";

type ClientStatus = "idle" | "submitting" | "error-already-requested" | "error-generic";

function isActiveState(state: DeletionRequestState | null): boolean {
  return state === "SUBMITTED" || state === "UNDER_REVIEW" || state === "APPROVED";
}

function isWithdrawableState(state: DeletionRequestState | null): boolean {
  return state === "SUBMITTED" || state === "UNDER_REVIEW";
}

function formatState(state: DeletionRequestState): string {
  switch (state) {
    case "SUBMITTED":
      return "submitted, awaiting review";
    case "UNDER_REVIEW":
      return "under review";
    case "APPROVED":
      return "approved, awaiting completion";
    case "DENIED":
      return "denied";
    case "WITHDRAWN":
      return "withdrawn";
    case "COMPLETED":
      return "completed";
  }
}

/**
 * The deletion-request half of /account/privacy (MVP-020, FR-004). Covers
 * every required gated state in one component: empty (no request has ever
 * been made — the initial button), pending-request (an active request,
 * shown with its state and a Withdraw control when withdrawable),
 * already-requested (submitting again while one is active returns 409,
 * shown inline rather than silently ignored), denied (with the recorded
 * reason and a path to request again), and the terminal withdrawn/completed
 * displays. Loading is the submitting label change; error is a generic
 * network/server failure distinct from the already-requested case.
 *
 * Same accessible pattern as ConsentToggle/FreeDownloadControl: plain
 * button, `aria-disabled` while submitting, one `role="status"` region.
 */
export function DeletionRequestPanel({
  requestId,
  state,
  deniedReason,
}: {
  requestId: string | null;
  state: DeletionRequestState | null;
  deniedReason: string | null;
}) {
  const [current, setCurrent] = useState<{ id: string | null; state: DeletionRequestState | null }>(
    {
      id: requestId,
      state,
    },
  );
  const [status, setStatus] = useState<ClientStatus>("idle");
  const statusId = useId();

  async function handleSubmit() {
    if (status === "submitting") return;
    setStatus("submitting");
    try {
      const response = await fetch("/api/account/deletion-requests", { method: "POST" });
      if (response.status === 409) {
        setStatus("error-already-requested");
        return;
      }
      if (!response.ok) {
        setStatus("error-generic");
        return;
      }
      const body = (await response.json()) as { id: string; state: DeletionRequestState };
      setCurrent({ id: body.id, state: body.state });
      setStatus("idle");
    } catch {
      setStatus("error-generic");
    }
  }

  async function handleWithdraw() {
    if (status === "submitting" || !current.id) return;
    setStatus("submitting");
    try {
      const response = await fetch(`/api/account/deletion-requests/${current.id}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        setStatus("error-generic");
        return;
      }
      setCurrent({ id: current.id, state: "WITHDRAWN" });
      setStatus("idle");
    } catch {
      setStatus("error-generic");
    }
  }

  const active = isActiveState(current.state);
  const withdrawable = isWithdrawableState(current.state);

  return (
    <div>
      {current.state === null && (
        <button
          type="button"
          onClick={handleSubmit}
          aria-disabled={status === "submitting"}
          aria-describedby={statusId}
        >
          {status === "submitting" ? "Requesting…" : "Request account deletion"}
        </button>
      )}

      {active && (
        <>
          <p>
            Your deletion request is currently: {formatState(current.state as DeletionRequestState)}
            .
          </p>
          {withdrawable && (
            <button
              type="button"
              onClick={handleWithdraw}
              aria-disabled={status === "submitting"}
              aria-describedby={statusId}
            >
              {status === "submitting" ? "Withdrawing…" : "Withdraw request"}
            </button>
          )}
        </>
      )}

      {current.state === "DENIED" && (
        <>
          <p>Your previous request was denied{deniedReason ? `: ${deniedReason}` : "."}</p>
          <button
            type="button"
            onClick={handleSubmit}
            aria-disabled={status === "submitting"}
            aria-describedby={statusId}
          >
            {status === "submitting" ? "Requesting…" : "Request account deletion again"}
          </button>
        </>
      )}

      {current.state === "WITHDRAWN" && (
        <>
          <p>You withdrew your previous deletion request.</p>
          <button
            type="button"
            onClick={handleSubmit}
            aria-disabled={status === "submitting"}
            aria-describedby={statusId}
          >
            {status === "submitting" ? "Requesting…" : "Request account deletion"}
          </button>
        </>
      )}

      {current.state === "COMPLETED" && <p>This request has been completed.</p>}

      <p id={statusId} role="status">
        {status === "error-already-requested" &&
          "A deletion request is already pending for this account."}
        {status === "error-generic" && "Something went wrong. Please try again."}
      </p>
    </div>
  );
}
