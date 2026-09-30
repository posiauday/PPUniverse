import { describe, expect, it } from "vitest";
import {
  InvalidOrderInputError,
  isSupportedCurrency,
  isValidOrderAmountCents,
  isValidOrderStatusTransition,
  OrderNotFoundError,
  OrderStatusTransitionNotAllowedError,
} from "./order.js";
import { WebhookSignatureInvalidError } from "./ports.js";
import type { OrderStatus } from "./types.js";

const ALL: OrderStatus[] = ["PENDING", "PAID", "FULFILLED", "EXPIRED", "FAILED"];

describe("isValidOrderStatusTransition", () => {
  it("allows exactly PENDING -> PAID/EXPIRED/FAILED and PAID -> FULFILLED", () => {
    const allowed = ALL.flatMap((from) =>
      ALL.filter((to) => isValidOrderStatusTransition(from, to)).map((to) => `${from}->${to}`),
    );
    expect(allowed.sort()).toEqual(
      ["PAID->FULFILLED", "PENDING->EXPIRED", "PENDING->FAILED", "PENDING->PAID"].sort(),
    );
  });

  it("never lets a PENDING order skip payment straight to FULFILLED", () => {
    expect(isValidOrderStatusTransition("PENDING", "FULFILLED")).toBe(false);
  });

  it("treats FULFILLED, EXPIRED and FAILED as terminal", () => {
    for (const terminal of ["FULFILLED", "EXPIRED", "FAILED"] as const) {
      for (const to of ALL) expect(isValidOrderStatusTransition(terminal, to)).toBe(false);
    }
  });
});

describe("isValidOrderAmountCents", () => {
  it("accepts positive whole amounts up to Stripe's USD ceiling", () => {
    expect(isValidOrderAmountCents(1)).toBe(true);
    expect(isValidOrderAmountCents(4900)).toBe(true);
    expect(isValidOrderAmountCents(99_999_999)).toBe(true);
  });

  it("rejects zero, negatives, fractions, and amounts over the ceiling", () => {
    for (const bad of [0, -1, 49.5, Number.NaN, 100_000_000]) {
      expect(isValidOrderAmountCents(bad)).toBe(false);
    }
  });
});

describe("isSupportedCurrency", () => {
  it("supports USD only at launch, case-sensitively", () => {
    expect(isSupportedCurrency("USD")).toBe(true);
    expect(isSupportedCurrency("usd")).toBe(false);
    expect(isSupportedCurrency("CAD")).toBe(false);
  });
});

describe("errors", () => {
  it("carry their identifying fields and distinct names", () => {
    const transition = new OrderStatusTransitionNotAllowedError("o1", "FULFILLED", "PAID");
    expect([transition.orderId, transition.fromStatus, transition.toStatus]).toEqual([
      "o1",
      "FULFILLED",
      "PAID",
    ]);
    expect(transition.name).toBe("OrderStatusTransitionNotAllowedError");
    expect(new OrderNotFoundError("o1").name).toBe("OrderNotFoundError");
    expect(new InvalidOrderInputError("currency", "x").field).toBe("currency");
  });

  it("WebhookSignatureInvalidError does not reveal why verification failed", () => {
    expect(new WebhookSignatureInvalidError().message).toBe(
      "Webhook signature verification failed",
    );
  });
});
