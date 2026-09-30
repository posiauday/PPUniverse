import Stripe from "stripe";
import {
  WebhookSignatureInvalidError,
  type PaymentWebhookVerifier,
  type VerifiedPaymentEvent,
} from "@ppu/domain-commerce";

/** Stripe's own default replay window. Stripe warns that 0 disables the
 * recency check entirely, so a non-positive tolerance is refused. */
const DEFAULT_TOLERANCE_SECONDS = 300;

/**
 * Verifies a Stripe webhook with Stripe's official library rather than
 * hand-rolled cryptography (MVP-007 slice 1; planning/prework/
 * MVP-007-stripe-checkout-prework.md, section 7). Checks the
 * `Stripe-Signature` header's HMAC-SHA256 `v1` signature against this
 * endpoint's own signing secret, in constant time, and rejects timestamps
 * outside the tolerance window (replay protection).
 *
 * Every failure becomes one detail-free WebhookSignatureInvalidError. The
 * underlying reason, the secret and the payload are never exposed or
 * logged. Only the three fields the payment-event ledger needs are
 * returned.
 */
export class StripeWebhookVerifier implements PaymentWebhookVerifier {
  constructor(
    private readonly endpointSecret: string,
    private readonly toleranceSeconds: number = DEFAULT_TOLERANCE_SECONDS,
  ) {
    if (!endpointSecret) {
      throw new Error("StripeWebhookVerifier requires the endpoint's webhook signing secret");
    }
    if (!(toleranceSeconds > 0)) {
      throw new Error(
        "StripeWebhookVerifier tolerance must be positive; 0 disables replay protection",
      );
    }
  }

  verify(rawBody: string | Uint8Array, signatureHeader: string | null): VerifiedPaymentEvent {
    if (!signatureHeader) throw new WebhookSignatureInvalidError();
    let event: Stripe.Event;
    try {
      event = Stripe.webhooks.constructEvent(
        typeof rawBody === "string" ? rawBody : Buffer.from(rawBody),
        signatureHeader,
        this.endpointSecret,
        this.toleranceSeconds,
      );
    } catch {
      throw new WebhookSignatureInvalidError();
    }
    if (typeof event.id !== "string" || typeof event.type !== "string") {
      throw new WebhookSignatureInvalidError();
    }
    return { stripeEventId: event.id, type: event.type, livemode: event.livemode === true };
  }
}
