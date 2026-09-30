-- MVP-010 (FR-005, Free entitlement flow). Purely additive: no existing
-- table is altered. Reversible: DROP TABLE "downloads", then DROP TABLE
-- "entitlements", then DROP TYPE "EntitlementSource" is the rollback, in
-- reverse dependency order.
--
-- RLS is enabled at the end of this migration, in the same migration that
-- creates these tables, per the established convention (docs/final-
-- decisions.md 2026-09-17; see 20260921000000_add_product_evidence for the
-- most recent precedent) — never deferred to a follow-up migration.

-- CreateEnum
CREATE TYPE "EntitlementSource" AS ENUM ('FREE_POLICY');

-- CreateTable
CREATE TABLE "entitlements" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "source" "EntitlementSource" NOT NULL,
    "grantedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "revokedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "entitlements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "downloads" (
    "id" TEXT NOT NULL,
    "entitlementId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "requestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "downloads_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "entitlements_productId_idx" ON "entitlements"("productId");

-- CreateIndex
CREATE UNIQUE INDEX "entitlements_userId_productId_key" ON "entitlements"("userId", "productId");

-- CreateIndex
CREATE INDEX "downloads_entitlementId_idx" ON "downloads"("entitlementId");

-- CreateIndex
CREATE INDEX "downloads_userId_idx" ON "downloads"("userId");

-- CreateIndex
CREATE INDEX "downloads_productId_idx" ON "downloads"("productId");

-- CreateIndex
CREATE INDEX "downloads_requestedAt_idx" ON "downloads"("requestedAt");

-- AddForeignKey
ALTER TABLE "entitlements" ADD CONSTRAINT "entitlements_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "entitlements" ADD CONSTRAINT "entitlements_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "downloads" ADD CONSTRAINT "downloads_entitlementId_fkey" FOREIGN KEY ("entitlementId") REFERENCES "entitlements"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Row Level Security (docs/final-decisions.md 2026-09-17): enabled with zero
-- policies, exactly as every other table in this schema. Standard PostgreSQL
-- default-denies all access to any role without table ownership or
-- BYPASSRLS once RLS is enabled; the app's own table-owning role is
-- unaffected. Not hand-expressible in schema.prisma — Prisma's schema
-- language has no RLS syntax, which is why this is a hand-written addition
-- to the generated migration, not something `prisma migrate dev` produced
-- on its own.
ALTER TABLE "entitlements" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "downloads" ENABLE ROW LEVEL SECURITY;
