"use client";

import { useId, useState } from "react";
import { useRouter } from "next/navigation";

export interface ReleasesEditorRelease {
  id: string;
  version: string;
  files: Array<{ fileScanId: string; status: string }>;
}

interface ReleasesEditorProps {
  productId: string;
  releases: ReleasesEditorRelease[];
}

type Status = "idle" | "submitting" | "error" | "saved";

/**
 * Creates releases (POST .../releases) and attaches an already-uploaded,
 * already-scanned file to a release by reference (POST
 * .../releases/[releaseId]/files) -- MVP-012, FR-009/FR-011. Composes with
 * MVP-006's existing upload/scan flow: the admin uploads a file elsewhere
 * (POST /api/files/uploads, then .../complete, then waits for the async
 * scan to mark it CLEAN) and enters the resulting file scan id here. This
 * editor never claims a file is clean on the client's behalf -- the server
 * re-verifies FileScan.status === "CLEAN" on every attach attempt.
 */
export function ReleasesEditor({ productId, releases }: ReleasesEditorProps) {
  const router = useRouter();
  const [version, setVersion] = useState("");
  const [releaseStatus, setReleaseStatus] = useState<Status>("idle");
  const [releaseFieldErrors, setReleaseFieldErrors] = useState<Record<string, string[]>>({});
  const [releaseError, setReleaseError] = useState<string | null>(null);

  const versionId = useId();
  const releaseStatusId = useId();

  async function handleCreateRelease(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (releaseStatus === "submitting") return;
    setReleaseStatus("submitting");
    setReleaseFieldErrors({});
    setReleaseError(null);

    try {
      const response = await fetch(`/api/admin/products/${productId}/releases`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ version }),
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as {
          message?: string;
          fieldErrors?: Record<string, string[]>;
        } | null;
        setReleaseFieldErrors(payload?.fieldErrors ?? {});
        setReleaseError(payload?.message ?? "Something went wrong. Please try again.");
        setReleaseStatus("error");
        return;
      }

      setReleaseStatus("saved");
      setVersion("");
      router.refresh();
    } catch {
      setReleaseError("Something went wrong. Please try again.");
      setReleaseStatus("error");
    }
  }

  return (
    <div>
      {releases.length === 0 ? (
        <p>No releases yet.</p>
      ) : (
        <ul>
          {releases.map((release) => (
            <li key={release.id}>
              <p>
                <strong>{release.version}</strong>
              </p>
              {release.files.length === 0 ? (
                <p>No files attached.</p>
              ) : (
                <ul>
                  {release.files.map((file) => (
                    <li key={file.fileScanId}>
                      {file.fileScanId} — {file.status}
                    </li>
                  ))}
                </ul>
              )}
              <AttachFileForm productId={productId} releaseId={release.id} />
            </li>
          ))}
        </ul>
      )}

      <form onSubmit={handleCreateRelease} noValidate>
        <div>
          <label htmlFor={versionId}>New release version</label>
          <input
            id={versionId}
            type="text"
            value={version}
            onChange={(event) => setVersion(event.target.value)}
            aria-invalid={Boolean(releaseFieldErrors["version"])}
          />
          {releaseFieldErrors["version"] ? <p>{releaseFieldErrors["version"][0]}</p> : null}
        </div>
        <button type="submit" aria-disabled={releaseStatus === "submitting"}>
          {releaseStatus === "submitting" ? "Creating…" : "Create release"}
        </button>
        <p id={releaseStatusId} role="status">
          {releaseStatus === "saved" ? "Release created." : releaseError}
        </p>
      </form>
    </div>
  );
}

function AttachFileForm({ productId, releaseId }: { productId: string; releaseId: string }) {
  const router = useRouter();
  const [fileScanId, setFileScanId] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const fieldId = useId();
  const statusId = useId();

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (status === "submitting") return;
    setStatus("submitting");
    setErrorMessage(null);

    try {
      const response = await fetch(
        `/api/admin/products/${productId}/releases/${releaseId}/files`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ fileScanId }),
        },
      );

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as {
          fieldErrors?: Record<string, string[]>;
          message?: string;
        } | null;
        setErrorMessage(
          payload?.fieldErrors?.["fileScanId"]?.[0] ??
            payload?.message ??
            "Something went wrong. Please try again.",
        );
        setStatus("error");
        return;
      }

      setStatus("saved");
      setFileScanId("");
      router.refresh();
    } catch {
      setErrorMessage("Something went wrong. Please try again.");
      setStatus("error");
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate>
      <label htmlFor={fieldId}>Attach a scanned-clean file (file scan id)</label>
      <input
        id={fieldId}
        type="text"
        value={fileScanId}
        onChange={(event) => setFileScanId(event.target.value)}
        aria-invalid={status === "error"}
      />
      <button type="submit" aria-disabled={status === "submitting"}>
        {status === "submitting" ? "Attaching…" : "Attach file"}
      </button>
      <p id={statusId} role="status">
        {status === "saved" ? "File attached." : errorMessage}
      </p>
    </form>
  );
}
