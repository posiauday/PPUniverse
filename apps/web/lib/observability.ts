import { createErrorEnvelope } from "@ppu/shared";
import { getCorrelationId, logger, runWithCorrelationId } from "@ppu/telemetry";
import { NextResponse } from "next/server";
import { errorMonitoring } from "./error-monitoring";

type RouteHandler<Args extends [Request, ...unknown[]]> = (...args: Args) => Promise<Response>;

/**
 * Wraps a Next.js route handler with: correlation-ID propagation (reused
 * from an inbound `x-correlation-id` header when present, so a request
 * traced by an upstream caller stays traceable end to end), structured
 * request-start/request-end logs with timing, and error-monitoring capture
 * for anything the handler itself doesn't catch. A handler's own expected
 * error responses (401/400/403/404, ...) are unaffected — this only adds
 * an outer safety net and observability, not new authorization logic.
 */
export function withObservability<Args extends [Request, ...unknown[]]>(
  routeName: string,
  handler: RouteHandler<Args>,
): RouteHandler<Args> {
  return async (...args: Args): Promise<Response> => {
    const [request] = args;
    const inboundCorrelationId = request.headers.get("x-correlation-id") ?? undefined;

    return runWithCorrelationId(async () => {
      const start = Date.now();
      logger.info("request.start", { route: routeName, method: request.method });

      try {
        const response = await handler(...args);
        logger.info("request.end", {
          route: routeName,
          method: request.method,
          status: response.status,
          durationMs: Date.now() - start,
        });
        return response;
      } catch (error) {
        const correlationId = getCorrelationId();
        errorMonitoring.captureException(error, { correlationId, route: routeName });
        logger.error("request.error", {
          route: routeName,
          method: request.method,
          durationMs: Date.now() - start,
          message: error instanceof Error ? error.message : String(error),
        });
        return NextResponse.json(
          createErrorEnvelope(
            "INTERNAL_ERROR",
            "An unexpected error occurred.",
            correlationId ?? "unknown",
          ),
          { status: 500 },
        );
      }
    }, inboundCorrelationId);
  };
}
