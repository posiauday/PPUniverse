/**
 * Log-content safety (NFR-006, CLAUDE.md "Keep all secrets in environment
 * variables" and the general no-credentials-in-logs principle). Matches
 * key names case-insensitively so `Authorization`, `authorization`, and
 * `AUTHORIZATION` are all caught. Extend via `extraKeys` for a specific
 * call site rather than editing this default list for a one-off need.
 */
export const DEFAULT_SENSITIVE_KEYS: readonly string[] = [
  "password",
  "token",
  "secret",
  "authorization",
  "cookie",
  "sessiontoken",
  "accesstoken",
  "refreshtoken",
  "apikey",
  "dsn",
  "connectionstring",
  "database_url",
  "databaseurl",
  "id_token",
  "session_state",
];

const REDACTED = "[REDACTED]";

export function redact(
  value: unknown,
  extraKeys: readonly string[] = [],
  sensitiveKeys: readonly string[] = DEFAULT_SENSITIVE_KEYS,
): unknown {
  const keys = new Set([...sensitiveKeys, ...extraKeys].map((k) => k.toLowerCase()));
  return redactValue(value, keys);
}

function redactValue(value: unknown, sensitiveKeys: ReadonlySet<string>): unknown {
  if (Array.isArray(value)) {
    return value.map((item) => redactValue(item, sensitiveKeys));
  }
  if (value !== null && typeof value === "object") {
    const result: Record<string, unknown> = {};
    for (const [key, val] of Object.entries(value)) {
      result[key] = sensitiveKeys.has(key.toLowerCase())
        ? REDACTED
        : redactValue(val, sensitiveKeys);
    }
    return result;
  }
  return value;
}
