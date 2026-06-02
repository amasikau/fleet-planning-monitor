-- AlterTable
ALTER TABLE "FleetVehicle" ADD COLUMN     "previousStatus" "FleetVehicleStatus" NOT NULL DEFAULT 'active';
