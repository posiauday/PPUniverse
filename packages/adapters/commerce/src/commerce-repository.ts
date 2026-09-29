import { Prisma, type PrismaClient } from "@ppu/db";
import {
  InvalidOrderInputError,
  isSupportedCurrency,
  isValidOrderAmountCents,
  isValidOrderStatusTransition,
  OrderNotFoundError,
  OrderStatusTransitionNotAllowedError,
  PricedProductNotFoundError,
  type CommerceRepository,
  type CreatePendingOrderInput,
  type OrderRecord,
  type OrderStatus,
  type PaymentEventRecord,
  type PriceRecord,
  type RecordPaymentEventResult,
  type VerifiedPaymentEvent,
} from "@ppu/domain-commerce";

export class PrismaCommerceRepository implements CommerceRepository {
  constructor(private readonly db: PrismaClient) {}

  async createPendingOrder(input: CreatePendingOrderInput): Promise<OrderRecord> {
    if (!isValidOrderAmountCents(input.amountCents)) {
      throw new InvalidOrderInputError(
        "amountCents",
        "amountCents must be a positive whole number of cents",
      );
    }
    if (!isSupportedCurrency(input.currency)) {
      throw new InvalidOrderInputError("currency", `Unsupported currency: ${input.currency}`);
    }
    const row = await this.db.order.create({
      data: {
        userId: input.userId,
        productId: input.productId,
        licenseDefinitionId: input.licenseDefinitionId,
        amountCents: input.amountCents,
        currency: input.currency,
      },
    });
    return toOrderRecord(row);
  }

  async findOrderById(orderId: string): Promise<OrderRecord | null> {
    const row = await this.db.order.findUnique({ where: { id: orderId } });
    return row ? toOrderRecord(row) : null;
  }

  async transitionOrderStatus(orderId: string, toStatus: OrderStatus): Promise<OrderRecord> {
    const current = await this.db.order.findUnique({ where: { id: orderId } });
    if (!current) throw new OrderNotFoundError(orderId);
    if (!isValidOrderStatusTransition(current.status, toStatus)) {
      throw new OrderStatusTransitionNotAllowedError(orderId, current.status, toStatus);
    }
    // Compare-and-swap on the exact status just validated: count === 1
    // proves the row was still in that status when replaced, so a
    // concurrent transition can never be silently overwritten.
    const claim = await this.db.order.updateMany({
      where: { id: orderId, status: current.status },
      data: { status: toStatus },
    });
    if (claim.count !== 1) {
      const fresh = await this.db.order.findUniqueOrThrow({ where: { id: orderId } });
      throw new OrderStatusTransitionNotAllowedError(orderId, fresh.status, toStatus);
    }
    return toOrderRecord(await this.db.order.findUniqueOrThrow({ where: { id: orderId } }));
  }

  async recordPaymentEvent(
    event: VerifiedPaymentEvent,
    orderId: string | null,
  ): Promise<RecordPaymentEventResult> {
    // Insert first and let the unique constraint on stripeEventId decide,
    // rather than check-then-insert, which a concurrent redelivery could beat
    // (the same pattern as PrismaEntitlementRepository.grantOrReuseEntitlement).
    try {
      const row = await this.db.paymentEvent.create({
        data: {
          stripeEventId: event.stripeEventId,
          type: event.type,
          livemode: event.livemode,
          orderId,
        },
      });
      return { recorded: true, event: toPaymentEventRecord(row) };
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
        const existing = await this.db.paymentEvent.findUniqueOrThrow({
          where: { stripeEventId: event.stripeEventId },
        });
        return { recorded: false, event: toPaymentEventRecord(existing) };
      }
      throw error;
    }
  }

  async findProductPrice(productId: string): Promise<PriceRecord | null> {
    const row = await this.db.price.findUnique({ where: { productId } });
    return row ? toPriceRecord(row) : null;
  }

  async setProductPrice(
    productId: string,
    amountCents: number,
    currency: string,
  ): Promise<PriceRecord> {
    if (!isValidOrderAmountCents(amountCents)) {
      throw new InvalidOrderInputError(
        "amountCents",
        "amountCents must be a positive whole number of cents",
      );
    }
    if (!isSupportedCurrency(currency)) {
      throw new InvalidOrderInputError("currency", `Unsupported currency: ${currency}`);
    }
    try {
      const row = await this.db.price.upsert({
        where: { productId },
        create: { productId, amountCents, currency },
        update: { amountCents, currency },
      });
      return toPriceRecord(row);
    } catch (error) {
      // P2003: the productId foreign key has no matching product.
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2003") {
        throw new PricedProductNotFoundError(productId);
      }
      throw error;
    }
  }

  async clearProductPrice(productId: string): Promise<void> {
    await this.db.price.deleteMany({ where: { productId } });
  }
}

function toOrderRecord(row: {
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
}): OrderRecord {
  return {
    id: row.id,
    userId: row.userId,
    productId: row.productId,
    licenseDefinitionId: row.licenseDefinitionId,
    status: row.status,
    amountCents: row.amountCents,
    currency: row.currency,
    stripeCheckoutSessionId: row.stripeCheckoutSessionId,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

function toPaymentEventRecord(row: {
  id: string;
  stripeEventId: string;
  type: string;
  livemode: boolean;
  orderId: string | null;
  receivedAt: Date;
}): PaymentEventRecord {
  return {
    id: row.id,
    stripeEventId: row.stripeEventId,
    type: row.type,
    livemode: row.livemode,
    orderId: row.orderId,
    receivedAt: row.receivedAt,
  };
}

function toPriceRecord(row: {
  productId: string;
  amountCents: number;
  currency: string;
  updatedAt: Date;
}): PriceRecord {
  return {
    productId: row.productId,
    amountCents: row.amountCents,
    currency: row.currency,
    updatedAt: row.updatedAt,
  };
}
