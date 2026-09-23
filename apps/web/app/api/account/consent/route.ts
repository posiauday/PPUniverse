import { PrismaPrivacyRepository } from "@ppu/adapter-privacy";
import { prisma } from "@ppu/db";
import { isConsentCategory } from "@ppu/domain-privacy";
import { createErrorEnvelope } from "@ppu/shared";
import { getCorrelationId, logger } from "@ppu/telemetry";
import { getServerSession } from "next-auth/next";
import { NextResponse } from "next/server";
import { authOptions } from "../../../../lib/auth";
import { withObservability } from "../../../../lib/observability";

/**
 * Records a consent decision for the signed-in user (MVP-020, FR-004).
 * Always self-only: userId is taken from the session, never from the
 * request body — there is no parameter a caller could supply to act on
 * someone else's behalf (same pattern as MVP-010's entitlement route).
 *
 * Append-only: this always inserts a new ConsentRecord row, never updates
 * an earlier one. A user changing their mind (granting, then withdrawing)
 * calls this twice; both rows persist.
 */
export const POST = withObservability("POST /api/account/consent", async (request: Request) => {
  const correlationId = getCorrelationId() ?? "unknown";
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json(
      createErrorEnvelope("UNAUTHENTICATED", "Sign-in required.", correlationId),
      {
        status: 401,
      },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      createErrorEnvelope("VALIDATION", "Invalid request body.", correlationId),
      {
        status: 400,
      },
    );
  }

  const category = (body as { category?: unknown } | null)?.category;
  const granted = (body as { granted?: unknown } | null)?.granted;
  if (
    typeof category !== "string" ||
    !isConsentCategory(category) ||
    typeof granted !== "boolean"
  ) {
    return NextResponse.json(
      createErrorEnvelope(
        "VALIDATION",
        "A valid category and a boolean granted value are required.",
        correlationId,
      ),
      { status: 400 },
    );
  }

  const db = prisma;
  const repository = new PrismaPrivacyRepository(db);

  // Server-resolved, never accepted from the client: the current policy
  // version for a category that is tied to one at all. TERMS_OF_SERVICE
  // acceptance always references the current version; MARKETING_EMAIL is
  // not tied to a specific legal-document version (see privacy.prisma).
  let policyVersionId: string | null = null;
  if (category === "TERMS_OF_SERVICE") {
    const current = await db.policyVersion.findFirst({
      where: { documentType: "TERMS_OF_SERVICE" },
      orderBy: { effectiveAt: "desc" },
    });
    policyVersionId = current?.id ?? null;
  }

  const record = await repository.recordConsent({
    userId: session.user.id,
    category,
    granted,
    policyVersionId,
  });

  logger.info("consent.recorded", {
    userId: session.user.id,
    category: record.category,
    granted: record.granted,
    policyVersionId: record.policyVersionId,
  });

  return NextResponse.json({ category: record.category, granted: record.granted }, { status: 201 });
});
