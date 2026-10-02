import { randomUUID } from "node:crypto";
import {
  checkUploadPolicy,
  describeUploadPolicyViolation,
  sanitizeFilename,
} from "@ppu/domain-files";
import { createErrorEnvelope } from "@ppu/shared";
import { getCorrelationId } from "@ppu/telemetry";
import { NextResponse } from "next/server";
import { notFoundForNonAdmin, requireAdmin } from "../../../../lib/require-admin";
import { withObservability } from "../../../../lib/observability";
import { storageAdapter } from "../../../../lib/storage";

interface UploadRequestBody {
  filename: string;
  declaredMimeType: string;
  sizeBytes: number;
}

function isUploadRequestBody(value: unknown): value is UploadRequestBody {
  if (typeof value !== "object" || value === null) return false;
  const body = value as Record<string, unknown>;
  return (
    typeof body["filename"] === "string" &&
    typeof body["declaredMimeType"] === "string" &&
    typeof body["sizeBytes"] === "number"
  );
}

export const POST = withObservability("POST /api/files/uploads", async (request: Request) => {
  const correlationId = getCorrelationId() ?? "unknown";
  // BUG-020: only an admin uploads files (first-party publishing; visitors
  // never upload). Signed out and non-admin both get the identical 404.
  const admin = await requireAdmin();
  if (!admin) return notFoundForNonAdmin(correlationId);

  const body: unknown = await request.json().catch(() => null);
  if (!isUploadRequestBody(body)) {
    return NextResponse.json(
      createErrorEnvelope(
        "VALIDATION",
        "filename, declaredMimeType, and sizeBytes are required.",
        correlationId,
      ),
      { status: 400 },
    );
  }

  const violation = checkUploadPolicy({
    declaredMimeType: body.declaredMimeType,
    sizeBytes: body.sizeBytes,
  });
  if (violation) {
    return NextResponse.json(
      createErrorEnvelope(
        "UPLOAD_POLICY_VIOLATION",
        describeUploadPolicyViolation(violation),
        correlationId,
      ),
      { status: 400 },
    );
  }

  const storageKey = `${admin.userId}/${randomUUID()}-${sanitizeFilename(body.filename)}`;
  const uploadUrl = await storageAdapter.getSignedUploadUrl(
    "quarantine",
    storageKey,
    body.declaredMimeType,
  );

  return NextResponse.json({ storageKey, uploadUrl });
});
