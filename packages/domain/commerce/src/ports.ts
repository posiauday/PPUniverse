import type {
  CreatePendingOrderInput,
  OrderRecord,
  OrderStatus,
  RecordPaymentEventResult,
  VerifiedPaymentEvent,
} from "./types.js";

/**
 * Verifies an incoming payment webhook and returns only the fields the
 * ledger needs. Provider-neutral per ADR 003; @ppu/adapter-payments
 * implements it for Stripe. Throws WebhookSignatureInvalidError for any
 * request that is not provably from the provider -- a missing or malformed
 * signature header, a signature that does not match, a tampered body, or a
 * timestamp outside the replay window. The caller must pass the raw request
 * body exactly as received, before any JSON parsing.
 */
export interface PaymentWebhookVerifier {
  verify(rawBody: string | Uint8Array, signatureHeader: string | null): VerifiedPaymentEvent;
}

/** Deliberately carries no detail about why verification failed: the
 * reason is never returned to the caller of a webhook endpoint. */
export class WebhookSignatureInvalidError extends Error {
  constructor() {
    super("Webhook signature verification failed");
    this.name = "WebhookSignatureInvalidError";
  }
}

export interface CommerceRepository {
  /** Rejects an amount that is not a positive whole number or a currency
   * that is not supported (InvalidOrderInputError) before touching the
   * database; the database's own CHECK constraints back this up. */
  createPendingOrder(input: CreatePendingOrderInput): Promise<OrderRecord>;
  findOrderById(orderId: string): Promise<OrderRecord | null>;
  /**
   * Compare-and-swap: succeeds only if the order is still in the exact
   * status it was validated against, so two concurrent transitions can never
   * both apply and a stale read can never win (the lesson from MVP-019's
   * changeProductStatus). Throws OrderNotFoundError or
   * OrderStatusTransitionNotAllowedError (carrying the fresh status).
   */
  transitionOrderStatus(orderId: string, toStatus: OrderStatus): Promise<OrderRecord>;
  /**
   * Idempotent on Stripe's event id: the first delivery is recorded and
   * returns `recorded: true`; any redelivery, including one racing
   * concurrently, returns `recorded: false` with the original row. Safe to
   * call before any side effect runs.
   */
  recordPaymentEvent(
    event: VerifiedPaymentEvent,
    orderId: string | null,
  ): Promise<RecordPaymentEventResult>;
}
