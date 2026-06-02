ALTER TABLE "FleetServiceEvent" ALTER COLUMN "dueAt" DROP NOT NULL;

ALTER TABLE "FleetServiceEvent"
ADD COLUMN "reportedById" TEXT,
ADD COLUMN "defectDescription" TEXT NOT NULL DEFAULT '',
ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

CREATE INDEX "FleetServiceEvent_mechanicId_idx" ON "FleetServiceEvent"("mechanicId");
CREATE INDEX "FleetServiceEvent_reportedById_idx" ON "FleetServiceEvent"("reportedById");

ALTER TABLE "FleetServiceEvent"
ADD CONSTRAINT "FleetServiceEvent_reportedById_fkey"
FOREIGN KEY ("reportedById") REFERENCES "User"("id")
ON DELETE SET NULL ON UPDATE CASCADE;
