import { prisma } from "@ppu/db";
import {
  checkProductPublishReadiness,
  isValidProductStatusTransition,
  type ProductPublishMissingField,
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

/** One friendly sentence per missing mandatory field (docs/open-questions.md
 * item 61's recorded field set). Carried as `fieldErrors` on the 409
 * response -- the same shape ordinary validation errors use elsewhere in
 * this codebase, so the admin UI can render it with the same code path. */
const MISSING_FIELD_MESSAGES: Record<ProductPublishMissingField, string> = {
  license: "At least one license must be assigned before publishing.",
  supportPolicy: "A support policy must be set before publishing.",
  compatibility: "At least one compatibility entry must be recorded before publishing.",
  release:
    "At least one release with an attached, scanned-clean file must exist before publishing.",
};

/**
 * Publishes a Product: DRAFT -> PUBLISHED only (MVP-012, FR-009). A
 * dedicated sub-route, not a PATCH-with-action-field, mirroring
 * api/admin/content/[id]/publish/route.ts exactly. Two independent gates,
 * checked in order:
 *   1. The pure status transition (isValidProductStatusTransition) -- an
 *      already-PUBLISHED product is rejected with INVALID_STATE, same as
 *      Article.
 *   2. The mandatory-field readiness gate (checkProductPublishReadiness) --
 *      a DRAFT product missing a license/support policy/compatibility
 *      entry/clean-file release is rejected with PUBLISH_NOT_READY and the
 *      full list of what's missing, not just the first failure.
 */
export const POST = withObservability(
  "POST /api/admin/products/[id]/publish",
  async (_request: Request, { params }: { params: Promise<{ id: string }> }) => {
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

    if (!isValidProductStatusTransition(product.status, "PUBLISHED")) {
      return NextResponse.json(
        createErrorEnvelope(
          "INVALID_STATE",
          `Cannot publish a product in status ${product.status}.`,
          correlationId,
        ),
        { status: 409 },
      );
    }

    const snapshot = await catalogRepository.getProductPublishSnapshot(id);
    const readiness = checkProductPublishReadiness(snapshot);
    if (!readiness.ready) {
      const fieldErrors: Record<string, string[]> = {};
      for (const field of readiness.missingFields) {
        fieldErrors[field] = [MISSING_FIELD_MESSAGES[field]];
      }
      return NextResponse.json(
        createErrorEnvelope(
          "PUBLISH_NOT_READY",
          "This product is missing mandatory fields and cannot be published yet.",
          correlationId,
          { fieldErrors },
        ),
        { status: 409 },
      );
    }

    const published = await catalogRepository.publishProduct(id);

    logger.info("product.published", { productId: published.id, actorUserId: admin.userId });

    return NextResponse.json({ product: published }, { status: 200 });
  },
);
