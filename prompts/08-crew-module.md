# Prompt 08 — Crew Management Module

**Tahap:** Seafarer registry, STCW certificate tracking, sign-on/off, manning list  
**Prerequisite:** Prompt 07 selesai  
**Output:** Crew module dengan full STCW compliance validation

---

## PROMPT 08-A — Crew Domain Layer

```
Buat Crew bounded context — domain layer lengkap.
Baca docs/ai-rules/12-maritime-compliance.md section 12.3 untuk STCW rules LENGKAP.
Baca docs/ai-rules/11-domain-glossary.md section 11.2 untuk semua CrewRank values.
Lokasi: apps/api/src/contexts/crew/

DOMAIN ENTITIES:

1. entities/seafarer.entity.ts (Aggregate Root)

   Properties (private, exposed via getters):
   id, companyId, seamanBookNumber, firstName, lastName,
   nationality, dateOfBirth, placeOfBirth, gender,
   passportNumber, passportExpiry, address,
   emergencyContact (object: name, phone, relation),
   status (SeafarerStatus enum), createdAt, updatedAt, createdBy, deletedAt

   Static factory:
   static create(data: CreateSeafarerData): Seafarer

   Computed getters:
   get fullName(): string           → `${firstName} ${lastName}`
   get age(): number                → hitung dari dateOfBirth
   get isActive(): boolean          → status === ACTIVE
   get passportExpired(): boolean   → passportExpiry < today

   Business methods:
   activate(): void                 → status → ACTIVE
   sendOnLeave(): void              → status → ON_LEAVE
   reinstate(): void                → ON_LEAVE → ACTIVE
   blacklist(reason: string): void  → status → BLACKLISTED (audit reason)

2. entities/crew-assignment.entity.ts

   Properties:
   id, companyId, seafarerId, vesselId, rank (CrewRank),
   signOnDate, signOffDate (nullable), signOnPort, signOffPort (nullable),
   contractDuration (months), remarks, createdBy

   Static factory:
   static create(data): CrewAssignment
   → Validate signOnDate tidak di masa depan lebih dari 7 hari
   → Emit CrewSignedOnEvent

   Business methods:
   signOff(port: string, date: Date, signedOffBy: string): void
   → Validate date >= signOnDate
   → Set signOffDate, signOffPort
   → Emit CrewSignedOffEvent

   Computed:
   get isOnBoard(): boolean         → signOffDate === null
   get contractEndDate(): Date      → addMonths(signOnDate, contractDuration)
   get daysRemainingInContract(): number
   get contractExpiringSoon(): boolean → daysRemaining <= 30

3. value-objects/crew-rank.vo.ts

   static isDeckOfficer(rank: CrewRank): boolean
   → [MASTER, CHIEF_OFFICER, SECOND_OFFICER, THIRD_OFFICER, RADIO_OFFICER]

   static isEngineOfficer(rank: CrewRank): boolean
   → [CHIEF_ENGINEER, SECOND_ENGINEER, THIRD_ENGINEER, FOURTH_ENGINEER, ELECTRICIAN]

   static isRating(rank: CrewRank): boolean
   → [BOSUN, ABLE_SEAMAN, ORDINARY_SEAMAN, FITTER, OILER, WIPER, MESSMAN, CHIEF_COOK]

   static getDepartment(rank: CrewRank): "DECK" | "ENGINE" | "CATERING"

4. domain/services/stcw-compliance.service.ts

   IMPLEMENTASI PENUH dari docs/ai-rules/12-maritime-compliance.md section 12.3:

   // Required certificates per rank (LENGKAP)
   const REQUIRED_BY_RANK: Record<CrewRank, SeafarerCertType[]> = {
     [CrewRank.MASTER]: [
       SeafarerCertType.COC,        // Master CoC (≥ 3000 GT)
       SeafarerCertType.STCW_BST,
       SeafarerCertType.STCW_SCRFA,
       SeafarerCertType.STCW_AFF,
       SeafarerCertType.STCW_MEFA,
       SeafarerCertType.MEDICAL_CERTIFICATE,
       SeafarerCertType.SEAMAN_BOOK,
     ],
     [CrewRank.CHIEF_OFFICER]: [
       SeafarerCertType.COC,        // Chief Mate CoC
       SeafarerCertType.STCW_BST,
       SeafarerCertType.STCW_SCRFA,
       SeafarerCertType.STCW_AFF,
       SeafarerCertType.STCW_MEFA,
       SeafarerCertType.MEDICAL_CERTIFICATE,
       SeafarerCertType.SEAMAN_BOOK,
     ],
     [CrewRank.SECOND_OFFICER]: [
       SeafarerCertType.COC,
       SeafarerCertType.STCW_BST,
       SeafarerCertType.STCW_SCRFA,
       SeafarerCertType.STCW_AFF,
       SeafarerCertType.MEDICAL_CERTIFICATE,
       SeafarerCertType.SEAMAN_BOOK,
     ],
     [CrewRank.THIRD_OFFICER]: [...],
     [CrewRank.CHIEF_ENGINEER]: [
       SeafarerCertType.COC,        // Chief Engineer CoC
       SeafarerCertType.STCW_BST,
       SeafarerCertType.STCW_SCRFA,
       SeafarerCertType.STCW_AFF,
       SeafarerCertType.MEDICAL_CERTIFICATE,
       SeafarerCertType.SEAMAN_BOOK,
     ],
     [CrewRank.SECOND_ENGINEER]: [...],
     [CrewRank.THIRD_ENGINEER]: [...],
     [CrewRank.FOURTH_ENGINEER]: [...],
     [CrewRank.BOSUN]: [
       SeafarerCertType.STCW_BST,
       SeafarerCertType.STCW_SCRFA,
       SeafarerCertType.MEDICAL_CERTIFICATE,
       SeafarerCertType.SEAMAN_BOOK,
     ],
     [CrewRank.ABLE_SEAMAN]: [
       SeafarerCertType.COP,        // AB CoP
       SeafarerCertType.STCW_BST,
       SeafarerCertType.STCW_SCRFA,
       SeafarerCertType.MEDICAL_CERTIFICATE,
       SeafarerCertType.SEAMAN_BOOK,
     ],
     [CrewRank.ORDINARY_SEAMAN]: [
       SeafarerCertType.STCW_BST,
       SeafarerCertType.MEDICAL_CERTIFICATE,
       SeafarerCertType.SEAMAN_BOOK,
     ],
     // ... lanjutkan untuk semua rank
   };

   validateForSignOn(
     certificates: SeafarerCertificate[],
     rank: CrewRank,
     signOnDate: Date
   ): StcwValidationResult {
     const required = REQUIRED_BY_RANK[rank] ?? [];
     const violations: StcwViolation[] = [];

     for (const certType of required) {
       const cert = certificates.find(c => c.certificateType === certType);

       if (!cert) {
         violations.push({ certType, issue: "MISSING",
           message: `Sertifikat ${certType} tidak ditemukan` });
         continue;
       }

       if (cert.expiryDate && cert.expiryDate < signOnDate) {
         violations.push({ certType, issue: "EXPIRED",
           expiryDate: cert.expiryDate,
           message: `Sertifikat ${certType} telah kadaluarsa sejak ${format(cert.expiryDate, "dd MMM yyyy")}` });
       }
     }

     return { isCompliant: violations.length === 0, violations };
   }

5. events/
   - crew-signed-on.event.ts    { assignmentId, seafarerId, vesselId, rank, signOnDate }
   - crew-signed-off.event.ts   { assignmentId, seafarerId, vesselId, signOffDate }
   - seafarer-registered.event.ts

6. exceptions/
   - seafarer-not-found.exception.ts        (CREW_SEAFARER_NOT_FOUND, 404)
   - seafarer-already-on-board.exception.ts (CREW_ALREADY_ON_BOARD, 409)
   - stcw-violation.exception.ts            (CREW_SIGN_ON_CERT_INVALID, 422)
     → constructor(violations: StcwViolation[]) → include violations di context
   - assignment-not-found.exception.ts      (CREW_ASSIGNMENT_NOT_FOUND, 404)
   - invalid-sign-off-date.exception.ts     (VALIDATION_INVALID_DATE_RANGE, 400)

UNIT TESTS (wajib dibuat bersamaan):

contexts/crew/domain/__tests__/stcw-compliance.service.spec.ts:
✅ MASTER dengan semua cert valid → isCompliant: true, violations: []
✅ MASTER CoC expired saat signOnDate → EXPIRED violation
✅ MASTER tanpa BST → MISSING violation
✅ Multiple violations → semua ditampilkan
✅ ABLE_SEAMAN dengan cert minimal → compliant
✅ Cert dengan expiryDate null → tidak dianggap expired (beberapa cert tidak expire)
✅ Sign-on date masa depan dengan cert yang expire sebelum sign-on → EXPIRED
```

