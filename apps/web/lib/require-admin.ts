import { prisma } from "@ppu/db";
import { createErrorEnvelope } from "@ppu/shared";
import { getServerSession } from "next-auth/next";
import { NextResponse } from "next/server";
import { authOptions } from "./auth";

/**
 * The signed-in admin, or null. The role is always re-queried from the
 * database, never read from the session -- the same rule every
 * /api/admin/* route applies inline (MVP-012). Shared here for the routes
 * outside /api/admin that are admin-only too (BUG-020: file uploads).
 */
export async function requireAdmin(): Promise<{ userId: string } | null> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return null;
  const actor = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true },
  });
  if (actor?.role !== "ADMIN") return null;
  return { userId: session.user.id };
}

/** Signed out and not an admin get the identical 404, so the route is not revealed. */
export function notFoundForNonAdmin(correlationId: string): NextResponse {
  return NextResponse.json(createErrorEnvelope("NOT_FOUND", "Not found.", correlationId), {
    status: 404,
  });
}
