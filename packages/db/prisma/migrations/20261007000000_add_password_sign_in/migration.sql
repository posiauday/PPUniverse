-- MVP-036 (docs/final-decisions.md, 2026-10-06, "Email and password sign-in:
-- rules"; docs/plans/mvp-036-password-sign-in.md): email and password sign-in
-- alongside the email link and Google.
--
-- Purely additive: three new tables, one new enum type and two new values on
-- "EmailMessageType". No existing row or column changes. Rollback, in order
-- (the two enum values can't be dropped in place; leaving them is harmless):
--   DROP TABLE "auth_throttle";
--   DROP TABLE "password_tokens";
--   DROP TABLE "password_credentials";
--   DROP TYPE "PasswordTokenPurpose";
--
-- password_credentials cascades with its user (a deleted account leaves no
-- hash behind). password_tokens and auth_throttle hold no foreign key: a
-- sign-up token exists before its user does, and throttle keys are hashes.

-- AlterEnum
ALTER TYPE "EmailMessageType" ADD VALUE 'PASSWORD_CONFIRM';
ALTER TYPE "EmailMessageType" ADD VALUE 'PASSWORD_SET_LINK';

-- CreateEnum
CREATE TYPE "PasswordTokenPurpose" AS ENUM ('CONFIRM_SIGNUP', 'SET_PASSWORD');

-- CreateTable
CREATE TABLE "password_credentials" (
    "userId" TEXT NOT NULL,
    "hash" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "password_credentials_pkey" PRIMARY KEY ("userId")
);

-- CreateTable
CREATE TABLE "password_tokens" (
    "id" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "purpose" "PasswordTokenPurpose" NOT NULL,
    "email" TEXT NOT NULL,
    "pendingHash" TEXT,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "usedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "password_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "auth_throttle" (
    "key" TEXT NOT NULL,
    "failures" INTEGER NOT NULL,
    "windowStart" TIMESTAMP(3) NOT NULL,
    "lockedUntil" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "auth_throttle_pkey" PRIMARY KEY ("key")
);

-- CreateIndex
CREATE UNIQUE INDEX "password_tokens_tokenHash_key" ON "password_tokens"("tokenHash");

-- CreateIndex
CREATE INDEX "password_tokens_expiresAt_idx" ON "password_tokens"("expiresAt");

-- AddForeignKey
ALTER TABLE "password_credentials" ADD CONSTRAINT "password_credentials_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Row-level security: enabled with zero policies, the same unconditional
-- convention every table in this schema follows (docs/final-decisions.md,
-- 2026-09-17, "RLS is approved and required").
ALTER TABLE "password_credentials" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "password_tokens" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "auth_throttle" ENABLE ROW LEVEL SECURITY;
