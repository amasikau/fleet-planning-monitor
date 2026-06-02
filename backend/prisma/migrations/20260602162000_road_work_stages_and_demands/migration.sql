-- CreateEnum
CREATE TYPE "RoadWorkStageType" AS ENUM ('preparation', 'earthworks', 'milling', 'base_layer', 'asphalt_paving', 'compaction', 'material_delivery', 'marking', 'maintenance');

-- CreateEnum
CREATE TYPE "RoadWorkStageStatus" AS ENUM ('planned', 'in_progress', 'completed', 'delayed');

-- CreateEnum
CREATE TYPE "EquipmentDemandPriority" AS ENUM ('normal', 'high', 'critical');

-- AlterTable
ALTER TABLE "EquipmentPlanAssignment" ADD COLUMN "stageId" TEXT;
ALTER TABLE "EquipmentPlanAssignment" ADD COLUMN "demandId" TEXT;

-- CreateTable
CREATE TABLE "RoadWorkStage" (
    "id" TEXT NOT NULL,
    "siteId" TEXT NOT NULL,
    "type" "RoadWorkStageType" NOT NULL,
    "name" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "status" "RoadWorkStageStatus" NOT NULL DEFAULT 'planned',
    "notes" TEXT NOT NULL DEFAULT '',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RoadWorkStage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EquipmentDemand" (
    "id" TEXT NOT NULL,
    "siteId" TEXT NOT NULL,
    "stageId" TEXT,
    "vehicleType" "FleetVehicleType" NOT NULL,
    "requiredCount" INTEGER NOT NULL,
    "plannedHours" INTEGER NOT NULL DEFAULT 8,
    "priority" "EquipmentDemandPriority" NOT NULL DEFAULT 'normal',
    "notes" TEXT NOT NULL DEFAULT '',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EquipmentDemand_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "EquipmentPlanAssignment_stageId_idx" ON "EquipmentPlanAssignment"("stageId");

-- CreateIndex
CREATE INDEX "EquipmentPlanAssignment_demandId_idx" ON "EquipmentPlanAssignment"("demandId");

-- CreateIndex
CREATE INDEX "RoadWorkStage_siteId_idx" ON "RoadWorkStage"("siteId");

-- CreateIndex
CREATE INDEX "RoadWorkStage_type_idx" ON "RoadWorkStage"("type");

-- CreateIndex
CREATE INDEX "RoadWorkStage_status_idx" ON "RoadWorkStage"("status");

-- CreateIndex
CREATE INDEX "RoadWorkStage_startDate_idx" ON "RoadWorkStage"("startDate");

-- CreateIndex
CREATE INDEX "RoadWorkStage_endDate_idx" ON "RoadWorkStage"("endDate");

-- CreateIndex
CREATE INDEX "EquipmentDemand_siteId_idx" ON "EquipmentDemand"("siteId");

-- CreateIndex
CREATE INDEX "EquipmentDemand_stageId_idx" ON "EquipmentDemand"("stageId");

-- CreateIndex
CREATE INDEX "EquipmentDemand_vehicleType_idx" ON "EquipmentDemand"("vehicleType");

-- CreateIndex
CREATE INDEX "EquipmentDemand_priority_idx" ON "EquipmentDemand"("priority");

-- AddForeignKey
ALTER TABLE "RoadWorkStage" ADD CONSTRAINT "RoadWorkStage_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "ConstructionSite"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EquipmentDemand" ADD CONSTRAINT "EquipmentDemand_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "ConstructionSite"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EquipmentDemand" ADD CONSTRAINT "EquipmentDemand_stageId_fkey" FOREIGN KEY ("stageId") REFERENCES "RoadWorkStage"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EquipmentPlanAssignment" ADD CONSTRAINT "EquipmentPlanAssignment_stageId_fkey" FOREIGN KEY ("stageId") REFERENCES "RoadWorkStage"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EquipmentPlanAssignment" ADD CONSTRAINT "EquipmentPlanAssignment_demandId_fkey" FOREIGN KEY ("demandId") REFERENCES "EquipmentDemand"("id") ON DELETE SET NULL ON UPDATE CASCADE;
