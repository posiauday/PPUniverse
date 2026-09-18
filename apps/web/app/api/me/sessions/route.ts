import { randomUUID } from "node:crypto";
import { PrismaSessionRepository } from "@ppu/adapter-identity";
import { prisma } from "@ppu/db";
import { toSessionListView } from "@ppu/domain-identity";
import { createErrorEnvelope } from "@ppu/shared";
import { getServerSession } from "next-auth/next";
import { NextResponse } from "next/server";
import { authOptions } from "../../../../lib/auth";
import { getCurrentSessionId } from "../../../../lib/current-session";

export async function GET() {
  const correlationId = randomUUID();
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
}
