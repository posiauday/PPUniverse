import { PrismaPrivacyRepository } from "@ppu/adapter-privacy";
import { prisma } from "@ppu/db";
import { currentDeletionRequestState, isActiveDeletionRequestState } from "@ppu/domain-privacy";
import { createErrorEnvelope } from "@ppu/shared";
import { getCorrelationId, logger } from "@ppu/telemetry";
import { getServerSession } from "next-auth/next";
import { NextResponse } from "next/server";
import { authOptions } from "../../../../lib/auth";
import { withObservability } from "../../../../lib/observability";

/**
 * Submits a deletion request for the signed-in user (MVP-020, FR-004).
 * Self-only: userId is taken from the session, never from the request body.
 *
 * Records the request only — no erasure, anonymisation or pseudonymisation
 * happens here or anywhere in this story (docs/final-decisions.md, "MVP-020
 * open questions 46, 47 and 48").
 */
export const POST = withObservability(
  "POST /api/account/deletion-requests",
  async (_request: Request) => {
    const correlationId = getCorrelationId() ?? "unknown";
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        createErrorEnvelope("UNAUTHENTICATED", "Sign-in required.", correlationId),
        { status: 401 },
      );
    }

    const repository = new PrismaPrivacyRepository(prisma);

    // Re-read fresh on every request — never trust client state about
    // whether a request is already pending (same principle as MVP-010's
    // entitlement route never trusting a client-supplied product state).
    const existing = await repository.getLatestDeletionRequestForUser(session.user.id);
    if (existing && isActiveDeletionRequestState(currentDeletionRequestState(existing))) {
      return NextResponse.json(
        createErrorEnvelope(
          "ALREADY_REQUESTED",
          "A deletion request is already pending for this account.",
          correlationId,
        ),
        { status: 409 },
      );
    }

    const deletionRequest = await repository.createDeletionRequest(session.user.id);

    logger.info("deletion_request.submitted", {
      userId: session.user.id,
      deletionRequestId: deletionRequest.id,
    });

    return NextResponse.json(
      { id: deletionRequest.id, state: currentDeletionRequestState(deletionRequest) },
      { status: 201 },
    );
  },
);
