# Prompt 05 — Fleet Module

**Tahap:** Vessel CRUD, certificate tracking, document management  
**Prerequisite:** Prompt 04 selesai, auth berfungsi  
**Output:** Fleet module lengkap dengan compliance validation

> **Status: ⚠️ SEBAGIAN SELESAI**  
> Backend: `vessel.controller.ts` (CRUD lengkap), `vessel.service.ts`, `certificate.service.ts`, cron job `certificate-expiry.scheduler.ts`, fleet domain exceptions ada. **Yang belum:** Domain entities (vessel.entity.ts, vessel-certificate.entity.ts), value objects, domain events, infrastructure repositories (prisma-vessel.repository.ts), vessel-certificate controller, vessel-status controller, mapper, unit & integration tests.

---

## PROMPT 05-A — Fleet Domain Layer

> ⚠️ **SEBAGIAN** — `apps/api/src/contexts/fleet/domain/exceptions/` ada. **Belum ada:** `entities/vessel.entity.ts`, `entities/vessel-certificate.entity.ts`, `value-objects/imo-number.vo.ts`, `value-objects/vessel-status.vo.ts`, `events/`, `repositories/` interfaces, unit tests domain.

```
Buat Fleet bounded context — domain layer.
Baca docs/ai-rules/12-maritime-compliance.md untuk business rules.
Baca docs/ai-rules/11-domain-glossary.md untuk enum values yang benar.
Baca docs/ai-rules/04-folder-structure.md section 4.3 untuk template.

Lokasi: apps/api/src/contexts/fleet/domain/

1. entities/vessel.entity.ts  (Aggregate Root)

   class Vessel {
     private constructor(props: VesselProps) {}

     Properties (semua private, exposed via getters):
     id, companyId, imoNumber, mmsiNumber, name, callSign
     flagState, portOfRegistry, vesselType, status
     grossTonnage, netTonnage, deadweightTonnage
     lengthOverall, breadth, depth
     yearBuilt, shipyard, classSociety, classNumber
     mainEngineType, mainEnginePower, fuelType
     createdAt, updatedAt, createdBy, updatedBy, deletedAt

     Static factory:
     static create(data: CreateVesselData): Vessel
       → Validate IMO number format (7 digit: /^\d{7}$/)
       → Validate grossTonnage > 0
       → Default status: ACTIVE
       → Emit VesselRegisteredEvent

     Business methods:
     changeStatus(newStatus: VesselStatus, changedBy: string): void
       → Validate status transition (tidak bisa ACTIVE → SCRAPPED langsung)
       → Emit VesselStatusChangedEvent

     sendToDrydock(dockyard: string, startDate: Date): void
       → Validate status === ACTIVE
       → Change status ke DRYDOCK

     activate(): void
     layUp(): void

     get isOperational(): boolean
       → return status === ACTIVE

2. entities/vessel-certificate.entity.ts

   class VesselCertificate {
     static create(data): VesselCertificate

     get expiryStatus(): CertificateStatus
       → Gunakan calculateCertificateExpiryStatus dari @shared/utils
       → Ini adalah computed property, bukan stored value

     get daysUntilExpiry(): number

     get isValid(): boolean
       → return expiryStatus === VALID || expiryStatus === EXPIRING_SOON

     renew(newExpiryDate: Date, issuingAuthority: string, renewedBy: string): void
       → Emit CertificateRenewedEvent
   }

3. value-objects/
   - imo-number.vo.ts
     class ImoNumber {
       private constructor(private readonly value: string) {}
       static create(value: string): ImoNumber
         → Validate: /^\d{7}$/ (tepat 7 digit angka)
         → Throw InvalidImoNumberException jika tidak valid
       toString(): string
       equals(other: ImoNumber): boolean
     }

   - vessel-status.vo.ts
     VALID_TRANSITIONS: Map<VesselStatus, VesselStatus[]>
       ACTIVE      → [DRYDOCK, LAID_UP, SOLD, SCRAPPED]
       DRYDOCK     → [ACTIVE, LAID_UP, SCRAPPED]
       LAID_UP     → [ACTIVE, DRYDOCK, SCRAPPED, SOLD]
       SOLD        → []   ← Terminal state
       SCRAPPED    → []   ← Terminal state

     static isValidTransition(from, to): boolean

4. events/
   - vessel-registered.event.ts        { vesselId, imoNumber, companyId, occurredAt }
   - vessel-status-changed.event.ts    { vesselId, oldStatus, newStatus, changedBy }
   - certificate-expiring.event.ts     { certId, vesselId, certType, expiryDate, daysLeft }
   - certificate-expired.event.ts      { certId, vesselId, certType, expiredAt }
   - certificate-renewed.event.ts      { certId, vesselId, certType, newExpiryDate }

5. exceptions/
   - vessel-not-found.exception.ts                (FLEET_VESSEL_NOT_FOUND, 404)
   - duplicate-imo-number.exception.ts           (FLEET_VESSEL_DUPLICATE_IMO, 409)
   - invalid-imo-number.exception.ts             (VALIDATION_INVALID_IMO, 400)
   - invalid-status-transition.exception.ts      (FLEET_VESSEL_STATUS_INVALID, 422)
   - vessel-in-active-voyage.exception.ts        (FLEET_VESSEL_IN_VOYAGE, 422)
   - certificate-not-found.exception.ts          (FLEET_CERT_NOT_FOUND, 404)

6. repositories/
   - vessel.repository.interface.ts
     findById(id, companyId): Promise<Vessel | null>
     findByImo(imoNumber): Promise<Vessel | null>          ← Global check (no companyId)
     findAll(companyId, options): Promise<PaginatedResult<Vessel>>
     findWithExpiredCerts(companyId): Promise<Vessel[]>
     save(vessel): Promise<Vessel>
     update(id, companyId, data, updatedBy): Promise<Vessel>
     softDelete(id, companyId, deletedBy): Promise<void>

   - vessel-certificate.repository.interface.ts
     findByVessel(vesselId, companyId): Promise<VesselCertificate[]>
     findExpiringSoon(daysThreshold: number): Promise<VesselCertificate[]>
     findExpired(): Promise<VesselCertificate[]>
     save(cert): Promise<VesselCertificate>
     update(id, companyId, data, updatedBy): Promise<VesselCertificate>
     delete(id, companyId): Promise<void>

Buat unit tests untuk:
- VesselEntity.create() dengan valid dan invalid data
- ImoNumber.create() dengan valid dan invalid format
- VesselStatus valid/invalid transitions
- VesselCertificate.expiryStatus computed property (semua 4 status)
```

