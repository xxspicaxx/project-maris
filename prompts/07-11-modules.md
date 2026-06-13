# Prompt 07 — Dashboard & KPI

**Tahap:** Dashboard utama dengan KPI fleet, alert panel, compliance widgets  
**Prerequisite:** Prompt 06 selesai  
**Output:** Dashboard fully functional dengan real data dari API

---

## PROMPT 07-A — Dashboard Page

```
Buat halaman Dashboard utama untuk Maritime Fleet ERP.
Baca docs/ai-rules/10-ui-design-system.md section 10.4 Pattern 3 untuk layout.
Data dari API harus real — TIDAK ada hardcoded/mock data di halaman ini.

File: apps/web/src/app/(dashboard)/page.tsx  (atau /dashboard/page.tsx)

LAYOUT DASHBOARD (3 section vertikal):

SECTION 1 — KPI Row (4 kartu sejajar)
Fetch: GET /api/v1/vessels/compliance-summary

KPI Cards:
┌──────────────────┬──────────────────┬──────────────────┬──────────────────┐
│  Total Armada    │  Beroperasi      │  Sertifikat      │  Compliance Rate │
│  [47] kapal      │  [38] kapal      │  [12] Kritis     │  [87.2] %        │
│  status: neutral │  status: good    │  status: danger  │  status: warning │
└──────────────────┴──────────────────┴──────────────────┴──────────────────┘

SECTION 2 — Dua panel sejajar (3:2 ratio)
Kiri (60%): AlertPanel — daftar sertifikat kritis dan expiring soon
Kanan (40%): VesselStatusBreakdown — donut chart status kapal

SECTION 3 — Dua panel sejajar (1:1)
Kiri: RecentActivity — 10 aktivitas terakhir dari audit log
Kanan: UpcomingExpiryList — 10 sertifikat yang akan segera expired

Semua panel menggunakan layout:
- bg-surface, border, rounded, tidak ada shadow berlebihan
- Header: 12px uppercase label + optional "Lihat Semua" link
- Loading: skeleton, bukan spinner penuh halaman
- Error: inline error state per panel (bukan error page)
- Refresh: setiap 5 menit otomatis (react-query staleTime)
```

---

## PROMPT 07-B — Alert Panel Component

```
Buat AlertPanel — komponen paling penting di dashboard.
Ini adalah first thing yang dilihat Fleet Manager setiap hari.

File: apps/web/src/components/maritime/AlertPanel.tsx

Data fetch: GET /api/v1/vessels/compliance-summary
           + GET /api/v1/vessels?certStatus=CRITICAL,EXPIRED&limit=20

Tampilan DENSE (seperti email inbox, bukan card besar):

Header: "⚠ Alert Kepatuhan" + badge count + refresh button

List items (sorted: EXPIRED dulu, lalu CRITICAL, lalu EXPIRING_SOON):
┌─────────────────────────────────────────────────────────────┐
│ 🔴 [EXPIRED]       MV Nusantara 1 · SMC · Expired 5 hr lalu │
│ 🟠 [KRITIS]        MV Sentosa Star · IOPP · 12 hari lagi    │
│ 🟠 [KRITIS]        MV Armada 3 · ISSC · 18 hari lagi        │
│ 🟡 [SEGERA HABIS]  MV Nusantara 2 · Load Line · 45 hr lagi  │
│ 🟡 [SEGERA HABIS]  MV Sentosa · DOC · 67 hari lagi          │
└─────────────────────────────────────────────────────────────┘

Setiap item:
- Row height: 40px
- Klik → navigate ke /fleet/vessels/{vesselId}/certificates
- Hover: highlight row
- Icon warna sesuai status
- Vessel name bold, cert type + days left secondary
- Badge status kecil di kiri

Footer: "X alert aktif — Lihat Semua Sertifikat →"

Empty state: "✅ Semua sertifikat dalam kondisi baik"
```

---

## PROMPT 07-C — Fleet Vessels List Page

