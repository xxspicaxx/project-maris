-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "CompanyType" AS ENUM ('SHIP_OWNER', 'SHIP_MANAGER', 'CHARTERER', 'HOLDING');

-- CreateEnum
CREATE TYPE "PermissionScope" AS ENUM ('OWN', 'COMPANY', 'ALL');

-- CreateEnum
CREATE TYPE "VesselType" AS ENUM ('BULK_CARRIER', 'TANKER_CRUDE', 'TANKER_PRODUCT', 'TANKER_CHEMICAL', 'CONTAINER', 'GENERAL_CARGO', 'RO_RO', 'PASSENGER', 'OFFSHORE_SUPPLY', 'TUGBOAT', 'BARGE', 'LNG_CARRIER', 'OTHER');

-- CreateEnum
CREATE TYPE "VesselStatus" AS ENUM ('ACTIVE', 'DRYDOCK', 'LAID_UP', 'SCRAPPED', 'SOLD');

-- CreateEnum
CREATE TYPE "FuelType" AS ENUM ('HFO', 'MDO', 'MGO', 'LNG', 'LPG', 'METHANOL');

-- CreateEnum
CREATE TYPE "Gender" AS ENUM ('MALE', 'FEMALE');

-- CreateEnum
CREATE TYPE "SeafarerStatus" AS ENUM ('ACTIVE', 'ON_LEAVE', 'RESIGNED', 'BLACKLISTED');

-- CreateEnum
CREATE TYPE "ContractStatus" AS ENUM ('DRAFT', 'ACTIVE', 'COMPLETED', 'TERMINATED');

-- CreateEnum
CREATE TYPE "CrewRank" AS ENUM ('MASTER', 'CHIEF_OFFICER', 'SECOND_OFFICER', 'THIRD_OFFICER', 'CHIEF_ENGINEER', 'SECOND_ENGINEER', 'THIRD_ENGINEER', 'FOURTH_ENGINEER', 'BOSUN', 'ABLE_SEAMAN', 'ORDINARY_SEAMAN', 'FITTER', 'OILER', 'WIPER', 'CHIEF_COOK', 'MESSMAN', 'ELECTRICIAN', 'RADIO_OFFICER');

-- CreateEnum
CREATE TYPE "VesselCertType" AS ENUM ('SMC', 'DOC', 'ISSC', 'LOAD_LINE', 'IOPP', 'ITC', 'CSR', 'MARPOL_ANNEX_VI', 'CLASS_CERTIFICATE', 'RADIO_LICENSE', 'MINIMUM_SAFE_MANNING');

-- CreateEnum
CREATE TYPE "SeafarerCertType" AS ENUM ('COC', 'COP', 'STCW_BST', 'STCW_SCRFA', 'STCW_AFF', 'STCW_MEFA', 'STCW_MEOL', 'STCW_GMDSS', 'STCW_TANKER_OIL', 'STCW_TANKER_CHEMICAL', 'STCW_TANKER_LNG', 'MEDICAL_CERTIFICATE', 'SEAMAN_BOOK', 'PASSPORT', 'YELLOW_FEVER', 'CUSTOM');

-- CreateEnum
CREATE TYPE "CertificateStatus" AS ENUM ('VALID', 'EXPIRING_SOON', 'CRITICAL', 'EXPIRED', 'PENDING_RENEWAL', 'SUSPENDED');

