# Prompt 09 — Voyage Management Module

**Tahap:** Voyage planning, port call, log book, departure compliance gate  
**Prerequisite:** Prompt 08 selesai  
**Output:** Full voyage lifecycle dengan compliance blocking

---

## PROMPT 09-A — Voyage Domain & Application

```
Buat Voyage bounded context.
Baca docs/ai-rules/12-maritime-compliance.md section 12.9 untuk blocking rules.
Baca docs/ai-rules/11-domain-glossary.md section 11.4 untuk voyage terminology.

PRISMA SCHEMA (jalankan migration setelah schema dibuat):

model Voyage {
  id              String        @id @default(uuid())
  companyId       String
  vesselId        String
  voyageNumber    String        @unique   // Auto: {companyCode}-{YYYY}-{seq:04d}
  status          VoyageStatus  @default(PLANNED)
  departurePort   String
  destinationPort String
  etd             DateTime      // Estimated Time of Departure
  eta             DateTime      // Estimated Time of Arrival
  atd             DateTime?     // Actual Time of Departure
  ata             DateTime?     // Actual Time of Arrival
  cargoType       String?
  cargoQuantity   Decimal?      @db.Decimal(10, 2)
  cargoUnit       String?       // MT, CBM, TEU, dll
  isBallastedVoyage Boolean     @default(false)
  remarks         String?
  cancelledReason String?
  createdAt       DateTime      @default(now())
  updatedAt       DateTime      @updatedAt
  createdBy       String
  updatedBy       String

  vessel          Vessel        @relation(...)
  company         Company       @relation(...)
  portCalls       PortCall[]
  noonReports     NoonReport[]

  @@index([companyId, status])
  @@index([companyId, vesselId])
  @@map("voyages")
}

enum VoyageStatus {
  PLANNED
  ACTIVE
  COMPLETED
  CANCELLED
}

model PortCall {
  id          String    @id @default(uuid())
  voyageId    String
  companyId   String
  portName    String
  portCode    String?   // LOCODE (e.g. IDJKT untuk Jakarta)
  country     String
  eta         DateTime
  ata         DateTime?
  etd         DateTime
  atd         DateTime?
  purpose     String?   // LOADING, DISCHARGING, BUNKERING, REPAIR
  remarks     String?
  createdAt   DateTime  @default(now())
  createdBy   String

  voyage      Voyage    @relation(...)
  @@map("port_calls")
}

model NoonReport {
  id          String    @id @default(uuid())
  voyageId    String
  companyId   String
  reportDate  DateTime  // Tanggal noon report (biasanya 12:00 UTC)
  latitude    Decimal   @db.Decimal(9, 6)
  longitude   Decimal   @db.Decimal(9, 6)
  speed       Decimal?  @db.Decimal(5, 2)   // knots
  heading     Int?      // degrees
  seaState    Int?      // Beaufort scale 0-12
  windSpeed   Decimal?  @db.Decimal(5, 2)
  fuelConsumed Decimal? @db.Decimal(8, 2)   // MT
  distanceMade Decimal? @db.Decimal(8, 2)   // NM
  remarks     String?
  submittedBy String
  createdAt   DateTime  @default(now())

  voyage      Voyage    @relation(...)
  @@unique([voyageId, reportDate])
  @@map("noon_reports")
}

MIGRATION: add_voyage_management_schema

DOMAIN LAYER:

entities/voyage.entity.ts (Aggregate Root)
  static create(data): Voyage
    → Auto-generate voyageNumber: await sequenceService.next(companyId, year)
    → Validate eta > etd
    → Emit VoyageCreatedEvent

  approve(atd: Date): void
    → Validate status === PLANNED
    → Set status = ACTIVE, atd = atd
    → Emit VoyageDepartedEvent

  recordArrival(ata: Date): void
    → Validate status === ACTIVE
    → Validate ata >= atd
    → Set status = COMPLETED, ata = ata
    → Emit VoyageCompletedEvent

  cancel(reason: string): void
    → Validate status === PLANNED (tidak bisa cancel voyage yang sudah active)
    → Set status = CANCELLED, cancelledReason = reason

  get duration(): number | null  // hari antara atd dan ata

domain/services/voyage-compliance.service.ts:
  async validateDepartureCompliance(
    vessel: Vessel,
    companyDoc: VesselCertificate | null,
    vesselCerts: VesselCertificate[],
    manningSummary: ManningSummaryDto,
    pscStatus: { isDetained: boolean }
  ): Promise<ComplianceCheckResult>

  Implement SEMUA checks dari docs/ai-rules/12-maritime-compliance.md section 12.9:

  HARD BLOCKS (canDepart = false):
  - SMC expired → { code: "VOYAGE_SMC_EXPIRED", level: "HARD" }
  - DOC expired → { code: "VOYAGE_DOC_EXPIRED", level: "HARD" }
  - ISSC expired → { code: "VOYAGE_ISSC_EXPIRED", level: "HARD" }
  - Manning < minimum → { code: "VOYAGE_MANNING_INSUFFICIENT", level: "HARD" }
  - PSC detained → { code: "VOYAGE_VESSEL_DETAINED", level: "HARD" }

  SOFT BLOCKS (canDepart = true dengan warning):
  - SMC critical (<30 hari) → { level: "SOFT", message: "SMC akan expired dalam X hari" }
  - IOPP critical → { level: "SOFT" }

  Return:
  {
    canDepart: boolean,
    hardBlocks: ComplianceViolation[],
    softBlocks: ComplianceViolation[],
    checkedAt: Date
  }

APPLICATION COMMANDS:

1. create-voyage/ → validate eta > etd, generate voyageNumber, save, emit event
2. update-voyage/ → hanya jika status PLANNED
3. approve-departure/
   Handler:
   → FindVoyage (PLANNED only)
   → Run VoyageComplianceService checks
   → Jika ada hardBlocks → throw ComplianceBlockException(hardBlocks)
   → Log softBlocks ke audit
   → voyage.approve(atd ?? new Date())
   → Save → Emit

4. record-arrival/ → voyage.recordArrival(ata), save
5. cancel-voyage/ → validate PLANNED, voyage.cancel(reason), save
6. add-port-call/ → add PortCall ke voyage
7. submit-noon-report/ → create NoonReport, validate unique per date per voyage

APPLICATION QUERIES:

8. list-voyages/ → filter: status, vesselId, dateRange, companyId
9. get-voyage-detail/ → include portCalls, noonReports
10. get-active-voyages/ → status=ACTIVE, untuk dashboard widget
11. get-departure-compliance/ → run compliance check tanpa approve (untuk preview di UI)
    Query: { voyageId, companyId }
    → Fetch semua data yang diperlukan
    → Run compliance check
    → Return result (tanpa mengubah state)

CONTROLLERS:

voyage.controller.ts
POST   /api/v1/voyages
GET    /api/v1/voyages              ?status=ACTIVE&vesselId=...&page=1
GET    /api/v1/voyages/active       ← Dashboard: voyage yang sedang ACTIVE
GET    /api/v1/voyages/:voyageId
PATCH  /api/v1/voyages/:voyageId    ← Hanya status PLANNED
DELETE /api/v1/voyages/:voyageId    ← Sama dengan cancel

POST   /api/v1/voyages/:voyageId/check-compliance   ← Preview saja, tidak approve
POST   /api/v1/voyages/:voyageId/approve-departure
POST   /api/v1/voyages/:voyageId/record-arrival
POST   /api/v1/voyages/:voyageId/cancel

POST   /api/v1/voyages/:voyageId/port-calls
GET    /api/v1/voyages/:voyageId/port-calls
PATCH  /api/v1/voyages/:voyageId/port-calls/:portCallId

POST   /api/v1/voyages/:voyageId/noon-reports
GET    /api/v1/voyages/:voyageId/noon-reports

FRONTEND PAGES:

apps/web/src/app/(dashboard)/voyage/
├── page.tsx               ← Voyage list dengan status filter
└── [voyageId]/
    └── page.tsx           ← Detail: info + port call timeline + noon reports

Voyage List table columns:
No. Voyage | Kapal | Rute (A → B) | ETD | ETA | Status | Muatan | Actions

Voyage Detail page:
- InfoPanel: data voyage (rute, waktu, muatan)
- ComplianceStatus panel: hasil check dengan warna (jika PLANNED)
- Port Call Timeline: visual timeline kiri-kanan
- Noon Reports table: date, posisi, speed, fuel
- Action buttons: [Approve Keberangkatan] [Record Kedatangan] [Batalkan]

DEPARTURE APPROVAL DIALOG (penting!):
Modal yang tampilkan hasil compliance check:

┌──────────────────────────────────────────────────────────────┐
│  Konfirmasi Keberangkatan — MV Nusantara Jaya 1              │
├──────────────────────────────────────────────────────────────┤
│  Pemeriksaan Kepatuhan:                                       │
│                                                               │
│  ✅ SMC                Valid s/d 15 Mar 2026 (287 hr)        │
│  ✅ DOC                Valid s/d 20 Jun 2025 (384 hr)        │
│  ⚠️  IOPP              Valid s/d 5 Feb 2025 (47 hr)          │
│  ✅ Manning            21/20 crew (sufficient)               │
│  ✅ PSC Status         Tidak dalam penahanan                 │
│                                                               │
│  ⚠️  1 peringatan: IOPP akan kadaluarsa dalam 47 hari        │
│                                                               │
│  ☐ Saya memahami peringatan di atas dan tetap menyetujui    │
│    keberangkatan kapal ini.                                   │
├──────────────────────────────────────────────────────────────┤
│                                [Batal]  [✓ Setujui Keberangkatan]│
└──────────────────────────────────────────────────────────────┘

Jika ada HARD BLOCK:
  ✅ → ✅ → ❌ SMC EXPIRED (merah, bold)
  → Tombol "Setujui Keberangkatan" DISABLED
  → Pesan: "Kapal tidak dapat berangkat karena ada sertifikat yang telah kadaluarsa"
```

