-- MVP-020, FR-004 (Consent and legal deletion workflow). Purely additive: no
-- existing table is altered, no data migration. Fully reversible — DROP
-- TABLE all four, in reverse dependency order (deletion_request_events,
-- deletion_requests, consent_records, policy_versions), is the rollback.
--
-- FK onDelete is RESTRICT (not CASCADE) on every userId/actorUserId
-- reference — a deliberate divergence from entitlements.prisma's
-- Entitlement.userId CASCADE (MVP-010), decided 2026-09-22
-- (docs/final-decisions.md, "MVP-020 open questions 46, 47 and 48", question
-- 46): a cascade would let a future user-deletion destroy the very records
-- that prove what was consented to and what was requested. A future erasure
-- implementation has to handle these FKs explicitly; that is the intended
-- outcome, not an inconsistency to "fix" against the entitlements table.

-- CreateEnum
CREATE TYPE "PolicyDocumentType" AS ENUM ('TERMS_OF_SERVICE', 'PRIVACY_POLICY');

-- CreateEnum
CREATE TYPE "ConsentCategory" AS ENUM ('TERMS_OF_SERVICE', 'MARKETING_EMAIL');

-- CreateEnum
CREATE TYPE "DeletionRequestState" AS ENUM ('SUBMITTED', 'UNDER_REVIEW', 'APPROVED', 'DENIED', 'WITHDRAWN', 'COMPLETED');

-- CreateTable
CREATE TABLE "policy_versions" (
    "id" TEXT NOT NULL,
    "documentType" "PolicyDocumentType" NOT NULL,
    "version" TEXT NOT NULL,
    "effectiveAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "policy_versions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "consent_records" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "category" "ConsentCategory" NOT NULL,
    "granted" BOOLEAN NOT NULL,
    "policyVersionId" TEXT,
    "recordedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "consent_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "deletion_requests" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "deletion_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "deletion_request_events" (
    "id" TEXT NOT NULL,
    "deletionRequestId" TEXT NOT NULL,
    "toState" "DeletionRequestState" NOT NULL,
    "actorUserId" TEXT NOT NULL,
    "reason" TEXT,
    "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "deletion_request_events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "policy_versions_documentType_version_key" ON "policy_versions"("documentType", "version");

-- CreateIndex
CREATE INDEX "consent_records_userId_category_recordedAt_idx" ON "consent_records"("userId", "category", "recordedAt");

-- CreateIndex
CREATE INDEX "deletion_requests_userId_idx" ON "deletion_requests"("userId");

-- CreateIndex
CREATE INDEX "deletion_request_events_deletionRequestId_occurredAt_idx" ON "deletion_request_events"("deletionRequestId", "occurredAt");

-- AddForeignKey
ALTER TABLE "consent_records" ADD CONSTRAINT "consent_records_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "consent_records" ADD CONSTRAINT "consent_records_policyVersionId_fkey" FOREIGN KEY ("policyVersionId") REFERENCES "policy_versions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "deletion_requests" ADD CONSTRAINT "deletion_requests_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "deletion_request_events" ADD CONSTRAINT "deletion_request_events_deletionRequestId_fkey" FOREIGN KEY ("deletionRequestId") REFERENCES "deletion_requests"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "deletion_request_events" ADD CONSTRAINT "deletion_request_events_actorUserId_fkey" FOREIGN KEY ("actorUserId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Row-level security: enabled with zero policies on every new table, the
-- same unconditional convention every table in this schema follows
-- (docs/final-decisions.md, 2026-09-17, "RLS is approved and required").
ALTER TABLE "policy_versions" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "consent_records" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "deletion_requests" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "deletion_request_events" ENABLE ROW LEVEL SECURITY;
