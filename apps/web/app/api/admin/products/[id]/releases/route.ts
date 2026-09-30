import { Prisma, prisma } from "@ppu/db";
import { isValidReleaseVersion } from "@ppu/domain-catalog";
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

function isDuplicateVersionError(error: unknown): boolean {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2002" &&
    Array.isArray((error.meta as { target?: unknown } | undefined)?.target) &&
    ((error.meta as { target?: unknown[] }).target ?? []).includes("version")
  );
}

interface ReleaseInputBody {
  version?: unknown;
}

/**
 * Creates a Release (version) for a product (MVP-012, FR-009, FR-011).
 * File attachment is a separate, dedicated sub-route
 * ([id]/releases/[releaseId]/files) so a release can exist with zero files
 * (a real intermediate authoring state) and a file can be attached to any
 * of the product's releases by reference, not only the one just created.
 * Release immutability enforcement (a published release's files can never
 * change) is MVP-014's scope, not this route's.
 */
export const POST = withObservability(
  "POST /api/admin/products/[id]/releases",
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

    let body: ReleaseInputBody;
    try {
      body = (await request.json()) as ReleaseInputBody;
    } catch {
      return NextResponse.json(
        createErrorEnvelope("VALIDATION", "Invalid request body.", correlationId),
        { status: 400 },
      );
    }

    if (typeof body.version !== "string" || !isValidReleaseVersion(body.version)) {
      return NextResponse.json(
        createErrorEnvelope("VALIDATION", "One or more fields are invalid.", correlationId, {
          fieldErrors: { version: ["version is required and must be 50 characters or fewer."] },
        }),
        { status: 400 },
      );
    }

    try {
      const release = await catalogRepository.createRelease(id, body.version);

      logger.info("product.release_created", {
        productId: id,
        releaseId: release.id,
        actorUserId: admin.userId,
      });

      return NextResponse.json({ release }, { status: 201 });
    } catch (error) {
      if (isDuplicateVersionError(error)) {
        return NextResponse.json(
          createErrorEnvelope(
            "VALIDATION",
            "A release with this version already exists for this product.",
            correlationId,
            { fieldErrors: { version: ["This version already exists for this product."] } },
          ),
          { status: 409 },
        );
      }
      throw error;
    }
  },
);