---

## PROMPT 05-B — Fleet Application Layer

> ⚠️ **SEBAGIAN** — `vessel.service.ts` (CRUD dasar) dan `certificate.service.ts` ada di `application/services/`. **Belum ada:** Commands/queries terpisah (register-vessel, update-vessel, change-vessel-status, dll), DTOs Swagger lengkap, unit tests handlers.

```
Buat application layer untuk Fleet module — use cases dan handlers.
Baca docs/ai-rules/06-api-design.md untuk DTO patterns.
Baca docs/ai-rules/09-audit-trail.md untuk audit requirements.

Lokasi: apps/api/src/contexts/fleet/application/

COMMANDS:

1. register-vessel/
   Command: { dto: CreateVesselDto, companyId, createdBy }
   Handler:
   → Check duplicate IMO (global, tidak per company)
   → Create Vessel entity via Vessel.create()
   → Save via repository
   → Emit VesselRegisteredEvent
   → Return VesselResponseDto

2. update-vessel/
   Command: { vesselId, companyId, dto: UpdateVesselDto, updatedBy }
   Handler:
   → FindById (throw jika tidak ada)
   → Apply updates
   → Save
   → Return VesselResponseDto

3. change-vessel-status/
   Command: { vesselId, companyId, newStatus, reason, changedBy }
   Handler:
   → FindById
   → vessel.changeStatus() ← Validasi transition di entity
   → Save
   → Emit VesselStatusChangedEvent

4. delete-vessel/
   Command: { vesselId, companyId, deletedBy }
   Handler:
   → FindById
   → Check tidak ada active voyage (via VoyageService interface)
   → SoftDelete
   → Emit VesselDeletedEvent

5. add-vessel-certificate/
   Command: { vesselId, companyId, dto: CreateCertificateDto, createdBy }
   Handler:
   → FindVessel
   → Check tidak ada cert aktif dengan tipe yang sama
   → Create VesselCertificate
   → Save
   → Check apakah cert EXPIRING_SOON → emit alert event jika ya

6. renew-vessel-certificate/
   Command: { certId, vesselId, companyId, newExpiryDate, issuingAuthority, renewedBy }
   Handler:
   → FindCertificate
   → Validate newExpiryDate > today
   → cert.renew()
   → Save
   → Emit CertificateRenewedEvent

QUERIES:

7. list-vessels/
   Query: { companyId, page, limit, status?, search?, flagState?, vesselType? }
   Handler:
   → Repository.findAll() dengan filters
   → Map ke VesselListItemDto (compact untuk list view)
   → Return PaginatedResult

8. get-vessel-detail/
   Query: { vesselId, companyId, include?: string[] }
   Handler:
   → FindById
   → Jika include "certificates": fetch semua certs
   → Jika include "documents": fetch recent documents
   → Map ke VesselDetailDto

9. get-vessel-certificates/
   Query: { vesselId, companyId }
   Handler:
   → Fetch all certificates untuk vessel
   → Hitung expiryStatus untuk masing-masing (computed)
   → Sort: EXPIRED, CRITICAL, EXPIRING_SOON, VALID
   → Return VesselCertificateDto[]

10. get-fleet-compliance-summary/
    Query: { companyId }
    Handler:
    → Count vessels per status
    → Count certificates per expiryStatus
    → Return ComplianceSummaryDto

    ComplianceSummaryDto:
    {
      totalVessels: number,
      activeVessels: number,
      vesselsByStatus: Record<VesselStatus, number>,
      certificates: {
        total: number,
        valid: number,
        expiringSoon: number,
        critical: number,
        expired: number,
      },
      complianceRate: number   ← % vessels tanpa expired cert
    }

DTOs (semua dengan Swagger decorators):
- create-vessel.dto.ts       ← Lengkap dengan validasi
- update-vessel.dto.ts       ← PartialType(CreateVesselDto)
- vessel-response.dto.ts     ← Full detail
- vessel-list-item.dto.ts    ← Compact untuk table (id, name, imoNumber, flagState, type, status, GT)
- create-certificate.dto.ts
- vessel-certificate.dto.ts  ← Dengan computed expiryStatus dan daysUntilExpiry
- compliance-summary.dto.ts

Buat unit tests untuk semua handlers (mock repositories).
```

