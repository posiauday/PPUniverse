import { createErrorEnvelope } from "@ppu/shared";
import { NextResponse } from "next/server";

/** Shared responses for the admin component library routes (MVP-049). */
export function componentNotFound(correlationId: string): NextResponse {
  return NextResponse.json(
    createErrorEnvelope("NOT_FOUND", "Component not found.", correlationId),
    {
      status: 404,
    },
  );
}