---

# Prompt 10 — Technical / PMS Module

**Tahap:** Planned Maintenance System, work orders, defect tracking  
**Prerequisite:** Prompt 09 selesai  
**Output:** PMS module siap digunakan Technical Superintendent

---

## PROMPT 10 — PMS Full Implementation

```
Buat Technical/PMS bounded context.
Baca docs/ai-rules/11-domain-glossary.md section 11.5 untuk terminologi teknikal.

PRISMA SCHEMA ADDITIONS:

model MaintenanceComponent {
  id            String    @id @default(uuid())
  companyId     String
  vesselId      String
  code          String
  name          String
  location      String?
  maker         String?
  model         String?
  serialNumber  String?
  installDate   DateTime?
  currentRunningHours Decimal? @db.Decimal(10, 2)
  deletedAt     DateTime?
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
  createdBy     String
  updatedBy     String

  vessel        Vessel    @relation(...)
  maintenanceJobs MaintenanceJob[]
  @@unique([companyId, vesselId, code])
  @@map("maintenance_components")
}

model MaintenanceJob {
  id            String        @id @default(uuid())
  companyId     String
  vesselId      String
  componentId   String?
  jobCode       String
  title         String
  description   String?
  jobType       MaintenanceJobType  // CALENDAR | RUNNING_HOURS | CONDITION_BASED
  intervalDays  Int?          // Untuk CALENDAR type
  intervalHours Decimal?      // Untuk RUNNING_HOURS type
  lastDoneDate  DateTime?
  lastDoneHours Decimal?
  dueDateCalendar DateTime?   // Calculated: lastDoneDate + intervalDays
  dueHours      Decimal?      // Calculated: lastDoneHours + intervalHours
  status        PmsStatus     @default(SCHEDULED)
  priority      Priority      @default(MEDIUM)
  responsibleRank CrewRank?
  deletedAt     DateTime?
  createdAt     DateTime      @default(now())
  updatedAt     DateTime      @updatedAt
  createdBy     String
  updatedBy     String

  vessel        Vessel        @relation(...)
  component     MaintenanceComponent? @relation(...)
  workOrders    WorkOrder[]
  @@index([companyId, vesselId, status])
  @@index([dueDateCalendar])
  @@map("maintenance_jobs")
}

enum MaintenanceJobType { CALENDAR RUNNING_HOURS CONDITION_BASED }
enum PmsStatus { SCHEDULED DUE OVERDUE IN_PROGRESS COMPLETED DEFERRED }
enum Priority { LOW MEDIUM HIGH CRITICAL }

model WorkOrder {
  id              String    @id @default(uuid())
  companyId       String
  vesselId        String
  maintenanceJobId String?
  woNumber        String    @unique  // Auto: WO-{YYYY}-{seq:05d}
  title           String
  description     String?
  assignedRank    CrewRank?
  plannedDate     DateTime?
  startDate       DateTime?
  completedDate   DateTime?
  status          WorkOrderStatus @default(OPEN)
  actualHours     Decimal?  @db.Decimal(6, 2)
  findings        String?
  partsUsed       Json?     // [{ partNumber, description, quantity }]
  remarks         String?
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
  createdBy       String
  updatedBy       String
  completedBy     String?

  vessel          Vessel    @relation(...)
  maintenanceJob  MaintenanceJob? @relation(...)
  @@index([companyId, vesselId, status])
  @@map("work_orders")
}

enum WorkOrderStatus { OPEN IN_PROGRESS COMPLETED CANCELLED }

model Defect {
  id            String      @id @default(uuid())
  companyId     String
  vesselId      String
  defectCode    String      // Auto: DEF-{YYYY}-{seq:04d}
  title         String
  description   String
  severity      DefectSeverity
  location      String?     // Di mana di kapal
  reportedBy    String      // userId
  reportedAt    DateTime    @default(now())
  status        DefectStatus @default(OPEN)
  resolvedAt    DateTime?
  resolvedBy    String?
  resolution    String?
  evidence      String?     // URL file foto/dokumen
  createdAt     DateTime    @default(now())
  updatedAt     DateTime    @updatedAt
  updatedBy     String

  vessel        Vessel      @relation(...)
  @@index([companyId, vesselId, status])
  @@index([companyId, severity, status])
  @@map("defects")
}

enum DefectSeverity { CRITICAL HIGH MEDIUM LOW }
enum DefectStatus { OPEN IN_PROGRESS RESOLVED CLOSED }

Migration: add_technical_pms_schema

DOMAIN LAYER (ringkas — ikuti pattern dari Fleet/Crew):

entities/maintenance-job.entity.ts
  get isOverdue(): boolean → dueDateCalendar < today (untuk CALENDAR type)
  get daysUntilDue(): number
  get overdueBy(): number | null
  complete(data: CompleteJobData): void → update lastDoneDate, lastDoneHours, status = COMPLETED
  createWorkOrder(data): WorkOrder → emit WorkOrderCreatedEvent

entities/work-order.entity.ts
  start(startedBy): void → status = IN_PROGRESS, startDate = now
  complete(data: CompleteWorkOrderData): void → status = COMPLETED, completedDate = now

entities/defect.entity.ts
  resolve(resolution: string, resolvedBy: string): void → status = RESOLVED
  close(): void → status = CLOSED (hanya setelah RESOLVED)

domain/services/pms-scheduler.service.ts
  calculateDueDate(job: MaintenanceJob): Date | null
  isDueOrOverdue(job: MaintenanceJob): boolean
  updateJobStatuses(jobs: MaintenanceJob[]): MaintenanceJob[]

APPLICATION (commands & queries per pattern sebelumnya):
- create-maintenance-job, update-job, complete-job
- create-work-order, start-work-order, complete-work-order
- report-defect, update-defect, resolve-defect
- list-jobs (filter: vessel, status, priority, overdue only)
- get-pms-summary { overdue, dueSoon, open WOs, open defects }

CRON JOB:
@Cron("0 5 * * *") daily check:
→ Update PmsStatus untuk semua jobs:
   dueDateCalendar < today → OVERDUE
   dueDateCalendar <= today + 14 → DUE (2 minggu ke depan)
→ Emit MaintenanceOverdueEvent untuk jobs yang baru jadi OVERDUE
→ Notify Technical Superintendent

CONTROLLERS:

technical.controller.ts
GET  /api/v1/technical/summary              ← Overview KPIs
GET  /api/v1/technical/vessels/:vesselId/components
POST /api/v1/technical/vessels/:vesselId/components
GET  /api/v1/technical/vessels/:vesselId/jobs
POST /api/v1/technical/vessels/:vesselId/jobs
GET  /api/v1/technical/vessels/:vesselId/jobs/overdue
PATCH /api/v1/technical/jobs/:jobId
POST  /api/v1/technical/jobs/:jobId/complete
POST  /api/v1/technical/jobs/:jobId/work-order    ← Create WO dari job

work-order.controller.ts
GET  /api/v1/technical/work-orders
POST /api/v1/technical/work-orders              ← Ad-hoc WO tanpa job
GET  /api/v1/technical/work-orders/:woId
PATCH /api/v1/technical/work-orders/:woId
POST  /api/v1/technical/work-orders/:woId/start
POST  /api/v1/technical/work-orders/:woId/complete

defect.controller.ts
GET  /api/v1/technical/defects
POST /api/v1/technical/defects
GET  /api/v1/technical/defects/:defectId
PATCH /api/v1/technical/defects/:defectId
POST  /api/v1/technical/defects/:defectId/resolve
POST  /api/v1/technical/defects/:defectId/close

FRONTEND:
apps/web/src/app/(dashboard)/technical/
├── page.tsx           ← Overview: overdue count, due this week, open WOs, critical defects
├── pms/page.tsx       ← Job list (all vessels or per vessel)
├── work-orders/page.tsx
└── defects/page.tsx

Defect list table: Kode | Kapal | Lokasi | Judul | Severity(badge) | Dilaporkan | Status | Actions
PMS table: Kode | Komponen | Tipe | Interval | Last Done | Due Date | Status(badge) | Priority | Actions
Color coding: OVERDUE=merah, DUE=oranye, SCHEDULED=hijau
```

