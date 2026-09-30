# @ppu/telemetry

Correlation ID propagation, a structured JSON logger, and a log-content redaction helper — the operational-observability foundation (MVP-022, NFR-006/NFR-007). Traces and metrics are derived from these structured request logs (correlation ID + timing + status on every request) rather than a separate OpenTelemetry collector, which nothing in this project provisions yet — see `planning/progress-report.md`'s MVP-022 entry for the reversible scope reduction this represents.

- `runWithCorrelationId` / `getCorrelationId` — `AsyncLocalStorage`-based context; a correlation ID set at the top of a request stays attached through every `await` in that call chain without threading it through every function signature.
- `logger` — `info`/`warn`/`error`/`debug`, one JSON object per line, auto-attaches the current correlation ID, redacts known-sensitive field names before serializing.
- `redact` — the redaction logic `logger` uses internally, also exported directly for call sites that need it outside a log line (e.g. before sending data to an external error-monitoring vendor).

Audit-event emission (privileged/admin actions) is MVP-019's scope, not this package's — this is request/error observability only.
