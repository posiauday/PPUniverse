import * as Sentry from "@sentry/node";
import { redact } from "@ppu/telemetry";
import type { ErrorContext, ErrorMonitoringAdapter } from "./error-monitoring-adapter.js";

export interface SentryErrorMonitoringAdapterConfig {
  dsn: string;
  environment: string;
}

/**
 * Contexts passed to captureException/captureMessage are redacted before
 * being handed to the Sentry SDK — this adapter never receives raw request
 * objects/headers (its callers only ever pass small, explicit field sets,
 * see apps/web/lib/error-monitoring.ts), and redaction is a second,
 * defense-in-depth layer on top of that narrow interface, not the only
 * thing standing between a secret and Sentry's servers.
 */
export class SentryErrorMonitoringAdapter implements ErrorMonitoringAdapter {
  constructor(config: SentryErrorMonitoringAdapterConfig) {
    Sentry.init({
      dsn: config.dsn,
      environment: config.environment,
      sendDefaultPii: false,
    });
  }

  captureException(error: unknown, context: ErrorContext = {}): void {
    const { correlationId, ...rest } = context;
    Sentry.captureException(error, {
      tags: correlationId ? { correlationId } : undefined,
      extra: redact(rest) as Record<string, unknown>,
    });
  }

  captureMessage(message: string, level: "warning" | "error", context: ErrorContext = {}): void {
    const { correlationId, ...rest } = context;
    Sentry.captureMessage(message, {
      level,
      tags: correlationId ? { correlationId } : undefined,
      extra: redact(rest) as Record<string, unknown>,
    });
  }
}