```
Buat halaman Daftar Kapal — halaman yang paling sering digunakan Fleet Manager.
File: apps/web/src/app/(dashboard)/fleet/vessels/page.tsx

LAYOUT:
PageHeader:
  Title: "Daftar Armada"
  Subtitle: "X kapal terdaftar"
  Actions: [Filter dropdown] [+ Tambah Kapal]

Filter Bar (di bawah header, sebelum table):
- Search input: "Cari nama kapal, IMO..."
- Status filter: All | Beroperasi | Dok Kering | Diistirahatkan
- Type filter: Semua Tipe | Bulk Carrier | Tanker | dll
- Flag State filter

DATA TABLE (ErpDataTable dengan columns):
Kolom (urutan kiri ke kanan):
1. Checkbox (select)
2. Nama Kapal (bold, clickable → detail)
3. IMO Number (monospace font)
4. Tipe Kapal
5. Bendera (flag emoji + kode negara)
6. GT (Gross Tonnage) — right-aligned, monospace
7. Kelas (BKI, DNV, dll)
8. Status (StatusBadge)
9. Sertifikat (mini indicator: berapa cert OK / berapa warning / berapa expired)
10. Actions (⋯ menu: Edit, Ubah Status, Lihat Sertifikat, Hapus)

BEHAVIOR:
- Click nama kapal → /fleet/vessels/{vesselId}
- Pagination: 20 per page default
- Sort: click header column
- URL sync: filter dan pagination ke-URL params (?status=ACTIVE&page=2)
- Select multiple → bulk action bar muncul di atas table
- Responsive minimum: table horizontal scroll di layar kecil

DIALOG TAMBAH KAPAL (slide-over panel dari kanan, lebar 480px):
Form fields:
- Nomor IMO* (7 digit)
- Nama Kapal*
- Tipe Kapal* (select)
- Negara Bendera* (searchable select, ISO country list)
- Gross Tonnage*
- Net Tonnage
- DWT
- Biro Klasifikasi (select: BKI, DNV, Lloyd's, ABS, NK, BV, dll)
- Nomor Kelas
- Tahun Pembangunan
- Galangan Kapal

Validation: real-time, Zod schema dari @shared/schemas
Submit: useCreateVessel() → success → tutup panel, refresh table, toast
```

---

# Prompt 08 — Crew Management Module

**Tahap:** Seafarer CRUD, STCW certificate tracking, sign-on/sign-off  
**Prerequisite:** Prompt 07 selesai  
**Output:** Crew module fully functional dengan STCW compliance validation

---

## PROMPT 08-A — Crew Domain & Application Layer

```
Buat Crew bounded context — domain dan application layer.
Baca docs/ai-rules/12-maritime-compliance.md section 12.3 untuk STCW rules.
Baca docs/ai-rules/11-domain-glossary.md untuk crew ranks dan cert types.

Lokasi: apps/api/src/contexts/crew/

DOMAIN LAYER:

1. entities/seafarer.entity.ts  (Aggregate Root)

   Properties: id, companyId, seamanBookNumber, firstName, lastName,
   nationality, dateOfBirth, gender, passportNumber, passportExpiry,
   emergencyContact, status, createdAt, updatedAt, createdBy, deletedAt

   Business methods:
   get fullName(): string
   get age(): number

   activate(): void
   deactivate(): void
   blacklist(reason: string): void

   static create(data): Seafarer

2. entities/crew-assignment.entity.ts

   Properties: id, companyId, seafarerId, vesselId, rank, signOnDate,
   signOffDate, signOnPort, signOffPort, contractDuration, remarks

   Business methods:
   signOff(port: string, signOffDate: Date, signedOffBy: string): void
     → Validate signOffDate >= signOnDate
     → Emit CrewSignedOffEvent

   get isOnBoard(): boolean
     → return signOffDate === null

   get contractDaysRemaining(): number

   static create(data): CrewAssignment
     → Emit CrewSignedOnEvent

3. domain services/stcw-compliance.service.ts

   validateCertificatesForRank(
     seafarer: Seafarer,
     certificates: SeafarerCertificate[],
     rank: CrewRank,
     signOnDate: Date
   ): StcwComplianceResult

   Implement logic dari docs/ai-rules/12-maritime-compliance.md section 12.3:
   - REQUIRED_CERTIFICATES_BY_RANK mapping (lengkap semua rank)
   - Check MISSING certificates
   - Check EXPIRED certificates pada signOnDate
   - Return: { isCompliant, violations: StcwViolation[] }

4. exceptions/
   - seafarer-not-found.exception.ts       (CREW_SEAFARER_NOT_FOUND, 404)
   - seafarer-already-on-board.exception.ts (CREW_ALREADY_ON_BOARD, 409)
   - stcw-compliance-violation.exception.ts (CREW_SIGN_ON_CERT_INVALID, 422)
     Bawa violations detail di dalam exception
   - assignment-not-found.exception.ts    (CREW_ASSIGNMENT_NOT_FOUND, 404)

APPLICATION LAYER:

Commands:
- register-seafarer/ → create seafarer + validate seaman book unique
- update-seafarer/
- sign-on-crew/
  Handler:
  → FindSeafarer
  → Check tidak sedang on board di vessel lain
  → validateCertificatesForRank (STCW compliance)
  → Jika ada violations → throw StcwComplianceViolationException
  → Create CrewAssignment
  → Emit CrewSignedOnEvent

- sign-off-crew/
  → FindAssignment
  → assignment.signOff()
  → Update status seafarer
  → Emit CrewSignedOffEvent

- add-seafarer-certificate/
- renew-seafarer-certificate/

Queries:
- list-seafarers/       ← dengan filter: status, rank on board, cert status
- get-seafarer-detail/  ← termasuk assignments, certificates
- get-manning-list/     ← per vessel, siapa yang on board saat ini
- get-crew-compliance-summary/ ← aggregate cert status per company

Buat unit tests untuk StcwComplianceService dengan semua edge cases:
✅ MASTER dengan semua cert valid → compliant
✅ MASTER dengan CoC expired → tidak compliant
✅ MASTER dengan BST missing → tidak compliant
✅ AB dengan cert minimal → compliant
```

