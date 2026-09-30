import { PrismaSessionRepository } from "@ppu/adapter-identity";
import { prisma } from "@ppu/db";
import { toSessionListView } from "@ppu/domain-identity";
import { createErrorEnvelope } from "@ppu/shared";
import { getCorrelationId } from "@ppu/telemetry";
import { getServerSession } from "next-auth/next";
import { NextResponse } from "next/server";
import { authOptions } from "../../../../lib/auth";
import { getCurrentSessionId } from "../../../../lib/current-session";
import { withObservability } from "../../../../lib/observability";

export const GET = withObservability("GET /api/me/sessions", async (_request: Request) => {
  const correlationId = getCorrelationId() ?? "unknown";
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json(
      createErrorEnvelope("UNAUTHENTICATED", "Sign-in required.", correlationId),
      { status: 401 },
    );
  }

  const repository = new PrismaSessionRepository(prisma);
  const sessions = await repository.listByUser(session.user.id);
  const currentSessionId = await getCurrentSessionId();
  const view = toSessionListView(sessions, currentSessionId ?? "");

  return NextResponse.json({
    sessions: view.map((s) => ({
      id: s.id,
      expires: s.expires.toISOString(),
      createdAt: s.createdAt.toISOString(),
      isCurrent: s.isCurrent,
    })),
  });
});
