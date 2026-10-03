"use client";

import { useState } from "react";

type Status = "idle" | "submitting" | "error" | "published";

/** Publishes an update through POST /api/admin/updates/[id]/publish (MVP-033
 * slice D). Same accessible baseline as ArticlePublishControl. */
export function UpdatePublishControl({ updateId }: { updateId: string }) {
  const [status, setStatus] = useState<Status>("idle");

  async function handlePublish() {
    if (status === "submitting") return;
    setStatus("submitting");
    try {
      const response = await fetch(`/api/admin/updates/${updateId}/publish`, { method: "POST" });
      setStatus(response.ok ? "published" : "error");
    } catch {
      setStatus("error");
    }
  }

  if (status === "published") return <p role="status">Published.</p>;
  return (
    <div>
      <button type="button" onClick={handlePublish} aria-disabled={status === "submitting"}>
        {status === "submitting" ? "Publishing…" : "Publish"}
      </button>
      <p role="status">{status === "error" && "Something went wrong. Please try again."}</p>
    </div>
  );
}
