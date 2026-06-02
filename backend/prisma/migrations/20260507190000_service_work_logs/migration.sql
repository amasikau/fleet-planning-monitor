CREATE TABLE "FleetServiceWorkLog" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "performedAt" TIMESTAMP(3) NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "mileageKm" INTEGER,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FleetServiceWorkLog_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "FleetServiceWorkLog_eventId_idx" ON "FleetServiceWorkLog"("eventId");
CREATE INDEX "FleetServiceWorkLog_performedAt_idx" ON "FleetServiceWorkLog"("performedAt");
CREATE INDEX "FleetServiceWorkLog_createdById_idx" ON "FleetServiceWorkLog"("createdById");

ALTER TABLE "FleetServiceWorkLog"
ADD CONSTRAINT "FleetServiceWorkLog_eventId_fkey"
FOREIGN KEY ("eventId") REFERENCES "FleetServiceEvent"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "FleetServiceWorkLog"
ADD CONSTRAINT "FleetServiceWorkLog_createdById_fkey"
FOREIGN KEY ("createdById") REFERENCES "User"("id")
ON DELETE SET NULL ON UPDATE CASCADE;
