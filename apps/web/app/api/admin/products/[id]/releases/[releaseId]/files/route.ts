import { prisma } from "@ppu/db";
import {
  FileScanNotCleanError,
  FileScanNotFoundError,
  ReleaseAlreadyPublishedError,
  ReleaseNotFoundError,
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

interface FileInputBody {
  fileScanId?: unknown;
}

/** Maps attachReleaseFile/detachReleaseFile's typed errors to an HTTP
 * response. Never trusts the client's own claim about scan status or
 * release ownership -- every case here reflects a fresh, server-side
 * re-check. Messages name only an id and a status enum value, never a
 * storage path, scan-engine output, or file contents (NFR-006). */
function respondToReleaseFileError(error: unknown, correlationId: string): NextResponse {
  if (error instanceof ReleaseNotFoundError) {
    return NextResponse.json(
      createErrorEnvelope("NOT_FOUND", "Release not found for this product.", correlationId),
      { status: 404 },
    );
  }
  if (error instanceof ReleaseAlreadyPublishedError) {
    return NextResponse.json(
      createErrorEnvelope(
        "INVALID_STATE",
        "This release is already published; its files are immutable.",
        correlationId,
      ),
      { status: 409 },
    );
  }
  if (error instanceof FileScanNotFoundError) {
    return NextResponse.json(
      createErrorEnvelope("VALIDATION", "One or more fields are invalid.", correlationId, {
        fieldErrors: { fileScanId: [error.message] },
      }),
      { status: 400 },
    );
  }
  if (error instanceof FileScanNotCleanError) {
    return NextResponse.json(
      createErrorEnvelope("VALIDATION", "One or more fields are invalid.", correlationId, {
        fieldErrors: { fileScanId: [error.message] },
      }),
      { status: 400 },
    );
  }
  throw error;
}

/**
 * Attaches an already-uploaded, already-scanned file to a *draft* release by
 * reference (MVP-012, FR-009; composes with MVP-006's existing upload/scan
 * flow -- POST /api/files/uploads, then POST /api/files/uploads/complete,
 * then the async scan pipeline marks it CLEAN or REJECTED -- rather than
 * assuming a new upload path). The admin supplies a `fileScanId` obtained
 * from that flow; this route never accepts a client-supplied "this file is
 * clean" claim. PrismaCatalogRepository.attachReleaseFile re-verifies, fresh
 * from the database, that the release belongs to this product, is not
 * already published (A3 -- a published release's files are immutable), and
 * that the file is CLEAN.
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

    let body: FileInputBody;
    try {
      body = (await request.json()) as FileInputBody;
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
      await catalogRepository.attachReleaseFile(id, releaseId, body.fileScanId);
    } catch (error) {
      return respondToReleaseFileError(error, correlationId);
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

/**
 * Detaches (removes) one file attachment from a *draft* release, correcting
 * an accidental attachment (MVP-012, FR-009; direct product-owner decision,
 * "PR #23 blocker corrections" A3). Deletes only the ReleaseFile join row --
 * never the underlying FileScan or its stored file -- and rejects a
 * published release the same way attach does.
 */
export const DELETE = withObservability(
  "DELETE /api/admin/products/[id]/releases/[releaseId]/files",
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

    let body: FileInputBody;
    try {
      body = (await request.json()) as FileInputBody;
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
      await catalogRepository.detachReleaseFile(id, releaseId, body.fileScanId);
    } catch (error) {
      return respondToReleaseFileError(error, correlationId);
    }

    logger.info("product.release_file_detached", {
      productId: id,
      releaseId,
      actorUserId: admin.userId,
    });

    const releases = await catalogRepository.listReleasesForAdmin(id);
    const release = releases.find((entry) => entry.id === releaseId) ?? null;

    return NextResponse.json({ release }, { status: 200 });
  },
);
