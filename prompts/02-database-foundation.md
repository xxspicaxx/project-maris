# Prompt 02 — Database Foundation

**Tahap:** Prisma schema lengkap, migrations, seed data  
**Prerequisite:** Prompt 01 selesai, PostgreSQL running via Docker  
**Output:** Database siap dengan semua tabel Phase 1 + seed data

> **Status: ✅ SELESAI**  
> Prisma schema 591 baris (15 model, 17 enum), migrations applied, seed data lengkap (9 roles, 2 companies, 5 users, 5 vessels, 6 seafarers, certificates beragam status), base repository pattern tersedia.

---

## PROMPT 02-A — Prisma Schema Lengkap

> ✅ **SELESAI** — `prisma/schema.prisma` (591 baris) memiliki semua 5 bagian. `npx prisma validate` pass.  
> **Implementasi aktual:** 15 model, 17 enum. Semua index, audit fields, soft delete, `@db.Decimal` untuk tonnage tersedia.

```
Buat Prisma schema lengkap untuk Maritime Fleet ERP Phase 1.
Baca docs/ai-rules/07-database-schema.md sebagai referensi utama.
Baca docs/ai-rules/02-architecture.md section 2.5 untuk multi-tenancy pattern.

File: prisma/schema.prisma

Buat schema dengan model-model berikut dalam urutan ini:

BAGIAN 1 — Company & IAM
- Company         (id, code, name, type, country, address, email, phone, taxId, isActive)
- User            (id, companyId→Company, email, passwordHash, firstName, lastName, phone,
                   isActive, lastLoginAt, deletedAt — dengan audit fields)
- Role            (id, name unique, displayName, description, isSystem)
- Permission      (id, resource, action, scope enum: OWN/COMPANY/ALL)
- UserRole        (userId, roleId, vesselId nullable — unique constraint)
- RolePermission  (roleId, permissionId — composite PK)
- RefreshToken    (id, userId, token unique, expiresAt, revokedAt, ipAddress)

BAGIAN 2 — Fleet Domain
- Vessel          (lengkap sesuai schema di rules — IMO unique, semua measurements,
                   build info, engine info, companyId, audit fields, soft delete)
- VesselCertificate (id, companyId, vesselId, certificateType enum, certificateNumber,
                   issuingAuthority, issueDate, expiryDate, status enum, documentUrl)

BAGIAN 3 — Crew Domain
- Seafarer        (id, companyId, seamanBookNumber unique nullable, firstName, lastName,
                   nationality, dateOfBirth, placeOfBirth, gender, passportNumber,
                   passportExpiry, emergencyContact Json, status enum, audit fields)
- SeafarerCertificate (id, companyId, seafarerId, certificateType enum, certificateNumber,
                   issuingAuthority, issuingCountry, issueDate, expiryDate nullable,
                   endorsementNumber, status enum, documentUrl)
- CrewAssignment  (id, companyId, seafarerId, vesselId, rank enum, signOnDate,
                   signOffDate nullable, signOnPort, signOffPort nullable,
                   contractDuration, remarks)

BAGIAN 4 — Voyage Domain
- Voyage          (id, companyId, vesselId, voyageNumber, status enum, departurePort,
                   destinationPort, etd, eta, atd, ata, cargoType, cargoQuantity,
                   remarks, audit fields)
- PortCall        (id, voyageId, companyId, portName, portCode, country, eta, ata,
                   etd, atd, purpose, remarks)

BAGIAN 5 — Document & Audit
- Document        (id, companyId, vesselId nullable, seafarerId nullable, title,
                   documentType, fileUrl, fileSize, mimeType, uploadedBy,
                   expiryDate nullable, createdAt)
- AuditLog        (id, companyId nullable, userId nullable, action enum, resource,
                   resourceId, oldValues Json, newValues Json, ipAddress,
                   userAgent, requestId, createdAt)

Aturan wajib untuk semua model:
- id: String @id @default(uuid())
- Semua model utama: createdAt, updatedAt, createdBy, updatedBy
- Semua model utama (kecuali log/junction): deletedAt nullable (soft delete)
- companyId + field utama: selalu ada @@index
- Gunakan @db.Decimal(10, 2) untuk angka desimal (GT, NT, DWT)
- Enum didefinisikan di atas model yang menggunakannya

Setelah schema selesai: npx prisma validate → harus 0 errors
```

