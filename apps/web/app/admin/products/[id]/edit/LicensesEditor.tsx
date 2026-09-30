"use client";

import { useId, useState } from "react";
import { useRouter } from "next/navigation";

export interface LicensesEditorOption {
  id: string;
  name: string;
}

interface LicensesEditorProps {
  productId: string;
  options: LicensesEditorOption[];
  initialSelectedIds: string[];
}

type Status = "idle" | "submitting" | "error" | "saved";

/**
 * Replaces the product's full assigned license set (MVP-012, FR-009) via
 * PUT /api/admin/products/[id]/licenses -- checkbox-picker semantics: the
 * request body is always the complete set, not an incremental add/remove
 * (CatalogRepository.setProductLicenses' own contract).
 */
export function LicensesEditor({ productId, options, initialSelectedIds }: LicensesEditorProps) {
  const router = useRouter();
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set(initialSelectedIds));
  const [status, setStatus] = useState<Status>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const groupId = useId();
  const statusId = useId();

  function toggle(id: string) {
    setSelectedIds((current) => {
      const next = new Set(current);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (status === "submitting") return;
    setStatus("submitting");
    setErrorMessage(null);

    try {
      const response = await fetch(`/api/admin/products/${productId}/licenses`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ licenseDefinitionIds: [...selectedIds] }),
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as { message?: string } | null;
        setErrorMessage(payload?.message ?? "Something went wrong. Please try again.");
        setStatus("error");
        return;
      }

      setStatus("saved");
      router.refresh();
    } catch {
      setErrorMessage("Something went wrong. Please try again.");
      setStatus("error");
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <fieldset>
        <legend id={groupId}>Licenses</legend>
        {options.length === 0 ? (
          <p>No license tiers are available.</p>
        ) : (
          options.map((option) => {
            const checkboxId = `${groupId}-${option.id}`;
            return (
              <div key={option.id}>
                <input
                  id={checkboxId}
                  type="checkbox"
                  checked={selectedIds.has(option.id)}
                  onChange={() => toggle(option.id)}
                />
                <label htmlFor={checkboxId}>{option.name}</label>
              </div>
            );
          })
        )}
      </fieldset>
      <button type="submit" aria-disabled={status === "submitting"}>
        {status === "submitting" ? "Saving…" : "Save licenses"}
      </button>
      <p id={statusId} role="status">
        {status === "saved" ? "Licenses saved." : errorMessage}
      </p>
    </form>
  );
}
