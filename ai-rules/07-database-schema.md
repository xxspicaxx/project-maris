# 07 — Database Schema

> **AI Instruction:** Semua tabel utama wajib memiliki `id`, `companyId`, `createdAt`, `updatedAt`, `deletedAt`. Jangan pernah hard delete data utama. Multi-tenant isolation wajib di setiap query.

---

## 7.1 Prisma Schema Conventions

### Base Fields (Wajib di setiap tabel utama)

```prisma
model AnyMainTable {
  // Identity
  id          String    @id @default(uuid())

  // Multi-tenant isolation
  companyId   String
  company     Company   @relation(fields: [companyId], references: [id])

  // Audit fields
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt
  createdBy   String    // userId yang membuat
  updatedBy   String    // userId yang terakhir update

  // Soft delete
  deletedAt   DateTime?
  deletedBy   String?
}
```

### Index Conventions

```prisma
// Selalu index companyId + field yang sering di-query bersama
@@index([companyId, status])
@@index([companyId, deletedAt])

// Unique constraint selalu scoped ke company (kecuali IMO Number yang global)
@@unique([companyId, name])

// IMO Number adalah global unique (seluruh dunia)
@@unique([imoNumber])
```

---

## 7.2 Core Schema — Company & IAM

```prisma
// prisma/schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// ─── COMPANY MANAGEMENT ───────────────────────────────────────

model Company {
  id            String    @id @default(uuid())
  code          String    @unique          // Kode perusahaan (e.g., "PT-NJ")
  name          String
  type          CompanyType               // SHIP_OWNER | SHIP_MANAGER | CHARTERER
  country       String                    // ISO 3166-1 alpha-2
  address       String?
  email         String?
  phone         String?
  taxId         String?                   // NPWP
  isActive      Boolean   @default(true)
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  // Relations
  vessels       Vessel[]
  users         User[]
  documents     Document[]

  @@map("companies")
}

enum CompanyType {
  SHIP_OWNER
  SHIP_MANAGER
  CHARTERER
  HOLDING
}

// ─── IAM (Identity & Access Management) ──────────────────────

model User {
  id            String    @id @default(uuid())
  companyId     String
  email         String    @unique
  passwordHash  String
  firstName     String
  lastName      String
  phone         String?
  isActive      Boolean   @default(true)
  lastLoginAt   DateTime?
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
  deletedAt     DateTime?

  // Relations
  company       Company   @relation(fields: [companyId], references: [id])
  userRoles     UserRole[]
  auditLogs     AuditLog[]

  @@index([companyId, isActive])
  @@map("users")
}

model Role {
  id            String    @id @default(uuid())
  name          String    @unique           // "fleet_manager", "master", "crewing_officer"
  displayName   String
  description   String?
  isSystem      Boolean   @default(false)  // System roles tidak bisa dihapus
  createdAt     DateTime  @default(now())

  // Relations
  userRoles     UserRole[]
  rolePermissions RolePermission[]

  @@map("roles")
}

model Permission {
  id            String    @id @default(uuid())
  resource      String                    // "vessel", "crew", "document"
  action        String                    // "create", "read", "update", "delete"
  scope         PermissionScope           // OWN | COMPANY | ALL
  description   String?

  rolePermissions RolePermission[]

  @@unique([resource, action, scope])
  @@map("permissions")
}

enum PermissionScope {
  OWN       // Hanya data milik sendiri
  COMPANY   // Semua data dalam company
  ALL       // Lintas company (Super Admin only)
}

model UserRole {
  id        String   @id @default(uuid())
  userId    String
  roleId    String
  vesselId  String?  // Jika role scoped ke kapal tertentu
  assignedAt DateTime @default(now())
  assignedBy String

  user      User     @relation(fields: [userId], references: [id])
  role      Role     @relation(fields: [roleId], references: [id])

  @@unique([userId, roleId, vesselId])
  @@map("user_roles")
}

model RolePermission {
  roleId        String
  permissionId  String

  role          Role       @relation(fields: [roleId], references: [id])
  permission    Permission @relation(fields: [permissionId], references: [id])

  @@id([roleId, permissionId])
  @@map("role_permissions")
}
```

---

## 7.3 Fleet Domain Schema