---

## PROMPT 08-B — Crew Infrastructure, Presentation & Frontend

```
Buat infrastructure, presentation (API), dan frontend untuk Crew module.

BACKEND CONTROLLERS:

1. seafarer.controller.ts
   Tag: "Crew — Seafarers"

   GET    /api/v1/crew/seafarers                    List dengan filter
   POST   /api/v1/crew/seafarers                    Register seafarer baru
   GET    /api/v1/crew/seafarers/:seafarerId         Detail seafarer
   PATCH  /api/v1/crew/seafarers/:seafarerId         Update data
   DELETE /api/v1/crew/seafarers/:seafarerId         Soft delete

   GET    /api/v1/crew/seafarers/:seafarerId/certificates
   POST   /api/v1/crew/seafarers/:seafarerId/certificates
   PATCH  /api/v1/crew/seafarers/:seafarerId/certificates/:certId
   POST   /api/v1/crew/seafarers/:seafarerId/certificates/:certId/renew

   GET    /api/v1/crew/seafarers/:seafarerId/assignments  ← Riwayat kapal

2. crew-assignment.controller.ts
   Tag: "Crew — Assignments"

   POST   /api/v1/crew/assignments/sign-on
   Body: { seafarerId, vesselId, rank, signOnDate, signOnPort, contractDuration }
   → Run STCW validation
   → Jika violation: return 422 dengan detail violations (jangan block UI tapi tunjukkan)

   POST   /api/v1/crew/assignments/:assignmentId/sign-off
   Body: { signOffPort, signOffDate, remarks }

   GET    /api/v1/crew/manning-list/:vesselId        ← Siapa on board sekarang
   GET    /api/v1/crew/compliance-summary            ← Dashboard widget

FRONTEND PAGES:

3. apps/web/src/app/(dashboard)/crew/seafarers/page.tsx

   Table columns:
   - Nama Lengkap (clickable)
   - No. Buku Pelaut (monospace)
   - Kebangsaan
   - Jabatan Terakhir
   - Status (on board / available / on leave)
   - Sertifikat (indicator bar: berapa ok, berapa warning)
   - Kapal Saat Ini (jika on board)
   - Actions

   Actions toolbar: [Filter] [+ Daftarkan Pelaut] [Export Excel]

4. apps/web/src/app/(dashboard)/crew/seafarers/[seafarerId]/page.tsx

   Layout 2 kolom:

   Kolom kiri (1/3):
   - Info Panel: Data Pribadi (nama, tanggal lahir, kebangsaan, dll)
   - Info Panel: Dokumen (no. paspor, buku pelaut, expiry)
   - Info Panel: Kontak Darurat

   Kolom kanan (2/3):
   Tabs:
   [Sertifikat] [Riwayat Kapal] [Audit Log]

   Tab Sertifikat:
   - List semua cert dengan CertificateExpiryBar
   - Sort: EXPIRED dulu, kemudian by expiry date
   - Button: + Tambah Sertifikat, Perbarui (per cert)

   Tab Riwayat Kapal:
   - Timeline: kapal, jabatan, sign-on, sign-off, durasi

5. apps/web/src/app/(dashboard)/crew/manning/page.tsx

   Manning List — per vessel view

   Vessel selector di atas (dropdown)

   Table per jabatan (grouped):
   ┌─── DEK ──────────────────────────────────────────────────┐
   │ Nakhoda      │ Joko Widodo  │ Sign On: 12 Jan │ 45 hr lagi│
   │ Mualim I     │ Ahmad Yani   │ Sign On: 5 Feb  │ 85 hr lagi│
   │ Mualim II    │ -VACANT-     │                 │           │
   ├─── MESIN ────────────────────────────────────────────────┤
   │ KKM          │ Budi Santoso │ Sign On: 1 Mar  │ 60 hr lagi│
   └──────────────────────────────────────────────────────────┘

   Button: [Sign On Kru Baru] [Sign Off Kru]

   Sign-On Dialog:
   - Cari seafarer (search by nama/buku pelaut)
   - Pilih jabatan
   - Tanggal naik, pelabuhan naik, durasi kontrak
   - STCW Compliance Check (run di client side dulu, kemudian server validate)
   - Jika ada warning cert: tampilkan list violations tapi izinkan proceed dengan konfirmasi
   - Jika ada EXPIRED cert wajib: BLOCK dengan pesan jelas
```

