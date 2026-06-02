-- CreateEnum
CREATE TYPE "EquipmentPlanShift" AS ENUM ('day', 'night');

-- CreateEnum
CREATE TYPE "EquipmentPlanStatus" AS ENUM ('planned', 'in_progress', 'completed', 'failed');

-- CreateTable
CREATE TABLE "EquipmentPlanAssignment" (
    "id" TEXT NOT NULL,
    "siteId" TEXT NOT NULL,
    "vehicleId" TEXT NOT NULL,
    "workDate" TIMESTAMP(3) NOT NULL,
    "shift" "EquipmentPlanShift" NOT NULL DEFAULT 'day',
    "plannedHours" INTEGER NOT NULL,
    "actualHours" INTEGER,
    "status" "EquipmentPlanStatus" NOT NULL DEFAULT 'planned',
    "notes" TEXT NOT NULL DEFAULT '',
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EquipmentPlanAssignment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "EquipmentPlanAssignment_vehicleId_workDate_shift_key" ON "EquipmentPlanAssignment"("vehicleId", "workDate", "shift");

-- CreateIndex
CREATE INDEX "EquipmentPlanAssignment_siteId_idx" ON "EquipmentPlanAssignment"("siteId");

-- CreateIndex
CREATE INDEX "EquipmentPlanAssignment_vehicleId_idx" ON "EquipmentPlanAssignment"("vehicleId");

-- CreateIndex
CREATE INDEX "EquipmentPlanAssignment_workDate_idx" ON "EquipmentPlanAssignment"("workDate");

-- CreateIndex
CREATE INDEX "EquipmentPlanAssignment_status_idx" ON "EquipmentPlanAssignment"("status");

-- AddForeignKey
ALTER TABLE "EquipmentPlanAssignment" ADD CONSTRAINT "EquipmentPlanAssignment_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "ConstructionSite"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EquipmentPlanAssignment" ADD CONSTRAINT "EquipmentPlanAssignment_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "FleetVehicle"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EquipmentPlanAssignment" ADD CONSTRAINT "EquipmentPlanAssignment_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