```prisma
// ─── FLEET MANAGEMENT ────────────────────────────────────────

model Vessel {
  id              String        @id @default(uuid())
  companyId       String
  imoNumber       String        @unique    // Global unique
  mmsiNumber      String?       @unique
  name            String
  formerNames     String[]                 // Array nama sebelumnya
  callSign        String?
  flagState       String                   // ISO 3166-1 alpha-2 ("ID", "PA", "SG")
  portOfRegistry  String?
  vesselType      VesselType
  status          VesselStatus  @default(ACTIVE)

  // Measurements
  grossTonnage    Decimal       @db.Decimal(10, 2)
  netTonnage      Decimal?      @db.Decimal(10, 2)
  deadweightTonnage Decimal?    @db.Decimal(10, 2)
  lengthOverall   Decimal?      @db.Decimal(8, 2)      // meters
  breadth         Decimal?      @db.Decimal(8, 2)
  depth           Decimal?      @db.Decimal(8, 2)

  // Build info
  yearBuilt       Int?
  shipyard        String?
  shipyardCountry String?
  classNumber     String?
  classSociety    String?      // "BKI", "DNV", "Lloyd's", "ABS"

  // Engine
  mainEngineType    String?
  mainEnginePower   Decimal?   @db.Decimal(10, 2)  // kW
  fuelType          FuelType?

  // Audit
  createdAt       DateTime     @default(now())
  updatedAt       DateTime     @updatedAt
  createdBy       String
  updatedBy       String
  deletedAt       DateTime?

  // Relations
  company         Company      @relation(fields: [companyId], references: [id])
  certificates    VesselCertificate[]
  crewAssignments CrewAssignment[]
  voyages         Voyage[]
  maintenanceJobs MaintenanceJob[]
  documents       Document[]

  @@index([companyId, status])
  @@index([companyId, deletedAt])
  @@map("vessels")
}

enum VesselType {
  BULK_CARRIER
  TANKER_CRUDE
  TANKER_PRODUCT
  TANKER_CHEMICAL
  CONTAINER
  GENERAL_CARGO
  RO_RO
  PASSENGER
  OFFSHORE_SUPPLY
  TUGBOAT
  BARGE
  LNG_CARRIER
  OTHER
}

enum VesselStatus {
  ACTIVE
  DRYDOCK
  LAID_UP
  SCRAPPED
  SOLD
}

enum FuelType {
  HFO
  MDO
  MGO
  LNG
  LPG
  METHANOL
}
```

---

## 7.4 Crew Domain Schema

```prisma
// ─── CREW MANAGEMENT ─────────────────────────────────────────

model Seafarer {
  id              String      @id @default(uuid())
  companyId       String
  seamanBookNumber String?    @unique
  firstName       String
  lastName        String
  nationality     String      // ISO 3166-1 alpha-2
  dateOfBirth     DateTime
  placeOfBirth    String?
  gender          Gender      @default(MALE)
  passportNumber  String?
  passportExpiry  DateTime?
  address         String?
  emergencyContact Json?      // { name, phone, relation }
  bankAccount     Json?       // Encrypted
  status          SeafarerStatus @default(ACTIVE)

  // Audit
  createdAt       DateTime    @default(now())
  updatedAt       DateTime    @updatedAt
  createdBy       String
  updatedBy       String
  deletedAt       DateTime?

  // Relations
  company         Company     @relation(fields: [companyId], references: [id])
  certificates    SeafarerCertificate[]
  assignments     CrewAssignment[]
  contracts       CrewContract[]

  @@index([companyId, status])
  @@map("seafarers")
}

enum Gender {
  MALE
  FEMALE
}

enum SeafarerStatus {
  ACTIVE
  ON_LEAVE
  RESIGNED
  BLACKLISTED
}

model CrewAssignment {
  id          String    @id @default(uuid())
  companyId   String
  seafarerId  String
  vesselId    String
  rank        CrewRank
  signOnDate  DateTime
  signOffDate DateTime?
  signOnPort  String
  signOffPort String?
  contractDuration Int             // Months
  remarks     String?

  // Audit
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt
  createdBy   String
  updatedBy   String

  // Relations
  seafarer    Seafarer  @relation(fields: [seafarerId], references: [id])
  vessel      Vessel    @relation(fields: [vesselId], references: [id])

  @@index([companyId, vesselId])
  @@index([companyId, seafarerId])
  @@map("crew_assignments")
}

enum CrewRank {
  MASTER
  CHIEF_OFFICER
  SECOND_OFFICER
  THIRD_OFFICER
  CHIEF_ENGINEER
  SECOND_ENGINEER
  THIRD_ENGINEER
  FOURTH_ENGINEER
  BOSUN
  ABLE_SEAMAN
  ORDINARY_SEAMAN
  FITTER
  OILER
  WIPER
  CHIEF_COOK
  MESSMAN
  ELECTRICIAN
  RADIO_OFFICER
}
```

---

## 7.5 Certificate Schema (Shared)

