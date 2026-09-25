import { prisma } from "@ppu/db";
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

interface AttachFileInputBody {
  fileScanId?: unknown;
}

/**
 * Attaches an already-uploaded, already-scanned file to a release by
 * reference (MVP-012, FR-009; composes with MVP-006's existing upload/scan
 * flow -- POST /api/files/uploads, then POST /api/files/uploads/complete,
 * then the async scan pipeline marks it CLEAN or REJECTED -- rather than
 * assuming a new upload path). The admin supplies a `fileScanId` obtained
 * from that flow; this route never accepts a client-supplied "this file is
 * clean" claim. PrismaCatalogRepository.attachReleaseFile re-verifies
 * FileScan.status === "CLEAN" server-side and throws otherwise, which this
 * route turns into a 400 naming the reason.
 */
export const POST = withObservability(
  "POST /api/admin/products/[id]/releases/[releaseId]/files",
  async (request: Request, { params }: { params: Promise<{ id: string; releaseId: string }> }) => {
    const correlationId = getCorrelationId() ?? "unknown";
    const admin = await requireAdmin();
    if (!admin) return deny(correlationId);

    const { id, releaseId } = await params;
    const product = await catalogRepository.findProductByIdForAdmin(id);
    if (!product) {
      return NextResponse.json(
        createErrorEnvelope("NOT_FOUND", "Product not found.", correlationId),
        { status: 404 },
      );
    }

    let body: AttachFileInputBody;
    try {
      body = (await request.json()) as AttachFileInputBody;
    } catch {
      return NextResponse.json(
        createErrorEnvelope("VALIDATION", "Invalid request body.", correlationId),
        { status: 400 },
      );
    }

    if (typeof body.fileScanId !== "string" || body.fileScanId.length === 0) {
      return NextResponse.json(
        createErrorEnvelope("VALIDATION", "One or more fields are invalid.", correlationId, {
          fieldErrors: { fileScanId: ["fileScanId is required."] },
        }),
        { status: 400 },
      );
    }

    try {
      await catalogRepository.attachReleaseFile(releaseId, body.fileScanId);
    } catch (error) {
      // attachReleaseFile throws for: unknown release, unknown file scan, or
      // a file scan that is not CLEAN -- never trust the client's own claim
      // about scan status. Its message names only the id and status enum
      // value, never a storage path, scan-engine output, or file contents
      // (NFR-006).
      const message = error instanceof Error ? error.message : "Unable to attach this file.";
      return NextResponse.json(
        createErrorEnvelope("VALIDATION", "One or more fields are invalid.", correlationId, {
          fieldErrors: { fileScanId: [message] },
        }),
        { status: 400 },
      );
    }

    logger.info("product.release_file_attached", {
      productId: id,
      releaseId,
      actorUserId: admin.userId,
    });

    const releases = await catalogRepository.listReleasesForAdmin(id);
    const release = releases.find((entry) => entry.id === releaseId) ?? null;

    return NextResponse.json({ release }, { status: 200 });
  },
);
