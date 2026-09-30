-- MVP-018, FR-013 (Transactional email and preferences). Purely additive: no
-- existing table is altered, no data migration. Fully reversible — DROP
-- TABLE "email_sends" is the rollback. userId is nullable (a first-time
-- sign-in link may be sent before a User row exists) and Restrict (not
-- Cascade) on delete, consistent with MVP-020's deliberate divergence: an
-- audit trail should not be destroyed by the event it is auditing.

-- CreateEnum
CREATE TYPE "EmailMessageType" AS ENUM ('SIGNIN_LINK', 'DELETION_REQUEST_SUBMITTED');

-- CreateEnum
CREATE TYPE "EmailSendStatus" AS ENUM ('SENT', 'FAILED', 'SKIPPED_NO_CONSENT');

-- CreateTable
CREATE TABLE "email_sends" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "messageType" "EmailMessageType" NOT NULL,
    "status" "EmailSendStatus" NOT NULL,
    "providerMessageId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "email_sends_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "email_sends_userId_idx" ON "email_sends"("userId");

-- CreateIndex
CREATE INDEX "email_sends_messageType_createdAt_idx" ON "email_sends"("messageType", "createdAt");

-- AddForeignKey
ALTER TABLE "email_sends" ADD CONSTRAINT "email_sends_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Row-level security: enabled with zero policies, the same unconditional
-- convention every table in this schema follows (docs/final-decisions.md,
-- 2026-09-17, "RLS is approved and required").
ALTER TABLE "email_sends" ENABLE ROW LEVEL SECURITY;
