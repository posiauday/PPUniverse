"use client";

import { useState } from "react";

type Status = "idle" | "submitting" | "error" | "published";

/**
 * Publishes an Article via the dedicated POST .../[id]/publish route
 * (MVP-017, FR-014). Same accessible baseline as
 * AdminDeletionRequestControls.tsx: a plain button, `aria-disabled` while
 * submitting, one `role="status"` region.
 */
export function ArticlePublishControl({ articleId }: { articleId: string }) {
  const [status, setStatus] = useState<Status>("idle");

  async function handlePublish() {
    if (status === "submitting") return;
    setStatus("submitting");
    try {
      const response = await fetch(`/api/admin/content/${articleId}/publish`, {
        method: "POST",
      });
      if (!response.ok) {
        setStatus("error");
        return;
      }
      setStatus("published");
    } catch {
      setStatus("error");
    }
  }

  if (status === "published") {
    return <p role="status">Published.</p>;
  }

  return (
    <div>
      <button type="button" onClick={handlePublish} aria-disabled={status === "submitting"}>
        {status === "submitting" ? "Publishing…" : "Publish"}
      </button>
      <p role="status">{status === "error" && "Something went wrong. Please try again."}</p>
    </div>
  );
}
