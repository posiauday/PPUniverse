/**
 * Error envelope shape required by docs/07-api-contracts.md: every API error
 * response uses this shape. Never include stack traces, provider secrets, or
 * internal storage paths in `message` or `fieldErrors`.
 */
export interface ErrorEnvelope {
  code: string;
  message: string;
  fieldErrors?: Record<string, string[]>;
  correlationId: string;
  retryAfter?: number;
}

export function createErrorEnvelope(
  code: string,
  message: string,
  correlationId: string,
  options?: { fieldErrors?: Record<string, string[]>; retryAfter?: number },
): ErrorEnvelope {
  return {
    code,
    message,
    correlationId,
    ...(options?.fieldErrors ? { fieldErrors: options.fieldErrors } : {}),
    ...(options?.retryAfter !== undefined ? { retryAfter: options.retryAfter } : {}),
  };
}