---

## PROMPT 05-C — Fleet Infrastructure & Presentation

> ⚠️ **SEBAGIAN** — `vessel.controller.ts` dengan CRUD + compliance-summary endpoint ada. **Belum ada:** `prisma-vessel.repository.ts`, `prisma-vessel-certificate.repository.ts`, `vessel.mapper.ts`, event handlers, `vessel-certificate.controller.ts` (endpoints sertifikat), `vessel-status.controller.ts` (activate/drydock/layup), integration tests.

```
Buat infrastructure dan presentation layer untuk Fleet module.
Baca docs/ai-rules/06-api-design.md untuk controller template yang benar.
Baca docs/ai-rules/08-auth-rbac.md untuk permission yang diperlukan.

INFRASTRUCTURE:

1. repositories/prisma-vessel.repository.ts
   Implements IVesselRepository

   findAll() harus support:
   - Filter: status, flagState, vesselType, search (name, imoNumber)
   - Sort: name, imoNumber, createdAt, status
   - Pagination: skip/take dari page/limit
   - SELALU: where.companyId = companyId, where.deletedAt = null

   findExpiringSoon():
   SELECT vessels yang punya certificates dengan:
   expiryDate BETWEEN today AND today+90days
   Include certificate data

2. repositories/prisma-vessel-certificate.repository.ts
   findExpiringSoon(daysThreshold):
   → Query semua certs dimana expiryDate <= addDays(today, daysThreshold)
   → Include vessel dan company data (untuk notifikasi)

3. mappers/vessel.mapper.ts
   toDomain(prismaVessel): Vessel
   toListResponse(vessel): VesselListItemDto
   toDetailResponse(vessel, certs?, docs?): VesselDetailDto
   toPrismaCreate(vessel): Prisma.VesselCreateInput
   toPrismaUpdate(data): Prisma.VesselUpdateInput

4. event-handlers/
   - certificate-expiring.handler.ts
     Listen: CertificateExpiringEvent
     → Log warning
     → Trigger notification (stub: console.log, real di Phase 2)
     → Update certificate status di DB

   - vessel-registered.handler.ts
     Listen: VesselRegisteredEvent
     → Audit log entry

PRESENTATION:

5. controllers/vessel.controller.ts
   Tag: "Fleet — Vessels"

   POST   /api/v1/vessels
   @Permissions("vessel:create")
   @Audit({ resource: "vessel" })
   Body: CreateVesselDto → RegisterVesselCommand
   Response 201: VesselResponseDto

   GET    /api/v1/vessels
   @Permissions("vessel:read")
   Query: page, limit, status, search, flagState, vesselType
   Response 200: VesselListItemDto[] + pagination meta

   GET    /api/v1/vessels/compliance-summary
   @Permissions("vessel:read")
   Response: ComplianceSummaryDto
   PENTING: Route ini harus SEBELUM /:vesselId untuk menghindari conflict

   GET    /api/v1/vessels/:vesselId
   @Permissions("vessel:read")
   Query: ?include=certificates,documents
   Response: VesselDetailDto

   PATCH  /api/v1/vessels/:vesselId
   @Permissions("vessel:update")
   @Audit({ resource: "vessel", captureOld: true })
   Body: UpdateVesselDto
   Response: VesselResponseDto

   DELETE /api/v1/vessels/:vesselId
   @Permissions("vessel:delete")
   @Audit({ resource: "vessel" })
   Response 204: no content

6. controllers/vessel-certificate.controller.ts
   Tag: "Fleet — Certificates"

   GET    /api/v1/vessels/:vesselId/certificates
   @Permissions("vessel:read")
   Response: VesselCertificateDto[]

   POST   /api/v1/vessels/:vesselId/certificates
   @Permissions("vessel:certificate:manage")
   @Audit({ resource: "vessel_certificate" })
   Body: CreateCertificateDto
   Response 201: VesselCertificateDto

   PATCH  /api/v1/vessels/:vesselId/certificates/:certId
   @Permissions("vessel:certificate:manage")
   @Audit({ resource: "vessel_certificate", captureOld: true })
   Body: UpdateCertificateDto
   Response: VesselCertificateDto

   POST   /api/v1/vessels/:vesselId/certificates/:certId/renew
   @Permissions("vessel:certificate:manage")
   @Audit({ resource: "vessel_certificate", captureOld: true })
   Body: { newExpiryDate, newCertNumber?, issuingAuthority? }
   Response: VesselCertificateDto

   DELETE /api/v1/vessels/:vesselId/certificates/:certId
   @Permissions("vessel:certificate:manage")
   Response 204

7. controllers/vessel-status.controller.ts
   Tag: "Fleet — Vessel Operations"

   POST /api/v1/vessels/:vesselId/activate
   POST /api/v1/vessels/:vesselId/drydock    Body: { dockyard, plannedStart, plannedEnd }
   POST /api/v1/vessels/:vesselId/layup      Body: { reason }
   POST /api/v1/vessels/:vesselId/reactivate

   Semua: @Permissions("vessel:update"), @Audit({ resource: "vessel" })

8. Buat integration tests:
   File: test/integration/fleet/vessel.spec.ts

   Minimal test cases:
   ✅ POST /vessels → create sukses
   ✅ POST /vessels → 409 jika duplicate IMO
   ✅ POST /vessels → 400 jika IMO format salah
   ✅ GET /vessels → hanya return vessels company sendiri
   ✅ GET /vessels?status=ACTIVE → filter berfungsi
   ✅ PATCH /vessels/:id → update sukses
   ✅ DELETE /vessels/:id → soft delete (masih ada di DB, tidak muncul di GET)
   ✅ POST /vessels/:id/certificates → add cert
   ✅ POST /vessels/:id/certificates/:certId/renew → renew cert
```

