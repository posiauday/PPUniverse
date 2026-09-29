import Stripe from "stripe";
import { describe, expect, it } from "vitest";
import { WebhookSignatureInvalidError } from "@ppu/domain-commerce";
import { StripeWebhookVerifier } from "./stripe-webhook-verifier.js";

/**
 * Real signatures, not mocks: every header is produced by Stripe's own
 * test-header generator using the same HMAC scheme Stripe uses in
 * production. The secret is a throwaway test value, never a real one.
 */
const SECRET = "whsec_test_only_not_a_real_secret";
const payload = JSON.stringify({
  id: "evt_test_123",
  object: "event",
  type: "checkout.session.completed",
  livemode: false,
  data: { object: { id: "cs_test_1", customer_email: "buyer@example.test" } },
});

function header(body: string, opts: { secret?: string; timestamp?: number } = {}) {
  return Stripe.webhooks.generateTestHeaderString({
    payload: body,
    secret: opts.secret ?? SECRET,
    timestamp: opts.timestamp ?? Math.floor(Date.now() / 1000),
  });
}

describe("StripeWebhookVerifier", () => {
  const verifier = new StripeWebhookVerifier(SECRET);

  it("accepts a correctly signed event and returns only id, type and livemode", () => {
    const result = verifier.verify(payload, header(payload));
    expect(result).toEqual({
      stripeEventId: "evt_test_123",
      type: "checkout.session.completed",
      livemode: false,
    });
    expect(JSON.stringify(result)).not.toContain("buyer@example.test");
  });

  it("accepts the raw body as bytes as well as a string", () => {
    expect(verifier.verify(new TextEncoder().encode(payload), header(payload)).stripeEventId).toBe(
      "evt_test_123",
    );
  });

  it("rejects a missing signature header", () => {
    expect(() => verifier.verify(payload, null)).toThrow(WebhookSignatureInvalidError);
    expect(() => verifier.verify(payload, "")).toThrow(WebhookSignatureInvalidError);
  });

  it("rejects a signature made with a different secret", () => {
    expect(() =>
      verifier.verify(payload, header(payload, { secret: "whsec_someone_else" })),
    ).toThrow(WebhookSignatureInvalidError);
  });

  it("rejects a body modified after signing", () => {
    const tampered = payload.replace("checkout.session.completed", "checkout.session.expired");
    expect(() => verifier.verify(tampered, header(payload))).toThrow(WebhookSignatureInvalidError);
  });

  it("rejects a body that was re-serialized (not the raw bytes Stripe signed)", () => {
    const reformatted = JSON.stringify(JSON.parse(payload), null, 2);
    expect(() => verifier.verify(reformatted, header(payload))).toThrow(
      WebhookSignatureInvalidError,
    );
  });

  it("rejects a replayed event whose timestamp is outside the 5-minute window", () => {
    const tenMinutesAgo = Math.floor(Date.now() / 1000) - 600;
    expect(() => verifier.verify(payload, header(payload, { timestamp: tenMinutesAgo }))).toThrow(
      WebhookSignatureInvalidError,
    );
  });

  it("rejects a malformed header", () => {
    expect(() => verifier.verify(payload, "not-a-stripe-signature")).toThrow(
      WebhookSignatureInvalidError,
    );
  });

  it("rejects a header carrying only a non-v1 scheme (downgrade protection)", () => {
    const v1 = header(payload);
    const downgraded = v1.replace(/v1=/, "v0=");
    expect(() => verifier.verify(payload, downgraded)).toThrow(WebhookSignatureInvalidError);
  });

  it("never exposes the failure reason, the secret or the payload", () => {
    try {
      verifier.verify(payload, header(payload, { secret: "whsec_someone_else" }));
      throw new Error("should have thrown");
    } catch (error) {
      const text = `${(error as Error).message} ${JSON.stringify(error)}`;
      expect(text).not.toContain(SECRET);
      expect(text).not.toContain("buyer@example.test");
      expect((error as Error).message).toBe("Webhook signature verification failed");
    }
  });

  it("refuses to be constructed without a secret or with a non-positive tolerance", () => {
    expect(() => new StripeWebhookVerifier("")).toThrow();
    expect(() => new StripeWebhookVerifier(SECRET, 0)).toThrow();
    expect(() => new StripeWebhookVerifier(SECRET, -1)).toThrow();
  });
});
