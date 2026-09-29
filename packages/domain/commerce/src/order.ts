import type { OrderStatus } from "./types.js";

/**
 * PENDING -> PAID | EXPIRED | FAILED, then PAID -> FULFILLED. FULFILLED,
 * EXPIRED and FAILED are terminal. PAID is a separate state from FULFILLED
 * on purpose: a payment Stripe confirmed but whose fulfilment then failed
 * stays PAID, which is the recovery anchor for re-driving fulfilment
 * (planning/prework/MVP-007-stripe-checkout-prework.md, section 11).
 */
const ALLOWED_ORDER_TRANSITIONS: Record<OrderStatus, readonly OrderStatus[]> = {
  PENDING: ["PAID", "EXPIRED", "FAILED"],
  PAID: ["FULFILLED"],
  FULFILLED: [],
  EXPIRED: [],
  FAILED: [],
};

export function isValidOrderStatusTransition(from: OrderStatus, to: OrderStatus): boolean {
  return ALLOWED_ORDER_TRANSITIONS[from].includes(to);
}

/** USD only at launch (docs/final-decisions.md, 2026-09-28, decision 2). The
 * database only checks the three-letter shape, so this list is the single
 * place to change when another currency is approved. */
export const SUPPORTED_CURRENCIES: readonly string[] = ["USD"];

export function isSupportedCurrency(currency: string): boolean {
  return SUPPORTED_CURRENCIES.includes(currency);
}

/** A paid order's amount in the currency's minor unit. Must be a positive
 * whole number: a free product never gets an Order at all. The upper bound
 * is Stripe's own per-charge ceiling for USD ($999,999.99), so an amount
 * Stripe would reject is refused before it is ever recorded. */
const MAX_AMOUNT_CENTS = 99_999_999;

export function isValidOrderAmountCents(amountCents: number): boolean {
  return Number.isInteger(amountCents) && amountCents > 0 && amountCents <= MAX_AMOUNT_CENTS;
}

export class OrderNotFoundError extends Error {
  constructor(public readonly orderId: string) {
    super(`Order ${orderId} not found`);
    this.name = "OrderNotFoundError";
  }
}

/** Carries the order's actual current status, which may differ from what the
 * caller expected if a concurrent request changed it first. */
export class OrderStatusTransitionNotAllowedError extends Error {
  constructor(
    public readonly orderId: string,
    public readonly fromStatus: string,
    public readonly toStatus: string,
  ) {
    super(`Cannot move order ${orderId} from ${fromStatus} to ${toStatus}`);
    this.name = "OrderStatusTransitionNotAllowedError";
  }
}

export class InvalidOrderInputError extends Error {
  constructor(
    public readonly field: "amountCents" | "currency",
    message: string,
  ) {
    super(message);
    this.name = "InvalidOrderInputError";
  }
}
