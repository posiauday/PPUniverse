import { PrismaPrivacyRepository } from "@ppu/adapter-privacy";
import { prisma } from "@ppu/db";
import { currentDeletionRequestState, isActiveDeletionRequestState } from "@ppu/domain-privacy";
import { createErrorEnvelope } from "@ppu/shared";
import { getCorrelationId, logger } from "@ppu/telemetry";
import { getServerSession } from "next-auth/next";
import { NextResponse } from "next/server";
import { authOptions } from "../../../../lib/auth";
import { notificationService } from "../../../../lib/email";
import { withObservability } from "../../../../lib/observability";
import { EMAILS, renderEmail } from "../../../../lib/email-templates";
import { CONTACT_EMAIL } from "../../../../lib/legal/pages";
import { isSameOrigin } from "../../../../lib/request-guards";
import { siteOrigin } from "../../../../lib/site-url";

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
  async (request: Request) => {
    const correlationId = getCorrelationId() ?? "unknown";
    // Only this site's own pages may call it (site review, 2026-10-10), like every other
    // write route; the SameSite=Lax session cookie was the only cross-site defence.
    if (!isSameOrigin(request))
      return NextResponse.json(
        createErrorEnvelope("FORBIDDEN", "Not allowed from another site.", correlationId),
        { status: 403 },
      );
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

    // Sent after the request is durably committed above, never inside that
    // transaction. A send failure must not fail, roll back or change the
    // request's state — the record is authoritative, the email is a
    // courtesy (docs/final-decisions.md, "MVP-018 open question 49",
    // constraint 3) — so it is deliberately swallowed here; the failure is
    // already recorded via EmailSend and telemetry inside sendTransactional.
    // Placeholder copy: states only that the request was received and will
    // be reviewed, pending product-owner review — no claim of deletion, a
    // timeframe, a legal right, or regulatory compliance. The verified
    // account address is read fresh from the database, never taken from
    // the session token or any client-supplied value.
    try {
      const recipient = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { email: true },
      });
      if (recipient) {
        await notificationService.sendTransactional("DELETION_REQUEST_SUBMITTED", session.user.id, {
          to: recipient.email,
          // MVP-044: the branded receipt; this wording replaces the old placeholder.
          ...renderEmail(
            EMAILS.deletionRequestReceived(`${siteOrigin() ?? ""}/account/privacy`, CONTACT_EMAIL),
            siteOrigin(),
          ),
        });
      }
    } catch {
      // No retry (question 7's single-attempt model); no state change.
    }

    return NextResponse.json(
      { id: deletionRequest.id, state: currentDeletionRequestState(deletionRequest) },
      { status: 201 },
    );
  },
);
