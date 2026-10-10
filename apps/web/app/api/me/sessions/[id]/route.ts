import { PrismaSessionRepository } from "@ppu/adapter-identity";
import { prisma } from "@ppu/db";
import { decideRevokeSession } from "@ppu/domain-identity";
import { createErrorEnvelope } from "@ppu/shared";
import { getCorrelationId } from "@ppu/telemetry";
import { getServerSession } from "next-auth/next";
import { NextResponse } from "next/server";
import { authOptions } from "../../../../../lib/auth";
import { getCurrentSessionId } from "../../../../../lib/current-session";
import { withObservability } from "../../../../../lib/observability";
import { isSameOrigin } from "../../../../../lib/request-guards";

export const DELETE = withObservability(
  "DELETE /api/me/sessions/[id]",
  async (request: Request, { params }: { params: Promise<{ id: string }> }) => {
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

    const { id } = await params;
    const repository = new PrismaSessionRepository(prisma);
    const target = await repository.findById(id);
    const currentSessionId = await getCurrentSessionId();

    const decision = decideRevokeSession(target, {
      requestingUserId: session.user.id,
      currentSessionId: currentSessionId ?? "",
    });

    if (!decision.allowed) {
      const status =
        decision.reason === "NOT_FOUND"
          ? 404
          : decision.reason === "IS_CURRENT_SESSION"
            ? 400
            : 403;
      const message =
        decision.reason === "NOT_FOUND"
          ? "Session not found."
          : decision.reason === "IS_CURRENT_SESSION"
            ? "Cannot revoke the current session; sign out instead."
            : "You do not have access to this session.";
      return NextResponse.json(createErrorEnvelope(decision.reason, message, correlationId), {
        status,
      });
    }

    await repository.deleteById(id);
    return new NextResponse(null, { status: 204 });
  },
);