---

## PROMPT 08-B — Crew Application Layer

```
Buat application layer — use cases untuk crew management.

Lokasi: apps/api/src/contexts/crew/application/

COMMANDS:

1. register-seafarer/
   Command: { dto: RegisterSeafarerDto, companyId, createdBy }
   Handler:
   → Validate seamanBookNumber unique (jika diisi)
   → Seafarer.create(dto)
   → repository.save()
   → Emit SeafarerRegisteredEvent
   → Return SeafarerResponseDto

2. update-seafarer/
   Command: { seafarerId, companyId, dto: UpdateSeafarerDto, updatedBy }

3. sign-on-crew/
   Command: {
     seafarerId, vesselId, rank, signOnDate, signOnPort,
     contractDuration, companyId, createdBy
   }
   Handler (CRITICAL — compliance check here):

   → FindSeafarer (throw jika tidak ada)
   → FindActiveAssignment:
      Cek apakah seafarer punya assignment tanpa signOffDate
      Jika ada → throw SeafarerAlreadyOnBoardException

   → FetchCertificates: ambil semua sertifikat seafarer ini

   → stcwService.validateForSignOn(certificates, rank, signOnDate)
      Jika violations.length > 0:
        Pisahkan: criticalViolations (MISSING atau EXPIRED cert wajib)
        vs warningViolations (EXPIRING_SOON dalam 30 hari)

        Jika criticalViolations.length > 0:
          → throw StcwViolationException(criticalViolations)

        Jika hanya warnings:
          → Lanjut tapi catat warnings di assignment.remarks

   → CrewAssignment.create({ seafarerId, vesselId, rank, signOnDate, ... })
   → repository.save(assignment)
   → Emit CrewSignedOnEvent
   → Return CrewAssignmentDto

4. sign-off-crew/
   Command: { assignmentId, companyId, signOffPort, signOffDate, remarks, signedOffBy }
   Handler:
   → FindAssignment (throw jika tidak ada)
   → Validate assignment.isOnBoard (throw jika sudah sign-off)
   → assignment.signOff(signOffPort, signOffDate, signedOffBy)
   → repository.update(assignment)
   → Emit CrewSignedOffEvent

5. add-seafarer-certificate/
   Command: { seafarerId, companyId, dto: CreateSeafarerCertDto, createdBy }
   Handler:
   → FindSeafarer
   → Create SeafarerCertificate
   → Calculate initial status dari expiryDate
   → Save
   → Emit alert event jika EXPIRING_SOON atau EXPIRED

6. renew-seafarer-certificate/
   Command: { certId, seafarerId, companyId, newExpiryDate, issuingAuthority, renewedBy }

QUERIES:

7. list-seafarers/
   Query: { companyId, page, limit, search?, status?, onBoard?, vesselId? }
   Handler:
   → Repository.findAll() dengan filters
   → Jika onBoard=true: hanya seafarer dengan active assignment
   → Map ke SeafarerListItemDto
   → Include: currentVessel name, currentRank, contractDaysRemaining

8. get-seafarer-detail/
   Query: { seafarerId, companyId }
   Handler:
   → FindById
   → Fetch certificates (sorted: EXPIRED → CRITICAL → EXPIRING_SOON → VALID)
   → Fetch assignment history (sorted: newest first)
   → Fetch current assignment (jika on board)
   → Map ke SeafarerDetailDto

9. get-manning-list/
   Query: { vesselId, companyId }
   Handler:
   → Fetch active assignments untuk vessel ini
   → Group by department: DECK, ENGINE, CATERING
   → Untuk setiap jabatan dalam safe manning: cek apakah terisi atau VACANT
   → Return ManningSummaryDto:
     {
       vesselId, vesselName,
       totalOnBoard: number,
       safeManningRequired: number,
       isManningSufficient: boolean,
       departments: {
         DECK: { required, onBoard, assignments: [...] },
         ENGINE: { required, onBoard, assignments: [...] },
         CATERING: { required, onBoard, assignments: [...] }
       }
     }

10. get-crew-compliance-summary/
    Query: { companyId }
    → Seafarers with expired certs who are on board (critical!)
    → Seafarers with expiring certs who are on board (warning)
    → Total on board count
    → Return CrewComplianceSummaryDto

DTOs:
- register-seafarer.dto.ts     (semua field dengan validasi + Swagger)
- seafarer-response.dto.ts     (full detail, NO sensitive data)
- seafarer-list-item.dto.ts    (compact: id, name, seamanBook, nationality, status, currentVessel)
- create-seafarer-cert.dto.ts
- seafarer-cert.dto.ts         (dengan computed expiryStatus + daysUntilExpiry)
- sign-on-crew.dto.ts          { seafarerId, vesselId, rank, signOnDate, signOnPort, contractDuration }
- sign-off-crew.dto.ts         { signOffPort, signOffDate, remarks }
- manning-summary.dto.ts

UNIT TESTS untuk semua handlers (mock repositories).
```

