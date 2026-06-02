-- CreateEnum
CREATE TYPE "MechanicSpecialization" AS ENUM ('engine', 'transmission', 'electrical', 'suspension', 'brakes', 'diagnostics', 'bodywork', 'tire_service');

-- CreateEnum
CREATE TYPE "MechanicDocType" AS ENUM ('certificate', 'medical');

-- CreateEnum
CREATE TYPE "MechanicAuditAction" AS ENUM ('assign', 'doc_upload', 'doc_remove', 'specialization_change', 'unassign');

-- CreateTable
CREATE TABLE "Mechanic" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "specializations" "MechanicSpecialization"[],
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Mechanic_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MechanicDocument" (
    "id" TEXT NOT NULL,
    "mechanicId" TEXT NOT NULL,
    "type" "MechanicDocType" NOT NULL,
    "fileName" TEXT NOT NULL,
    "filePath" TEXT NOT NULL DEFAULT '',
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MechanicDocument_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MechanicAuditLog" (
    "id" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "action" "MechanicAuditAction" NOT NULL,
    "targetUserId" TEXT NOT NULL,
    "performedById" TEXT NOT NULL,
    "details" TEXT NOT NULL,

    CONSTRAINT "MechanicAuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Mechanic_userId_key" ON "Mechanic"("userId");

-- AddForeignKey
ALTER TABLE "Mechanic" ADD CONSTRAINT "Mechanic_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MechanicDocument" ADD CONSTRAINT "MechanicDocument_mechanicId_fkey" FOREIGN KEY ("mechanicId") REFERENCES "Mechanic"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MechanicAuditLog" ADD CONSTRAINT "MechanicAuditLog_targetUserId_fkey" FOREIGN KEY ("targetUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MechanicAuditLog" ADD CONSTRAINT "MechanicAuditLog_performedById_fkey" FOREIGN KEY ("performedById") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
