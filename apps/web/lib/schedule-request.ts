import {
  SCHEDULE_PROBLEM_MESSAGE,
  parseScheduleTime,
  scheduleTimeProblem,
} from "@ppu/domain-content";
import { createErrorEnvelope } from "@ppu/shared";
import { NextResponse } from "next/server";
import { isSameOrigin, readJson } from "./request-guards";

/**
 * Shared by the admin schedule routes for guides and updates (MVP-050).
 * Reads `{ "publishAt": "<ISO date-time with offset>" }` from a same-origin
 * request and checks the time is from a minute to a year ahead, or returns
 * the response to send instead (403 for another site, 400 for anything else).
 */
export async function readScheduleTime(
  request: Request,
  correlationId: string,
  now: Date = new Date(),
): Promise<{ at: Date } | { response: NextResponse }> {
  const read = await readJson(request);
  if ("response" in read) return read;
  const at = parseScheduleTime(read.body["publishAt"]);
  const problem = at ? scheduleTimeProblem(at, now) : "invalid";
  if (problem || !at) {
    const message = SCHEDULE_PROBLEM_MESSAGE[problem ?? "invalid"];
    return {
      response: NextResponse.json(
        createErrorEnvelope("VALIDATION", message, correlationId, {
          fieldErrors: { publishAt: [message] },
        }),
        { status: 400 },
      ),
    };
  }
  return { at };
}

/** Cancelling has no body, so only the origin is checked (403 for another site). */
export function crossSiteResponse(request: Request): NextResponse | null {
  return isSameOrigin(request) ? null : NextResponse.json({ error: "forbidden" }, { status: 403 });
}

export function conflict(message: string, correlationId: string): NextResponse {
  return NextResponse.json(createErrorEnvelope("INVALID_STATE", message, correlationId), {
    status: 409,
  });
}
