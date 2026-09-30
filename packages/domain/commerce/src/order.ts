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

/** Thrown when setting a price on a product that does not exist. */
export class PricedProductNotFoundError extends Error {
  constructor(public readonly productId: string) {
    super(`Product ${productId} not found`);
    this.name = "PricedProductNotFoundError";
  }
}

/**
 * Parses what an admin types into the price field ("49", "49.9", "49.00",
 * "$49.00", "1,299.00") into whole cents, or null if it is not a valid
 * positive amount with at most two decimal places. Works on the string
 * directly, never through floating-point arithmetic, so "19.99" is exactly
 * 1999 cents.
 */
export function parsePriceInputToCents(input: string): number | null {
  const cleaned = input.trim().replace(/^\$/, "").replace(/,/g, "");
  const match = /^(\d+)(?:\.(\d{1,2}))?$/.exec(cleaned);
  if (!match) return null;
  const dollars = match[1] ?? "0";
  const cents = (match[2] ?? "").padEnd(2, "0");
  const total = Number(dollars) * 100 + Number(cents);
  return isValidOrderAmountCents(total) ? total : null;
}

/** "$49.00 USD" -- the currency code is always shown, so Canadian visitors
 * are never left guessing which dollars. */
export function formatPrice(amountCents: number, currency: string): string {
  const dollars = Math.floor(amountCents / 100).toLocaleString("en-US");
  const cents = String(amountCents % 100).padStart(2, "0");
  return `$${dollars}.${cents} ${currency}`;
}
