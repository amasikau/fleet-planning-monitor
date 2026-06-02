-- CreateEnum
CREATE TYPE "FleetVehicleType" AS ENUM ('dump_truck', 'crane', 'excavator', 'loader', 'van', 'pickup');

-- CreateEnum
CREATE TYPE "FleetVehicleStatus" AS ENUM ('active', 'reserve', 'maintenance', 'repair');

-- CreateEnum
CREATE TYPE "FleetServiceEventType" AS ENUM ('maintenance', 'inspection', 'repair', 'insurance', 'diagnostics');

-- CreateEnum
CREATE TYPE "FleetServiceEventStatus" AS ENUM ('scheduled', 'in_progress', 'overdue', 'completed');

-- CreateEnum
CREATE TYPE "FleetAuditAction" AS ENUM ('create', 'edit', 'delete', 'status_change', 'assign_driver', 'unassign_driver');

-- CreateEnum
CREATE TYPE "ConstructionSiteStatus" AS ENUM ('planning', 'active', 'paused', 'completed');

-- CreateEnum
CREATE TYPE "ConstructionSitePriority" AS ENUM ('standard', 'high', 'critical');

-- CreateEnum
CREATE TYPE "ConstructionSiteAuditAction" AS ENUM ('create', 'edit', 'delete', 'status_change', 'progress_change', 'assign_manager', 'unassign_manager');

-- CreateTable
CREATE TABLE "FleetVehicle" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "brand" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "plateNumber" TEXT NOT NULL,
    "vin" TEXT NOT NULL,
    "type" "FleetVehicleType" NOT NULL DEFAULT 'pickup',
    "status" "FleetVehicleStatus" NOT NULL DEFAULT 'active',
    "year" INTEGER NOT NULL DEFAULT 2024,
    "odometerKm" INTEGER NOT NULL DEFAULT 0,
    "fuelLevelPercent" INTEGER NOT NULL DEFAULT 100,
    "baseName" TEXT NOT NULL DEFAULT '',
    "currentSite" TEXT NOT NULL DEFAULT '',
    "assignedDriverUserId" TEXT,
    "nextMaintenanceAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "nextMaintenanceKm" INTEGER NOT NULL DEFAULT 0,
    "insuranceExpiresAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "diagnosticsExpiresAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "notes" TEXT NOT NULL DEFAULT '',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FleetVehicle_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FleetServiceEvent" (
    "id" TEXT NOT NULL,
    "vehicleId" TEXT NOT NULL,
    "type" "FleetServiceEventType" NOT NULL,
    "status" "FleetServiceEventStatus" NOT NULL,
    "title" TEXT NOT NULL,
    "dueAt" TIMESTAMP(3) NOT NULL,
    "completedAt" TIMESTAMP(3),
    "mileageKm" INTEGER,
    "mechanicId" TEXT,
    "notes" TEXT NOT NULL DEFAULT '',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FleetServiceEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FleetAuditLog" (
    "id" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "action" "FleetAuditAction" NOT NULL,
    "targetVehicleId" TEXT,
    "vehicleLabel" TEXT NOT NULL,
    "performedById" TEXT NOT NULL,
    "details" TEXT NOT NULL,

    CONSTRAINT "FleetAuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ConstructionSite" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "district" TEXT NOT NULL DEFAULT '',
    "customer" TEXT NOT NULL DEFAULT '',
    "status" "ConstructionSiteStatus" NOT NULL DEFAULT 'planning',
    "priority" "ConstructionSitePriority" NOT NULL DEFAULT 'standard',
    "progressPercent" INTEGER NOT NULL DEFAULT 0,
    "workforceCount" INTEGER NOT NULL DEFAULT 0,
    "machineryCount" INTEGER NOT NULL DEFAULT 0,
    "areaSqM" INTEGER NOT NULL DEFAULT 0,
    "startDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deadline" TIMESTAMP(3) NOT NULL,
    "managerUserId" TEXT,
    "notes" TEXT NOT NULL DEFAULT '',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ConstructionSite_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ConstructionSiteAuditLog" (
    "id" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "action" "ConstructionSiteAuditAction" NOT NULL,
    "targetSiteId" TEXT,
    "siteLabel" TEXT NOT NULL,
    "performedById" TEXT NOT NULL,
    "details" TEXT NOT NULL,

    CONSTRAINT "ConstructionSiteAuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "FleetVehicle_plateNumber_key" ON "FleetVehicle"("plateNumber");

