/*
  Warnings:

  - You are about to drop the column `settings` on the `companies` table. All the data in the column will be lost.
  - You are about to drop the column `description` on the `documents` table. All the data in the column will be lost.
  - You are about to drop the column `fileName` on the `documents` table. All the data in the column will be lost.
  - You are about to drop the column `status` on the `documents` table. All the data in the column will be lost.
  - You are about to drop the column `tags` on the `documents` table. All the data in the column will be lost.
  - You are about to drop the column `userAgent` on the `refresh_tokens` table. All the data in the column will be lost.
  - You are about to drop the column `address` on the `seafarers` table. All the data in the column will be lost.
  - You are about to drop the column `bankAccount` on the `seafarers` table. All the data in the column will be lost.
  - You are about to drop the column `assignedAt` on the `user_roles` table. All the data in the column will be lost.
  - You are about to drop the column `assignedBy` on the `user_roles` table. All the data in the column will be lost.
  - You are about to drop the column `notes` on the `vessel_certificates` table. All the data in the column will be lost.
  - You are about to drop the column `arrivalDate` on the `voyages` table. All the data in the column will be lost.
  - You are about to drop the column `arrivalPort` on the `voyages` table. All the data in the column will be lost.
  - You are about to drop the column `cargoUnit` on the `voyages` table. All the data in the column will be lost.
  - You are about to drop the column `chartererId` on the `voyages` table. All the data in the column will be lost.
  - You are about to drop the column `departureDate` on the `voyages` table. All the data in the column will be lost.
  - You are about to alter the column `cargoQuantity` on the `voyages` table. The data in that column could be lost. The data in that column will be cast from `Decimal(12,2)` to `Decimal(10,2)`.
  - You are about to drop the `crew_contracts` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `maintenance_jobs` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `createdBy` to the `companies` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedBy` to the `companies` table without a default value. This is not possible if the table is not empty.
  - Added the required column `uploadedBy` to the `documents` table without a default value. This is not possible if the table is not empty.
  - Made the column `fileSize` on table `documents` required. This step will fail if there are existing NULL values in that column.
  - Made the column `mimeType` on table `documents` required. This step will fail if there are existing NULL values in that column.
  - Added the required column `createdBy` to the `permissions` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `permissions` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedBy` to the `permissions` table without a default value. This is not possible if the table is not empty.
  - Added the required column `createdBy` to the `roles` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `roles` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedBy` to the `roles` table without a default value. This is not possible if the table is not empty.
  - Added the required column `createdBy` to the `user_roles` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `user_roles` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedBy` to the `user_roles` table without a default value. This is not possible if the table is not empty.
  - Added the required column `createdBy` to the `users` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedBy` to the `users` table without a default value. This is not possible if the table is not empty.
  - Added the required column `destinationPort` to the `voyages` table without a default value. This is not possible if the table is not empty.
  - Added the required column `eta` to the `voyages` table without a default value. This is not possible if the table is not empty.
  - Added the required column `etd` to the `voyages` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "crew_contracts" DROP CONSTRAINT "crew_contracts_seafarerId_fkey";

-- DropForeignKey
ALTER TABLE "maintenance_jobs" DROP CONSTRAINT "maintenance_jobs_vesselId_fkey";

-- DropIndex
DROP INDEX "documents_companyId_status_idx";

-- AlterTable
ALTER TABLE "companies" DROP COLUMN "settings",
ADD COLUMN     "createdBy" TEXT NOT NULL,
ADD COLUMN     "deletedAt" TIMESTAMP(3),
ADD COLUMN     "updatedBy" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "crew_assignments" ADD COLUMN     "deletedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "documents" DROP COLUMN "description",
DROP COLUMN "fileName",
DROP COLUMN "status",
DROP COLUMN "tags",
ADD COLUMN     "expiryDate" TIMESTAMP(3),
ADD COLUMN     "seafarerId" TEXT,
ADD COLUMN     "uploadedBy" TEXT NOT NULL,
ALTER COLUMN "fileSize" SET NOT NULL,
ALTER COLUMN "mimeType" SET NOT NULL;

-- AlterTable
ALTER TABLE "permissions" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "createdBy" TEXT NOT NULL,
ADD COLUMN     "deletedAt" TIMESTAMP(3),
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "updatedBy" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "refresh_tokens" DROP COLUMN "userAgent";

-- AlterTable
ALTER TABLE "roles" ADD COLUMN     "createdBy" TEXT NOT NULL,
ADD COLUMN     "deletedAt" TIMESTAMP(3),
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "updatedBy" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "seafarer_certificates" ADD COLUMN     "deletedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "seafarers" DROP COLUMN "address",
DROP COLUMN "bankAccount";

-- AlterTable
ALTER TABLE "user_roles" DROP COLUMN "assignedAt",
DROP COLUMN "assignedBy",
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "createdBy" TEXT NOT NULL,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "updatedBy" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "createdBy" TEXT NOT NULL,
ADD COLUMN     "updatedBy" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "vessel_certificates" DROP COLUMN "notes",
ADD COLUMN     "deletedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "voyages" DROP COLUMN "arrivalDate",
DROP COLUMN "arrivalPort",
DROP COLUMN "cargoUnit",
DROP COLUMN "chartererId",
DROP COLUMN "departureDate",
ADD COLUMN     "ata" TIMESTAMP(3),
ADD COLUMN     "atd" TIMESTAMP(3),
ADD COLUMN     "destinationPort" TEXT NOT NULL,
ADD COLUMN     "eta" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "etd" TIMESTAMP(3) NOT NULL,
ALTER COLUMN "cargoQuantity" SET DATA TYPE DECIMAL(10,2);

-- DropTable
DROP TABLE "crew_contracts";

-- DropTable
DROP TABLE "maintenance_jobs";

-- DropEnum
DROP TYPE "ContractStatus";

-- DropEnum
DROP TYPE "DocumentStatus";

-- DropEnum
DROP TYPE "JobStatus";

-- DropEnum
DROP TYPE "MaintenanceType";

-- DropEnum
DROP TYPE "Priority";

-- CreateTable
CREATE TABLE "port_calls" (
    "id" TEXT NOT NULL,
    "voyageId" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "portName" TEXT NOT NULL,
    "portCode" TEXT NOT NULL,
    "country" TEXT NOT NULL,
    "eta" TIMESTAMP(3) NOT NULL,
    "ata" TIMESTAMP(3),
    "etd" TIMESTAMP(3) NOT NULL,
    "atd" TIMESTAMP(3),
    "purpose" TEXT,
    "remarks" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT NOT NULL,
    "updatedBy" TEXT NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "port_calls_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "port_calls_companyId_voyageId_idx" ON "port_calls"("companyId", "voyageId");

-- CreateIndex
CREATE INDEX "port_calls_companyId_deletedAt_idx" ON "port_calls"("companyId", "deletedAt");

-- CreateIndex
CREATE INDEX "crew_assignments_companyId_deletedAt_idx" ON "crew_assignments"("companyId", "deletedAt");

-- CreateIndex
CREATE INDEX "documents_companyId_seafarerId_idx" ON "documents"("companyId", "seafarerId");

-- CreateIndex
CREATE INDEX "documents_companyId_deletedAt_idx" ON "documents"("companyId", "deletedAt");

-- CreateIndex
CREATE INDEX "seafarer_certificates_companyId_deletedAt_idx" ON "seafarer_certificates"("companyId", "deletedAt");

-- CreateIndex
CREATE INDEX "seafarers_companyId_deletedAt_idx" ON "seafarers"("companyId", "deletedAt");

-- CreateIndex
CREATE INDEX "users_companyId_deletedAt_idx" ON "users"("companyId", "deletedAt");

-- CreateIndex
CREATE INDEX "vessel_certificates_companyId_deletedAt_idx" ON "vessel_certificates"("companyId", "deletedAt");

-- CreateIndex
CREATE INDEX "voyages_companyId_deletedAt_idx" ON "voyages"("companyId", "deletedAt");

-- AddForeignKey
ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_vesselId_fkey" FOREIGN KEY ("vesselId") REFERENCES "vessels"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vessel_certificates" ADD CONSTRAINT "vessel_certificates_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "seafarer_certificates" ADD CONSTRAINT "seafarer_certificates_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "crew_assignments" ADD CONSTRAINT "crew_assignments_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "voyages" ADD CONSTRAINT "voyages_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "port_calls" ADD CONSTRAINT "port_calls_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "port_calls" ADD CONSTRAINT "port_calls_voyageId_fkey" FOREIGN KEY ("voyageId") REFERENCES "voyages"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "documents" ADD CONSTRAINT "documents_seafarerId_fkey" FOREIGN KEY ("seafarerId") REFERENCES "seafarers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE SET NULL ON UPDATE CASCADE;
