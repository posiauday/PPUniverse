"use client";

import { useId, useState } from "react";
import { useRouter } from "next/navigation";

export interface ReleasesEditorRelease {
  id: string;
  version: string;
  /** null means still a draft (editable); once set, this release and its
   * files are immutable (A3, "PR #23 blocker corrections"). Accepted as
   * either a Date or its serialized ISO string -- only its null-ness is
   * ever inspected here, never formatted, so either shape is safe across
   * the server/client component boundary. */
  publishedAt: string | Date | null;
  files: Array<{ fileScanId: string; status: string }>;
}

interface ReleasesEditorProps {
  productId: string;
  releases: ReleasesEditorRelease[];
}

type Status = "idle" | "submitting" | "error" | "saved";

/**
 * Creates releases (POST .../releases) and attaches/detaches an
 * already-uploaded, already-scanned file to a *draft* release by reference
 * (POST/DELETE .../releases/[releaseId]/files) -- MVP-012, FR-009/FR-011;
 * direct product-owner decision, "PR #23 blocker corrections" A2/A3/A7.
 * Composes with MVP-006's existing upload/scan flow: the admin uploads a
 * file elsewhere (POST /api/files/uploads, then .../complete, then waits
 * for the async scan to mark it CLEAN) and enters the resulting file scan
 * id here. This editor never claims a file is clean on the client's behalf
 * -- the server re-verifies FileScan.status === "CLEAN" on every attach
 * attempt, and re-verifies a release is still a draft on every
 * attach/detach attempt. The attach/detach controls are hidden entirely for
 * an already-published release (a UI convenience only -- the server enforces
 * this independently and rejects the request either way; hiding the control
 * is not the authorization).
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

  if (releases.length === 0) {
    return (
      <div>
        <p>No releases yet.</p>
        <CreateReleaseForm
          version={version}
          setVersion={setVersion}
          status={releaseStatus}
          fieldErrors={releaseFieldErrors}
          errorMessage={releaseError}
          onSubmit={handleCreateRelease}
          versionId={versionId}
          statusId={releaseStatusId}
        />
      </div>
    );
  }

  return (
    <div>
      <ul>
        {releases.map((release) => {
          const isPublished = release.publishedAt !== null;
          return (
            <li key={release.id}>
              <p>
                <strong>{release.version}</strong> — {isPublished ? "Published" : "Draft"}
              </p>
              {release.files.length === 0 ? (
                <p>No files attached.</p>
              ) : (
                <ul>
                  {release.files.map((file) => (
                    <li key={file.fileScanId}>
                      {file.fileScanId} — {file.status}
                      {!isPublished ? (
                        <DetachFileButton
                          productId={productId}
                          releaseId={release.id}
                          fileScanId={file.fileScanId}
                        />
                      ) : null}
                    </li>
                  ))}
                </ul>
              )}
              {isPublished ? (
                <p>This release is published; its files are immutable.</p>
              ) : (
                <AttachFileForm productId={productId} releaseId={release.id} />
              )}
            </li>
          );
        })}
      </ul>

      <CreateReleaseForm
        version={version}
        setVersion={setVersion}
        status={releaseStatus}
        fieldErrors={releaseFieldErrors}
        errorMessage={releaseError}
        onSubmit={handleCreateRelease}
        versionId={versionId}
        statusId={releaseStatusId}
      />
    </div>
  );
}

interface CreateReleaseFormProps {
  version: string;
  setVersion: (value: string) => void;
  status: Status;
  fieldErrors: Record<string, string[]>;
  errorMessage: string | null;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
  versionId: string;
  statusId: string;
}

function CreateReleaseForm({
  version,
  setVersion,
  status,
  fieldErrors,
  errorMessage,
  onSubmit,
  versionId,
  statusId,
}: CreateReleaseFormProps) {
  return (
    <form onSubmit={onSubmit} noValidate>
      <div>
        <label htmlFor={versionId}>New release version</label>
        <input
          id={versionId}
          type="text"
          value={version}
          onChange={(event) => setVersion(event.target.value)}
          aria-invalid={Boolean(fieldErrors["version"])}
        />
        {fieldErrors["version"] ? <p>{fieldErrors["version"][0]}</p> : null}
      </div>
      <button type="submit" aria-disabled={status === "submitting"}>
        {status === "submitting" ? "Creating…" : "Create release"}
      </button>
      <p id={statusId} role="status">
        {status === "saved" ? "Release created." : errorMessage}
      </p>
    </form>
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
      const response = await fetch(`/api/admin/products/${productId}/releases/${releaseId}/files`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fileScanId }),
      });

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

function DetachFileButton({
  productId,
  releaseId,
  fileScanId,
}: {
  productId: string;
  releaseId: string;
  fileScanId: string;
}) {
  const router = useRouter();
  const [status, setStatus] = useState<Status>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const statusId = useId();

  async function handleDetach() {
    if (status === "submitting") return;
    setStatus("submitting");
    setErrorMessage(null);

    try {
      const response = await fetch(`/api/admin/products/${productId}/releases/${releaseId}/files`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fileScanId }),
      });

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
      router.refresh();
    } catch {
      setErrorMessage("Something went wrong. Please try again.");
      setStatus("error");
    }
  }

  return (
    <span>
      <button type="button" aria-disabled={status === "submitting"} onClick={handleDetach}>
        {status === "submitting" ? "Removing…" : "Remove"}
      </button>
      <span id={statusId} role="status">
        {status === "saved" ? "File removed." : errorMessage}
      </span>
    </span>
  );
}