---

# Prompt 11 — HSSEQ Module

**Tahap:** Incident reporting, ISM audit, PSC inspection, drill records  
**Prerequisite:** Prompt 10 selesai  
**Output:** HSSEQ module sesuai ISM Code Chapter 9 & 10

---

## PROMPT 11 — HSSEQ Full Implementation

```
Buat HSSEQ bounded context.
Baca docs/ai-rules/12-maritime-compliance.md untuk ISM Code requirements.
Referensi: ISM Code Chapter 9 (Accident Reporting) dan Chapter 11 (Documentation).

PRISMA SCHEMA ADDITIONS:

model Incident {
  id              String          @id @default(uuid())
  companyId       String
  vesselId        String
  incidentNumber  String          @unique   // INC-{YYYY}-{seq:04d}
  type            IncidentType
  severity        IncidentSeverity
  title           String
  description     String
  location        String?         // Di mana di kapal/perairan
  incidentDate    DateTime
  reportedBy      String          // userId
  reportedAt      DateTime        @default(now())
  status          IncidentStatus  @default(OPEN)
  rootCause       String?
  correctiveActions String?
  lessonsLearned  String?
  investigatedBy  String?
  investigatedAt  DateTime?
  closedBy        String?
  closedAt        DateTime?
  createdAt       DateTime        @default(now())
  updatedAt       DateTime        @updatedAt
  updatedBy       String

  vessel          Vessel          @relation(...)
  @@index([companyId, status])
  @@index([companyId, severity])
  @@map("incidents")
}

enum IncidentType {
  ACCIDENT NEAR_MISS DANGEROUS_OCCURRENCE
  POLLUTION PROPERTY_DAMAGE SECURITY_INCIDENT
}
enum IncidentSeverity { FATAL SERIOUS MINOR NEAR_MISS }
enum IncidentStatus { OPEN UNDER_INVESTIGATION CLOSED }

model PscInspection {
  id                String            @id @default(uuid())
  companyId         String
  vesselId          String
  inspectionDate    DateTime
  port              String
  portStateCountry  String
  pscOfficer        String?
  inspectionType    PscInspectionType
  result            PscResult
  isDetained        Boolean           @default(false)
  detentionFrom     DateTime?
  detentionTo       DateTime?
  releaseConditions String?
  createdAt         DateTime          @default(now())
  updatedAt         DateTime          @updatedAt
  createdBy         String
  updatedBy         String

  vessel            Vessel            @relation(...)
  deficiencies      PscDeficiency[]
  @@index([companyId, vesselId])
  @@map("psc_inspections")
}

enum PscInspectionType { INITIAL MORE_DETAILED EXPANDED }
enum PscResult { NO_DEFICIENCY DEFICIENCY_NO_DETENTION DETAINED }

model PscDeficiency {
  id              String          @id @default(uuid())
  inspectionId    String
  deficiencyCode  String          // IMO deficiency code
  description     String
  actionCode      String?
  isRectified     Boolean         @default(false)
  rectifiedAt     DateTime?
  rectifiedPort   String?
  evidence        String?         // URL dokumen bukti

  inspection      PscInspection   @relation(...)
  @@map("psc_deficiencies")
}

model DrillRecord {
  id              String      @id @default(uuid())
  companyId       String
  vesselId        String
  drillType       DrillType
  drillDate       DateTime
  conductedBy     String      // Jabatan yang pimpin drill
  participants    Int         // Jumlah peserta
  duration        Int         // Menit
  findings        String?
  correctiveActions String?
  signedByMaster  Boolean     @default(false)
  masterSignedAt  DateTime?
  createdAt       DateTime    @default(now())
  createdBy       String
  updatedBy       String

  vessel          Vessel      @relation(...)
  @@index([companyId, vesselId, drillType])
  @@map("drill_records")
}

enum DrillType {
  FIRE ABANDON_SHIP MOB SECURITY
  OIL_SPILL FLOODING STEERING_FAILURE
}

model InternalAudit {
  id          String        @id @default(uuid())
  companyId   String
  vesselId    String?       // Null jika office audit
  auditNumber String        @unique   // AUDIT-{YYYY}-{seq:03d}
  auditType   AuditType     // VESSEL | SMS | OFFICE
  auditDate   DateTime
  auditorName String
  auditScope  String
  status      AuditStatus   @default(OPEN)
  closedAt    DateTime?
  createdAt   DateTime      @default(now())
  updatedAt   DateTime      @updatedAt
  createdBy   String
  updatedBy   String

  findings    AuditFinding[]
  @@map("internal_audits")
}

enum AuditType { VESSEL SMS OFFICE }
enum AuditStatus { OPEN CLOSED }

model AuditFinding {
  id              String        @id @default(uuid())
  auditId         String
  findingType     FindingType   // MAJOR_NC | MINOR_NC | OBSERVATION
  description     String
  requirementRef  String?       // ISM Code ref, SOLAS chapter, dll
  responsibleParty String?
  targetCloseDate DateTime?
  actualCloseDate DateTime?
  status          FindingStatus @default(OPEN)
  evidence        String?       // URL dokumen

  audit           InternalAudit @relation(...)
  @@map("audit_findings")
}

enum FindingType { MAJOR_NC MINOR_NC OBSERVATION }
enum FindingStatus { OPEN IN_PROGRESS CLOSED }

Migration: add_hsseq_schema

DOMAIN LAYER (entities, events, exceptions — ikuti pattern):
- incident.entity.ts: investigate(), close(), addRootCause()
- psc-inspection.entity.ts: rectifyDeficiency(), releasePscDetention()
- drill-record.entity.ts: signByMaster()
- internal-audit.entity.ts: addFinding(), closeFinding(), closeAudit()

BUSINESS RULES:
1. Incident FATAL/SERIOUS → Wajib investigasi, auto-notify ISM Manager
2. PSC detained → update vessel ke status blocked (emit event ke Fleet module)
3. Drill wajib per 3 bulan per jenis (FIRE, ABANDON_SHIP)
   Cron job: cek dan buat reminder 2 minggu sebelum jadwal
4. MAJOR_NC finding harus punya targetCloseDate dan tidak boleh melebihi 3 bulan
5. ISM Code: setiap incident HARUS dilaporkan dalam 24 jam (field reportedAt)

EVENT HANDLERS:
- IncidentReportedEvent → notify ISM Manager (email + in-app)
- IncidentSeriousEvent → notify COMPANY_ADMIN juga
- PscDetentionEvent → emit ke Fleet module, update vessel status
- DrillOverdueEvent → notify MASTER dan ISM Manager

CONTROLLERS:

incident.controller.ts
GET  /api/v1/hsseq/incidents                  ?status=OPEN&type=NEAR_MISS
POST /api/v1/hsseq/incidents                  ← @Permissions("hsseq:incident:report") — semua kru bisa
GET  /api/v1/hsseq/incidents/:id
PATCH /api/v1/hsseq/incidents/:id
POST  /api/v1/hsseq/incidents/:id/investigate ← @Permissions("hsseq:incident:investigate")
POST  /api/v1/hsseq/incidents/:id/close

psc.controller.ts
GET  /api/v1/hsseq/psc-inspections
POST /api/v1/hsseq/psc-inspections
GET  /api/v1/hsseq/psc-inspections/:id
POST /api/v1/hsseq/psc-inspections/:id/deficiencies
PATCH /api/v1/hsseq/psc-inspections/:id/deficiencies/:defId/rectify

drill.controller.ts
GET  /api/v1/hsseq/drills              ?vesselId=...&type=FIRE
POST /api/v1/hsseq/drills
GET  /api/v1/hsseq/drills/upcoming     ← Jadwal drill yang akan datang (per vessel)

audit.controller.ts
GET  /api/v1/hsseq/audits
POST /api/v1/hsseq/audits
GET  /api/v1/hsseq/audits/:id
POST /api/v1/hsseq/audits/:id/findings
PATCH /api/v1/hsseq/audits/:id/findings/:findingId
POST  /api/v1/hsseq/audits/:id/findings/:findingId/close
POST  /api/v1/hsseq/audits/:id/close

FRONTEND PAGES:
apps/web/src/app/(dashboard)/hsseq/
├── page.tsx                ← Overview: open incidents, open NCs, next drill, PSC summary
├── incidents/page.tsx      ← List + filter + form report incident
├── psc/page.tsx            ← PSC inspection tracker + deficiency list
├── drills/page.tsx         ← Drill records + upcoming schedule calendar
└── audits/page.tsx         ← Audit list + finding management

Incident list table:
No. | Kapal | Tanggal | Tipe | Severity(badge) | Judul | Status | Dilaporkan Oleh | Actions

PSC Inspection card (bukan table — lebih visual):
┌────────────────────────────────────────────────┐
│  MV Nusantara Jaya 1 · Tanjung Priok · 15 Jan  │
│  Hasil: ● Ada Defisiensi (Tidak Ditahan)        │
│  3 defisiensi · 2 sudah diperbaiki · 1 pending  │
│  [Lihat Detail]                                 │
└────────────────────────────────────────────────┘

Dashboard widget HSSEQ:
- Open Incidents: [count] open, [count] under investigation
- Non-Conformities: [count] open, [count] overdue
- PSC 12 bulan: [count] inspeksi, [count] defisiensi, detention rate [%]
- Drill berikutnya: "Fire Drill - MV Nusantara Jaya 1 - 15 Mar (12 hari lagi)"
```

