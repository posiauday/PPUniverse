import { createErrorEnvelope } from "@ppu/shared";
import { getCorrelationId } from "@ppu/telemetry";
import { NextResponse } from "next/server";
import { notFoundForNonAdmin, requireAdmin } from "../../../../../lib/require-admin";
import { completeFileUpload, UploadNotFoundError } from "../../../../../lib/complete-file-upload";
import { withObservability } from "../../../../../lib/observability";

interface CompleteRequestBody {
  storageKey: string;
  originalFilename: string;
  declaredMimeType: string;
}

function isCompleteRequestBody(value: unknown): value is CompleteRequestBody {
  if (typeof value !== "object" || value === null) return false;
  const body = value as Record<string, unknown>;
  return (
    typeof body["storageKey"] === "string" &&
    typeof body["originalFilename"] === "string" &&
    typeof body["declaredMimeType"] === "string"
  );
}

export const POST = withObservability(
  "POST /api/files/uploads/complete",
  async (request: Request) => {
    const correlationId = getCorrelationId() ?? "unknown";
    // BUG-020: only an admin uploads files. Signed out and non-admin both
    // get the identical 404.
    const admin = await requireAdmin();
    if (!admin) return notFoundForNonAdmin(correlationId);

    const body: unknown = await request.json().catch(() => null);
    if (!isCompleteRequestBody(body)) {
      return NextResponse.json(
        createErrorEnvelope(
          "VALIDATION",
          "storageKey, originalFilename, and declaredMimeType are required.",
          correlationId,
        ),
        { status: 400 },
      );
    }

    // The storage key an upload URL was issued for is always prefixed with
    // the requesting user's id (see /api/files/uploads) — this is the
    // ownership check for a resource with no FileScan row yet to check
    // ownership against.
    if (!body.storageKey.startsWith(`${admin.userId}/`)) {
      return NextResponse.json(
        createErrorEnvelope("FORBIDDEN", "You do not have access to this upload.", correlationId),
        { status: 403 },
      );
    }

    try {
      const record = await completeFileUpload({
        storageKey: body.storageKey,
        originalFilename: body.originalFilename,
        declaredMimeType: body.declaredMimeType,
        uploadedByUserId: admin.userId,
      });
      return NextResponse.json({ fileScan: record });
    } catch (error) {
      if (error instanceof UploadNotFoundError) {
        return NextResponse.json(
          createErrorEnvelope("UPLOAD_NOT_FOUND", error.message, correlationId),
          { status: 404 },
        );
      }
      throw error;
    }
  },
);
