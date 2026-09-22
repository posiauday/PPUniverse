import { PrismaEntitlementRepository } from "@ppu/adapter-entitlements";
import { PrismaCatalogRepository } from "@ppu/adapter-catalog";
import { prisma } from "@ppu/db";
import { isDownloadAllowed, isProductEligibleForFreeEntitlement } from "@ppu/domain-entitlements";
import { createErrorEnvelope } from "@ppu/shared";
import { getCorrelationId, logger } from "@ppu/telemetry";
import { getServerSession } from "next-auth/next";
import { NextResponse } from "next/server";
import { authOptions } from "../../../../../lib/auth";
import { withObservability } from "../../../../../lib/observability";

/**
 * Grants (or reuses) a free entitlement for the signed-in user and records a
 * download event (MVP-010, FR-005). Does not deliver a file — see
 * planning/prework/MVP-010-prework-analysis.md, "Delivery boundary": there
 * is no ReleaseFile model yet, so this only creates the right and the audit
 * record, both scoped to the product, not a specific release.
 *
 * Sign-in is required for every request (docs/final-decisions.md, "MVP-010
 * open questions 44 and 45", Q44) — there is no guest path and no
 * per-product policy field.
 */
export const POST = withObservability(
  "POST /api/products/[slug]/entitlement",
  async (_request: Request, { params }: { params: Promise<{ slug: string }> }) => {
    const correlationId = getCorrelationId() ?? "unknown";
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        createErrorEnvelope("UNAUTHENTICATED", "Sign-in required.", correlationId),
        { status: 401 },
      );
    }

    const { slug } = await params;
    // Re-read the product fresh on every request; never trust a
    // client-supplied price, free flag, or product state (docs/final-
    // decisions.md, "MVP-010 open questions 44 and 45"). findPublishedProductBySlug
    // already filters to PUBLISHED, and isProductEligibleForFreeEntitlement
    // re-checks the returned record's own status explicitly, so the rule is
    // independently verifiable here, not only implicit in the query.
    const catalogRepository = new PrismaCatalogRepository(prisma);
    const product = await catalogRepository.findPublishedProductBySlug(slug);
    if (!product || !isProductEligibleForFreeEntitlement({ status: product.status })) {
      // Draft, suspended, archived, rejected or nonexistent all read the
      // same from outside: not found. Nothing distinguishes "exists but
      // ineligible" from "doesn't exist" in the response, so an unpublished
      // product's existence is never leaked by this endpoint.
      return NextResponse.json(
        createErrorEnvelope("NOT_FOUND", "Product not found.", correlationId),
        { status: 404 },
      );
    }

    const entitlementRepository = new PrismaEntitlementRepository(prisma);
    const { entitlement, reused } = await entitlementRepository.grantOrReuseEntitlement(
      session.user.id,
      product.id,
    );

    // Enforced at read time (docs/final-decisions.md, "MVP-010 open
    // questions 44 and 45", Q45 amendment) even though nothing in this
    // story ever sets revokedAt — the check exists and is live from the
    // first request, not added later alongside whatever eventually
    // revokes an entitlement.
    if (!isDownloadAllowed(entitlement)) {
      return NextResponse.json(
        createErrorEnvelope(
          "ENTITLEMENT_REVOKED",
          "This entitlement is no longer active.",
          correlationId,
        ),
        { status: 403 },
      );
    }

    await entitlementRepository.recordDownload(entitlement.id, session.user.id, product.id);

    logger.info("entitlement.granted", {
      userId: session.user.id,
      productId: product.id,
      source: entitlement.source,
      reused,
    });
    logger.info("entitlement.download_recorded", {
      entitlementId: entitlement.id,
      userId: session.user.id,
      productId: product.id,
    });

    return NextResponse.json({ granted: true, reused }, { status: 200 });
  },
);
