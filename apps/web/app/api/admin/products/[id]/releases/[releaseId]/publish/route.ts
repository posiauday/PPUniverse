import { prisma } from "@ppu/db";
import {
  ProductNotFoundError,
  ProductNotPublishedError,
  ProductNotReadyError,
  ReleaseAlreadyPublishedError,
  ReleaseNotFoundForProductError,
  ReleaseNotReadyError,
  type ProductPublishMissingField,
} from "@ppu/domain-catalog";
import { createErrorEnvelope } from "@ppu/shared";
import { getCorrelationId, logger } from "@ppu/telemetry";
import { getServerSession } from "next-auth/next";
import { NextResponse } from "next/server";
import { authOptions } from "../../../../../../../../lib/auth";
import { catalogRepository } from "../../../../../../../../lib/catalog";
import { withObservability } from "../../../../../../../../lib/observability";

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

/** Mirrors .../[id]/publish/route.ts's MISSING_FIELD_MESSAGES exactly --
 * the same mandatory-field vocabulary applies to a subsequent release. */
const MISSING_FIELD_MESSAGES: Record<ProductPublishMissingField, string> = {
  license: "At least one license must be assigned before publishing.",
  supportPolicy: "A support policy must be set before publishing.",
  compatibility: "At least one compatibility entry must be recorded before publishing.",
  release:
    "At least one release with an attached, scanned-clean file must exist before publishing.",
};

function missingFieldErrors(fields: ProductPublishMissingField[]): Record<string, string[]> {
  const fieldErrors: Record<string, string[]> = {};
  for (const field of fields) {
    fieldErrors[field] = [MISSING_FIELD_MESSAGES[field]];
  }
  return fieldErrors;
}

/**
 * Publishes a further draft Release belonging to an already-PUBLISHED
 * Product (MVP-014, FR-011; direct product-owner decision, "MVP-014
 * implementation authorization" sections 4/8). A dedicated sub-route,
 * distinct from .../[id]/publish -- that route requires the Product to
 * still be DRAFT; this one requires the opposite, so the two can never be
 * confused for one another and neither weakens the other's precondition.
 *
 * The one authoritative gate is
 * CatalogRepository.publishSubsequentRelease itself: it re-reads and
 * re-validates the Product, the selected Release, and every mandatory
 * field fresh, inside one transaction, using an atomic conditional update
 * (not a plain read-then-write) to guarantee a Release transitions
 * unpublished -> published at most once even under concurrent requests.
 * Product.publishedAt is never touched here -- it records only the
 * Product's initial publication.
 */
export const POST = withObservability(
  "POST /api/admin/products/[id]/releases/[releaseId]/publish",
  async (_request: Request, { params }: { params: Promise<{ id: string; releaseId: string }> }) => {
    const correlationId = getCorrelationId() ?? "unknown";
    const admin = await requireAdmin();
    if (!admin) return deny(correlationId);

    const { id, releaseId } = await params;

    try {
      const result = await catalogRepository.publishSubsequentRelease(id, releaseId, admin.userId);

      logger.info("product.subsequent_release_published", {
        productId: result.product.id,
        releaseId: result.release.id,
        actorUserId: admin.userId,
      });

      return NextResponse.json(
        { product: result.product, release: result.release },
        { status: 200 },
      );
    } catch (error) {
      if (error instanceof ProductNotFoundError) {
        return NextResponse.json(
          createErrorEnvelope("NOT_FOUND", "Product not found.", correlationId),
          { status: 404 },
        );
      }
      if (error instanceof ReleaseNotFoundForProductError) {
        return NextResponse.json(
          createErrorEnvelope(
            "NOT_FOUND",
            "The selected release does not belong to this product.",
            correlationId,
          ),
          { status: 404 },
        );
      }
      if (error instanceof ProductNotPublishedError) {
        return NextResponse.json(
          createErrorEnvelope(
            "INVALID_STATE",
            `Cannot publish a subsequent release for a product in status ${error.status}. Use the initial publish action instead.`,
            correlationId,
          ),
          { status: 409 },
        );
      }
      if (error instanceof ReleaseAlreadyPublishedError) {
        return NextResponse.json(
          createErrorEnvelope(
            "INVALID_STATE",
            "This release is already published and cannot be published again.",
            correlationId,
          ),
          { status: 409 },
        );
      }
      if (error instanceof ReleaseNotReadyError) {
        return NextResponse.json(
          createErrorEnvelope(
            "PUBLISH_NOT_READY",
            "The selected release has no attached, scanned-clean file.",
            correlationId,
            { fieldErrors: missingFieldErrors(["release"]) },
          ),
          { status: 409 },
        );
      }
      if (error instanceof ProductNotReadyError) {
        return NextResponse.json(
          createErrorEnvelope(
            "PUBLISH_NOT_READY",
            "This product is missing mandatory fields and cannot publish a new release yet.",
            correlationId,
            { fieldErrors: missingFieldErrors(error.missingFields) },
          ),
          { status: 409 },
        );
      }
      throw error;
    }
  },
);