### Implementasi Aktual (Schema Summary)

| Bagian              | Model                                                                   | Enum                                                                  | Status |
| ------------------- | ----------------------------------------------------------------------- | --------------------------------------------------------------------- | ------ |
| 1 — Company & IAM   | Company, User, Role, Permission, UserRole, RolePermission, RefreshToken | CompanyType, PermissionScope                                          | ✅     |
| 2 — Fleet           | Vessel, VesselCertificate                                               | VesselType, VesselStatus, FuelType, CertificateStatus, VesselCertType | ✅     |
| 3 — Crew            | Seafarer, SeafarerCertificate, CrewAssignment                           | Gender, SeafarerStatus, SeafarerCertType, CrewRank                    | ✅     |
| 4 — Voyage          | Voyage, PortCall                                                        | VoyageStatus                                                          | ✅     |
| 5 — Dokumen & Audit | Document, AuditLog                                                      | AuditAction                                                           | ✅     |

> ⚠️ **Catatan:** Model `PasswordResetToken` (untuk Prompt 04-D) **belum** ada di schema. Perlu ditambahkan saat mengerjakan password reset flow.

---

## PROMPT 02-B — Migrations

> ✅ **SELESAI** — Migration `init_maritime_erp_schema` applied. `prisma.service.ts` dengan soft-delete middleware, `database.module.ts` (global module) tersedia.

```
Jalankan dan verifikasi Prisma migrations untuk Maritime Fleet ERP.

Langkah yang harus dilakukan:

1. Generate migration pertama:
   npx prisma migrate dev --name init_maritime_erp_schema

2. Verifikasi migration berhasil:
   - File migration ada di prisma/migrations/
   - Tabel-tabel sudah terbuat di database
   - npx prisma studio → buka http://localhost:5555, semua tabel terlihat

3. Buat prisma/migrations/README.md dengan panduan:
   - Cara membuat migration baru
   - Naming convention migration
   - Cara rollback (prisma migrate reset)
   - Cara apply di production (prisma migrate deploy)

4. Setup Prisma service untuk NestJS di apps/api/src/shared/database/:

   File: prisma.service.ts
   - Extends PrismaClient
   - Implements OnModuleInit (prisma.$connect())
   - Implements OnModuleDestroy (prisma.$disconnect())
   - Enable query logging di development
   - Soft delete middleware: otomatis filter deletedAt: null
     pada findMany, findFirst, findUnique untuk model yang punya deletedAt

   File: database.module.ts
   - Global module
   - Export PrismaService

Contoh soft delete middleware yang harus diimplementasikan:
prisma.$use(async (params, next) => {
  // Jika model punya deletedAt, otomatis tambah filter deletedAt: null
  // pada operasi find
})

Setelah selesai, verifikasi dengan query sederhana:
await prisma.company.findMany()  → harus return [] tanpa error
```

### Implementasi Aktual

- **`apps/api/src/shared/database/prisma.service.ts`** ✅ — Extends PrismaClient, OnModuleInit/Destroy, soft-delete middleware aktif
- **`apps/api/src/shared/database/database.module.ts`** ✅ — Global module, export PrismaService
- **`prisma/migrations/`** ✅ — Migration folder tersedia
- **`prisma.config.ts`** ✅ — Di root project

---

## PROMPT 02-C — Seed Data

> ✅ **SELESAI** — 9 file seed tersedia, `pnpm db:seed` berjalan. Scripts `db:seed`, `db:reset`, `db:studio`, `db:fresh` ada di root `package.json`.

