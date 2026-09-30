import {
  ConsoleErrorMonitoringAdapter,
  SentryErrorMonitoringAdapter,
  type ErrorMonitoringAdapter,
} from "@ppu/adapter-error-monitoring";

/**
 * Sentry is the decided vendor (docs/final-decisions.md) but no DSN has
 * been provisioned yet (docs/open-questions.md item 18) — falls back to
 * logging locally instead of failing to start.
 */
const dsn = process.env["SENTRY_DSN"];

export const errorMonitoring: ErrorMonitoringAdapter = dsn
  ? new SentryErrorMonitoringAdapter({ dsn, environment: process.env["NODE_ENV"] ?? "development" })
  : new ConsoleErrorMonitoringAdapter();
