import { createErrorEnvelope } from "@ppu/shared";
import { NextResponse } from "next/server";
import type { FieldErrors } from "./learn-input";

/** Shared responses for the admin Learn routes (MVP-048 slice 1b). */

/** The request's JSON object, or null if it isn't one. */
export async function readJsonObject(request: Request): Promise<Record<string, unknown> | null> {
  try {
    const body: unknown = await request.json();
    return body && typeof body === "object" && !Array.isArray(body)
      ? (body as Record<string, unknown>)
      : null;
  } catch {
    return null;
  }
}

export function badBody(correlationId: string): NextResponse {
  return NextResponse.json(
    createErrorEnvelope("VALIDATION", "Invalid request body.", correlationId),
    { status: 400 },
  );
}

export function invalidFields(
  correlationId: string,
  fieldErrors: FieldErrors,
  message = "One or more fields are invalid.",
  status = 400,
): NextResponse {
  return NextResponse.json(
    createErrorEnvelope("VALIDATION", message, correlationId, { fieldErrors }),
    { status },
  );
}

export function notFoundEnvelope(correlationId: string, what: "Topic" | "Lesson"): NextResponse {
  return NextResponse.json(createErrorEnvelope("NOT_FOUND", `${what} not found.`, correlationId), {
    status: 404,
  });
}

export function invalidState(correlationId: string, message: string): NextResponse {
  return NextResponse.json(createErrorEnvelope("INVALID_STATE", message, correlationId), {
    status: 409,
  });
}