```
Buat seed data lengkap untuk development dan testing.
Baca docs/ai-rules/08-auth-rbac.md untuk daftar roles dan permissions.
Baca docs/ai-rules/11-domain-glossary.md untuk data referensi maritim.

File: prisma/seed/index.ts (entry point)
File: prisma/seed/01-permissions.ts
File: prisma/seed/02-roles.ts
File: prisma/seed/03-companies.ts
File: prisma/seed/04-users.ts
File: prisma/seed/05-vessels.ts
File: prisma/seed/06-seafarers.ts
File: prisma/seed/07-certificates.ts

SEED 01 — Permissions (semua kombinasi resource:action:scope)
Resources: vessel, crew, voyage, document, technical, hsseq, financial, user, company, system
Actions: create, read, update, delete
Scopes: OWN, COMPANY, ALL

SEED 02 — Roles dengan permissions yang sesuai dari permission matrix di 08-auth-rbac.md:
- SUPER_ADMIN      (scope: ALL untuk semua)
- COMPANY_ADMIN    (scope: COMPANY untuk semua)
- FLEET_MANAGER    (vessel: COMPANY, crew: COMPANY read-only, voyage: COMPANY)
- CREWING_MANAGER  (crew: COMPANY, vessel: COMPANY read-only)
- TECHNICAL_SUPER  (technical: COMPANY, vessel: COMPANY)
- ISM_MANAGER      (hsseq: COMPANY, vessel: COMPANY read-only)
- MASTER           (vessel: OWN, voyage: OWN, crew: OWN read-only)
- CHIEF_OFFICER    (vessel: OWN read-only, voyage: OWN log, crew: OWN read-only)
- PORT_AGENT       (voyage: OWN read-only, document: OWN read-only)

SEED 03 — Companies (2 perusahaan):
- PT Nusantara Jaya Maritim (code: NJM, type: SHIP_OWNER, country: ID)
- PT Armada Sentosa Lines (code: ASL, type: SHIP_MANAGER, country: ID)

SEED 04 — Users (satu per role per company):
- superadmin@maritime-erp.com / Password123! → SUPER_ADMIN
- admin@njm.co.id / Password123! → COMPANY_ADMIN (NJM)
- fleet@njm.co.id / Password123! → FLEET_MANAGER (NJM)
- crewing@njm.co.id / Password123! → CREWING_MANAGER (NJM)
- master@njm.co.id / Password123! → MASTER (NJM)

SEED 05 — Vessels (3 kapal untuk NJM, 2 untuk ASL):
NJM:
- MV Nusantara Jaya 1, IMO: 9100001, BULK_CARRIER, flagState: ID, GT: 25000, status: ACTIVE
- MV Nusantara Jaya 2, IMO: 9100002, TANKER_PRODUCT, flagState: ID, GT: 18000, status: ACTIVE
- MV Nusantara Jaya 3, IMO: 9100003, GENERAL_CARGO, flagState: ID, GT: 8500, status: DRYDOCK
ASL:
- MV Sentosa Star, IMO: 9200001, CONTAINER, flagState: SG, GT: 35000, status: ACTIVE
- MV Sentosa Pearl, IMO: 9200002, BULK_CARRIER, flagState: PA, GT: 45000, status: LAID_UP

SEED 06 — Seafarers (5 pelaut untuk NJM, berbagai jabatan)

SEED 07 — Certificates dengan berbagai status:
- Beberapa certificate VALID (> 90 hari)
- Beberapa EXPIRING_SOON (60 hari lagi)
- Beberapa CRITICAL (20 hari lagi)
- Beberapa EXPIRED (sudah lewat)
→ Penting untuk testing dashboard alert

Tambahkan script di package.json:
"db:seed": "npx prisma db seed"
"db:reset": "npx prisma migrate reset --force"
"db:studio": "npx prisma studio"
"db:fresh": "pnpm db:reset && pnpm db:seed"

Jalankan: pnpm db:seed → harus sukses tanpa error
```

### Implementasi Aktual

| File                             | Ukuran | Isi                                |
| -------------------------------- | ------ | ---------------------------------- |
| `prisma/seed/01-permissions.ts`  | 1.4 KB | Permissions resource:action:scope  |
| `prisma/seed/02-roles.ts`        | 5.9 KB | 9 roles + role-permission mapping  |
| `prisma/seed/03-companies.ts`    | 1.9 KB | NJM + ASL                          |
| `prisma/seed/04-users.ts`        | 4.8 KB | 5 users dengan hashed password     |
| `prisma/seed/05-vessels.ts`      | 7.1 KB | 5 vessels (3 NJM, 2 ASL)           |
| `prisma/seed/06-seafarers.ts`    | 6.5 KB | 6 seafarers berbagai jabatan       |
| `prisma/seed/07-certificates.ts` | 8.2 KB | Vessel & seafarer certs mix status |
| `prisma/seed/seed.ts`            | 9.7 KB | Main seed orchestration            |
| `prisma/seed/index.ts`           | 1.7 KB | Entry point                        |

