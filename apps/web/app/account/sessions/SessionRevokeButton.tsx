"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function SessionRevokeButton({ sessionId, label }: { sessionId: string; label: string }) {
  const router = useRouter();
  const [status, setStatus] = useState<"idle" | "revoking" | "error">("idle");

  async function handleRevoke() {
    setStatus("revoking");
    const response = await fetch(`/api/me/sessions/${sessionId}`, { method: "DELETE" });
    if (response.ok) {
      router.refresh();
    } else {
      setStatus("error");
    }
  }

  return (
    <>
      <button type="button" onClick={handleRevoke} disabled={status === "revoking"}>
        {status === "revoking" ? "Revoking…" : "Revoke"}
        <span className="sr-only"> {label}</span>
      </button>
      {status === "error" && <span role="alert"> Could not revoke this session. Try again.</span>}
    </>
  );
}