-- CreateIndex
CREATE UNIQUE INDEX "FleetVehicle_vin_key" ON "FleetVehicle"("vin");

-- CreateIndex
CREATE INDEX "FleetVehicle_status_idx" ON "FleetVehicle"("status");

-- CreateIndex
CREATE INDEX "FleetVehicle_type_idx" ON "FleetVehicle"("type");

-- CreateIndex
CREATE INDEX "FleetVehicle_assignedDriverUserId_idx" ON "FleetVehicle"("assignedDriverUserId");

-- CreateIndex
CREATE INDEX "FleetServiceEvent_vehicleId_idx" ON "FleetServiceEvent"("vehicleId");

-- CreateIndex
CREATE INDEX "FleetServiceEvent_status_idx" ON "FleetServiceEvent"("status");

-- CreateIndex
CREATE INDEX "FleetServiceEvent_dueAt_idx" ON "FleetServiceEvent"("dueAt");

-- CreateIndex
CREATE INDEX "FleetAuditLog_timestamp_idx" ON "FleetAuditLog"("timestamp");

-- CreateIndex
CREATE INDEX "FleetAuditLog_action_idx" ON "FleetAuditLog"("action");

-- CreateIndex
CREATE INDEX "FleetAuditLog_targetVehicleId_idx" ON "FleetAuditLog"("targetVehicleId");

-- CreateIndex
CREATE UNIQUE INDEX "ConstructionSite_code_key" ON "ConstructionSite"("code");

-- CreateIndex
CREATE INDEX "ConstructionSite_status_idx" ON "ConstructionSite"("status");

-- CreateIndex
CREATE INDEX "ConstructionSite_priority_idx" ON "ConstructionSite"("priority");

-- CreateIndex
CREATE INDEX "ConstructionSite_deadline_idx" ON "ConstructionSite"("deadline");

-- CreateIndex
CREATE INDEX "ConstructionSite_managerUserId_idx" ON "ConstructionSite"("managerUserId");

-- CreateIndex
CREATE INDEX "ConstructionSiteAuditLog_timestamp_idx" ON "ConstructionSiteAuditLog"("timestamp");

-- CreateIndex
CREATE INDEX "ConstructionSiteAuditLog_action_idx" ON "ConstructionSiteAuditLog"("action");

-- CreateIndex
CREATE INDEX "ConstructionSiteAuditLog_targetSiteId_idx" ON "ConstructionSiteAuditLog"("targetSiteId");

-- AddForeignKey
ALTER TABLE "FleetVehicle" ADD CONSTRAINT "FleetVehicle_assignedDriverUserId_fkey" FOREIGN KEY ("assignedDriverUserId") REFERENCES "Driver"("userId") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FleetServiceEvent" ADD CONSTRAINT "FleetServiceEvent_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "FleetVehicle"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FleetServiceEvent" ADD CONSTRAINT "FleetServiceEvent_mechanicId_fkey" FOREIGN KEY ("mechanicId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FleetAuditLog" ADD CONSTRAINT "FleetAuditLog_targetVehicleId_fkey" FOREIGN KEY ("targetVehicleId") REFERENCES "FleetVehicle"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FleetAuditLog" ADD CONSTRAINT "FleetAuditLog_performedById_fkey" FOREIGN KEY ("performedById") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConstructionSite" ADD CONSTRAINT "ConstructionSite_managerUserId_fkey" FOREIGN KEY ("managerUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConstructionSiteAuditLog" ADD CONSTRAINT "ConstructionSiteAuditLog_targetSiteId_fkey" FOREIGN KEY ("targetSiteId") REFERENCES "ConstructionSite"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConstructionSiteAuditLog" ADD CONSTRAINT "ConstructionSiteAuditLog_performedById_fkey" FOREIGN KEY ("performedById") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
