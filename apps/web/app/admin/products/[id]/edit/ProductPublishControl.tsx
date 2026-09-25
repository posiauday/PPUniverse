"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const MISSING_FIELD_LABELS: Record<string, string> = {
  license: "At least one license",
  supportPolicy: "A support policy",
  compatibility: "At least one compatibility entry",
  release: "At least one release with an attached, scanned-clean file",
};

interface ProductPublishControlProps {
  productId: string;
  initialMissingFields: string[];
}

type Status = "idle" | "submitting" | "error" | "published";

/**
 * Publishes a Product via the dedicated POST .../[id]/publish route
 * (MVP-012, FR-009), extending apps/web/app/admin/content/
 * ArticlePublishControl.tsx's pattern for a *list* of missing-field
 * reasons rather than a single reason: the server-computed
 * `initialMissingFields` (from checkProductPublishReadiness, via the edit
 * page's own server-side render) seeds the display, and a 409 response
 * from the publish attempt itself replaces it with the latest server
 * truth -- this list is never computed client-side.
 */
export function ProductPublishControl({
  productId,
  initialMissingFields,
}: ProductPublishControlProps) {
  const router = useRouter();
  const [missingFields, setMissingFields] = useState<string[]>(initialMissingFields);
  const [status, setStatus] = useState<Status>("idle");

  async function handlePublish() {
    if (status === "submitting" || missingFields.length > 0) return;
    setStatus("submitting");
    try {
      const response = await fetch(`/api/admin/products/${productId}/publish`, {
        method: "POST",
      });
      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as {
          fieldErrors?: Record<string, string[]>;
        } | null;
        if (payload?.fieldErrors) {
          setMissingFields(Object.keys(payload.fieldErrors));
        }
        setStatus("error");
        return;
      }
      setStatus("published");
      setMissingFields([]);
      router.refresh();
    } catch {
      setStatus("error");
    }
  }

  if (status === "published") {
    return <p role="status">Published.</p>;
  }

  return (
    <div>
      {missingFields.length > 0 ? (
        <div>
          <p>Before this product can be published, it still needs:</p>
          <ul>
            {missingFields.map((field) => (
              <li key={field}>{MISSING_FIELD_LABELS[field] ?? field}</li>
            ))}
          </ul>
        </div>
      ) : null}
      <button
        type="button"
        onClick={handlePublish}
        aria-disabled={status === "submitting" || missingFields.length > 0}
      >
        {status === "submitting" ? "Publishing…" : "Publish"}
      </button>
      <p role="status">
        {status === "error" && missingFields.length === 0
          ? "Something went wrong. Please try again."
          : null}
      </p>
    </div>
  );
}
