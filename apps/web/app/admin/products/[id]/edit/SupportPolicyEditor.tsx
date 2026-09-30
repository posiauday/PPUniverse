"use client";

import { useId, useState } from "react";
import { useRouter } from "next/navigation";

const SUPPORT_STATUS_OPTIONS: Array<{ value: string; label: string }> = [
  { value: "CREATOR_SUPPORTED", label: "Creator-supported" },
  { value: "PLATFORM_SUPPORTED", label: "Platform-supported" },
  { value: "COMMUNITY_SUPPORTED", label: "Community-supported" },
  { value: "UNSUPPORTED", label: "Unsupported" },
];

interface SupportPolicyEditorProps {
  productId: string;
  initialStatus: string | null;
  initialChannel: string | null;
}

type Status = "idle" | "submitting" | "error" | "saved";

/** Upserts the product's support policy (MVP-012, FR-009) via
 * PUT /api/admin/products/[id]/support. A channel is required unless
 * status is Unsupported -- the same rule the database CHECK constraint
 * enforces, surfaced here as a friendly client-side hint, not a substitute
 * for the server's own validation. */
export function SupportPolicyEditor({
  productId,
  initialStatus,
  initialChannel,
}: SupportPolicyEditorProps) {
  const router = useRouter();
  const [supportStatus, setSupportStatus] = useState(initialStatus ?? "UNSUPPORTED");
  const [channel, setChannel] = useState(initialChannel ?? "");
  const [status, setStatus] = useState<Status>("idle");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const statusFieldId = useId();
  const channelFieldId = useId();
  const statusMessageId = useId();

  const channelRequired = supportStatus !== "UNSUPPORTED";

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (status === "submitting") return;
    setStatus("submitting");
    setFieldErrors({});
    setErrorMessage(null);

    try {
      const response = await fetch(`/api/admin/products/${productId}/support`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: supportStatus,
          channel: channel.trim() === "" ? null : channel,
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
      router.refresh();
    } catch {
      setErrorMessage("Something went wrong. Please try again.");
      setStatus("error");
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate>
      <div>
        <label htmlFor={statusFieldId}>Support status</label>
        <select
          id={statusFieldId}
          value={supportStatus}
          onChange={(event) => setSupportStatus(event.target.value)}
          aria-invalid={Boolean(fieldErrors["status"])}
        >
          {SUPPORT_STATUS_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        {fieldErrors["status"] ? <p>{fieldErrors["status"][0]}</p> : null}
      </div>

      <div>
        <label htmlFor={channelFieldId}>
          Support channel {channelRequired ? "(required)" : "(optional)"}
        </label>
        <input
          id={channelFieldId}
          type="text"
          value={channel}
          onChange={(event) => setChannel(event.target.value)}
          aria-invalid={Boolean(fieldErrors["channel"])}
        />
        {fieldErrors["channel"] ? <p>{fieldErrors["channel"][0]}</p> : null}
      </div>

      <button type="submit" aria-disabled={status === "submitting"}>
        {status === "submitting" ? "Saving…" : "Save support policy"}
      </button>
      <p id={statusMessageId} role="status">
        {status === "saved" ? "Support policy saved." : errorMessage}
      </p>
    </form>
  );
}
