-- CreateTable
CREATE TABLE "release_files" (
    "releaseId" TEXT NOT NULL,
    "fileScanId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "release_files_pkey" PRIMARY KEY ("releaseId","fileScanId")
);

-- CreateIndex
CREATE INDEX "release_files_fileScanId_idx" ON "release_files"("fileScanId");

-- AddForeignKey
ALTER TABLE "release_files" ADD CONSTRAINT "release_files_releaseId_fkey" FOREIGN KEY ("releaseId") REFERENCES "releases"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "release_files" ADD CONSTRAINT "release_files_fileScanId_fkey" FOREIGN KEY ("fileScanId") REFERENCES "file_scans"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