```prisma
// ─── CERTIFICATES ─────────────────────────────────────────────

// Sertifikat Kapal
model VesselCertificate {
  id                String              @id @default(uuid())
  companyId         String
  vesselId          String
  certificateType   VesselCertType
  certificateNumber String?
  issuingAuthority  String
  issueDate         DateTime
  expiryDate        DateTime
  status            CertificateStatus   @default(VALID)
  documentUrl       String?             // Link ke MinIO/S3
  notes             String?

  // Audit
  createdAt         DateTime            @default(now())
  updatedAt         DateTime            @updatedAt
  createdBy         String
  updatedBy         String

  vessel            Vessel              @relation(fields: [vesselId], references: [id])

  @@index([companyId, vesselId])
  @@index([companyId, status])
  @@index([expiryDate])             // Untuk cron job expiry check
  @@map("vessel_certificates")
}

enum VesselCertType {
  SMC                           // Safety Management Certificate
  DOC                           // Document of Compliance
  ISSC                          // International Ship Security Certificate
  LOAD_LINE
  IOPP                          // MARPOL Annex I
  ITC                           // International Tonnage Certificate
  CSR                           // Continuous Synopsis Record
  MARPOL_ANNEX_VI               // IAPP Certificate
  CLASS_CERTIFICATE
  RADIO_LICENSE
  MINIMUM_SAFE_MANNING
}

// Sertifikat Seafarer
model SeafarerCertificate {
  id                String              @id @default(uuid())
  companyId         String
  seafarerId        String
  certificateType   SeafarerCertType
  certificateNumber String?
  issuingAuthority  String
  issuingCountry    String
  issueDate         DateTime
  expiryDate        DateTime?           // Beberapa cert tidak expire (BST dasar)
  endorsementNumber String?
  status            CertificateStatus   @default(VALID)
  documentUrl       String?

  // Audit
  createdAt         DateTime            @default(now())
  updatedAt         DateTime            @updatedAt
  createdBy         String
  updatedBy         String

  seafarer          Seafarer            @relation(fields: [seafarerId], references: [id])

  @@index([companyId, seafarerId])
  @@index([companyId, status])
  @@index([expiryDate])
  @@map("seafarer_certificates")
}

enum SeafarerCertType {
  COC                           // Certificate of Competency
  COP                           // Certificate of Proficiency
  STCW_BST                      // Basic Safety Training
  STCW_SCRFA                    // Survival Craft
  STCW_AFF                      // Advanced Fire Fighting
  STCW_MEFA                     // Medical First Aid
  STCW_MEOL                     // Medical Care
  STCW_GMDSS
  STCW_TANKER_OIL
  STCW_TANKER_CHEMICAL
  STCW_TANKER_LNG
  MEDICAL_CERTIFICATE
  SEAMAN_BOOK
  PASSPORT
  YELLOW_FEVER
  CUSTOM
}

enum CertificateStatus {
  VALID
  EXPIRING_SOON                 // Dalam 90 hari
  CRITICAL                      // Dalam 30 hari
  EXPIRED
  PENDING_RENEWAL
  SUSPENDED
}
```

---

## 7.6 Audit Log Schema

```prisma
// ─── AUDIT TRAIL ──────────────────────────────────────────────

model AuditLog {
  id          String    @id @default(uuid())
  companyId   String?                   // Null untuk system actions
  userId      String?                   // Null untuk automated actions
  action      AuditAction
  resource    String                    // "vessel", "seafarer", "certificate"
  resourceId  String
  oldValues   Json?                     // State sebelum perubahan
  newValues   Json?                     // State setelah perubahan
  ipAddress   String?
  userAgent   String?
  requestId   String?
  createdAt   DateTime  @default(now())

  user        User?     @relation(fields: [userId], references: [id])

  @@index([companyId, resource, resourceId])
  @@index([userId])
  @@index([createdAt])
  @@map("audit_logs")
}

enum AuditAction {
  CREATE
  UPDATE
  DELETE
  RESTORE
  LOGIN
  LOGOUT
  EXPORT
  IMPORT
  APPROVE
  REJECT
}
```

---

## 7.7 Migration & Seed Rules

```bash
# Membuat migration baru
npx prisma migrate dev --name add_vessel_fuel_type

# Naming convention migration:
# add_{field/table}_{context}
# remove_{field/table}_{context}
# update_{table}_add_{field}
# create_{table}

# JANGAN gunakan:
# migration_1, fix, update, changes  ← Nama tidak deskriptif
```

**Seed data wajib ada untuk:**

- Default roles & permissions
- Sample companies (2)
- Sample vessels (5 per company)
- Sample users dengan berbagai roles
- Sample certificates dengan berbagai status (valid, expiring, expired)

---

_Schema ini adalah source of truth untuk database. Semua perubahan harus melalui Prisma migration — jangan edit database langsung._
