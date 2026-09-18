import { randomUUID } from "node:crypto";
import { createErrorEnvelope } from "@ppu/shared";
import { getServerSession } from "next-auth/next";
import { NextResponse } from "next/server";
import { authOptions } from "../../../lib/auth";

export async function GET() {
  const correlationId = randomUUID();
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json(
      createErrorEnvelope("UNAUTHENTICATED", "Sign-in required.", correlationId),
      { status: 401 },
    );
  }
  return NextResponse.json({
    user: {
      id: session.user.id,
      email: session.user.email ?? null,
      name: session.user.name ?? null,
    },
  });
}