---

# Prompt 12 — Notification System

**Tahap:** Email alerts, in-app notifications, WebSocket real-time  
**Prerequisite:** Prompt 11 selesai  
**Output:** Full notification system — email + in-app + real-time

---

## PROMPT 12 — Notification System Full

```
Buat Notification System terintegrasi dengan semua domain events.
Baca docs/ai-rules/02-architecture.md section 2.6 untuk event-driven pattern.

PRISMA SCHEMA:

model Notification {
  id          String            @id @default(uuid())
  companyId   String
  userId      String
  type        NotificationType
  title       String
  message     String
  data        Json?             // { certId, vesselId, voyageId, dll }
  isRead      Boolean           @default(false)
  readAt      DateTime?
  createdAt   DateTime          @default(now())

  user        User              @relation(...)
  @@index([userId, isRead])
  @@index([companyId, createdAt])
  @@map("notifications")
}

enum NotificationType {
  CERT_EXPIRING_SOON CERT_CRITICAL CERT_EXPIRED
  VESSEL_STATUS_CHANGED CREW_SIGN_ON CREW_SIGN_OFF
  INCIDENT_REPORTED AUDIT_FINDING_OPENED
  MAINTENANCE_OVERDUE PSC_DETAINED DRILL_OVERDUE
}

Migration: add_notifications_schema

SERVICES:

apps/api/src/shared/notifications/notification.service.ts:
  create(dto: CreateNotificationDto): Promise<Notification>
    → Save ke DB
    → Emit ke WebSocket room user-{userId}

  getUnread(userId, companyId): Promise<Notification[]>
  getCount(userId): Promise<number>
  markAsRead(id, userId): Promise<void>
  markAllAsRead(userId, companyId): Promise<void>

apps/api/src/shared/notifications/email.service.ts:
  Gunakan Nodemailer. Development → MailHog. Production → SMTP real.

  sendCertExpiryAlert({ recipientEmail, recipientName,
    vesselName, certType, expiryDate, daysLeft, dashboardUrl })
  sendIncidentAlert({ recipientEmail, recipientName,
    incidentNumber, vesselName, severity, title })
  sendWelcomeEmail({ email, firstName, loginUrl })
  sendPasswordReset({ email, resetLink, expiresIn })

  HTML templates di: apps/api/src/shared/notifications/templates/
  Buat template untuk tiap email type — simple tapi professional.
  Dark header (#0d1526), company logo placeholder, clear CTA button.

EVENT HANDLERS (di shared/notifications/handlers/):

certificate-alert.handler.ts
  Listen: CertificateExpiringEvent, CertificateExpiredEvent
  → Cari semua user FLEET_MANAGER dan COMPANY_ADMIN di company tersebut
  → Untuk setiap user: notification.service.create(...)
  → Kirim email ke fleet manager (1 email per event, bukan per user)
  → Jika EXPIRED: severity lebih tinggi, email dengan urgent subject

incident-alert.handler.ts
  Listen: IncidentReportedEvent
  → Notify semua ISM_MANAGER di company
  → Jika severity FATAL atau SERIOUS: notify COMPANY_ADMIN juga

maintenance-overdue.handler.ts
  Listen: MaintenanceOverdueEvent
  → Notify TECHNICAL_SUPER dan user dengan role CHIEF_ENGINEER di vessel tersebut

psc-detention.handler.ts
  Listen: PscDetentionEvent
  → Notify FLEET_MANAGER dan COMPANY_ADMIN
  → Email urgent: "Kapal dalam penahanan PSC"

WEBSOCKET GATEWAY:

apps/api/src/shared/notifications/notification.gateway.ts

@WebSocketGateway({ namespace: "/notifications", cors: { origin: WEB_URL } })
export class NotificationGateway {
  @WebSocketServer() server: Server;

  handleConnection(client: Socket) {
    // Authenticate JWT dari handshake.auth.token
    // Validate token → get userId
    // Join room: user-{userId}
    // Emit pending unread count
  }

  sendToUser(userId: string, notification: Notification) {
    this.server.to(`user-${userId}`).emit("new_notification", notification);
  }
}

CONTROLLERS:

GET  /api/v1/notifications              ← Unread untuk current user
GET  /api/v1/notifications/count        ← Unread count (untuk badge)
PATCH /api/v1/notifications/:id/read
PATCH /api/v1/notifications/read-all
GET  /api/v1/notifications/all          ← Semua notif (read + unread) dengan pagination

FRONTEND:

components/layout/NotificationBell.tsx:
  - useQuery untuk initial load unread notifications + count
  - WebSocket connection untuk real-time updates
  - Badge: unread count, max "99+"
  - Dropdown panel (max-h-96, overflow-y-scroll):
    Header: "Notifikasi" + "Tandai semua dibaca"
    List items:
    ┌──────────────────────────────────────────────────────────┐
    │ 🔴  Sertifikat SMC — MV Nusantara Jaya 1 telah kadaluarsa │
    │     3 menit lalu                                          │
    ├──────────────────────────────────────────────────────────┤
    │ 🟡  IOPP hampir kadaluarsa (47 hari) — MV Sentosa Star   │
    │     1 jam lalu                                            │
    └──────────────────────────────────────────────────────────┘
    Footer: "Lihat Semua Notifikasi →"

  Klik item → navigate ke resource yang relevan + mark as read
  Klik bell ketika ada notif baru → badge hilang

  hooks/use-notifications.ts:
  - useQuery("notifications") untuk initial data
  - useEffect → init Socket.io client
  - socket.on("new_notification") → update query cache, update count
  - useMutation markAsRead, markAllAsRead
```

