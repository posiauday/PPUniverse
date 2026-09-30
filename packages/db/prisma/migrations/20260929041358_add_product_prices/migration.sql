-- CreateTable
CREATE TABLE "prices" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "amountCents" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "prices_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "prices_productId_key" ON "prices"("productId");

-- AddForeignKey
ALTER TABLE "prices" ADD CONSTRAINT "prices_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Same rules as orders: a price is a positive amount in the currency's minor
-- unit, with a three-letter currency code. "Free" is the absence of a row,
-- never a zero price.
ALTER TABLE "prices" ADD CONSTRAINT "prices_amount_positive_check" CHECK ("amountCents" > 0);
ALTER TABLE "prices" ADD CONSTRAINT "prices_currency_format_check" CHECK ("currency" ~ '^[A-Z]{3}$');

-- Row-level security: enabled with zero policies, the same unconditional
-- convention every table in this schema follows.
ALTER TABLE "prices" ENABLE ROW LEVEL SECURITY;
