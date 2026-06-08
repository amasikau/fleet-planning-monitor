UPDATE "FleetAuditLog"
SET "action" = 'edit'::"FleetAuditAction"
WHERE "action"::text IN ('assign_driver', 'unassign_driver');

ALTER TABLE "FleetVehicle" DROP CONSTRAINT IF EXISTS "FleetVehicle_assignedDriverUserId_fkey";
DROP INDEX IF EXISTS "FleetVehicle_assignedDriverUserId_idx";
ALTER TABLE "FleetVehicle" DROP COLUMN IF EXISTS "assignedDriverUserId";

ALTER TABLE "FleetServiceEvent" DROP CONSTRAINT IF EXISTS "FleetServiceEvent_mechanicId_fkey";
DROP INDEX IF EXISTS "FleetServiceEvent_mechanicId_idx";
ALTER TABLE "FleetServiceEvent" DROP COLUMN IF EXISTS "mechanicId";

DROP TABLE IF EXISTS "NotificationRead";
DROP TABLE IF EXISTS "Notification";
DROP TABLE IF EXISTS "MechanicAuditLog";
DROP TABLE IF EXISTS "MechanicDocument";
DROP TABLE IF EXISTS "Mechanic";
DROP TABLE IF EXISTS "DriverAuditLog";
DROP TABLE IF EXISTS "DriverDocument";
DROP TABLE IF EXISTS "Driver";

ALTER TYPE "FleetAuditAction" RENAME TO "FleetAuditAction_old";
CREATE TYPE "FleetAuditAction" AS ENUM ('create', 'edit', 'delete', 'status_change');
ALTER TABLE "FleetAuditLog"
ALTER COLUMN "action" TYPE "FleetAuditAction"
USING "action"::text::"FleetAuditAction";
DROP TYPE "FleetAuditAction_old";

DROP TYPE IF EXISTS "NotificationCategory";
DROP TYPE IF EXISTS "MechanicAuditAction";
DROP TYPE IF EXISTS "MechanicDocType";
DROP TYPE IF EXISTS "MechanicSpecialization";
DROP TYPE IF EXISTS "DriverAuditAction";
DROP TYPE IF EXISTS "DriverDocType";
DROP TYPE IF EXISTS "DrivingCategory";