---

# Prompt 13 — Testing Suite

**Tahap:** Lengkapi semua tests, enforce coverage  
**Prerequisite:** Prompt 12 selesai — semua module implemented

---

## PROMPT 13 — Complete Testing Suite

```
Lengkapi test coverage untuk seluruh Maritime Fleet ERP.
Baca docs/ai-rules/14-testing-strategy.md untuk semua patterns.
Target coverage: ≥80% domain + application layer.

UNIT TESTS — lengkapi yang belum ada:

contexts/fleet/domain/__tests__/vessel.entity.spec.ts
contexts/fleet/domain/__tests__/vessel-certificate.entity.spec.ts (4 expiry scenarios)
contexts/crew/domain/__tests__/stcw-compliance.service.spec.ts (8+ scenarios)
contexts/crew/domain/__tests__/crew-assignment.entity.spec.ts
contexts/voyage/domain/__tests__/voyage-compliance.service.spec.ts
contexts/voyage/domain/__tests__/voyage.entity.spec.ts (status transitions)
contexts/technical/domain/__tests__/maintenance-job.entity.spec.ts (isOverdue, daysUntilDue)
contexts/hsseq/domain/__tests__/incident.entity.spec.ts

contexts/fleet/application/__tests__/register-vessel.handler.spec.ts
contexts/fleet/application/__tests__/add-vessel-certificate.handler.spec.ts
contexts/crew/application/__tests__/sign-on-crew.handler.spec.ts
contexts/crew/application/__tests__/sign-off-crew.handler.spec.ts
contexts/voyage/application/__tests__/approve-departure.handler.spec.ts
  ✅ Semua certs valid → approve sukses
  ✅ SMC expired → throw ComplianceBlockException dengan detail
  ✅ Manning kurang → throw ComplianceBlockException
  ✅ PSC detained → throw ComplianceBlockException
  ✅ Soft block (SMC critical) → approve tetap jalan + log warning

INTEGRATION TESTS:

test/integration/fleet/vessel.integration.spec.ts (lengkapi dari Prompt 05)
test/integration/fleet/certificate.integration.spec.ts
test/integration/crew/seafarer.integration.spec.ts
test/integration/crew/sign-on.integration.spec.ts
test/integration/voyage/voyage.integration.spec.ts
test/integration/voyage/departure-compliance.integration.spec.ts
test/integration/iam/auth.integration.spec.ts (multi-tenant isolation)
test/integration/iam/rbac.integration.spec.ts:
  ✅ PORT_AGENT: bisa GET vessels, tidak bisa POST vessels (403)
  ✅ MASTER: hanya bisa akses vessel yang dia awaki
  ✅ FLEET_MANAGER: bisa semua vessel dalam company, tidak bisa vessel company lain
  ✅ SUPER_ADMIN: bisa akses semua company

E2E TESTS:

test/e2e/journey-1-vessel-lifecycle.e2e.ts
  Login Fleet Manager → Tambah kapal → Tambah SMC cert → Drydock → Aktivasi → Hapus

test/e2e/journey-2-crew-sign-on-off.e2e.ts
  Login Crewing Manager → Register seafarer → Tambah certs → Sign-on → Verifikasi manning → Sign-off

test/e2e/journey-3-voyage-full.e2e.ts
  Setup vessel+crew → Create voyage → Check compliance → Approve departure → Record arrival

test/e2e/journey-4-compliance-alert.e2e.ts
  Create cert dengan expiry 15 hari lagi → Trigger cron → Verify status CRITICAL → Verify notification created

CI CONFIGURATION:

.github/workflows/ci.yml:
name: CI — Maritime Fleet ERP
on:
  push: { branches: [main, develop] }
  pull_request: { branches: [main] }

jobs:
  quality:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v2
      - run: pnpm install --frozen-lockfile
      - run: pnpm lint
      - run: cd apps/api && pnpm tsc --noEmit
      - run: cd apps/web && pnpm tsc --noEmit

  test-unit:
    needs: quality
    runs-on: ubuntu-latest
    steps:
      - run: pnpm test:unit --coverage --coverageThreshold='{"global":{"lines":80}}'

  test-integration:
    needs: quality
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:16-alpine
        env: { POSTGRES_DB: maritime_test, POSTGRES_PASSWORD: test }
        options: --health-cmd pg_isready
      redis:
        image: redis:7-alpine
        options: --health-cmd "redis-cli ping"
    steps:
      - run: DATABASE_URL="..." pnpm test:integration

  build-check:
    needs: [test-unit, test-integration]
    runs-on: ubuntu-latest
    steps:
      - run: pnpm build
```

