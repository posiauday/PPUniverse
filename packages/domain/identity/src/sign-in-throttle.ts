/**
 * Failed sign-in limits (MVP-036). Two counters guard each attempt: one per
 * account (by email) and one per IP address. Each counts failures inside a
 * fixed window; reaching the limit locks that counter until the lock ends.
 * The decision is pure, so the stored state can live anywhere (the app keeps
 * it in Postgres, since serverless memory doesn't last between requests).
 */
export interface ThrottleRule {
  maxFailures: number;
  windowMs: number;
  lockMs: number;
}

export const ACCOUNT_RULE: ThrottleRule = {
  maxFailures: 5,
  windowMs: 15 * 60_000,
  lockMs: 15 * 60_000,
};
export const IP_RULE: ThrottleRule = {
  maxFailures: 30,
  windowMs: 15 * 60_000,
  lockMs: 15 * 60_000,
};

export interface ThrottleState {
  failures: number;
  windowStart: Date;
  lockedUntil: Date | null;
}

export function isLocked(state: ThrottleState | null, now: Date): boolean {
  return !!state?.lockedUntil && state.lockedUntil > now;
}

/** The state after one more failure. */
export function recordFailure(
  state: ThrottleState | null,
  rule: ThrottleRule,
  now: Date,
): ThrottleState {
  const fresh = !state || now.getTime() - state.windowStart.getTime() >= rule.windowMs;
  const failures = fresh ? 1 : state.failures + 1;
  const windowStart = fresh ? now : state.windowStart;
  const lockedUntil =
    failures >= rule.maxFailures
      ? new Date(now.getTime() + rule.lockMs)
      : (state?.lockedUntil ?? null);
  return { failures, windowStart, lockedUntil };
}