> ✅ `pnpm db:seed` berjalan sukses. Prisma Studio (`npx prisma studio`) aktif di port 5555.

---

## PROMPT 02-D — Base Repository Pattern

> ✅ **SELESAI** — `apps/api/src/shared/database/base.repository.ts` (11.3 KB) tersedia dengan abstract class `BaseRepository<TEntity, TCreateInput, TUpdateInput>`.

```
Buat base repository abstract class yang akan diextend oleh semua repositories.
Baca docs/ai-rules/02-architecture.md untuk dependency inversion principle.
Baca docs/ai-rules/05-code-conventions.md untuk patterns yang benar.

File: apps/api/src/shared/database/base.repository.ts

Abstract class BaseRepository<TEntity, TCreateInput, TUpdateInput> dengan methods:
- findById(id: string, companyId: string): Promise<TEntity | null>
- findAll(companyId: string, options?: FindAllOptions): Promise<PaginatedResult<TEntity>>
- create(data: TCreateInput, createdBy: string): Promise<TEntity>
- update(id: string, companyId: string, data: TUpdateInput, updatedBy: string): Promise<TEntity>
- softDelete(id: string, companyId: string, deletedBy: string): Promise<void>
- exists(id: string, companyId: string): Promise<boolean>

FindAllOptions interface:
- page?: number
- limit?: number
- sortBy?: string
- sortOrder?: 'asc' | 'desc'
- search?: string
- filters?: Record<string, unknown>

PaginatedResult<T> interface:
- data: T[]
- meta: PaginationMeta   (dari @shared/types)

Aturan:
- Semua query WAJIB include companyId filter
- findAll WAJIB include deletedAt: null filter
- Gunakan prisma.$transaction untuk operasi multi-step
- Handle PrismaClientKnownRequestError (P2002 = unique constraint, P2025 = not found)
  dan convert ke domain exceptions yang sesuai
```

### Implementasi Aktual

- **File:** `apps/api/src/shared/database/base.repository.ts` (11.3 KB)
- **Interface:** `BaseRepository<TEntity, TCreateInput, TUpdateInput>`
- **Methods tersedia:** `findById`, `findAll` (dengan pagination), `create`, `update`, `softDelete`, `exists`
- **Error handling:** `PrismaClientKnownRequestError` di-handle (P2002, P2025)
- **Multi-tenant safety:** Semua query include `companyId` filter otomatis

> ⚠️ **Catatan:** `base.repository.ts` sudah ada, namun modul-modul (Fleet, IAM) belum mengextend class ini secara penuh — service langsung menggunakan PrismaService. Refactor ke pattern ini akan dilakukan bertahap.

---

## Checklist Selesai Prompt 02

```bash
# Database terbuat
npx prisma studio              # Buka http://localhost:5555, lihat semua tabel ✅

# Seed berhasil
pnpm db:seed                   # "Seeding completed successfully" ✅

# Verifikasi data (konfirmasi via Prisma Studio)
# ✅ 9 roles dengan permissions yang benar
# ✅ 2 companies (NJM, ASL)
# ✅ 5 users dengan roles masing-masing
# ✅ 5 vessels (3 NJM, 2 ASL)
# ✅ 6 seafarers
# ✅ Certificates dengan berbagai status (VALID, EXPIRING_SOON, CRITICAL, EXPIRED)

# Migration clean
npx prisma migrate status      # "All migrations have been applied" ✅
```

**✅ Prompt 02 selesai. Sudah lanjut ke Prompt 03.**

### Item Pending (Carry-over ke Prompt berikutnya)

- [ ] **Model `PasswordResetToken`** — perlu ditambahkan ke `prisma/schema.prisma` saat mengerjakan Prompt 04-D (password reset flow)
- [ ] **Migration baru** — jalankan setelah `PasswordResetToken` ditambahkan: `npx prisma migrate dev --name add_password_reset_tokens`
