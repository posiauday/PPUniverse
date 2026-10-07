"use client";

import { useState } from "react";

/** Closes (deletes) one report; the row then says so in place. */
export function CloseReportButton({ reportId }: { reportId: string }) {
  const [state, setState] = useState<"idle" | "busy" | "done" | "error">("idle");
  async function close() {
    if (state === "busy") return;
    setState("busy");
    try {
      const response = await fetch(`/api/admin/reports/${encodeURIComponent(reportId)}/close`, {
        method: "POST",
      });
      setState(response.ok ? "done" : "error");
    } catch {
      setState("error");
    }
  }
  if (state === "done") return <p role="status">Closed and deleted.</p>;
  return (
    <div className="flex flex-wrap items-center gap-3">
      <button type="button" onClick={() => void close()} aria-disabled={state === "busy"}>
        {state === "busy" ? "Closing…" : "Close and delete"}
      </button>
      <p role="status" className="text-sm">
        {state === "error" ? "Couldn't close it. Please try again." : ""}
      </p>
    </div>
  );
}