---

## PROMPT 08-C — Crew Infrastructure & Controllers

```
Buat infrastructure dan presentation layer untuk Crew module.

INFRASTRUCTURE:

1. prisma-seafarer.repository.ts
   findAll() support filters: status, onBoard (join dengan crew_assignments),
   vesselId (filter crew on board di vessel tertentu), search (nama, seaman book)

2. prisma-crew-assignment.repository.ts
   findActiveBySeafarer(seafarerId): Promise<CrewAssignment | null>
   → Query: signOffDate IS NULL AND seafarerId = ?
   findActiveByVessel(vesselId, companyId): Promise<CrewAssignment[]>
   → Query: signOffDate IS NULL AND vesselId = ? AND companyId = ?

3. mappers/seafarer.mapper.ts
   toDomain(), toListResponse(), toDetailResponse(), toPrismaCreate()

CONTROLLERS:

4. seafarer.controller.ts
   @ApiTags("Crew — Seafarers")

   GET    /api/v1/crew/seafarers
   @Permissions("crew:read")
   @ApiQuery: page, limit, status, search, onBoard (boolean), vesselId

   POST   /api/v1/crew/seafarers
   @Permissions("crew:create")
   @Audit({ resource: "seafarer" })

   GET    /api/v1/crew/seafarers/:seafarerId
   @Permissions("crew:read")

   PATCH  /api/v1/crew/seafarers/:seafarerId
   @Permissions("crew:update")
   @Audit({ resource: "seafarer", captureOld: true })

   DELETE /api/v1/crew/seafarers/:seafarerId
   @Permissions("crew:delete")

   GET    /api/v1/crew/seafarers/:seafarerId/certificates
   POST   /api/v1/crew/seafarers/:seafarerId/certificates
   PATCH  /api/v1/crew/seafarers/:seafarerId/certificates/:certId
   POST   /api/v1/crew/seafarers/:seafarerId/certificates/:certId/renew
   GET    /api/v1/crew/seafarers/:seafarerId/assignments

5. crew-assignment.controller.ts
   @ApiTags("Crew — Manning")

   POST   /api/v1/crew/sign-on
   @Permissions("crew:sign_on")
   @Audit({ resource: "crew_assignment" })
   Body: SignOnCrewDto
   Response 201: CrewAssignmentDto
   OnError StcwViolationException → 422 dengan violations array dalam error.details

   POST   /api/v1/crew/sign-off/:assignmentId
   @Permissions("crew:sign_off")
   @Audit({ resource: "crew_assignment", captureOld: true })

   GET    /api/v1/crew/manning/:vesselId
   @Permissions("crew:read")
   Response: ManningSummaryDto

   GET    /api/v1/crew/compliance-summary
   @Permissions("crew:read")
   Response: CrewComplianceSummaryDto

6. fleet.module.ts — tambahkan CertExpiryJob untuk seafarer certs
```

