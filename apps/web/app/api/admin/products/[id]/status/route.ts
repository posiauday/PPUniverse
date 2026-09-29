import { prisma } from "@ppu/db";
import {
  ProductNotFoundError,
  ProductStatusChangeReasonRequiredError,
  ProductStatusTransitionNotAllowedError,
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

const VALID_TO_STATUSES = ["PUBLISHED", "SUSPENDED", "ARCHIVED"] as const;
type ValidToStatus = (typeof VALID_TO_STATUSES)[number];

function isValidToStatus(value: unknown): value is ValidToStatus {
  return typeof value === "string" && (VALID_TO_STATUSES as readonly string[]).includes(value);
}

interface StatusChangeInputBody {
  toStatus?: unknown;
  reason?: unknown;
}

/**
 * Suspend, archive, or reinstate a Product (MVP-019, FR-015/NFR-009; direct
 * product-owner decision, "MVP-019 operations console and audit"). One
 * route for all three actions, not three near-identical ones -- they share
 * the exact same validation shape (a transition graph check plus a
 * mandatory reason), and CatalogRepository.changeProductStatus is the one
 * authoritative gate regardless of which direction the transition runs.
 * `PUBLISHED` is a valid `toStatus` here only when reinstating from
 * `SUSPENDED` -- the initial DRAFT -> PUBLISHED publish stays exclusively
 * .../[id]/publish's concern (enforced by
 * CatalogRepository.changeProductStatus itself, not by this route).
 */
export const POST = withObservability(
  "POST /api/admin/products/[id]/status",
  async (request: Request, { params }: { params: Promise<{ id: string }> }) => {
    const correlationId = getCorrelationId() ?? "unknown";
    const admin = await requireAdmin();
    if (!admin) return deny(correlationId);

    const { id } = await params;

    let body: StatusChangeInputBody;
    try {
      body = (await request.json()) as StatusChangeInputBody;
    } catch {
      return NextResponse.json(
        createErrorEnvelope("VALIDATION", "Invalid request body.", correlationId),
        { status: 400 },
      );
    }

    const fieldErrors: Record<string, string[]> = {};
    if (!isValidToStatus(body.toStatus)) {
      fieldErrors.toStatus = ["toStatus must be one of PUBLISHED, SUSPENDED, ARCHIVED."];
    }
    if (typeof body.reason !== "string" || body.reason.trim().length === 0) {
      fieldErrors.reason = ["A reason is required."];
    }
    if (Object.keys(fieldErrors).length > 0) {
      return NextResponse.json(
        createErrorEnvelope("VALIDATION", "One or more fields are invalid.", correlationId, {
          fieldErrors,
        }),
        { status: 400 },
      );
    }

    const toStatus = body.toStatus as ValidToStatus;
    const reason = body.reason as string;

    try {
      const result = await catalogRepository.changeProductStatus(
        id,
        toStatus,
        admin.userId,
        reason,
      );

      logger.info("product.status_changed", {
        productId: result.product.id,
        fromStatus: result.statusEvent.fromStatus,
        toStatus: result.statusEvent.toStatus,
        actorUserId: admin.userId,
      });

      return NextResponse.json({ product: result.product }, { status: 200 });
    } catch (error) {
      if (error instanceof ProductNotFoundError) {
        return NextResponse.json(
          createErrorEnvelope("NOT_FOUND", "Product not found.", correlationId),
          { status: 404 },
        );
      }
      if (error instanceof ProductStatusTransitionNotAllowedError) {
        return NextResponse.json(
          createErrorEnvelope(
            "INVALID_STATE",
            `Cannot change this product from ${error.fromStatus} to ${error.toStatus}.`,
            correlationId,
          ),
          { status: 409 },
        );
      }
      if (error instanceof ProductStatusChangeReasonRequiredError) {
        return NextResponse.json(
          createErrorEnvelope("VALIDATION", "A reason is required.", correlationId, {
            fieldErrors: { reason: ["A reason is required."] },
          }),
          { status: 400 },
        );
      }
      throw error;
    }
  },
);
