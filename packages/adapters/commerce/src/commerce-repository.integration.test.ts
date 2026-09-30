import { afterAll, beforeAll, describe, expect, it } from "vitest";
import {
  InvalidOrderInputError,
  OrderNotFoundError,
  OrderStatusTransitionNotAllowedError,
  PricedProductNotFoundError,
} from "@ppu/domain-commerce";
import { PrismaCommerceRepository } from "./commerce-repository.js";

/**
 * Runs only when DATABASE_URL points at a real, migrated Postgres database;
 * CI provides one. Every row this file creates uses the reserved
 * "commerce-repo-" prefix, and cleanup deletes in Restrict-FK order:
 * payment events, then orders, then the product and user they reference.
 */
const hasDatabase = Boolean(process.env["DATABASE_URL"]);

describe.skipIf(!hasDatabase)("PrismaCommerceRepository (integration)", () => {
  let db: import("@ppu/db").PrismaClient;
  let repo: PrismaCommerceRepository;
  let userId: string;
  let productId: string;
  let licenseDefinitionId: string;
  let eventCounter = 0;

  const newEventId = () => `commerce-repo-evt_${Date.now()}_${eventCounter++}`;

  beforeAll(async () => {
    const { prisma } = await import("@ppu/db");
    db = prisma;
    repo = new PrismaCommerceRepository(db);

    const category = await db.category.findUniqueOrThrow({
      where: { slug: "power-apps-components" },
    });
    const user = await db.user.create({ data: { email: "commerce-repo-buyer@example.test" } });
    userId = user.id;
    const product = await db.product.create({
      data: {
        slug: "commerce-repo-product",
        name: "Commerce Repo Test Product",
        summary: "Used only by this test.",
        status: "PUBLISHED",
        categoryId: category.id,
        publishedAt: new Date(),
      },
    });
    productId = product.id;
    const personal = await db.licenseDefinition.findUniqueOrThrow({ where: { slug: "personal" } });
    licenseDefinitionId = personal.id;
  });

  afterAll(async () => {
    await db.paymentEvent.deleteMany({
      where: { stripeEventId: { startsWith: "commerce-repo-" } },
    });
    await db.order.deleteMany({ where: { userId } });
    await db.product.deleteMany({ where: { id: productId } });
    await db.user.deleteMany({ where: { id: userId } });
    await db.$disconnect();
  });

  const createOrder = () =>
    repo.createPendingOrder({
      userId,
      productId,
      licenseDefinitionId,
      amountCents: 4900,
      currency: "USD",
    });

  describe("createPendingOrder", () => {
    it("creates a PENDING order with the amount and currency charged", async () => {
      const order = await createOrder();
      expect(order.status).toBe("PENDING");
      expect(order.amountCents).toBe(4900);
      expect(order.currency).toBe("USD");
      expect(order.stripeCheckoutSessionId).toBeNull();
    });

    it("rejects a zero or fractional amount before touching the database", async () => {
      for (const amountCents of [0, -100, 49.5]) {
        await expect(
          repo.createPendingOrder({
            userId,
            productId,
            licenseDefinitionId,
            amountCents,
            currency: "USD",
          }),
        ).rejects.toBeInstanceOf(InvalidOrderInputError);
      }
    });

    it("rejects a currency other than USD", async () => {
      await expect(
        repo.createPendingOrder({
          userId,
          productId,
          licenseDefinitionId,
          amountCents: 100,
          currency: "CAD",
        }),
      ).rejects.toBeInstanceOf(InvalidOrderInputError);
    });

    it("the database itself refuses a non-positive amount, even if the domain check were bypassed", async () => {
      await expect(
        db.order.create({
          data: { userId, productId, licenseDefinitionId, amountCents: 0, currency: "USD" },
        }),
      ).rejects.toThrow();
    });

    it("the database itself refuses a malformed currency code", async () => {
      await expect(
        db.order.create({
          data: { userId, productId, licenseDefinitionId, amountCents: 100, currency: "usd" },
        }),
      ).rejects.toThrow();
    });
  });

  describe("transitionOrderStatus", () => {
    it("moves an order through PENDING -> PAID -> FULFILLED", async () => {
      const order = await createOrder();
      expect((await repo.transitionOrderStatus(order.id, "PAID")).status).toBe("PAID");
      expect((await repo.transitionOrderStatus(order.id, "FULFILLED")).status).toBe("FULFILLED");
    });

    it("rejects skipping payment (PENDING -> FULFILLED) and leaves the order unchanged", async () => {
      const order = await createOrder();
      await expect(repo.transitionOrderStatus(order.id, "FULFILLED")).rejects.toBeInstanceOf(
        OrderStatusTransitionNotAllowedError,
      );
      expect((await repo.findOrderById(order.id))?.status).toBe("PENDING");
    });

    it("rejects any transition out of a terminal status", async () => {
      const order = await createOrder();
      await repo.transitionOrderStatus(order.id, "EXPIRED");
      await expect(repo.transitionOrderStatus(order.id, "PAID")).rejects.toBeInstanceOf(
        OrderStatusTransitionNotAllowedError,
      );
    });

    it("rejects an unknown order id", async () => {
      await expect(repo.transitionOrderStatus("does-not-exist", "PAID")).rejects.toBeInstanceOf(
        OrderNotFoundError,
      );
    });

    it("two concurrent PAID transitions on one order: exactly one succeeds", async () => {
      const order = await createOrder();
      const outcomes = await Promise.allSettled([
        repo.transitionOrderStatus(order.id, "PAID"),
        repo.transitionOrderStatus(order.id, "PAID"),
      ]);
      expect(outcomes.filter((o) => o.status === "fulfilled")).toHaveLength(1);
      const rejected = outcomes.find((o) => o.status === "rejected");
      expect(rejected?.status === "rejected" && rejected.reason).toBeInstanceOf(
        OrderStatusTransitionNotAllowedError,
      );
      expect((await repo.findOrderById(order.id))?.status).toBe("PAID");
    });

    it("racing PAID against EXPIRED, repeated: the order always ends in exactly one of them, never both", async () => {
      for (let i = 0; i < 8; i++) {
        const order = await createOrder();
        const outcomes = await Promise.allSettled([
          repo.transitionOrderStatus(order.id, "PAID"),
          repo.transitionOrderStatus(order.id, "EXPIRED"),
        ]);
        // Both targets are only reachable from PENDING, so whichever claims
        // first makes the other's exact-status predicate miss.
        const fulfilled = outcomes.filter((o) => o.status === "fulfilled");
        expect(fulfilled).toHaveLength(1);
        const final = (await repo.findOrderById(order.id))?.status;
        const winner = fulfilled[0]?.status === "fulfilled" ? fulfilled[0].value.status : null;
        expect(final).toBe(winner);
      }
    });
  });

  describe("recordPaymentEvent", () => {
    it("records a first delivery, and a redelivery returns the original row without a duplicate", async () => {
      const order = await createOrder();
      const event = {
        stripeEventId: newEventId(),
        type: "checkout.session.completed",
        livemode: false,
      };
      const first = await repo.recordPaymentEvent(event, order.id);
      const again = await repo.recordPaymentEvent(event, order.id);

      expect(first.recorded).toBe(true);
      expect(again.recorded).toBe(false);
      expect(again.event.id).toBe(first.event.id);
      expect(await db.paymentEvent.count({ where: { stripeEventId: event.stripeEventId } })).toBe(
        1,
      );
    });

    it("accepts an event that does not map to any order", async () => {
      const result = await repo.recordPaymentEvent(
        { stripeEventId: newEventId(), type: "charge.dispute.created", livemode: false },
        null,
      );
      expect(result.recorded).toBe(true);
      expect(result.event.orderId).toBeNull();
    });

    it("concurrent redeliveries of the same event: exactly one is recorded", async () => {
      const event = {
        stripeEventId: newEventId(),
        type: "checkout.session.completed",
        livemode: false,
      };
      const results = await Promise.all(
        Array.from({ length: 5 }, () => repo.recordPaymentEvent(event, null)),
      );
      expect(results.filter((r) => r.recorded)).toHaveLength(1);
      expect(new Set(results.map((r) => r.event.id)).size).toBe(1);
      expect(await db.paymentEvent.count({ where: { stripeEventId: event.stripeEventId } })).toBe(
        1,
      );
    });

    it("an order with recorded payment evidence cannot be deleted (Restrict FK)", async () => {
      const order = await createOrder();
      await repo.recordPaymentEvent(
        { stripeEventId: newEventId(), type: "checkout.session.completed", livemode: false },
        order.id,
      );
      await expect(db.order.delete({ where: { id: order.id } })).rejects.toThrow();
    });
  });

  describe("product price", () => {
    it("a product starts free (no price), can be priced, repriced, and made free again", async () => {
      expect(await repo.findProductPrice(productId)).toBeNull();
      expect((await repo.setProductPrice(productId, 2900, "USD")).amountCents).toBe(2900);
      expect((await repo.setProductPrice(productId, 4900, "USD")).amountCents).toBe(4900);
      expect(await db.price.count({ where: { productId } })).toBe(1);
      await repo.clearProductPrice(productId);
      expect(await repo.findProductPrice(productId)).toBeNull();
      await repo.clearProductPrice(productId);
    });

    it("rejects a zero, negative or fractional price, or a non-USD currency", async () => {
      for (const amount of [0, -1, 9.5]) {
        await expect(repo.setProductPrice(productId, amount, "USD")).rejects.toBeInstanceOf(
          InvalidOrderInputError,
        );
      }
      await expect(repo.setProductPrice(productId, 100, "CAD")).rejects.toBeInstanceOf(
        InvalidOrderInputError,
      );
    });

    it("the database itself refuses a zero price", async () => {
      await expect(
        db.price.create({ data: { productId, amountCents: 0, currency: "USD" } }),
      ).rejects.toThrow();
    });

    it("rejects a price for an unknown product", async () => {
      await expect(repo.setProductPrice("does-not-exist", 100, "USD")).rejects.toBeInstanceOf(
        PricedProductNotFoundError,
      );
    });

    it("deleting a product removes its price (Cascade)", async () => {
      const category = await db.category.findUniqueOrThrow({
        where: { slug: "power-apps-components" },
      });
      const temp = await db.product.create({
        data: {
          slug: "commerce-repo-price-cascade",
          name: "Price Cascade",
          summary: "Temporary.",
          categoryId: category.id,
        },
      });
      await repo.setProductPrice(temp.id, 500, "USD");
      await db.product.delete({ where: { id: temp.id } });
      expect(await db.price.count({ where: { productId: temp.id } })).toBe(0);
    });
  });
});