-- CreateEnum
CREATE TYPE "VoyageStatus" AS ENUM ('PLANNED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "MaintenanceType" AS ENUM ('ROUTINE', 'DRYDOCK', 'REPAIR', 'OVERHAUL', 'SURVEY', 'EMERGENCY');

-- CreateEnum
CREATE TYPE "Priority" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

-- CreateEnum
CREATE TYPE "JobStatus" AS ENUM ('OPEN', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "DocumentStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "AuditAction" AS ENUM ('CREATE', 'UPDATE', 'DELETE', 'RESTORE', 'LOGIN', 'LOGOUT', 'EXPORT', 'IMPORT', 'APPROVE', 'REJECT');

-- CreateTable
CREATE TABLE "companies" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "CompanyType" NOT NULL,
    "country" TEXT NOT NULL,
    "address" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "taxId" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "settings" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "companies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "phone" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastLoginAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "refresh_tokens" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "revokedAt" TIMESTAMP(3),
    "ipAddress" TEXT,
    "userAgent" TEXT,

    CONSTRAINT "refresh_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "roles" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "description" TEXT,
    "isSystem" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "permissions" (
    "id" TEXT NOT NULL,
    "resource" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "scope" "PermissionScope" NOT NULL,
    "description" TEXT,

    CONSTRAINT "permissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_roles" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "roleId" TEXT NOT NULL,
    "vesselId" TEXT,
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "assignedBy" TEXT NOT NULL,

    CONSTRAINT "user_roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "role_permissions" (
    "roleId" TEXT NOT NULL,
    "permissionId" TEXT NOT NULL,

    CONSTRAINT "role_permissions_pkey" PRIMARY KEY ("roleId","permissionId")
);

-- CreateTable
CREATE TABLE "vessels" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "imoNumber" TEXT NOT NULL,
    "mmsiNumber" TEXT,
    "name" TEXT NOT NULL,
    "formerNames" TEXT[],
    "callSign" TEXT,
    "flagState" TEXT NOT NULL,
    "portOfRegistry" TEXT,
    "vesselType" "VesselType" NOT NULL,
    "status" "VesselStatus" NOT NULL DEFAULT 'ACTIVE',
    "grossTonnage" DECIMAL(10,2) NOT NULL,
    "netTonnage" DECIMAL(10,2),
    "deadweightTonnage" DECIMAL(10,2),
    "lengthOverall" DECIMAL(8,2),
    "breadth" DECIMAL(8,2),
    "depth" DECIMAL(8,2),
    "yearBuilt" INTEGER,
    "shipyard" TEXT,
    "shipyardCountry" TEXT,
    "classNumber" TEXT,
    "classSociety" TEXT,
    "mainEngineType" TEXT,
    "mainEnginePower" DECIMAL(10,2),
    "fuelType" "FuelType",
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT NOT NULL,
    "updatedBy" TEXT NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "vessels_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "seafarers" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "seamanBookNumber" TEXT,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "nationality" TEXT NOT NULL,
    "dateOfBirth" TIMESTAMP(3) NOT NULL,
    "placeOfBirth" TEXT,
    "gender" "Gender" NOT NULL DEFAULT 'MALE',
    "passportNumber" TEXT,
    "passportExpiry" TIMESTAMP(3),
    "address" TEXT,
    "emergencyContact" JSONB,
    "bankAccount" JSONB,
    "status" "SeafarerStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT NOT NULL,
    "updatedBy" TEXT NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "seafarers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "crew_assignments" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "seafarerId" TEXT NOT NULL,
    "vesselId" TEXT NOT NULL,
    "rank" "CrewRank" NOT NULL,
    "signOnDate" TIMESTAMP(3) NOT NULL,
    "signOffDate" TIMESTAMP(3),
    "signOnPort" TEXT NOT NULL,
    "signOffPort" TEXT,
    "contractDuration" INTEGER NOT NULL,
    "remarks" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT NOT NULL,
    "updatedBy" TEXT NOT NULL,

    CONSTRAINT "crew_assignments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "crew_contracts" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "seafarerId" TEXT NOT NULL,
    "contractNumber" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "rank" "CrewRank" NOT NULL,
    "monthlySalary" DECIMAL(12,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "status" "ContractStatus" NOT NULL DEFAULT 'ACTIVE',
    "signedAt" TIMESTAMP(3),
    "documentUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT NOT NULL,
    "updatedBy" TEXT NOT NULL,

    CONSTRAINT "crew_contracts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vessel_certificates" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "vesselId" TEXT NOT NULL,
    "certificateType" "VesselCertType" NOT NULL,
    "certificateNumber" TEXT,
    "issuingAuthority" TEXT NOT NULL,
    "issueDate" TIMESTAMP(3) NOT NULL,
    "expiryDate" TIMESTAMP(3) NOT NULL,
    "status" "CertificateStatus" NOT NULL DEFAULT 'VALID',
    "documentUrl" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT NOT NULL,
    "updatedBy" TEXT NOT NULL,

    CONSTRAINT "vessel_certificates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "seafarer_certificates" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "seafarerId" TEXT NOT NULL,
    "certificateType" "SeafarerCertType" NOT NULL,
    "certificateNumber" TEXT,
    "issuingAuthority" TEXT NOT NULL,
    "issuingCountry" TEXT NOT NULL,
    "issueDate" TIMESTAMP(3) NOT NULL,
    "expiryDate" TIMESTAMP(3),
    "endorsementNumber" TEXT,
    "status" "CertificateStatus" NOT NULL DEFAULT 'VALID',
    "documentUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT NOT NULL,
    "updatedBy" TEXT NOT NULL,

    CONSTRAINT "seafarer_certificates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "voyages" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "vesselId" TEXT NOT NULL,
    "voyageNumber" TEXT NOT NULL,
    "status" "VoyageStatus" NOT NULL,
    "departurePort" TEXT NOT NULL,
    "arrivalPort" TEXT NOT NULL,
    "departureDate" TIMESTAMP(3),
    "arrivalDate" TIMESTAMP(3),
    "cargoType" TEXT,
    "cargoQuantity" DECIMAL(12,2),
    "cargoUnit" TEXT,
    "chartererId" TEXT,
    "remarks" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT NOT NULL,
    "updatedBy" TEXT NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "voyages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "maintenance_jobs" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "vesselId" TEXT NOT NULL,
    "jobNumber" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "maintenanceType" "MaintenanceType" NOT NULL,
    "priority" "Priority" NOT NULL DEFAULT 'MEDIUM',
    "status" "JobStatus" NOT NULL DEFAULT 'OPEN',
    "scheduledDate" TIMESTAMP(3),
    "completedDate" TIMESTAMP(3),
    "assignedTo" TEXT,
    "estimatedCost" DECIMAL(12,2),
    "actualCost" DECIMAL(12,2),
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "remarks" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT NOT NULL,
    "updatedBy" TEXT NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "maintenance_jobs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "documents" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "vesselId" TEXT,
    "documentType" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "fileName" TEXT NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "fileSize" INTEGER,
    "mimeType" TEXT,
    "tags" TEXT[],
    "status" "DocumentStatus" NOT NULL DEFAULT 'DRAFT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT NOT NULL,
    "updatedBy" TEXT NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL,
    "companyId" TEXT,
    "userId" TEXT,
    "action" "AuditAction" NOT NULL,
    "resource" TEXT NOT NULL,
    "resourceId" TEXT NOT NULL,
    "oldValues" JSONB,
    "newValues" JSONB,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "requestId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "companies_code_key" ON "companies"("code");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_companyId_isActive_idx" ON "users"("companyId", "isActive");

-- CreateIndex
CREATE UNIQUE INDEX "refresh_tokens_token_key" ON "refresh_tokens"("token");

-- CreateIndex
CREATE INDEX "refresh_tokens_userId_idx" ON "refresh_tokens"("userId");

-- CreateIndex
CREATE INDEX "refresh_tokens_token_idx" ON "refresh_tokens"("token");

-- CreateIndex
CREATE UNIQUE INDEX "roles_name_key" ON "roles"("name");

-- CreateIndex
CREATE UNIQUE INDEX "permissions_resource_action_scope_key" ON "permissions"("resource", "action", "scope");

-- CreateIndex
CREATE UNIQUE INDEX "user_roles_userId_roleId_vesselId_key" ON "user_roles"("userId", "roleId", "vesselId");

-- CreateIndex
CREATE UNIQUE INDEX "vessels_imoNumber_key" ON "vessels"("imoNumber");

-- CreateIndex
CREATE UNIQUE INDEX "vessels_mmsiNumber_key" ON "vessels"("mmsiNumber");

-- CreateIndex
CREATE INDEX "vessels_companyId_status_idx" ON "vessels"("companyId", "status");

-- CreateIndex
CREATE INDEX "vessels_companyId_deletedAt_idx" ON "vessels"("companyId", "deletedAt");

-- CreateIndex
CREATE UNIQUE INDEX "seafarers_seamanBookNumber_key" ON "seafarers"("seamanBookNumber");

-- CreateIndex
CREATE INDEX "seafarers_companyId_status_idx" ON "seafarers"("companyId", "status");

-- CreateIndex
CREATE INDEX "crew_assignments_companyId_vesselId_idx" ON "crew_assignments"("companyId", "vesselId");

-- CreateIndex
CREATE INDEX "crew_assignments_companyId_seafarerId_idx" ON "crew_assignments"("companyId", "seafarerId");

-- CreateIndex
CREATE UNIQUE INDEX "crew_contracts_contractNumber_key" ON "crew_contracts"("contractNumber");

-- CreateIndex
CREATE INDEX "crew_contracts_companyId_seafarerId_idx" ON "crew_contracts"("companyId", "seafarerId");

-- CreateIndex
CREATE INDEX "crew_contracts_companyId_status_idx" ON "crew_contracts"("companyId", "status");

-- CreateIndex
CREATE INDEX "vessel_certificates_companyId_vesselId_idx" ON "vessel_certificates"("companyId", "vesselId");

-- CreateIndex
CREATE INDEX "vessel_certificates_companyId_status_idx" ON "vessel_certificates"("companyId", "status");

-- CreateIndex
CREATE INDEX "vessel_certificates_expiryDate_idx" ON "vessel_certificates"("expiryDate");

-- CreateIndex
CREATE INDEX "seafarer_certificates_companyId_seafarerId_idx" ON "seafarer_certificates"("companyId", "seafarerId");

-- CreateIndex
CREATE INDEX "seafarer_certificates_companyId_status_idx" ON "seafarer_certificates"("companyId", "status");

-- CreateIndex
CREATE INDEX "seafarer_certificates_expiryDate_idx" ON "seafarer_certificates"("expiryDate");

-- CreateIndex
CREATE INDEX "voyages_companyId_vesselId_idx" ON "voyages"("companyId", "vesselId");

-- CreateIndex
CREATE INDEX "voyages_companyId_status_idx" ON "voyages"("companyId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "maintenance_jobs_jobNumber_key" ON "maintenance_jobs"("jobNumber");

-- CreateIndex
CREATE INDEX "maintenance_jobs_companyId_vesselId_idx" ON "maintenance_jobs"("companyId", "vesselId");

-- CreateIndex
CREATE INDEX "maintenance_jobs_companyId_status_idx" ON "maintenance_jobs"("companyId", "status");

-- CreateIndex
CREATE INDEX "documents_companyId_vesselId_idx" ON "documents"("companyId", "vesselId");

-- CreateIndex
CREATE INDEX "documents_companyId_status_idx" ON "documents"("companyId", "status");

-- CreateIndex
CREATE INDEX "audit_logs_companyId_resource_resourceId_idx" ON "audit_logs"("companyId", "resource", "resourceId");

-- CreateIndex
CREATE INDEX "audit_logs_userId_idx" ON "audit_logs"("userId");

-- CreateIndex
CREATE INDEX "audit_logs_createdAt_idx" ON "audit_logs"("createdAt");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "refresh_tokens" ADD CONSTRAINT "refresh_tokens_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "roles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "role_permissions" ADD CONSTRAINT "role_permissions_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "roles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "role_permissions" ADD CONSTRAINT "role_permissions_permissionId_fkey" FOREIGN KEY ("permissionId") REFERENCES "permissions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vessels" ADD CONSTRAINT "vessels_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "seafarers" ADD CONSTRAINT "seafarers_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "crew_assignments" ADD CONSTRAINT "crew_assignments_seafarerId_fkey" FOREIGN KEY ("seafarerId") REFERENCES "seafarers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "crew_assignments" ADD CONSTRAINT "crew_assignments_vesselId_fkey" FOREIGN KEY ("vesselId") REFERENCES "vessels"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "crew_contracts" ADD CONSTRAINT "crew_contracts_seafarerId_fkey" FOREIGN KEY ("seafarerId") REFERENCES "seafarers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vessel_certificates" ADD CONSTRAINT "vessel_certificates_vesselId_fkey" FOREIGN KEY ("vesselId") REFERENCES "vessels"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "seafarer_certificates" ADD CONSTRAINT "seafarer_certificates_seafarerId_fkey" FOREIGN KEY ("seafarerId") REFERENCES "seafarers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "voyages" ADD CONSTRAINT "voyages_vesselId_fkey" FOREIGN KEY ("vesselId") REFERENCES "vessels"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "maintenance_jobs" ADD CONSTRAINT "maintenance_jobs_vesselId_fkey" FOREIGN KEY ("vesselId") REFERENCES "vessels"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "documents" ADD CONSTRAINT "documents_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "documents" ADD CONSTRAINT "documents_vesselId_fkey" FOREIGN KEY ("vesselId") REFERENCES "vessels"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

