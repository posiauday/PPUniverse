import { PrismaPrivacyRepository } from "@ppu/adapter-privacy";
import { prisma } from "@ppu/db";
import { createErrorEnvelope } from "@ppu/shared";
import { getCorrelationId, logger } from "@ppu/telemetry";
import { NextResponse } from "next/server";
import { verifyUnsubscribeLinkToken } from "../../../lib/unsubscribe";
import { withObservability } from "../../../lib/observability";

/**
 * Performs the actual unsubscribe write (MVP-018, FR-013; docs/final-
 * decisions.md, "MVP-018 open question 49"). Deliberately not session-
 * gated: authorization is possession of a valid token. Idempotent — a
 * repeat call with the same still-valid token inserts another `granted:
 * false` row (ConsentRecord is append-only, MVP-020); this is not an
 * error.
 */
export const POST = withObservability("POST /api/unsubscribe", async (request: Request) => {
  const correlationId = getCorrelationId() ?? "unknown";

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      createErrorEnvelope("VALIDATION", "Invalid request body.", correlationId),
      { status: 400 },
    );
  }

  const token = (body as { token?: unknown } | null)?.token;
  if (typeof token !== "string") {
    return NextResponse.json(
      createErrorEnvelope("VALIDATION", "A token is required.", correlationId),
      { status: 400 },
    );
  }

  const verified = verifyUnsubscribeLinkToken(token);
  if (!verified) {
    // Generic, identical for every failure mode — never discloses which
    // one occurred (bad signature, expired, malformed, wrong category).
    return NextResponse.json(
      createErrorEnvelope("INVALID_TOKEN", "This link is no longer valid.", correlationId),
      { status: 400 },
    );
  }

  const repository = new PrismaPrivacyRepository(prisma);
  await repository.recordConsent({
    userId: verified.userId,
    category: verified.category,
    granted: false,
    policyVersionId: null,
  });

  logger.info("consent.recorded", {
    userId: verified.userId,
    category: verified.category,
    granted: false,
    source: "unsubscribe_link",
  });

  return new NextResponse(null, { status: 204 });
});
