-- MVP-049 (docs/final-decisions.md, 2026-10-08, "Power Apps component library:
-- first, copy-paste YAML, free"; docs/plans/power-apps-component-library.md):
-- the component library and an append-only record of every test, publish and
-- setting change. Imported as drafts; publishing needs a recorded paste-test.
--
-- Additive. Rollback (no other table references these):
--   DROP TABLE "component_events";
--   DROP TABLE "library_components";
--   DROP TYPE "ComponentEventAction";
--   DROP TYPE "ComponentAccess";

-- CreateEnum
CREATE TYPE "ComponentAccess" AS ENUM ('OPEN', 'MEMBERS');

-- CreateEnum
CREATE TYPE "ComponentEventAction" AS ENUM ('TESTED', 'PUBLISHED', 'SETTINGS_CHANGED');

-- CreateTable
CREATE TABLE "library_components" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "componentName" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "guide" TEXT NOT NULL,
    "yaml" TEXT NOT NULL,
    "properties" JSONB NOT NULL,
    "variations" JSONB NOT NULL,
    "access" "ComponentAccess" NOT NULL DEFAULT 'OPEN',
    "version" TEXT NOT NULL,
    "needsModernControls" BOOLEAN NOT NULL DEFAULT true,
    "status" "ArticleStatus" NOT NULL DEFAULT 'DRAFT',
    "publishedAt" TIMESTAMP(3),
    "hidden" BOOLEAN NOT NULL DEFAULT false,
    "testedAt" TIMESTAMP(3),
    "testedStudioVersion" TEXT,
    "authorUserId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "library_components_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "component_events" (
    "id" TEXT NOT NULL,
    "componentId" TEXT NOT NULL,
    "actorUserId" TEXT NOT NULL,
    "action" "ComponentEventAction" NOT NULL,
    "detail" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "component_events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "library_components_slug_key" ON "library_components"("slug");

-- CreateIndex
CREATE INDEX "library_components_status_hidden_category_idx" ON "library_components"("status", "hidden", "category");

-- CreateIndex
CREATE INDEX "component_events_componentId_createdAt_idx" ON "component_events"("componentId", "createdAt");

-- CreateIndex
CREATE INDEX "component_events_createdAt_idx" ON "component_events"("createdAt");

-- AddForeignKey
ALTER TABLE "library_components" ADD CONSTRAINT "library_components_authorUserId_fkey" FOREIGN KEY ("authorUserId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "component_events" ADD CONSTRAINT "component_events_componentId_fkey" FOREIGN KEY ("componentId") REFERENCES "library_components"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "component_events" ADD CONSTRAINT "component_events_actorUserId_fkey" FOREIGN KEY ("actorUserId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