---

# Prompt 14 — Production Hardening

**Tahap:** Security, performance, observability  
**Prerequisite:** Prompt 13, semua tests passing

---

## PROMPT 14 — Production Hardening

```
Harden aplikasi sebelum deployment production.

SECURITY:

1. Environment validation di startup (apps/api/src/config/env-validation.ts):
   const requiredEnvs = ["DATABASE_URL","JWT_SECRET","REDIS_URL","MINIO_ACCESS_KEY",...];
   const missing = requiredEnvs.filter(k => !process.env[k]);
   if (missing.length) { console.error("Missing env:", missing); process.exit(1); }
   if (process.env.JWT_SECRET.length < 32) { console.error("JWT_SECRET too short"); process.exit(1); }

2. Helmet configuration (apps/api/src/main.ts):
   app.use(helmet({
     contentSecurityPolicy: { directives: { defaultSrc: ["'self'"], scriptSrc: ["'self'"] }},
     hsts: { maxAge: 31536000, includeSubDomains: true },
   }));

3. CORS (production only): origin strictly WEB_URL dari env

4. File upload MIME validation:
   Install: file-type package
   Di StorageService.uploadFile():
   const fileTypeResult = await fileTypeFromBuffer(file.buffer);
   const ALLOWED_MIMES = ["application/pdf","image/jpeg","image/png","image/webp"];
   if (!ALLOWED_MIMES.includes(fileTypeResult?.mime)) throw DocumentTypeNotAllowedException

5. Response DTO hardening:
   Semua Entity → DTO conversion harus exclude: passwordHash, tokenHash, bankAccount
   Gunakan ClassSerializerInterceptor + @Exclude() dari class-transformer
   Di setiap DTO yang expose data User: pastikan tidak ada passwordHash

6. Swagger production guard (main.ts):
   if (process.env.NODE_ENV !== "production") {
     SwaggerModule.setup("api/docs", app, document);
   }

PERFORMANCE:

7. Redis caching strategy:
   - compliance-summary per company: TTL 5 menit
     Key: "compliance:summary:{companyId}"
     Invalidate: saat ada cert status change event

   - vessel list page 1 per company: TTL 2 menit
     Key: "vessels:list:{companyId}:p1"
     Invalidate: saat ada vessel create/update/delete

8. Database connection pool:
   DATABASE_URL="${DATABASE_URL}?connection_limit=20&pool_timeout=10"

9. Query optimization — review semua findAll queries:
   Pastikan ada select() untuk field yang tidak dibutuhkan di list view
   Contoh vessel list: select HANYA field untuk VesselListItemDto, bukan select *

10. Next.js:
    next.config.js:
    {
      output: "standalone",               // Untuk Docker
      images: {
        domains: [process.env.MINIO_PUBLIC_DOMAIN],
        formats: ["image/avif","image/webp"],
      },
      experimental: { optimizeCss: true }
    }

OBSERVABILITY:

11. Winston structured logging (production format JSON):
    {
      "timestamp": "2024-01-15T08:30:00Z",
      "level": "info",
      "message": "HTTP Request",
      "requestId": "req_xxx",
      "userId": "user_xxx",
      "companyId": "company_xxx",
      "method": "GET",
      "url": "/api/v1/vessels",
      "statusCode": 200,
      "duration": 45
    }

12. Health check enhanced (/api/v1/health/detailed — butuh auth):
    {
      "status": "ok",
      "database": { "status": "ok", "responseTimeMs": 5 },
      "redis": { "status": "ok", "responseTimeMs": 2 },
      "storage": { "status": "ok" },
      "memory": { "heapUsedMB": 245, "heapTotalMB": 512 },
      "uptime": 86400,
      "version": "1.0.0"
    }

13. Sentry integration (optional tapi recommended):
    Di main.ts:
    if (process.env.SENTRY_DSN) {
      Sentry.init({ dsn: process.env.SENTRY_DSN, environment: process.env.NODE_ENV });
    }

    Di global exception filter:
    if (exception instanceof Error && !(exception instanceof DomainException)) {
      Sentry.captureException(exception, { extra: { userId, companyId, requestId } });
    }

FINAL SECURITY CHECKLIST (verifikasi manual sebelum lanjut ke Prompt 15):
□ Tidak ada console.log di production code (hanya Winston)
□ Tidak ada hardcoded credential di codebase (grep -r "password" src/ untuk check)
□ .env tidak di .gitignore dilanggar (git ls-files .env → harus kosong)
□ Semua DTO exclude field sensitif
□ Swagger hanya di development
□ Rate limiting aktif di /auth/login (max 5x/menit)
□ File upload validate MIME type dari buffer
□ JWT secret ≥ 32 karakter
□ httpOnly + Secure + SameSite=Strict pada refresh token cookie
□ Admin endpoints semua butuh SUPER_ADMIN permission
□ pnpm audit → 0 critical/high vulnerabilities
```