---

# Prompt 09 — Voyage Management Module

**Tahap:** Voyage planning, port call, log book, departure compliance check  
**Prerequisite:** Prompt 08 selesai  
**Output:** Voyage module dengan full lifecycle management

---

## PROMPT 09-A — Voyage Backend

```
Buat Voyage bounded context.
Baca docs/ai-rules/12-maritime-compliance.md section 12.9 untuk blocking rules.
Baca docs/ai-rules/11-domain-glossary.md untuk voyage terminology.

DOMAIN:

1. entities/voyage.entity.ts (Aggregate Root)

   Properties: id, companyId, vesselId, voyageNumber (auto-generated),
   status (PLANNED/ACTIVE/COMPLETED/CANCELLED),
   departurePort, destinationPort,
   etd, eta, atd, ata,
   cargoType, cargoQuantity, cargoUnit,
   isBallastedVoyage, remarks

   Business methods:
   static create(data): Voyage
     → Auto-generate voyageNumber: {companyCode}-{YYYY}-{sequential:04d}

   approve(): void
     → status PLANNED → ACTIVE, set actualDeparture

   complete(arrivalData): void
     → status ACTIVE → COMPLETED, set ata

   cancel(reason: string): void
     → Hanya bisa dari PLANNED

   addPortCall(portCall): void

   get duration(): number | null   ← hari, jika sudah ada ata

2. domain/services/voyage-compliance.service.ts

   async validateDepartureCompliance(
     vessel: Vessel,
     company: Company,
     voyageDate: Date
   ): Promise<ComplianceCheckResult>

   Checks (dari 12-maritime-compliance.md section 12.9):
   1. SMC valid? → HARD BLOCK jika expired
   2. DOC valid? → HARD BLOCK jika expired
   3. ISSC valid? → HARD BLOCK jika expired
   4. Manning >= minimum safe manning? → HARD BLOCK jika kurang
   5. PSC detained? → HARD BLOCK jika detention aktif
   6. SMC critical (<30 hari)? → SOFT BLOCK (perlu approval)

   Return:
   {
     canDepart: boolean,
     hardBlocks: ComplianceViolation[],
     softBlocks: ComplianceViolation[],
     warnings: ComplianceWarning[]
   }

APPLICATION:

Commands:
- create-voyage/          → Create dengan status PLANNED
- update-voyage/          → Hanya bisa update jika PLANNED
- approve-departure/
  Handler:
  → Run VoyageComplianceService.validateDepartureCompliance()
  → Jika ada hardBlocks → throw ComplianceBlockException
  → Log softBlocks sebagai warnings
  → voyage.approve()
  → Emit VoyageDepartedEvent

- record-arrival/         → voyage.complete() + set ata
- cancel-voyage/          → hanya dari status PLANNED
- add-port-call/
- update-noon-report/     → Log posisi harian kapal

Queries:
- list-voyages/           ← filter: status, vesselId, dateRange
- get-voyage-detail/      ← termasuk port calls, log entries
- get-active-voyages/     ← untuk dashboard — voyage yang sedang ACTIVE
- get-voyage-history/     ← per vessel, semua voyage selesai

CONTROLLERS:

voyage.controller.ts
POST   /api/v1/voyages
GET    /api/v1/voyages              ← dengan filter
GET    /api/v1/voyages/active       ← dashboard widget
GET    /api/v1/voyages/:voyageId
PATCH  /api/v1/voyages/:voyageId   ← hanya jika PLANNED
POST   /api/v1/voyages/:voyageId/approve-departure
POST   /api/v1/voyages/:voyageId/record-arrival
POST   /api/v1/voyages/:voyageId/cancel
POST   /api/v1/voyages/:voyageId/port-calls
GET    /api/v1/voyages/:voyageId/port-calls
POST   /api/v1/voyages/:voyageId/noon-reports

FRONTEND: apps/web/src/app/(dashboard)/voyage/

1. Voyage list page — table dengan status badges
2. Voyage detail page — info panels + port call timeline
3. Create voyage slide-over form
4. Departure approval dengan compliance check display:
   - Tunjukkan hasil compliance check sebelum confirm
   - Hard blocks: merah, tidak bisa proceed
   - Soft blocks: kuning, bisa proceed dengan checkbox konfirmasi
   - Semua clear: hijau "Kapal Siap Berangkat"
```

