import { logger, redact } from "@ppu/telemetry";
import type { ErrorContext, ErrorMonitoringAdapter } from "./error-monitoring-adapter.js";

/** Dev/test default: logs instead of sending to a vendor. Never used in production. */
export class ConsoleErrorMonitoringAdapter implements ErrorMonitoringAdapter {
  captureException(error: unknown, context: ErrorContext = {}): void {
    const message = error instanceof Error ? error.message : String(error);
    const stack = error instanceof Error ? error.stack : undefined;
    logger.error("error_monitoring.exception", {
      message,
      stack,
      ...(redact(context) as ErrorContext),
    });
  }

  captureMessage(message: string, level: "warning" | "error", context: ErrorContext = {}): void {
    logger.error("error_monitoring.message", {
      message,
      level,
      ...(redact(context) as ErrorContext),
    });
  }
}
