import { prisma } from "@ppu/db";
import { SUPPORT_STATUS_LABELS, type SupportStatus } from "@ppu/domain-catalog";
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

const SUPPORT_STATUSES = Object.keys(SUPPORT_STATUS_LABELS) as SupportStatus[];

interface SupportInputBody {
  status?: unknown;
  channel?: unknown;
}

/**
 * Upserts the product's support policy (MVP-012, FR-009; docs/09-
 * marketplace-operations.md "Support model"). Mirrors the existing database
 * CHECK constraint (evidence.prisma's SupportPolicy) at the application
 * layer for a friendly 400 instead of a raw constraint-violation 500: a
 * channel is required unless the status is UNSUPPORTED.
 */
export const PUT = withObservability(
  "PUT /api/admin/products/[id]/support",
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

    let body: SupportInputBody;
    try {
      body = (await request.json()) as SupportInputBody;
    } catch {
      return NextResponse.json(
        createErrorEnvelope("VALIDATION", "Invalid request body.", correlationId),
        { status: 400 },
      );
    }

    const fieldErrors: Record<string, string[]> = {};
    if (
      typeof body.status !== "string" ||
      !SUPPORT_STATUSES.includes(body.status as SupportStatus)
    ) {
      fieldErrors["status"] = [`status must be one of ${SUPPORT_STATUSES.join(", ")}.`];
    }
    const channel = body.channel === undefined || body.channel === null ? null : body.channel;
    if (channel !== null && typeof channel !== "string") {
      fieldErrors["channel"] = ["channel must be a string or null."];
    } else if (
      body.status === "COMMUNITY_SUPPORTED" ||
      body.status === "CREATOR_SUPPORTED" ||
      body.status === "PLATFORM_SUPPORTED"
    ) {
      if (typeof channel !== "string" || channel.trim().length === 0) {
        fieldErrors["channel"] = ["channel is required unless status is UNSUPPORTED."];
      }
    }

    if (Object.keys(fieldErrors).length > 0) {
      return NextResponse.json(
        createErrorEnvelope("VALIDATION", "One or more fields are invalid.", correlationId, {
          fieldErrors,
        }),
        { status: 400 },
      );
    }

    const support = await catalogRepository.upsertSupportPolicy(id, {
      status: body.status as SupportStatus,
      channel: channel as string | null,
    });

    logger.info("product.support_updated", { productId: id, actorUserId: admin.userId });

    return NextResponse.json({ support }, { status: 200 });
  },
);
