import { AsyncLocalStorage } from "node:async_hooks";
import { randomUUID } from "node:crypto";

interface CorrelationContext {
  correlationId: string;
}

const storage = new AsyncLocalStorage<CorrelationContext>();

/**
 * Runs `fn` with a correlation ID bound for the duration of the async call
 * chain (propagates through awaits, not just the synchronous call stack).
 * Reuses `existingId` when provided (e.g. an inbound header) rather than
 * minting a new one, so a correlation ID stays stable across service hops.
 */
export function runWithCorrelationId<T>(fn: () => T, existingId?: string): T {
  return storage.run({ correlationId: existingId ?? randomUUID() }, fn);
}

/** Returns the current correlation ID, or undefined outside a runWithCorrelationId scope. */
export function getCorrelationId(): string | undefined {
  return storage.getStore()?.correlationId;
}