---

## PROMPT 05-D — Certificate Expiry Cron Job

> ✅ **SELESAI** — `certificate-expiry.scheduler.ts` ada di `fleet/infrastructure/scheduler/` dengan `@Cron("0 6 * * *")`. Job sudah terdaftar di fleet.module.ts.

```
Buat scheduled job untuk daily certificate expiry check.
Baca docs/ai-rules/12-maritime-compliance.md section 12.7 untuk thresholds.

File: apps/api/src/contexts/fleet/infrastructure/jobs/certificate-expiry.job.ts

@Injectable()
export class CertificateExpiryJob {
  constructor(
    private readonly vesselCertRepo: IVesselCertificateRepository,
    private readonly seafarerCertRepo: ISeafarerCertificateRepository,
    private readonly eventEmitter: EventEmitter2,
    private readonly logger: Logger,
  ) {}

  @Cron("0 6 * * *", { timeZone: "Asia/Jakarta" })
  async checkVesselCertificates(): Promise<void> {
    this.logger.log("Starting daily vessel certificate expiry check...");

    const today = new Date();
    const checkWindow = 90; // days

    // Fetch all certs expiring dalam 90 hari ATAU sudah expired
    const certsToCheck = await this.vesselCertRepo.findExpiringSoon(checkWindow);

    let updated = 0;
    for (const cert of certsToCheck) {
      const daysLeft = differenceInDays(cert.expiryDate, today);
      const newStatus = calculateCertificateExpiryStatus(cert.expiryDate);

      if (cert.status !== newStatus) {
        await this.vesselCertRepo.updateStatus(cert.id, newStatus);

        // Emit event untuk notifikasi
        if (newStatus === CertificateStatus.EXPIRING_SOON ||
            newStatus === CertificateStatus.CRITICAL ||
            newStatus === CertificateStatus.EXPIRED) {
          this.eventEmitter.emit("certificate.expiring", new CertificateExpiringEvent({
            certId: cert.id,
            vesselId: cert.vesselId,
            vesselName: cert.vessel.name,
            companyId: cert.companyId,
            certType: cert.certificateType,
            expiryDate: cert.expiryDate,
            daysLeft,
            newStatus,
          }));
        }
        updated++;
      }
    }

    this.logger.log(`Certificate check complete. Updated: ${updated} certificates.`);
  }

  @Cron("0 6 * * *", { timeZone: "Asia/Jakarta" })
  async checkSeafarerCertificates(): Promise<void> {
    // Sama seperti vessel certs tapi untuk seafarer certs
    // Hanya untuk seafarer yang currently ON BOARD
  }
}

Tambahkan juga manual trigger endpoint untuk testing:
POST /api/v1/admin/jobs/certificate-check  (SUPER_ADMIN only)
→ Trigger checkVesselCertificates() secara manual

Buat unit test untuk job:
- Verify status update dari VALID ke EXPIRING_SOON
- Verify event emission
- Verify tidak update jika status sudah sama
```

