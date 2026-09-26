import { prisma } from "@ppu/db";
import {
  validateCompatibilityEntry,
  type CompatibilityEntryInput,
  type CompatibilityErrorCode,
} from "@ppu/domain-catalog";
import { createErrorEnvelope } from "@ppu/shared";
import { getCorrelationId, logger } from "@ppu/telemetry";
import { getServerSession } from "next-auth/next";
import { NextResponse } from "next/server";
import { authOptions } from "../../../../../../lib/auth";
import { catalogRepository } from "../../../../../../lib/catalog";
import { withObservability } from "../../../../../../lib/observability";

/** Same deny-by-default pattern as api/admin/products/route.ts. */
async function requireAdmin(): Promise<{ userId: string } | null> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return null;
  const actor = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true },
  });
  if (actor?.role !== "ADMIN") return null;
  return { userId: session.user.id };
}

function deny(correlationId: string): NextResponse {
  return NextResponse.json(createErrorEnvelope("NOT_FOUND", "Not found.", correlationId), {
    status: 404,
  });
}

const ERROR_CODE_MESSAGES: Record<CompatibilityErrorCode, string> = {
  PLATFORM_AREA_REQUIRED: "platformArea is required.",
  PLATFORM_AREA_INVALID: "platformArea must be one of the approved platform areas.",
  RELEASE_YEAR_REQUIRED: "minReleaseYear is required.",
  RELEASE_YEAR_OUT_OF_RANGE: "minReleaseYear is out of the supported range.",
  RELEASE_WAVE_REQUIRED: "minReleaseWave is required.",
  RELEASE_WAVE_INVALID: "minReleaseWave must be 1 or 2.",
  EVIDENCE_STATUS_REQUIRED: "evidenceStatus is required.",
  EVIDENCE_STATUS_INVALID: "evidenceStatus is not a recognized value.",
  EVIDENCE_STATUS_RESERVED_OR_LEGACY: "This evidenceStatus is reserved and cannot be assigned.",
  NOTES_TOO_LONG: "notes must be 500 characters or fewer.",
  EVIDENCE_SUMMARY_TOO_LONG: "evidenceSummary must be 500 characters or fewer.",
  LAST_VERIFIED_INVALID: "lastVerifiedAt must be a valid YYYY-MM-DD date.",
  LAST_VERIFIED_IN_FUTURE: "lastVerifiedAt cannot be in the future.",
};

interface CompatibilityInputBody {
  platformArea?: unknown;
  minReleaseYear?: unknown;
  minReleaseWave?: unknown;
  notes?: unknown;
  evidenceStatus?: unknown;
  evidenceSummary?: unknown;
  lastVerifiedAt?: unknown;
}

function toValidatorInput(body: CompatibilityInputBody): CompatibilityEntryInput {
  return {
    platformArea: typeof body.platformArea === "string" ? body.platformArea : null,
    minReleaseYear: typeof body.minReleaseYear === "number" ? body.minReleaseYear : null,
    minReleaseWave: typeof body.minReleaseWave === "number" ? body.minReleaseWave : null,
    notes: typeof body.notes === "string" ? body.notes : null,
    evidenceStatus: typeof body.evidenceStatus === "string" ? body.evidenceStatus : null,
    evidenceSummary: typeof body.evidenceSummary === "string" ? body.evidenceSummary : null,
    lastVerifiedAt: typeof body.lastVerifiedAt === "string" ? body.lastVerifiedAt : null,
  };
}

/**
 * Upserts a compatibility entry, keyed on (productId, platformArea)
 * (MVP-012, FR-009). TD-006/TD-008's hard gate, unchanged by the first-
 * party-only business-model reversal: this route -- and every MVP-012
 * write path -- may only ever write CREATOR_DECLARED. MARKETPLACE_REVIEWED
 * is rejected here with a distinct, tested error code even for an ADMIN
 * caller; it stays reserved for a future moderation/self-review mechanism
 * that is not approved yet (see this route's own tests for the rejection
 * case, and PrismaCatalogRepository.upsertCompatibilityEntry for the
 * defense-in-depth re-check at the database boundary).
 */
export const POST = withObservability(
  "POST /api/admin/products/[id]/compatibility",
  async (request: Request, { params }: { params: Promise<{ id: string }> }) => {
    const correlationId = getCorrelationId() ?? "unknown";
    const admin = await requireAdmin();
    if (!admin) return deny(correlationId);

    const { id } = await params;
    const product = await catalogRepository.findProductByIdForAdmin(id);
    if (!product) {
      return NextResponse.json(
        createErrorEnvelope("NOT_FOUND", "Product not found.", correlationId),
        { status: 404 },
      );
    }

    let body: CompatibilityInputBody;
    try {
      body = (await request.json()) as CompatibilityInputBody;
    } catch {
      return NextResponse.json(
        createErrorEnvelope("VALIDATION", "Invalid request body.", correlationId),
        { status: 400 },
      );
    }

    const result = validateCompatibilityEntry(toValidatorInput(body));
    if (!result.ok) {
      const fieldErrors: Record<string, string[]> = {};
      for (const validationError of result.errors) {
        const messages = fieldErrors[validationError.field] ?? [];
        messages.push(ERROR_CODE_MESSAGES[validationError.code]);
        fieldErrors[validationError.field] = messages;
      }
      return NextResponse.json(
        createErrorEnvelope("VALIDATION", "One or more fields are invalid.", correlationId, {
          fieldErrors,
        }),
        { status: 400 },
      );
    }

    // MVP-012's own hard gate (TD-006/TD-008), on top of the general
    // validator: even though validateCompatibilityEntry accepts
    // MARKETPLACE_REVIEWED as a generally-assignable status (it also serves
    // a future moderation write path), this ADMIN-authoring route must
    // never let it through. Rejected with a distinct code from ordinary
    // validation failures so a client can tell "you tried a real but
    // forbidden status" from "that isn't a status at all".
    if (result.value.evidenceStatus !== "CREATOR_DECLARED") {
      return NextResponse.json(
        createErrorEnvelope(
          "EVIDENCE_STATUS_NOT_PERMITTED_HERE",
          "Marketplace Reviewed cannot be set through this editor. Only Creator Declared is permitted.",
          correlationId,
          {
            fieldErrors: {
              evidenceStatus: [
                "Marketplace Reviewed cannot be set through this editor. Only Creator Declared is permitted.",
              ],
            },
          },
        ),
        { status: 400 },
      );
    }

    const entry = await catalogRepository.upsertCompatibilityEntry(id, result.value);

    logger.info("product.compatibility_upserted", {
      productId: id,
      actorUserId: admin.userId,
      platformArea: entry.platformArea,
    });

    return NextResponse.json({ compatibility: entry }, { status: 200 });
  },
);
