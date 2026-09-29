import { prisma } from "@ppu/db";
import { parsePriceInputToCents, PricedProductNotFoundError } from "@ppu/domain-commerce";
import { createErrorEnvelope } from "@ppu/shared";
import { getCorrelationId, logger } from "@ppu/telemetry";
import { getServerSession } from "next-auth/next";
import { NextResponse } from "next/server";
import { authOptions } from "../../../../../../lib/auth";
import { commerceRepository } from "../../../../../../lib/commerce";
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

/** USD only at launch (docs/final-decisions.md, 2026-09-28). */
const CURRENCY = "USD";

/**
 * Sets a product's single price (MVP-007 slice 2; docs/final-decisions.md,
 * "Business model: free learning first; one price per product; work
 * order"). The body carries the amount exactly as the admin typed it (e.g.
 * "49.00") and it is parsed here, on the server, so the one parser that
 * decides what a price is can never be bypassed by a client.
 */
export const PUT = withObservability(
  "PUT /api/admin/products/[id]/price",
  async (request: Request, { params }: { params: Promise<{ id: string }> }) => {
    const correlationId = getCorrelationId() ?? "unknown";
    const admin = await requireAdmin();
    if (!admin) return deny(correlationId);
    const { id } = await params;

    let body: { price?: unknown };
    try {
      body = (await request.json()) as { price?: unknown };
    } catch {
      return NextResponse.json(
        createErrorEnvelope("VALIDATION", "Invalid request body.", correlationId),
        { status: 400 },
      );
    }
    const amountCents = typeof body.price === "string" ? parsePriceInputToCents(body.price) : null;
    if (amountCents === null) {
      return NextResponse.json(
        createErrorEnvelope("VALIDATION", "One or more fields are invalid.", correlationId, {
          fieldErrors: {
            price: ["Enter a price greater than zero, like 49 or 49.99 (US dollars)."],
          },
        }),
        { status: 400 },
      );
    }

    try {
      const price = await commerceRepository.setProductPrice(id, amountCents, CURRENCY);
      logger.info("product.price_set", {
        productId: id,
        amountCents: price.amountCents,
        currency: price.currency,
        actorUserId: admin.userId,
      });
      return NextResponse.json({ price }, { status: 200 });
    } catch (error) {
      if (error instanceof PricedProductNotFoundError) {
        return NextResponse.json(
          createErrorEnvelope("NOT_FOUND", "Product not found.", correlationId),
          { status: 404 },
        );
      }
      throw error;
    }
  },
);

/** Makes the product free again. Idempotent: clearing an unpriced product
 * succeeds. */
export const DELETE = withObservability(
  "DELETE /api/admin/products/[id]/price",
  async (_request: Request, { params }: { params: Promise<{ id: string }> }) => {
    const correlationId = getCorrelationId() ?? "unknown";
    const admin = await requireAdmin();
    if (!admin) return deny(correlationId);
    const { id } = await params;
    await commerceRepository.clearProductPrice(id);
    logger.info("product.price_cleared", { productId: id, actorUserId: admin.userId });
    return new NextResponse(null, { status: 204 });
  },
);
