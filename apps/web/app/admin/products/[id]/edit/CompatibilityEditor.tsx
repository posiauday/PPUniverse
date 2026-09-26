"use client";

import { useId, useState } from "react";
import { useRouter } from "next/navigation";
import { PLATFORM_AREAS, PLATFORM_AREA_LABELS } from "@ppu/domain-catalog";

export interface CompatibilityEditorEntry {
  id: string;
  platformArea: string;
  minReleaseYear: number;
  minReleaseWave: number;
  notes: string | null;
}

interface CompatibilityEditorProps {
  productId: string;
  entries: CompatibilityEditorEntry[];
}

type Status = "idle" | "submitting" | "error" | "saved";

/**
 * Adds or updates one compatibility entry at a time, upserted by
 * (productId, platformArea), via POST /api/admin/products/[id]/compatibility
 * (MVP-012, FR-009). Evidence status is never a form field here: every
 * entry this editor writes is Creator Declared, full stop -- Marketplace
 * Reviewed is not offered as a selectable option anywhere in this UI, not
 * even disabled (TD-006/TD-008's hard gate; the server independently
 * enforces the same rule regardless of what this form ever sends).
 */
export function CompatibilityEditor({ productId, entries }: CompatibilityEditorProps) {
  const router = useRouter();
  const [platformArea, setPlatformArea] = useState(PLATFORM_AREAS[0] ?? "");
  const [minReleaseYear, setMinReleaseYear] = useState(String(new Date().getUTCFullYear()));
  const [minReleaseWave, setMinReleaseWave] = useState("1");
  const [notes, setNotes] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const platformAreaId = useId();
  const yearId = useId();
  const waveId = useId();
  const notesId = useId();
  const statusId = useId();

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (status === "submitting") return;
    setStatus("submitting");
    setFieldErrors({});
    setErrorMessage(null);

    try {
      const response = await fetch(`/api/admin/products/${productId}/compatibility`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          platformArea,
          minReleaseYear: Number(minReleaseYear),
          minReleaseWave: Number(minReleaseWave),
          notes: notes.trim() === "" ? null : notes,
          evidenceStatus: "CREATOR_DECLARED",
          evidenceSummary: null,
          lastVerifiedAt: null,
        }),
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as {
          message?: string;
          fieldErrors?: Record<string, string[]>;
        } | null;
        setFieldErrors(payload?.fieldErrors ?? {});
        setErrorMessage(payload?.message ?? "Something went wrong. Please try again.");
        setStatus("error");
        return;
      }

      setStatus("saved");
      setNotes("");
      router.refresh();
    } catch {
      setErrorMessage("Something went wrong. Please try again.");
      setStatus("error");
    }
  }

  return (
    <div>
      {entries.length === 0 ? (
        <p>No compatibility entries recorded yet.</p>
      ) : (
        <table>
          <caption>Recorded compatibility entries (Creator Declared)</caption>
          <thead>
            <tr>
              <th scope="col">Platform area</th>
              <th scope="col">Minimum release wave</th>
              <th scope="col">Notes</th>
            </tr>
          </thead>
          <tbody>
            {entries.map((entry) => (
              <tr key={entry.id}>
                <td>
                  {PLATFORM_AREA_LABELS[entry.platformArea as keyof typeof PLATFORM_AREA_LABELS] ??
                    entry.platformArea}
                </td>
                <td>
                  {entry.minReleaseYear} release wave {entry.minReleaseWave}
                </td>
                <td>{entry.notes ?? ""}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <form onSubmit={handleSubmit} noValidate>
        <div>
          <label htmlFor={platformAreaId}>Platform area</label>
          <select
            id={platformAreaId}
            value={platformArea}
            onChange={(event) => setPlatformArea(event.target.value)}
            aria-invalid={Boolean(fieldErrors["platformArea"])}
          >
            {PLATFORM_AREAS.map((area) => (
              <option key={area} value={area}>
                {PLATFORM_AREA_LABELS[area]}
              </option>
            ))}
          </select>
          {fieldErrors["platformArea"] ? <p>{fieldErrors["platformArea"][0]}</p> : null}
        </div>

        <div>
          <label htmlFor={yearId}>Minimum release year</label>
          <input
            id={yearId}
            type="number"
            value={minReleaseYear}
            onChange={(event) => setMinReleaseYear(event.target.value)}
            aria-invalid={Boolean(fieldErrors["minReleaseYear"])}
          />
          {fieldErrors["minReleaseYear"] ? <p>{fieldErrors["minReleaseYear"][0]}</p> : null}
        </div>

        <div>
          <label htmlFor={waveId}>Minimum release wave</label>
          <select
            id={waveId}
            value={minReleaseWave}
            onChange={(event) => setMinReleaseWave(event.target.value)}
            aria-invalid={Boolean(fieldErrors["minReleaseWave"])}
          >
            <option value="1">1</option>
            <option value="2">2</option>
          </select>
          {fieldErrors["minReleaseWave"] ? <p>{fieldErrors["minReleaseWave"][0]}</p> : null}
        </div>

        <div>
          <label htmlFor={notesId}>Notes (optional)</label>
          <textarea
            id={notesId}
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            aria-invalid={Boolean(fieldErrors["notes"])}
          />
          {fieldErrors["notes"] ? <p>{fieldErrors["notes"][0]}</p> : null}
        </div>

        <button type="submit" aria-disabled={status === "submitting"}>
          {status === "submitting" ? "Saving…" : "Add compatibility entry"}
        </button>
        <p id={statusId} role="status">
          {status === "saved" ? "Compatibility entry saved." : errorMessage}
        </p>
      </form>
    </div>
  );
}
