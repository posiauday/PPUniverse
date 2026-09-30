# @ppu/adapter-error-monitoring

Error monitoring/APM adapter (ADR 004, `docs/final-decisions.md` — Sentry). `ErrorMonitoringAdapter` is the port; `ConsoleErrorMonitoringAdapter` is the dev/test default (logs via `@ppu/telemetry` instead of sending anywhere); `SentryErrorMonitoringAdapter` is the real implementation.

Callers only ever pass a small, explicit context object (correlation ID plus a few named fields) — never a raw request/headers object — and that context is redacted (`@ppu/telemetry`'s `redact`) before being handed to the Sentry SDK, as a second layer on top of `sendDefaultPii: false`. See `sentry-error-monitoring-adapter.ts`'s own comment for the reasoning.

Requires `SENTRY_DSN` to construct the real adapter; `apps/web/lib/error-monitoring.ts` falls back to the console adapter when it's unset (no DSN has been provisioned yet — see `docs/open-questions.md` item 18).