---

# Prompt 10 — Technical / PMS Module

**Tahap:** Planned Maintenance System, work orders, defect tracking  
**Prerequisite:** Prompt 09 selesai  
**Output:** PMS module siap digunakan Technical Superintendent

---

## PROMPT 10 — PMS Backend & Frontend

```
Buat Technical/PMS bounded context (Planned Maintenance System).
Baca docs/ai-rules/11-domain-glossary.md section 11.5 untuk terminologi teknikal.

DOMAIN:

entities/maintenance-job.entity.ts (Aggregate Root)
Properties: id, companyId, vesselId, jobCode, title, description,
componentId, jobType (CALENDAR/RUNNING_HOURS/CONDITION_BASED),
intervalDays, intervalHours, lastDoneDate, lastDoneHours,
dueDateCalendar, dueHours, status (SCHEDULED/DUE/OVERDUE/IN_PROGRESS/COMPLETED),
priority (LOW/MEDIUM/HIGH/CRITICAL), responsibleRank

Business methods:
get isOverdue(): boolean
get daysUntilDue(): number
scheduleWorkOrder(assignedTo, plannedDate): WorkOrder
complete(completedDate, completedHours, remarks, completedBy): void

entities/work-order.entity.ts
Properties: id, companyId, vesselId, maintenanceJobId, woNumber,
title, description, assignedRank, plannedDate, startDate,
completedDate, status, actualHours, findings, partsUsed, remarks

entities/defect.entity.ts
Properties: id, companyId, vesselId, defectCode, title, description,
severity (CRITICAL/HIGH/MEDIUM/LOW), location, reportedBy, reportedAt,
status (OPEN/IN_PROGRESS/RESOLVED/CLOSED), resolvedAt, resolution, evidence

PRISMA SCHEMA ADDITIONS:
model MaintenanceComponent { id, vesselId, companyId, code, name,
  maker, model, serialNumber, installDate, runningHours }
model MaintenanceJob { ...semua fields di atas... }
model WorkOrder { ... }
model Defect { ... }

Migration: add_technical_pms_schema

CONTROLLERS:

technical.controller.ts
GET    /api/v1/technical/vessels/:vesselId/jobs           ← PMS job list
POST   /api/v1/technical/vessels/:vesselId/jobs
GET    /api/v1/technical/vessels/:vesselId/jobs/overdue   ← Dashboard critical
PATCH  /api/v1/technical/jobs/:jobId
POST   /api/v1/technical/jobs/:jobId/create-work-order

work-order.controller.ts
GET    /api/v1/technical/work-orders
POST   /api/v1/technical/work-orders
PATCH  /api/v1/technical/work-orders/:woId
POST   /api/v1/technical/work-orders/:woId/complete

defect.controller.ts
GET    /api/v1/technical/defects
POST   /api/v1/technical/defects                         ← Report defect baru
PATCH  /api/v1/technical/defects/:defectId
POST   /api/v1/technical/defects/:defectId/resolve

Cron job: Daily check overdue maintenance jobs → update status → emit alert

FRONTEND PAGES:

/technical/
├── page.tsx         ← Overview: overdue count, upcoming jobs, open defects
├── pms/page.tsx     ← Job list dengan filter vessel, status, priority
├── work-orders/     ← WO list
└── defects/         ← Defect tracker

Defect list table columns:
Kode | Kapal | Lokasi | Judul | Severity | Dilaporkan | Status | Actions
```

---

# Prompt 11 — HSSEQ Module