---

## PROMPT 08-D — Crew Frontend Pages

```
Buat halaman-halaman frontend untuk Crew Management module.
Baca docs/ai-rules/10-ui-design-system.md untuk dense information display.

FILE STRUCTURE:
apps/web/src/app/(dashboard)/crew/
├── seafarers/
│   ├── page.tsx                   ← List semua seafarer
│   └── [seafarerId]/
│       └── page.tsx               ← Detail seafarer
├── manning/
│   └── page.tsx                   ← Manning list per vessel
└── certificates/
    └── page.tsx                   ← All crew certificates (compliance view)

1. seafarers/page.tsx — Daftar Pelaut

   TABLE COLUMNS:
   - Nama Lengkap (bold, clickable)
   - No. Buku Pelaut (monospace)
   - Kebangsaan (flag emoji + nama)
   - Jabatan Terkini
   - Status (StatusBadge: On Board/Tersedia/Cuti/Blacklist)
   - Kapal Saat Ini (link ke vessel)
   - Sertifikat (mini compliance indicator)
   - Actions (Edit, Lihat Detail, Sertifikat, Nonaktifkan)

   FILTER BAR:
   [Cari nama/buku pelaut] [Status▼] [Jabatan▼] [Di Atas Kapal ☐]

   "+ Daftarkan Pelaut" → SlideOver form:
   Section Identitas: Nama Depan*, Nama Belakang*, Tanggal Lahir*, Kebangsaan*
   Section Dokumen: No. Buku Pelaut, No. Paspor, Berlaku Hingga
   Section Kontak Darurat: Nama, Hubungan, No. Telpon

2. seafarers/[seafarerId]/page.tsx — Detail Pelaut

   2-column layout:

   LEFT (1/3):
   - Photo placeholder (avatar dengan inisial)
   - InfoPanel: Data Pribadi
     Nama Lengkap, Kebangsaan, Tanggal Lahir, Usia, Jenis Kelamin
   - InfoPanel: Dokumen
     No. Buku Pelaut, No. Paspor, Berlaku Hingga (dengan ExpiryBadge)
   - InfoPanel: Status & Jabatan
     Status, Jabatan Saat Ini, Kapal Saat Ini, Sign On Date, Sisa Kontrak
   - InfoPanel: Kontak Darurat

   RIGHT (2/3):
   TabNav: [Sertifikat] [Riwayat Kapal] [Audit]

   Tab SERTIFIKAT:
   [+ Tambah Sertifikat]
   Dense list (bukan table besar):
   ┌──────────────────────────────────────────────────────────┐
   │ CoC (Chief Officer)     CoC-2020-1234  BKI              │
   │  ████████████████░░░░  Berlaku: 15 Mar 2026 (287 hari) │
   ├──────────────────────────────────────────────────────────┤
   │ BST                     BST-2019-5678  Balai Diklat     │
   │  ████████████████████  Tidak ada expiry                 │
   ├──────────────────────────────────────────────────────────┤
   │ Medical Certificate     MED-2023-9012  RS Pelabuhan     │
   │  ██████████████░░░░░░  Berlaku: 20 Jun 2024 ⚠ 45 hr   │
   └──────────────────────────────────────────────────────────┘

   Klik cert item → expand dengan detail + tombol Perbarui / Perpanjang

   Tab RIWAYAT KAPAL:
   Timeline vertikal:
   ● Jan 2024 – Sekarang  |  Mualim I  |  MV Nusantara Jaya 1
   ● Mar 2023 – Jan 2024  |  Mualim I  |  MV Armada Sentosa
   ● Jun 2022 – Mar 2023  |  Mualim II |  MV Nusantara Jaya 2

3. manning/page.tsx — Manning List

   VESSEL SELECTOR (di atas, sticky):
   Dropdown kapal dengan search. Default: kapal pertama yang active.

   MANNING TABLE (grouped by department):

   ┌─── DEPARTEMEN DEK ───────────────────────────────────────┐
   │  Jabatan       Nama              Sign On    Sisa Kontrak │
   │  Nakhoda       Joko Santoso      12 Jan 24  45 hari      │
   │  Mualim I      Ahmad Yani        5 Feb 24   85 hari  ⚠   │
   │  Mualim II     ── KOSONG ──      –          –            │  ← merah
   │  Mualim III    Budi Prasetyo     1 Mar 24   120 hari     │
   ├─── DEPARTEMEN MESIN ─────────────────────────────────────┤
   │  KKM           Hendra Wijaya     15 Jan 24  30 hari  🔴  │
   │  Masinis II    Doni Kusuma       20 Feb 24  60 hari      │
   └──────────────────────────────────────────────────────────┘

   JABATAN KOSONG: highlight merah, row "── KOSONG ──"
   SISA KONTRAK ≤30 HARI: badge oranye dengan ikon warning

   Action buttons:
   [+ Sign On Kru Baru] [Sign Off Kru] [Export Manning List]

   SIGN-ON DIALOG (Modal 560px):
   Step 1: Cari Pelaut
   - Search input → hasil muncul di bawah (nama + buku pelaut + status)
   - Klik untuk select

   Step 2: Detail Penugasan
   - Jabatan* (select — rank)
   - Tanggal Naik* (date picker)
   - Pelabuhan Naik* (text)
   - Durasi Kontrak* (number + "bulan")

   Step 3: STCW Compliance Check (auto-run setelah Step 2 diisi)
   - Loading: "Memeriksa sertifikat..."
   - Hasil: list cert dengan status (✓ valid, ⚠ expiring, ✗ missing/expired)
   - Jika ada HARD violation: tombol "Proses Sign On" disabled
     + pesan merah: "Tidak dapat naik kapal: ada sertifikat yang tidak valid"
   - Jika semua OK atau hanya warning:
     + tombol "Proses Sign On" enabled
     + Warning banner kuning jika ada cert yang mau expired

   [Batal] [← Kembali] [Proses Sign On ✓]
```

