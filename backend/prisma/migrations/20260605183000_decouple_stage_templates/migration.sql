-- CreateTable
CREATE TABLE "RoadWorkTypeStageTemplate" (
    "id" TEXT NOT NULL,
    "workTypeId" TEXT NOT NULL,
    "stageTemplateId" TEXT NOT NULL,
    "sequence" INTEGER NOT NULL,
    "startOffsetDays" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RoadWorkTypeStageTemplate_pkey" PRIMARY KEY ("id")
);

-- Preserve existing "stage belongs to work type" data as explicit links.
INSERT INTO "RoadWorkTypeStageTemplate" (
    "id",
    "workTypeId",
    "stageTemplateId",
    "sequence",
    "startOffsetDays",
    "createdAt",
    "updatedAt"
)
SELECT
    md5("id" || "workTypeId"),
    "workTypeId",
    "id",
    "sequence",
    "startOffsetDays",
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
FROM "RoadWorkStageTemplate";

-- DropForeignKey
ALTER TABLE "RoadWorkStageTemplate" DROP CONSTRAINT "RoadWorkStageTemplate_workTypeId_fkey";

-- DropIndex
DROP INDEX IF EXISTS "RoadWorkStageTemplate_workTypeId_idx";
DROP INDEX IF EXISTS "RoadWorkStageTemplate_sequence_idx";

-- AlterTable
ALTER TABLE "RoadWorkStageTemplate" DROP COLUMN "workTypeId",
DROP COLUMN "sequence",
DROP COLUMN "startOffsetDays";

-- CreateIndex
CREATE UNIQUE INDEX "RoadWorkTypeStageTemplate_workTypeId_stageTemplateId_key" ON "RoadWorkTypeStageTemplate"("workTypeId", "stageTemplateId");

-- CreateIndex
CREATE INDEX "RoadWorkTypeStageTemplate_workTypeId_idx" ON "RoadWorkTypeStageTemplate"("workTypeId");

-- CreateIndex
CREATE INDEX "RoadWorkTypeStageTemplate_stageTemplateId_idx" ON "RoadWorkTypeStageTemplate"("stageTemplateId");

-- CreateIndex
CREATE INDEX "RoadWorkTypeStageTemplate_sequence_idx" ON "RoadWorkTypeStageTemplate"("sequence");

-- CreateIndex
CREATE INDEX "RoadWorkStageTemplate_type_idx" ON "RoadWorkStageTemplate"("type");

-- CreateIndex
CREATE INDEX "RoadWorkStageTemplate_name_idx" ON "RoadWorkStageTemplate"("name");

-- AddForeignKey
ALTER TABLE "RoadWorkTypeStageTemplate" ADD CONSTRAINT "RoadWorkTypeStageTemplate_workTypeId_fkey" FOREIGN KEY ("workTypeId") REFERENCES "RoadWorkTypeTemplate"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RoadWorkTypeStageTemplate" ADD CONSTRAINT "RoadWorkTypeStageTemplate_stageTemplateId_fkey" FOREIGN KEY ("stageTemplateId") REFERENCES "RoadWorkStageTemplate"("id") ON DELETE CASCADE ON UPDATE CASCADE;
