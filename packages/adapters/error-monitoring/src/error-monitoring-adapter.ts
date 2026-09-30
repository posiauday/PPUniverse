export interface ErrorContext {
  correlationId?: string;
  [key: string]: unknown;
}

export interface ErrorMonitoringAdapter {
  captureException(error: unknown, context?: ErrorContext): void;
  captureMessage(message: string, level: "warning" | "error", context?: ErrorContext): void;
}