---

# Prompt 15 — Deployment

**Tahap:** Docker production, CI/CD pipeline, go-live  
**Prerequisite:** Prompt 14 selesai, security checklist 100% hijau

---

## PROMPT 15 — Production Deployment

```
Siapkan Maritime Fleet ERP untuk production deployment.

DOCKERFILE PRODUCTION:

docker/Dockerfile.api:
# Stage 1: Install dependencies
FROM node:20-alpine AS deps
WORKDIR /app
RUN corepack enable && corepack prepare pnpm@latest --activate
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY apps/api/package.json ./apps/api/
COPY packages/shared/package.json ./packages/shared/
COPY packages/config/package.json ./packages/config/
RUN pnpm install --frozen-lockfile

# Stage 2: Build
FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN pnpm --filter api build
RUN npx prisma generate

# Stage 3: Production runner
FROM node:20-alpine AS runner
WORKDIR /app
RUN addgroup -S maritime && adduser -S maritime -G maritime
USER maritime
COPY --from=builder --chown=maritime:maritime /app/apps/api/dist ./dist
COPY --from=builder --chown=maritime:maritime /app/node_modules ./node_modules
COPY --from=builder --chown=maritime:maritime /app/prisma ./prisma
EXPOSE 4000
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s \
  CMD wget -qO- http://localhost:4000/health || exit 1
CMD ["node", "dist/main.js"]

docker/Dockerfile.web:
# Stage 1 deps → Stage 2 builder → Stage 3 runner
FROM node:20-alpine AS runner
WORKDIR /app
RUN addgroup -S maritime && adduser -S maritime -G maritime
USER maritime
COPY --from=builder --chown=maritime:maritime /app/apps/web/.next/standalone ./
COPY --from=builder --chown=maritime:maritime /app/apps/web/.next/static ./.next/static
COPY --from=builder --chown=maritime:maritime /app/apps/web/public ./public
EXPOSE 3000
HEALTHCHECK --interval=30s CMD wget -qO- http://localhost:3000/api/health || exit 1
CMD ["node", "server.js"]

DOCKER COMPOSE PRODUCTION (docker-compose.prod.yml):

Semua services dengan:
- restart: unless-stopped
- resource limits (cpu, memory)
- health checks
- volume persistence
- Networks: internal (postgres, redis, minio tidak expose) + public (api, web, nginx)

Nginx config:
- Force HTTPS redirect
- SSL termination
- Proxy /api/* → api:4000
- Proxy /socket.io/* → api:4000 (WebSocket upgrade)
- Proxy /* → web:3000
- Security headers (X-Frame-Options, HSTS, dll)
- client_max_body_size 10m (file upload)

GITHUB ACTIONS CI/CD:

.github/workflows/ci.yml (pada push ke main & PR):
jobs: quality → test-unit → test-integration → build-docker

.github/workflows/deploy.yml (auto-deploy setelah CI pass di main):
steps:
1. SSH ke VPS (gunakan github secret: VPS_HOST, VPS_USER, VPS_SSH_KEY)
2. docker compose -f docker-compose.prod.yml pull
3. docker compose -f docker-compose.prod.yml up -d --no-deps api web
4. docker compose exec api npx prisma migrate deploy
5. curl https://your-domain.com/health → assert status ok
6. Notify deployment status (Slack webhook atau email)

GO-LIVE CHECKLIST:

PRE-DEPLOYMENT:
□ pnpm test:ci → semua passing
□ pnpm build → 0 errors
□ Security checklist (Prompt 14) → 100% hijau
□ .env.prod diisi lengkap di server
□ SSL certificate valid (Let's Encrypt atau commercial)
□ DNS A record pointing ke server IP
□ PostgreSQL backup schedule aktif (pg_dump setiap hari)
□ Monitoring alerts setup (server disk, CPU, memory)

DEPLOYMENT:
□ docker compose -f docker-compose.prod.yml build --no-cache
□ docker compose -f docker-compose.prod.yml up -d
□ docker compose ps → semua healthy
□ docker compose exec api npx prisma migrate deploy
□ (Fresh DB) docker compose exec api node dist/prisma/seed/index.js

POST-DEPLOYMENT VERIFICATION:
□ curl https://your-domain.com/health → { "status": "ok" }
□ Login superadmin@maritime-erp.com → dashboard tampil
□ Login admin@njm.co.id → hanya lihat data NJM
□ Login admin@asl.co.id → hanya lihat data ASL (isolasi tenant!)
□ Tambah vessel → berhasil + muncul di list
□ PORT_AGENT tidak bisa POST /vessels → 403
□ Certificate expiry visible di dashboard
□ Upload dokumen → tersimpan di MinIO
□ Notification bell → muncul alert dari seed data
□ WebSocket: buka 2 tab, kirim notif → muncul di keduanya realtime
□ Swagger tidak accessible di production (curl https://domain/api/docs → 404)

ROLLBACK PLAN:
Jika ada masalah kritis setelah deploy:
1. docker compose -f docker-compose.prod.yml down api web
2. docker tag {repo}/api:{prev-version} {repo}/api:rollback
3. docker compose -f docker-compose.prod.yml up -d api web
4. Jika DB migration bermasalah: restore dari pg_dump backup
5. Notify tim

MONITORING POST-LAUNCH (minggu pertama):
□ Pantau Winston logs setiap hari (errors, slow queries >1s)
□ Cek Redis memory usage (tidak boleh >80% allocated)
□ Cek database connection count (tidak boleh >15 dari limit 20)
□ Cek MinIO disk usage
□ Validasi cron jobs berjalan (certificate check jam 06:00 WIB setiap hari)
□ Kumpulkan feedback pengguna awal (Fleet Manager, Crewing Manager)

─────────────────────────────────────────────
🚢 SELESAI — Maritime Fleet ERP Phase 1 LIVE
─────────────────────────────────────────────

Sistem mencakup:
✅ Company & User Management (IAM + RBAC)
✅ Fleet Management (Vessel CRUD + Certificates)
✅ Crew Management (STCW Compliance + Manning)
✅ Voyage Management (Compliance Gate + Lifecycle)
✅ Technical / PMS (Maintenance + Defects)
✅ HSSEQ / ISM (Incidents + PSC + Drills + Audit)
✅ Notification System (Email + In-App + WebSocket)
✅ Audit Trail (Setiap write operation tercatat)
✅ Multi-Tenant (Isolasi data per company)
✅ Production Ready (Docker + CI/CD + Security)

Langkah selanjutnya → Phase 2 planning:
→ Financial Module (Voyage Cost + Disbursement)
→ Procurement Module (PO + Inventory)
→ AIS Integration (Real-time vessel tracking)
→ Mobile App (React Native untuk seafarer self-service)
```