---

## Checklist Selesai Prompt 08

```bash
# Backend API
curl -X POST http://localhost:4000/api/v1/crew/seafarers \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{"firstName":"Joko","lastName":"Santoso","nationality":"ID","dateOfBirth":"1985-03-15","gender":"MALE"}'
# → 201 seafarer created

# Sign-on dengan cert expired → compliance violation
curl -X POST http://localhost:4000/api/v1/crew/sign-on \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{"seafarerId":"...","vesselId":"...","rank":"MASTER","signOnDate":"2024-06-01","signOnPort":"Tanjung Priok","contractDuration":6}'
# Jika Master tanpa CoC → 422 dengan violations detail

# Manning list
curl http://localhost:4000/api/v1/crew/manning/{vesselId} \
  -H "Authorization: Bearer {token}"
# → ManningSummaryDto dengan grouped departments

# Frontend pages
# Buka /crew/seafarers → table dengan filter
# Klik seafarer → detail dengan sertifikat tabs
# /crew/manning → pilih kapal → manning table grouped

# Unit tests
pnpm test:unit --testPathPattern=crew
# → stcw-compliance.service.spec.ts semua passing
# → sign-on handler semua scenarios pass

# Integration test
pnpm test:integration --testPathPattern=crew
# → sign-on valid → assignment created
# → sign-on dengan cert expired → 422 violation
# → sign-off → isOnBoard: false
```
