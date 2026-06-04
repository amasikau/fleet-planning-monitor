ALTER TYPE "MechanicAuditAction" ADD VALUE IF NOT EXISTS 'vehicle_type_change';

ALTER TABLE "Mechanic"
ADD COLUMN "vehicleTypes" "FleetVehicleType"[] NOT NULL DEFAULT ARRAY[]::"FleetVehicleType"[];

UPDATE "Mechanic"
SET "vehicleTypes" = ARRAY['dump_truck', 'excavator', 'loader', 'crane']::"FleetVehicleType"[]
WHERE cardinality("vehicleTypes") = 0;
