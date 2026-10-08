"use client";

import type { ComponentAccess } from "@ppu/domain-content";
import { useRouter } from "next/navigation";
import { useId, useState } from "react";

/**
 * The admin's controls for one library component (MVP-049): record a
 * paste-test, choose who can copy it and whether it's hidden, and publish.
 * They mirror the API's messages; the server decides.
 */

type Result = { ok: true } | { ok: false; message: string; fieldErrors?: Record<string, string[]> };

async function send(url: string, method: "POST" | "PATCH", body?: unknown): Promise<Result> {
  try {
    const response = await fetch(url, {
      method,
      headers: body === undefined ? undefined : { "Content-Type": "application/json" },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    if (response.ok) return { ok: true };
    const payload = (await response.json().catch(() => null)) as {
      message?: string;
      fieldErrors?: Record<string, string[]>;
    } | null;
    return {
      ok: false,
      message: payload?.message ?? "Something went wrong. Please try again.",
      ...(payload?.fieldErrors ? { fieldErrors: payload.fieldErrors } : {}),
    };
  } catch {
    return { ok: false, message: "Something went wrong. Please try again." };
  }
}

const BUTTON =
  "inline-flex min-h-11 items-center rounded-full border-[1.5px] border-foreground px-4 font-semibold";

export function TestRecordForm({ id, lastVersion }: { id: string; lastVersion: string | null }) {
  const router = useRouter();
  const fieldId = useId();
  const [version, setVersion] = useState(lastVersion ?? "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    setError(null);
    setSaved(false);
    const result = await send(`/api/admin/components/${id}/test`, "POST", {
      studioVersion: version,
    });
    setBusy(false);
    if (result.ok) {
      setSaved(true);
      router.refresh();
    } else setError(result.fieldErrors?.["studioVersion"]?.[0] ?? result.message);
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-2" noValidate>
      <label htmlFor={fieldId} className="font-semibold">
        Studio version you tested in
      </label>
      <p id={`${fieldId}-hint`} className="text-sm text-muted-foreground">
        In Power Apps Studio: Settings &gt; Support &gt; Session details, the &quot;Studio
        version&quot; line. Record it only after the whole test checklist passed.
      </p>
      <input
        id={fieldId}
        value={version}
        onChange={(event) => setVersion(event.target.value)}
        aria-invalid={error !== null}
        aria-describedby={`${fieldId}-hint${error ? ` ${fieldId}-error` : ""}`}
        className="min-h-11 max-w-xs rounded-xl border border-border bg-card px-3"
        autoComplete="off"
      />
      {error ? (
        <p id={`${fieldId}-error`} className="text-sm text-coral">
          {error}
        </p>
      ) : null}
      <div className="flex flex-wrap items-center gap-3">
        <button type="submit" className={BUTTON} aria-disabled={busy}>
          {busy ? "Saving…" : "Record the test"}
        </button>
        <span role="status" className="text-sm">
          {saved ? "Test recorded." : null}
        </span>
      </div>
    </form>
  );
}

export function SettingsForm({
  id,
  access,
  hidden,
}: {
  id: string;
  access: ComponentAccess;
  hidden: boolean;
}) {
  const router = useRouter();
  const baseId = useId();
  const [values, setValues] = useState({ access, hidden });
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    setMessage(null);
    const result = await send(`/api/admin/components/${id}`, "PATCH", values);
    setBusy(false);
    if (result.ok) {
      setMessage({ ok: true, text: "Settings saved." });
      router.refresh();
    } else setMessage({ ok: false, text: result.message });
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-4">
      <fieldset className="flex flex-col gap-2">
        <legend className="font-semibold">Who can copy the YAML</legend>
        {(
          [
            ["OPEN", "Anyone"],
            ["MEMBERS", "Signed-in readers only (free account)"],
          ] as const
        ).map(([value, label]) => (
          <label key={value} className="flex min-h-11 items-center gap-2">
            <input
              type="radio"
              name={`${baseId}-access`}
              value={value}
              checked={values.access === value}
              onChange={() => setValues((current) => ({ ...current, access: value }))}
            />
            {label}
          </label>
        ))}
      </fieldset>
      <label className="flex min-h-11 items-center gap-2">
        <input
          type="checkbox"
          checked={values.hidden}
          onChange={(event) =>
            setValues((current) => ({ ...current, hidden: event.target.checked }))
          }
        />
        Hide from the site (it stays here, with its history)
      </label>
      <div className="flex flex-wrap items-center gap-3">
        <button type="submit" className={BUTTON} aria-disabled={busy}>
          {busy ? "Saving…" : "Save settings"}
        </button>
        <span role="status" className={`text-sm ${message && !message.ok ? "text-coral" : ""}`}>
          {message?.text ?? null}
        </span>
      </div>
    </form>
  );
}

export function PublishComponentButton({ id, canPublish }: { id: string; canPublish: boolean }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function publish() {
    if (busy || !canPublish) return;
    setBusy(true);
    setMessage(null);
    const result = await send(`/api/admin/components/${id}/publish`, "POST");
    setBusy(false);
    if (result.ok) router.refresh();
    else setMessage(result.message);
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      <button
        type="button"
        onClick={publish}
        aria-disabled={busy || !canPublish}
        className={`${BUTTON} ${canPublish ? "bg-foreground text-background" : "opacity-60"}`}
      >
        {busy ? "Publishing…" : "Publish component"}
      </button>
      <span role="status" className="text-sm text-coral">
        {message}
      </span>
    </div>
  );
}
