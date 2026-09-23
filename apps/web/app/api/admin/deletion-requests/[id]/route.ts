import { PrismaPrivacyRepository } from "@ppu/adapter-privacy";
import { prisma } from "@ppu/db";
import {
  currentDeletionRequestState,
  isAdminTransition,
  isReasonRequired,
  isValidDeletionRequestTransition,
  type DeletionRequestState,
} from "@ppu/domain-privacy";
import { createErrorEnvelope } from "@ppu/shared";
import { getCorrelationId, logger } from "@ppu/telemetry";
import { getServerSession } from "next-auth/next";
import { NextResponse } from "next/server";
import { authOptions } from "../../../../../lib/auth";
import { withObservability } from "../../../../../lib/observability";

const ADMIN_TRANSITION_STATES: readonly DeletionRequestState[] = [
  "UNDER_REVIEW",
  "APPROVED",
  "DENIED",
  "COMPLETED",
];

/**
 * Moves a deletion request to an admin-controlled state (MVP-020, FR-004;
 * docs/final-decisions.md, "MVP-020 open questions 46, 47 and 48", question
 * 48). ADMIN is never read from the session (auth.ts / MVP-002's session
 * callback is unmodified by this story) — it is re-queried from the
 * database on every request, the same "never trust a stale/client-supplied
 * claim, always re-derive server-side" principle MVP-010 already
 * established for product eligibility.
 *
 * Deliberately returns the *identical* 404 response for no session and for
 * an authenticated non-admin (decision 48, constraint 4: "A MEMBER receives
 * the same response as an unauthenticated request, with no information
 * disclosed about the existence of the surface") — not 401 or 403, which
 * would themselves confirm this endpoint exists and is access-controlled.
 */
export const POST = withObservability(
  "POST /api/admin/deletion-requests/[id]",
  async (request: Request, { params }: { params: Promise<{ id: string }> }) => {
    const correlationId = getCorrelationId() ?? "unknown";
    const deny = () =>
      NextResponse.json(createErrorEnvelope("NOT_FOUND", "Not found.", correlationId), {
        status: 404,
      });

    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return deny();
    }

    const actor = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    });
    if (actor?.role !== "ADMIN") {
      return deny();
    }

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        createErrorEnvelope("VALIDATION", "Invalid request body.", correlationId),
        { status: 400 },
      );
    }

    const toState = (body as { toState?: unknown } | null)?.toState;
    const reason = (body as { reason?: unknown } | null)?.reason;
    if (
      typeof toState !== "string" ||
      !ADMIN_TRANSITION_STATES.includes(toState as DeletionRequestState) ||
      !isAdminTransition(toState as DeletionRequestState)
    ) {
      return NextResponse.json(
        createErrorEnvelope("VALIDATION", "A valid target state is required.", correlationId),
        { status: 400 },
      );
    }
    if (isReasonRequired(toState as DeletionRequestState)) {
      if (typeof reason !== "string" || reason.trim().length === 0) {
        return NextResponse.json(
          createErrorEnvelope(
            "VALIDATION",
            "A reason is required to deny a request.",
            correlationId,
          ),
          { status: 400 },
        );
      }
    } else if (reason !== undefined && typeof reason !== "string") {
      return NextResponse.json(
        createErrorEnvelope("VALIDATION", "reason must be a string when provided.", correlationId),
        { status: 400 },
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

    const currentState = currentDeletionRequestState(target);
    if (!isValidDeletionRequestTransition(currentState, toState as DeletionRequestState)) {
      return NextResponse.json(
        createErrorEnvelope(
          "INVALID_STATE",
          `Cannot move a request from ${currentState} to ${toState}.`,
          correlationId,
        ),
        { status: 409 },
      );
    }

    await repository.appendDeletionRequestEvent(
      target.id,
      toState as DeletionRequestState,
      session.user.id,
      typeof reason === "string" ? reason : null,
    );

    logger.info("deletion_request.state_changed", {
      deletionRequestId: target.id,
      toState,
      actorUserId: session.user.id,
    });

    return NextResponse.json({ id: target.id, state: toState }, { status: 200 });
  },
);
