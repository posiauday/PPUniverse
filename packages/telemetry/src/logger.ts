import { getCorrelationId } from "./correlation.js";
import { redact } from "./redact.js";

export type LogLevel = "debug" | "info" | "warn" | "error";

export interface LogFields {
  [key: string]: unknown;
}

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  event: string;
  correlationId: string | undefined;
  [key: string]: unknown;
}

/**
 * One JSON object per line on stdout/stderr (info/debug -> stdout,
 * warn/error -> stderr) — the standard shape for a log-shipping platform to
 * pick up without a vendor-specific SDK, matching the TRD's "structured
 * JSON logs" baseline. Every entry auto-attaches the current correlation
 * ID (packages/telemetry/src/correlation.ts) when called inside a
 * runWithCorrelationId scope. All fields are redacted (redact.ts) before
 * serialization.
 */
function write(level: LogLevel, event: string, fields: LogFields = {}): void {
  const entry: LogEntry = {
    timestamp: new Date().toISOString(),
    level,
    event,
    correlationId: getCorrelationId(),
    ...(redact(fields) as LogFields),
  };
  const line = JSON.stringify(entry);
  if (level === "error" || level === "warn") {
    console.error(line);
  } else {
    console.log(line);
  }
}

export const logger = {
  debug: (event: string, fields?: LogFields) => write("debug", event, fields),
  info: (event: string, fields?: LogFields) => write("info", event, fields),
  warn: (event: string, fields?: LogFields) => write("warn", event, fields),
  error: (event: string, fields?: LogFields) => write("error", event, fields),
};
