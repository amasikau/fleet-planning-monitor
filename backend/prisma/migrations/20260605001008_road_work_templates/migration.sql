-- CreateEnum
CREATE TYPE "EquipmentCalculationKind" AS ENUM ('fixed', 'per_km', 'asphalt_delivery');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "RoadWorkStageType" ADD VALUE 'survey';
ALTER TYPE "RoadWorkStageType" ADD VALUE 'traffic_control';
ALTER TYPE "RoadWorkStageType" ADD VALUE 'tack_coat';
ALTER TYPE "RoadWorkStageType" ADD VALUE 'quality_control';

ALTER TYPE "FleetVehicleType" ADD VALUE 'road_milling_machine';

-- AlterTable
ALTER TABLE "FleetServiceEvent" ALTER COLUMN "updatedAt" DROP DEFAULT;

-- CreateTable
CREATE TABLE "RoadWorkTypeTemplate" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "defaultLengthKm" DOUBLE PRECISION NOT NULL DEFAULT 1,
    "defaultWidthM" DOUBLE PRECISION NOT NULL DEFAULT 7,
    "defaultShiftHours" INTEGER NOT NULL DEFAULT 8,
    "defaultHaulDistanceKm" DOUBLE PRECISION NOT NULL DEFAULT 12,
    "productionRateMPerDay" INTEGER NOT NULL DEFAULT 750,
    "sourceNote" TEXT NOT NULL DEFAULT '',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RoadWorkTypeTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RoadWorkStageTemplate" (
    "id" TEXT NOT NULL,
    "workTypeId" TEXT NOT NULL,
    "type" "RoadWorkStageType" NOT NULL,
    "name" TEXT NOT NULL,
    "sequence" INTEGER NOT NULL,
    "startOffsetDays" INTEGER NOT NULL DEFAULT 0,
    "durationDays" INTEGER NOT NULL DEFAULT 1,
    "canOverlap" BOOLEAN NOT NULL DEFAULT false,
    "notes" TEXT NOT NULL DEFAULT '',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RoadWorkStageTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RoadWorkStageEquipmentTemplate" (
    "id" TEXT NOT NULL,
    "stageTemplateId" TEXT NOT NULL,
    "vehicleType" "FleetVehicleType" NOT NULL,
    "calculationKind" "EquipmentCalculationKind" NOT NULL DEFAULT 'fixed',
    "baseCount" INTEGER NOT NULL DEFAULT 1,
    "countPerKm" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "minCount" INTEGER NOT NULL DEFAULT 1,
    "maxCount" INTEGER,
    "plannedHours" INTEGER NOT NULL DEFAULT 8,
    "priority" "EquipmentDemandPriority" NOT NULL DEFAULT 'normal',
    "notes" TEXT NOT NULL DEFAULT '',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RoadWorkStageEquipmentTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "RoadWorkTypeTemplate_code_key" ON "RoadWorkTypeTemplate"("code");

-- CreateIndex
CREATE INDEX "RoadWorkStageTemplate_workTypeId_idx" ON "RoadWorkStageTemplate"("workTypeId");

-- CreateIndex
CREATE INDEX "RoadWorkStageTemplate_sequence_idx" ON "RoadWorkStageTemplate"("sequence");

-- CreateIndex
CREATE INDEX "RoadWorkStageEquipmentTemplate_stageTemplateId_idx" ON "RoadWorkStageEquipmentTemplate"("stageTemplateId");

-- CreateIndex
CREATE INDEX "RoadWorkStageEquipmentTemplate_vehicleType_idx" ON "RoadWorkStageEquipmentTemplate"("vehicleType");

-- AddForeignKey
ALTER TABLE "RoadWorkStageTemplate" ADD CONSTRAINT "RoadWorkStageTemplate_workTypeId_fkey" FOREIGN KEY ("workTypeId") REFERENCES "RoadWorkTypeTemplate"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RoadWorkStageEquipmentTemplate" ADD CONSTRAINT "RoadWorkStageEquipmentTemplate_stageTemplateId_fkey" FOREIGN KEY ("stageTemplateId") REFERENCES "RoadWorkStageTemplate"("id") ON DELETE CASCADE ON UPDATE CASCADE;
