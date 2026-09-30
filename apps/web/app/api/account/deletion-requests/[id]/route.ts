import { PrismaPrivacyRepository } from "@ppu/adapter-privacy";
import { prisma } from "@ppu/db";
import { currentDeletionRequestState, isValidDeletionRequestTransition } from "@ppu/domain-privacy";
import { createErrorEnvelope } from "@ppu/shared";
import { getCorrelationId, logger } from "@ppu/telemetry";
import { getServerSession } from "next-auth/next";
import { NextResponse } from "next/server";
import { authOptions } from "../../../../../lib/auth";
import { withObservability } from "../../../../../lib/observability";

/**
 * Withdraws the signed-in user's own deletion request (MVP-020, FR-004).
 * Ownership and not-found get distinct responses (404 vs 403), matching the
 * established pattern for a self-service, owned resource
 * (apps/web/app/api/me/sessions/[id]/route.ts) — unlike the admin surface,
 * this is not a secrecy-sensitive check, since a signed-in user already
 * knows whether they submitted a request.
 */
export const DELETE = withObservability(
  "DELETE /api/account/deletion-requests/[id]",
  async (_request: Request, { params }: { params: Promise<{ id: string }> }) => {
    const correlationId = getCorrelationId() ?? "unknown";
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        createErrorEnvelope("UNAUTHENTICATED", "Sign-in required.", correlationId),
        { status: 401 },
      );
    }

    const { id } = await params;
    const repository = new PrismaPrivacyRepository(prisma);
    const target = await repository.getDeletionRequestById(id);

    if (!target) {
      return NextResponse.json(
        createErrorEnvelope("NOT_FOUND", "Deletion request not found.", correlationId),
        { status: 404 },
      );
    }
    if (target.userId !== session.user.id) {
      return NextResponse.json(
        createErrorEnvelope("FORBIDDEN", "You do not have access to this request.", correlationId),
        { status: 403 },
      );
    }

    const currentState = currentDeletionRequestState(target);
    if (!isValidDeletionRequestTransition(currentState, "WITHDRAWN")) {
      return NextResponse.json(
        createErrorEnvelope(
          "INVALID_STATE",
          "This request can no longer be withdrawn.",
          correlationId,
        ),
        { status: 409 },
      );
    }

    await repository.appendDeletionRequestEvent(target.id, "WITHDRAWN", session.user.id, null);

    logger.info("deletion_request.state_changed", {
      deletionRequestId: target.id,
      toState: "WITHDRAWN",
      actorUserId: session.user.id,
    });

    return new NextResponse(null, { status: 204 });
  },
);
