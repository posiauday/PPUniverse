-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "ProductStatus" ADD VALUE 'SUSPENDED';
ALTER TYPE "ProductStatus" ADD VALUE 'ARCHIVED';

-- CreateTable
CREATE TABLE "product_status_events" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "actorUserId" TEXT NOT NULL,
    "fromStatus" "ProductStatus" NOT NULL,
    "toStatus" "ProductStatus" NOT NULL,
    "reason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "product_status_events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "product_status_events_productId_createdAt_idx" ON "product_status_events"("productId", "createdAt");

-- AddForeignKey
ALTER TABLE "product_status_events" ADD CONSTRAINT "product_status_events_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_status_events" ADD CONSTRAINT "product_status_events_actorUserId_fkey" FOREIGN KEY ("actorUserId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Row-level security: enabled with zero policies, the same unconditional
-- convention every table in this schema follows (docs/final-decisions.md,
-- 2026-09-17, "RLS is approved and required"). Added in the same pass this
-- migration was generated, not as a later fix.
ALTER TABLE "product_status_events" ENABLE ROW LEVEL SECURITY;