---

## Checklist Selesai Prompt 05

```bash
# CRUD Vessel
curl -X POST http://localhost:4000/api/v1/vessels \
  -H "Authorization: Bearer {adminToken}" \
  -H "Content-Type: application/json" \
  -d '{"imoNumber":"9100099","name":"MV Test","flagState":"ID","vesselType":"BULK_CARRIER","grossTonnage":10000}'
# → 201 dengan vessel data

# List dengan filter
curl "http://localhost:4000/api/v1/vessels?status=ACTIVE&limit=10" \
  -H "Authorization: Bearer {adminToken}"
# → Hanya kapal ACTIVE, max 10

# Compliance summary
curl http://localhost:4000/api/v1/vessels/compliance-summary \
  -H "Authorization: Bearer {adminToken}"
# → Summary dengan counts per status

# Multi-tenant isolation
# Token dari company A → GET /vessels → TIDAK melihat vessel company B

# Certificate workflow
# Add cert → GET certs → Verify expiryStatus computed correctly

# Cron job manual trigger
curl -X POST http://localhost:4000/api/v1/admin/jobs/certificate-check \
  -H "Authorization: Bearer {superAdminToken}"
# → Job runs, status certificates terupdate

# Integration tests
pnpm test:integration --testPathPattern=fleet
# → Semua passing
```
