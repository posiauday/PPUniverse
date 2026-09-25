import { prisma } from "@ppu/db";
import {
  ProductNotDraftError,
  ProductNotFoundError,
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

interface PublishInputBody {
  releaseId?: unknown;
}

function missingFieldErrors(fields: ProductPublishMissingField[]): Record<string, string[]> {
  const fieldErrors: Record<string, string[]> = {};
  for (const field of fields) {
    fieldErrors[field] = [MISSING_FIELD_MESSAGES[field]];
  }
  return fieldErrors;
}

/**
 * Initial product publication (MVP-012, FR-009; direct product-owner
 * decision, "PR #23 blocker corrections" A2/A4). A dedicated sub-route, not
 * a PATCH-with-action-field, mirroring
 * api/admin/content/[id]/publish/route.ts's shape. The caller explicitly
 * selects which draft release becomes the initial published release --
 * publishing is never implicit about which release it applies to.
 *
 * The one authoritative gate is CatalogRepository.publishProductWithRelease
 * itself: it re-reads and re-validates the Product and the selected Release
 * fresh, inside one transaction, and either both are published together or
 * neither is. This route does no separate pre-check that could drift from
 * that transaction's own logic -- it only maps each of the transaction's
 * typed errors to the right HTTP response.
 */
export const POST = withObservability(
  "POST /api/admin/products/[id]/publish",
  async (request: Request, { params }: { params: Promise<{ id: string }> }) => {
    const correlationId = getCorrelationId() ?? "unknown";
    const admin = await requireAdmin();
    if (!admin) return deny(correlationId);

    const { id } = await params;

    let body: PublishInputBody;
    try {
      body = (await request.json()) as PublishInputBody;
    } catch {
      return NextResponse.json(
        createErrorEnvelope("VALIDATION", "Invalid request body.", correlationId),
        { status: 400 },
      );
    }
    if (typeof body.releaseId !== "string" || body.releaseId.length === 0) {
      return NextResponse.json(
        createErrorEnvelope("VALIDATION", "One or more fields are invalid.", correlationId, {
          fieldErrors: { releaseId: ["releaseId is required -- select the release to publish."] },
        }),
        { status: 400 },
      );
    }

    try {
      const result = await catalogRepository.publishProductWithRelease(id, body.releaseId);

      logger.info("product.published", {
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
            "VALIDATION",
            "The selected release does not belong to this product.",
            correlationId,
            { fieldErrors: { releaseId: ["This release does not belong to this product."] } },
          ),
          { status: 404 },
        );
      }
      if (error instanceof ProductNotDraftError) {
        return NextResponse.json(
          createErrorEnvelope(
            "INVALID_STATE",
            `Cannot publish a product in status ${error.status}.`,
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
            "This product is missing mandatory fields and cannot be published yet.",
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
