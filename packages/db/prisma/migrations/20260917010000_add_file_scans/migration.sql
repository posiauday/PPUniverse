-- CreateEnum
CREATE TYPE "FileScanStatus" AS ENUM ('UPLOADED', 'QUARANTINED', 'SCANNING', 'CLEAN', 'REJECTED', 'OVERRIDDEN');

-- CreateTable
CREATE TABLE "file_scans" (
    "id" TEXT NOT NULL,
    "storageKey" TEXT NOT NULL,
    "originalFilename" TEXT NOT NULL,
    "declaredMimeType" TEXT NOT NULL,
    "detectedMimeType" TEXT,
    "sizeBytes" INTEGER NOT NULL,
    "status" "FileScanStatus" NOT NULL DEFAULT 'UPLOADED',
    "rejectionReason" TEXT,
    "uploadedByUserId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "scanStartedAt" TIMESTAMP(3),
    "scanCompletedAt" TIMESTAMP(3),

    CONSTRAINT "file_scans_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "file_scans_storageKey_key" ON "file_scans"("storageKey");

-- CreateIndex
CREATE INDEX "file_scans_uploadedByUserId_idx" ON "file_scans"("uploadedByUserId");

-- AddForeignKey
ALTER TABLE "file_scans" ADD CONSTRAINT "file_scans_uploadedByUserId_fkey" FOREIGN KEY ("uploadedByUserId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
