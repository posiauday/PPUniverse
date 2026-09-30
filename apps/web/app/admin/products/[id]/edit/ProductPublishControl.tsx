"use client";

import { useId, useState } from "react";
import { useRouter } from "next/navigation";

const MISSING_FIELD_LABELS: Record<string, string> = {
  license: "At least one license",
  supportPolicy: "A support policy",
  compatibility: "At least one compatibility entry",
  release: "A selected release with an attached, scanned-clean file",
};

export interface EligibleReleaseOption {
  id: string;
  version: string;
}

interface ProductPublishControlProps {
  productId: string;
  initialMissingFields: string[];
  /** Draft releases with at least one attached CLEAN file -- the only
   * releases eligible to become the initial published release (A2/A4,
   * "PR #23 blocker corrections"). Computed server-side, never derived from
   * the client's own belief about a release's state. */
  eligibleReleases: EligibleReleaseOption[];
}

type Status = "idle" | "submitting" | "error" | "published";

/**
 * Publishes a Product via the dedicated POST .../[id]/publish route
 * (MVP-012, FR-009), extending apps/web/app/admin/content/
 * ArticlePublishControl.tsx's pattern for a *list* of missing-field reasons
 * rather than a single reason. The admin explicitly selects which draft
 * release becomes the initial published release (A2: publishing is never
 * implicit about which release it applies to) -- the select only ever lists
 * releases the server has already confirmed are eligible; the server
 * re-validates the selection again, authoritatively, inside the publish
 * transaction itself. The server-computed `initialMissingFields` (via the
 * edit page's own server-side render) seeds the display, and a 409 response
 * from the publish attempt itself replaces it with the latest server
 * truth -- this list is never computed client-side.
 */
export function ProductPublishControl({
  productId,
  initialMissingFields,
  eligibleReleases,
}: ProductPublishControlProps) {
  const router = useRouter();
  const [missingFields, setMissingFields] = useState<string[]>(initialMissingFields);
  const [selectedReleaseId, setSelectedReleaseId] = useState<string>(eligibleReleases[0]?.id ?? "");
  const [status, setStatus] = useState<Status>("idle");
  const selectId = useId();

  const canPublish = missingFields.length === 0 && selectedReleaseId.length > 0;

  async function handlePublish() {
    if (status === "submitting" || !canPublish) return;
    setStatus("submitting");
    try {
      const response = await fetch(`/api/admin/products/${productId}/publish`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ releaseId: selectedReleaseId }),
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

      {eligibleReleases.length > 0 ? (
        <div>
          <label htmlFor={selectId}>Release to publish</label>
          <select
            id={selectId}
            value={selectedReleaseId}
            onChange={(event) => setSelectedReleaseId(event.target.value)}
          >
            {eligibleReleases.map((release) => (
              <option key={release.id} value={release.id}>
                {release.version}
              </option>
            ))}
          </select>
        </div>
      ) : null}

      <button
        type="button"
        onClick={handlePublish}
        aria-disabled={status === "submitting" || !canPublish}
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