**Tahap:** Incident reporting, audit, PSC inspection, drill records  
**Prerequisite:** Prompt 10 selesai  
**Output:** HSSEQ module sesuai ISM Code requirements

---

## PROMPT 11 — HSSEQ Backend & Frontend

```
Buat HSSEQ bounded context (Health, Safety, Security, Environment & Quality).
Baca docs/ai-rules/12-maritime-compliance.md untuk ISM Code requirements.
Referensi: ISM Code Chapter 9 (Incident Reporting) dan Chapter 10 (Maintenance).

PRISMA SCHEMA ADDITIONS:

model Incident {
  id, companyId, vesselId, incidentNumber (auto: INC-{YYYY}-{seq}),
  type (ACCIDENT/NEAR_MISS/DANGEROUS_OCCURRENCE/POLLUTION/PROPERTY_DAMAGE),
  severity (FATAL/SERIOUS/MINOR/NEAR_MISS),
  title, description, location, incidentDate,
  reportedBy, reportedAt, status (OPEN/UNDER_INVESTIGATION/CLOSED),
  rootCause, correctiveActions, lessonsLearned,
  investigatedBy, investigatedAt, closedBy, closedAt
}

model PscInspection {
  id, companyId, vesselId, inspectionDate, port, portStateCountry,
  pscOfficer, inspectionType, result, isDetained,
  detentionFrom, detentionTo, releaseConditions
  deficiencies: PscDeficiency[]
}

model PscDeficiency {
  id, inspectionId, deficiencyCode, description,
  actionCode, isRectified, rectifiedAt, evidence
}

model DrillRecord {
  id, companyId, vesselId, drillType (FIRE/ABANDON_SHIP/MOB/SECURITY/OIL_SPILL),
  drillDate, conductedBy, participants, duration, findings,
  correctiveActions, signedByMaster, masterSignedAt
}

model InternalAudit {
  id, companyId, vesselId nullable, auditType (VESSEL/SMS/OFFICE),
  auditDate, auditorName, auditScope, findings: AuditFinding[],
  status, closedAt
}

model AuditFinding {
  id, auditId, findingType (MAJOR_NC/MINOR_NC/OBSERVATION),
  description, requirementRef, responsibleParty,
  targetCloseDate, actualCloseDate, status, evidence
}

Migration: add_hsseq_schema

CONTROLLERS:

incident.controller.ts
POST   /api/v1/hsseq/incidents               ← Report incident (semua kru bisa)
GET    /api/v1/hsseq/incidents               ← Filter by type, severity, status
GET    /api/v1/hsseq/incidents/:id
PATCH  /api/v1/hsseq/incidents/:id
POST   /api/v1/hsseq/incidents/:id/investigate
POST   /api/v1/hsseq/incidents/:id/close

psc.controller.ts
GET    /api/v1/hsseq/psc-inspections
POST   /api/v1/hsseq/psc-inspections
GET    /api/v1/hsseq/psc-inspections/:id
POST   /api/v1/hsseq/psc-inspections/:id/deficiencies
PATCH  /api/v1/hsseq/psc-inspections/:id/deficiencies/:defId/rectify

drill.controller.ts
GET    /api/v1/hsseq/drills
POST   /api/v1/hsseq/drills                 ← Record drill yang sudah dilakukan
GET    /api/v1/hsseq/drills/upcoming        ← Jadwal drill berikutnya

audit.controller.ts
GET    /api/v1/hsseq/audits
POST   /api/v1/hsseq/audits
GET    /api/v1/hsseq/audits/:id
POST   /api/v1/hsseq/audits/:id/findings
PATCH  /api/v1/hsseq/audits/:id/findings/:findingId

BUSINESS RULES:
- Incident dengan severity FATAL/SERIOUS → auto-notify ISM Manager via event
- PSC detention → set vessel status BLOCKED, update compliance check
- Drill harus dilakukan setiap 3 bulan (fire, abandon ship)
  → Cron job cek dan generate reminder jika sudah dekat jadwal

FRONTEND PAGES:
/hsseq/
├── incidents/         ← List + form report incident
├── psc/               ← PSC inspection tracker dengan deficiency list
├── drills/            ← Drill record + upcoming schedule
└── audits/            ← Internal audit management

Dashboard widget di /dashboard:
- Open incidents count
- Open non-conformities count
- Last PSC inspection result
- Next scheduled drill
```

---

_Prompt 08–11 mengikuti pola yang sama: domain → application → infrastructure → presentation → frontend. Selalu buat unit tests bersamaan._
