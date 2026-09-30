-- Product detail evidence model (MVP-005, FR-003). Additive only: five new
-- tables, no change to any existing table, no destructive statement.
-- Compatibility model approved in docs/final-decisions.md (2026-09-21).

-- CreateEnum
CREATE TYPE "PlatformArea" AS ENUM ('POWER_APPS', 'POWER_AUTOMATE', 'POWER_BI', 'DATAVERSE', 'POWER_PAGES', 'COPILOT_STUDIO', 'MICROSOFT_FABRIC');

-- CreateEnum
CREATE TYPE "CompatibilityEvidenceStatus" AS ENUM ('TESTED', 'CREATOR_DECLARED', 'NOT_VERIFIED');

-- CreateEnum
CREATE TYPE "SupportStatus" AS ENUM ('CREATOR_SUPPORTED', 'PLATFORM_SUPPORTED', 'COMMUNITY_SUPPORTED', 'UNSUPPORTED');

-- CreateTable
CREATE TABLE "license_definitions" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "license_definitions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product_licenses" (
    "productId" TEXT NOT NULL,
    "licenseDefinitionId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "product_licenses_pkey" PRIMARY KEY ("productId","licenseDefinitionId")
);

-- CreateTable
CREATE TABLE "releases" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "version" TEXT NOT NULL,
    "publishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "releases_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "support_policies" (
    "productId" TEXT NOT NULL,
    "status" "SupportStatus" NOT NULL,
    "channel" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "support_policies_pkey" PRIMARY KEY ("productId")
);

-- CreateTable
CREATE TABLE "compatibility_records" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "platformArea" "PlatformArea" NOT NULL,
    "minReleaseYear" INTEGER NOT NULL,
    "minReleaseWave" INTEGER NOT NULL,
    "notes" TEXT,
    "evidenceStatus" "CompatibilityEvidenceStatus" NOT NULL,
    "evidenceSummary" TEXT,
    "lastVerifiedAt" DATE,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "compatibility_records_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "license_definitions_slug_key" ON "license_definitions"("slug");

-- CreateIndex
CREATE INDEX "product_licenses_licenseDefinitionId_idx" ON "product_licenses"("licenseDefinitionId");

-- CreateIndex
CREATE INDEX "releases_productId_publishedAt_idx" ON "releases"("productId", "publishedAt");

-- CreateIndex
CREATE UNIQUE INDEX "releases_productId_version_key" ON "releases"("productId", "version");

-- CreateIndex
CREATE INDEX "compatibility_records_platformArea_minReleaseYear_minReleas_idx" ON "compatibility_records"("platformArea", "minReleaseYear", "minReleaseWave");

-- CreateIndex
CREATE UNIQUE INDEX "compatibility_records_productId_platformArea_key" ON "compatibility_records"("productId", "platformArea");

-- AddForeignKey
ALTER TABLE "product_licenses" ADD CONSTRAINT "product_licenses_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_licenses" ADD CONSTRAINT "product_licenses_licenseDefinitionId_fkey" FOREIGN KEY ("licenseDefinitionId") REFERENCES "license_definitions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "releases" ADD CONSTRAINT "releases_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "support_policies" ADD CONSTRAINT "support_policies_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "compatibility_records" ADD CONSTRAINT "compatibility_records_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Hand-written CHECK constraints (Prisma's schema language cannot express
-- these and Prisma Migrate does not introspect them - do not remove).

-- Release year: deliberately wide and static so a new year never needs a
-- migration. Application validation (packages/domain/catalog) is tighter.
ALTER TABLE "compatibility_records" ADD CONSTRAINT "compatibility_records_release_year_check" CHECK ("minReleaseYear" BETWEEN 2019 AND 2100);

ALTER TABLE "compatibility_records" ADD CONSTRAINT "compatibility_records_release_wave_check" CHECK ("minReleaseWave" IN (1, 2));

-- Notes / evidence summary: concise, never blank when present.
ALTER TABLE "compatibility_records" ADD CONSTRAINT "compatibility_records_notes_check" CHECK ("notes" IS NULL OR (btrim("notes") <> '' AND char_length("notes") <= 500));

ALTER TABLE "compatibility_records" ADD CONSTRAINT "compatibility_records_evidence_summary_check" CHECK ("evidenceSummary" IS NULL OR (btrim("evidenceSummary") <> '' AND char_length("evidenceSummary") <= 500));

-- A "Tested" claim must carry its evidence summary and last verified date.
ALTER TABLE "compatibility_records" ADD CONSTRAINT "compatibility_records_tested_requires_evidence_check" CHECK ("evidenceStatus" <> 'TESTED' OR ("evidenceSummary" IS NOT NULL AND "lastVerifiedAt" IS NOT NULL));

ALTER TABLE "releases" ADD CONSTRAINT "releases_version_check" CHECK (btrim("version") <> '' AND char_length("version") <= 64);

-- Support channel is required unless the product declares itself unsupported.
ALTER TABLE "support_policies" ADD CONSTRAINT "support_policies_channel_length_check" CHECK ("channel" IS NULL OR char_length("channel") <= 300);

ALTER TABLE "support_policies" ADD CONSTRAINT "support_policies_channel_required_check" CHECK ("status" = 'UNSUPPORTED' OR ("channel" IS NOT NULL AND btrim("channel") <> ''));

-- RowLevelSecurity (docs/final-decisions.md - every table gets RLS enabled
-- with zero policies; rationale in migration 20260917020000_enable_row_level_security)
ALTER TABLE "license_definitions" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "product_licenses" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "releases" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "support_policies" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "compatibility_records" ENABLE ROW LEVEL SECURITY;
