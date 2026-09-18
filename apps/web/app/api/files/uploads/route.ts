import { randomUUID } from "node:crypto";
import {
  checkUploadPolicy,
  describeUploadPolicyViolation,
  sanitizeFilename,
} from "@ppu/domain-files";
import { createErrorEnvelope } from "@ppu/shared";
import { getServerSession } from "next-auth/next";
import { NextResponse } from "next/server";
import { authOptions } from "../../../../lib/auth";
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

export async function POST(request: Request) {
  const correlationId = randomUUID();
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json(
      createErrorEnvelope("UNAUTHENTICATED", "Sign-in required.", correlationId),
      { status: 401 },
    );
  }

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

  const storageKey = `${session.user.id}/${randomUUID()}-${sanitizeFilename(body.filename)}`;
  const uploadUrl = await storageAdapter.getSignedUploadUrl(
    "quarantine",
    storageKey,
    body.declaredMimeType,
  );

  return NextResponse.json({ storageKey, uploadUrl });
}
