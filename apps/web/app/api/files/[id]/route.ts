import { randomUUID } from "node:crypto";
import { PrismaFileScanRepository } from "@ppu/adapter-files";
import { prisma } from "@ppu/db";
import { createErrorEnvelope } from "@ppu/shared";
import { getServerSession } from "next-auth/next";
import { NextResponse } from "next/server";
import { authOptions } from "../../../../lib/auth";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const correlationId = randomUUID();
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json(
      createErrorEnvelope("UNAUTHENTICATED", "Sign-in required.", correlationId),
      { status: 401 },
    );
  }

  const { id } = await params;
  const repository = new PrismaFileScanRepository(prisma);
  const record = await repository.findById(id);

  if (!record || record.uploadedByUserId !== session.user.id) {
    // Same response for "not found" and "not yours" — do not reveal which.
    return NextResponse.json(createErrorEnvelope("NOT_FOUND", "File not found.", correlationId), {
      status: 404,
    });
  }

  return NextResponse.json({ fileScan: record });
}
