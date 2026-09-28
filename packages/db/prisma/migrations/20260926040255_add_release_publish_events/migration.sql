-- CreateEnum
CREATE TYPE "ReleasePublishAction" AS ENUM ('PUBLISHED');

-- CreateTable
CREATE TABLE "release_publish_events" (
    "id" TEXT NOT NULL,
    "releaseId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "actorUserId" TEXT NOT NULL,
    "action" "ReleasePublishAction" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "release_publish_events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "release_publish_events_releaseId_createdAt_idx" ON "release_publish_events"("releaseId", "createdAt");

-- CreateIndex
CREATE INDEX "release_publish_events_productId_createdAt_idx" ON "release_publish_events"("productId", "createdAt");

-- AddForeignKey
ALTER TABLE "release_publish_events" ADD CONSTRAINT "release_publish_events_releaseId_fkey" FOREIGN KEY ("releaseId") REFERENCES "releases"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "release_publish_events" ADD CONSTRAINT "release_publish_events_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "release_publish_events" ADD CONSTRAINT "release_publish_events_actorUserId_fkey" FOREIGN KEY ("actorUserId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Row-level security: enabled with zero policies, the same unconditional
-- convention every table in this schema follows (docs/final-decisions.md,
-- 2026-09-17, "RLS is approved and required"). Added in the same pass this
-- migration was generated, not as a later fix (MVP-012's own review found
-- release_files missing this; do not repeat that gap).
ALTER TABLE "release_publish_events" ENABLE ROW LEVEL SECURITY;
