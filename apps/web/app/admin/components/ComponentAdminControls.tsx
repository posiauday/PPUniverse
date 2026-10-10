"use client";

import type { ComponentAccess } from "@ppu/domain-content";
import { useRouter } from "next/navigation";
import { useId, useState } from "react";
import { copyBySelection } from "../../guides/CopyCodeButton";
import { FIELD_CONTROL } from "../EditorParts";

/**
 * The admin's controls for one library component (MVP-049): record a
 * paste-test, copy its YAML, choose who can copy it, whether it's hidden and
 * whether a draft shows as Coming soon, publish, and post its team post
 * (MVP-053).
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

/**
 * Copies the YAML for a paste-test, so the product owner doesn't select it by
 * hand. The result is announced in a polite live region; the name stays the
 * same (WCAG 2.5.3, label in name).
 */
export function CopyYamlButton({ yaml }: { yaml: string }) {
  const [status, setStatus] = useState("");

  async function copy() {
    try {
      await navigator.clipboard.writeText(yaml);
      setStatus("Copied. Paste it onto a screen in Power Apps Studio.");
    } catch {
      setStatus(
        copyBySelection(yaml)
          ? "Copied. Paste it onto a screen in Power Apps Studio."
          : "Copy failed. Open the YAML below, select it and copy it instead.",
      );
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      <button type="button" onClick={copy} className={BUTTON}>
        Copy YAML
      </button>
      <span role="status" className="text-sm">
        {status}
      </span>
    </div>
  );
}

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
  comingSoon,
  published,
}: {
  id: string;
  access: ComponentAccess;
  hidden: boolean;
  comingSoon: boolean;
  published: boolean;
}) {
  const router = useRouter();
  const baseId = useId();
  // Published, the box means "move it back to Coming soon", so it starts clear
  // (docs/final-decisions.md, 2026-10-10, "Coming soon in Settings").
  const [values, setValues] = useState({
    access,
    hidden,
    comingSoon: published ? false : comingSoon,
  });
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    setMessage(null);
    const moveBack = published && values.comingSoon;
    const result = await send(
      `/api/admin/components/${id}`,
      "PATCH",
      moveBack ? { access: values.access, hidden: values.hidden } : values,
    );
    const moved =
      result.ok && moveBack
        ? await send(`/api/admin/components/${id}/coming-soon`, "POST")
        : result;
    setBusy(false);
    if (result.ok && moved.ok) {
      setMessage({
        ok: true,
        text: moveBack ? "Saved. It shows as Coming soon now." : "Settings saved.",
      });
      router.refresh();
    } else {
      const failed = result.ok ? moved : result;
      setMessage({ ok: false, text: failed.ok ? "Something went wrong." : failed.message });
    }
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-4">
      {/* A select, not radios: every option is reachable with the keyboard alone. */}
      <div className="flex flex-col gap-2">
        <label htmlFor={`${baseId}-access`} className="font-semibold">
          Who can copy the YAML
        </label>
        <select
          id={`${baseId}-access`}
          value={values.access}
          onChange={(event) =>
            setValues((current) => ({ ...current, access: event.target.value as ComponentAccess }))
          }
          className="min-h-11 max-w-sm rounded-xl border border-border bg-card px-3"
        >
          <option value="OPEN">Anyone</option>
          <option value="MEMBERS">Signed-in readers only (free account)</option>
        </select>
      </div>
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
      <label className="flex min-h-11 items-center gap-2">
        <input
          type="checkbox"
          checked={values.comingSoon}
          onChange={(event) =>
            setValues((current) => ({ ...current, comingSoon: event.target.checked }))
          }
        />
        {published
          ? "Show as Coming soon instead: off the live list, a blurred picture and nothing to copy. Its paste-test is kept, so you can publish it again."
          : "Show as Coming soon: its card and page with a blurred picture, nothing to copy"}
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

/**
 * The component's team post (MVP-053; docs/final-decisions.md, 2026-10-10,
 * "Team posts start the conversation on components"): it shows first under
 * "Questions and discussion", under the site's name. The box starts with the
 * live post, or else the drafted opener for this component, which nothing
 * posts until the admin does. Removing it uses the moderation route, so it
 * stays in /admin/comments and can be restored there.
 */
export function TeamPostForm({
  componentId,
  live,
  draft,
}: {
  componentId: string;
  /** The live team post, or null. */
  live: { id: string; body: string } | null;
  /** The drafted opener (lib/component-starters.ts), used when there's no live post. */
  draft: string;
}) {
  const router = useRouter();
  const fieldId = useId();
  const [body, setBody] = useState(live?.body ?? draft);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState("");

  async function save(event: React.FormEvent) {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    setError(null);
    setMessage("");
    const result = await send(`/api/admin/components/${componentId}/team-post`, "POST", { body });
    setBusy(false);
    if (!result.ok) {
      setError(result.fieldErrors?.["body"]?.[0] ?? result.message);
      return;
    }
    setMessage(
      live
        ? "Saved. The team post shows the new text."
        : "Posted. It's first on the component's page.",
    );
    router.refresh();
  }

  async function remove() {
    if (busy || !live) return;
    if (
      !window.confirm(
        "Remove the team post from the component's page? You can restore it in Comments.",
      )
    ) {
      return;
    }
    setBusy(true);
    setError(null);
    setMessage("");
    const result = await send(`/api/admin/comments/${live.id}/remove`, "POST");
    setBusy(false);
    if (!result.ok) {
      setError(result.message);
      return;
    }
    setBody(draft);
    setMessage("Removed. You can restore it in Comments, or post a new one.");
    router.refresh();
  }

  return (
    <form onSubmit={save} noValidate className="flex flex-col gap-3">
      <label htmlFor={fieldId} className="font-semibold">
        Team post
      </label>
      <p id={`${fieldId}-hint`} className="text-sm text-muted-foreground">
        {live
          ? 'Live on the component\'s page, first, under "LowCodeStacks team" with a Pinned badge.'
          : draft
            ? "Not posted yet. The box holds a draft written from this component's guide: read it, change anything, then post it."
            : "Not posted yet. Write a tip and a question to start the conversation."}{" "}
        10 to 2,000 characters, at most 2 links; ``` for code.
      </p>
      <textarea
        id={fieldId}
        rows={8}
        value={body}
        onChange={(event) => setBody(event.target.value)}
        aria-invalid={error !== null}
        aria-describedby={`${fieldId}-hint${error ? ` ${fieldId}-error` : ""}`}
        className={FIELD_CONTROL}
      />
      {error ? (
        <p id={`${fieldId}-error`} className="text-sm font-semibold text-coral">
          {error}
        </p>
      ) : null}
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="submit"
          aria-disabled={busy}
          className="inline-flex min-h-11 items-center rounded-full bg-[#7c3aed] px-5 font-semibold text-white hover:bg-[#6d28d9]"
        >
          {busy ? "Saving…" : live ? "Save the team post" : "Post as the team"}
        </button>
        {live ? (
          <button
            type="button"
            onClick={() => void remove()}
            aria-disabled={busy}
            className={BUTTON}
          >
            Remove the team post
          </button>
        ) : null}
        <span role="status" className="text-sm">
          {message}
        </span>
      </div>
    </form>
  );
}
