/**
 * Commerce domain (MVP-007 slice 1, FR-006). Orders and the Stripe
 * payment-event ledger only. No Price model yet (slice 2) and no Checkout
 * Session creation (slice 3); webhook handling and fulfilment are MVP-008.
 */

/** Mirrors the Prisma `OrderStatus` enum. There is no REFUNDED state: all
 * sales are final (docs/final-decisions.md, 2026-09-28, decision 3). */
export type OrderStatus = "PENDING" | "PAID" | "FULFILLED" | "EXPIRED" | "FAILED";

export interface OrderRecord {
  id: string;
  userId: string;
  productId: string;
  licenseDefinitionId: string;
  status: OrderStatus;
  amountCents: number;
  currency: string;
  stripeCheckoutSessionId: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreatePendingOrderInput {
  userId: string;
  productId: string;
  licenseDefinitionId: string;
  amountCents: number;
  currency: string;
}

/** The minimum a webhook event needs for idempotency and audit. The payload
 * itself is never stored (NFR-006). */
export interface VerifiedPaymentEvent {
  stripeEventId: string;
  type: string;
  livemode: boolean;
}

export interface PaymentEventRecord extends VerifiedPaymentEvent {
  id: string;
  orderId: string | null;
  receivedAt: Date;
}

/** `recorded: false` means this Stripe event id was already in the ledger --
 * a redelivery, which the caller must treat as already handled. */
export interface RecordPaymentEventResult {
  recorded: boolean;
  event: PaymentEventRecord;
}
