/*
  Warnings:

  - The values [status_change,progress_change,assign_manager,unassign_manager] on the enum `ConstructionSiteAuditAction` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `areaSqM` on the `ConstructionSite` table. All the data in the column will be lost.
  - You are about to drop the column `code` on the `ConstructionSite` table. All the data in the column will be lost.
  - You are about to drop the column `customer` on the `ConstructionSite` table. All the data in the column will be lost.
  - You are about to drop the column `deadline` on the `ConstructionSite` table. All the data in the column will be lost.
  - You are about to drop the column `district` on the `ConstructionSite` table. All the data in the column will be lost.
  - You are about to drop the column `machineryCount` on the `ConstructionSite` table. All the data in the column will be lost.
  - You are about to drop the column `managerUserId` on the `ConstructionSite` table. All the data in the column will be lost.
  - You are about to drop the column `priority` on the `ConstructionSite` table. All the data in the column will be lost.
  - You are about to drop the column `progressPercent` on the `ConstructionSite` table. All the data in the column will be lost.
  - You are about to drop the column `startDate` on the `ConstructionSite` table. All the data in the column will be lost.
  - You are about to drop the column `status` on the `ConstructionSite` table. All the data in the column will be lost.
  - You are about to drop the column `workforceCount` on the `ConstructionSite` table. All the data in the column will be lost.
  - Added the required column `workPeriodEnd` to the `ConstructionSite` table without a default value. This is not possible if the table is not empty.

*/
-- Clear existing audit logs that reference old enum values
DELETE FROM "ConstructionSiteAuditLog";
-- Clear existing construction sites so we can alter the table
DELETE FROM "ConstructionSite";

-- AlterEnum
BEGIN;
CREATE TYPE "ConstructionSiteAuditAction_new" AS ENUM ('create', 'edit', 'delete', 'complete', 'assign_vehicle', 'unassign_vehicle');
ALTER TABLE "ConstructionSiteAuditLog" ALTER COLUMN "action" TYPE "ConstructionSiteAuditAction_new" USING ("action"::text::"ConstructionSiteAuditAction_new");
ALTER TYPE "ConstructionSiteAuditAction" RENAME TO "ConstructionSiteAuditAction_old";
ALTER TYPE "ConstructionSiteAuditAction_new" RENAME TO "ConstructionSiteAuditAction";
DROP TYPE "public"."ConstructionSiteAuditAction_old";
COMMIT;

-- DropForeignKey
ALTER TABLE "ConstructionSite" DROP CONSTRAINT "ConstructionSite_managerUserId_fkey";

-- DropIndex
DROP INDEX "ConstructionSite_code_key";

-- DropIndex
DROP INDEX "ConstructionSite_deadline_idx";

-- DropIndex
DROP INDEX "ConstructionSite_managerUserId_idx";

-- DropIndex
DROP INDEX "ConstructionSite_priority_idx";

-- DropIndex
DROP INDEX "ConstructionSite_status_idx";

-- AlterTable
ALTER TABLE "ConstructionSite" DROP COLUMN "areaSqM",
DROP COLUMN "code",
DROP COLUMN "customer",
DROP COLUMN "deadline",
DROP COLUMN "district",
DROP COLUMN "machineryCount",
DROP COLUMN "managerUserId",
DROP COLUMN "priority",
DROP COLUMN "progressPercent",
DROP COLUMN "startDate",
DROP COLUMN "status",
DROP COLUMN "workforceCount",
ADD COLUMN     "completedAt" TIMESTAMP(3),
ADD COLUMN     "isCompleted" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "latitude" DOUBLE PRECISION,
ADD COLUMN     "longitude" DOUBLE PRECISION,
ADD COLUMN     "workPeriodEnd" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "workPeriodStart" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "workType" TEXT NOT NULL DEFAULT '',
ALTER COLUMN "address" SET DEFAULT '';

-- DropEnum
DROP TYPE "ConstructionSitePriority";

-- DropEnum
DROP TYPE "ConstructionSiteStatus";

-- CreateTable
CREATE TABLE "SiteVehicle" (
    "id" TEXT NOT NULL,
    "siteId" TEXT NOT NULL,
    "vehicleId" TEXT NOT NULL,
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SiteVehicle_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SiteVehicle_siteId_idx" ON "SiteVehicle"("siteId");

-- CreateIndex
CREATE INDEX "SiteVehicle_vehicleId_idx" ON "SiteVehicle"("vehicleId");

-- CreateIndex
CREATE UNIQUE INDEX "SiteVehicle_siteId_vehicleId_key" ON "SiteVehicle"("siteId", "vehicleId");

-- CreateIndex
CREATE INDEX "ConstructionSite_isCompleted_idx" ON "ConstructionSite"("isCompleted");

-- CreateIndex
CREATE INDEX "ConstructionSite_workPeriodEnd_idx" ON "ConstructionSite"("workPeriodEnd");

-- AddForeignKey
ALTER TABLE "SiteVehicle" ADD CONSTRAINT "SiteVehicle_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "ConstructionSite"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SiteVehicle" ADD CONSTRAINT "SiteVehicle_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "FleetVehicle"("id") ON DELETE CASCADE ON UPDATE CASCADE;
