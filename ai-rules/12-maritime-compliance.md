# 12 — Maritime Compliance

> **AI Instruction:** Regulasi maritim bukan opsional — ini adalah business rule hukum internasional. Validasi compliance harus diimplementasikan di domain layer, bukan di controller atau UI. Setiap rule di file ini harus ada implementasinya di kode.

---

## 12.1 Kerangka Regulasi

```
IMO (International Maritime Organization)
│
├── SOLAS 1974 (as amended)
│   ├── Chapter IX — ISM Code
│   ├── Chapter XI-2 — ISPS Code
│   └── Chapter V — Safety of Navigation
│
├── MARPOL 73/78
│   ├── Annex I — Oil Pollution
│   ├── Annex II — Noxious Liquid Substances
│   ├── Annex IV — Sewage
│   ├── Annex V — Garbage
│   └── Annex VI — Air Pollution (IAPP)
│
├── STCW Convention 1978 (Manila Amendments 2010)
│   ├── Chapter II — Master & Deck
│   ├── Chapter III — Engine
│   ├── Chapter IV — Radio
│   └── Chapter VI — Basic Safety
│
└── MLC 2006 (Maritime Labour Convention)
    ├── Title 1 — Minimum requirements for seafarers
    ├── Title 2 — Conditions of employment
    ├── Title 3 — Accommodation, recreational facilities
    ├── Title 4 — Health protection, medical care
    └── Title 5 — Compliance and enforcement

Indonesia National:
├── UU No. 17/2008 — Pelayaran
├── PP No. 71/2019 — Keselamatan Pelayaran
└── Peraturan Kemenhub — Berbagai PM
```

---

## 12.2 ISM Code — Business Rules

### Document of Compliance (DOC)
```typescript
interface DocComplianceRule {
  // DOC dikeluarkan untuk perusahaan (company level)
  // Berlaku 5 tahun dengan annual verification
  validity: 5;                          // Years
  annualVerificationWindow: {
    from: 3,                            // Months before anniversary
    to: 3,                              // Months after anniversary
  };
  // Kapal tidak boleh beroperasi jika DOC expired
  blockVesselOperation: true;
}

// Validasi saat vessel akan di-assign voyage
function validateDocForVoyage(company: Company): ValidationResult {
  const doc = company.certificates.find(c => c.type === "DOC");

  if (!doc) {
    return { valid: false, error: "DOC_NOT_FOUND",
      message: "Perusahaan belum memiliki Document of Compliance" };
  }

  if (doc.status === CertificateStatus.EXPIRED) {
    return { valid: false, error: "DOC_EXPIRED",
      message: "Document of Compliance telah kadaluarsa. Kapal tidak dapat beroperasi." };
  }

  return { valid: true };
}
```

### Safety Management Certificate (SMC)
```typescript
interface SmcComplianceRule {
  // SMC dikeluarkan untuk kapal (vessel level)
  validity: 5;                          // Years
  interimValidity: 6;                   // Months (untuk kapal baru)
  annualVerificationRequired: true;

  // SMC hanya valid jika DOC perusahaan juga valid
  requiresValidDoc: true;
}
```

---

## 12.3 STCW — Crew Certification Rules

### Minimum Safe Manning Validation

```typescript
interface ManningSafetyRule {
  // Setiap kapal memiliki Minimum Safe Manning Document
  // Tidak boleh berlayar dengan kru di bawah minimum
}

// Business rule: validasi manning sebelum voyage departure
async function validateManningSafety(
  vesselId: string,
  departureDate: Date
): Promise<ManningSafetyResult> {

  const vessel = await vesselRepo.findById(vesselId);
  const minimumManning = vessel.minimumSafeManning;
  const activeCrew = await crewRepo.findActiveOnBoard(vesselId, departureDate);

  // Cek jumlah minimum per departemen
  const deckOfficers = activeCrew.filter(c => isDeckOfficer(c.rank));
  const engineOfficers = activeCrew.filter(c => isEngineOfficer(c.rank));

  const violations: ManningSafetyViolation[] = [];

  if (deckOfficers.length < minimumManning.deckOfficers) {
    violations.push({
      department: "DECK",
      required: minimumManning.deckOfficers,
      available: deckOfficers.length,
      message: `Kekurangan ${minimumManning.deckOfficers - deckOfficers.length} perwira dek`
    });
  }

  if (engineOfficers.length < minimumManning.engineOfficers) {
    violations.push({
      department: "ENGINE",
      required: minimumManning.engineOfficers,
      available: engineOfficers.length,
      message: `Kekurangan ${minimumManning.engineOfficers - engineOfficers.length} perwira mesin`
    });
  }

  return {
    isCompliant: violations.length === 0,
    violations
  };
}
```

### STCW Certificate Validation per Rank

```typescript
// Sertifikat minimum per jabatan (STCW 2010)
const REQUIRED_CERTIFICATES_BY_RANK: Record<CrewRank, SeafarerCertType[]> = {
  [CrewRank.MASTER]: [
    SeafarerCertType.COC,               // Master CoC
    SeafarerCertType.STCW_BST,
    SeafarerCertType.STCW_SCRFA,
    SeafarerCertType.STCW_AFF,
    SeafarerCertType.STCW_MEFA,
    SeafarerCertType.MEDICAL_CERTIFICATE,
    SeafarerCertType.SEAMAN_BOOK,
  ],
  [CrewRank.CHIEF_OFFICER]: [
    SeafarerCertType.COC,               // Chief Officer CoC
    SeafarerCertType.STCW_BST,
    SeafarerCertType.STCW_SCRFA,
    SeafarerCertType.STCW_AFF,
    SeafarerCertType.STCW_MEFA,
    SeafarerCertType.MEDICAL_CERTIFICATE,
    SeafarerCertType.SEAMAN_BOOK,
  ],
  [CrewRank.CHIEF_ENGINEER]: [
    SeafarerCertType.COC,               // Chief Engineer CoC
    SeafarerCertType.STCW_BST,
    SeafarerCertType.STCW_SCRFA,
    SeafarerCertType.STCW_AFF,
    SeafarerCertType.MEDICAL_CERTIFICATE,
    SeafarerCertType.SEAMAN_BOOK,
  ],
  [CrewRank.ABLE_SEAMAN]: [
    SeafarerCertType.COP,               // AB CoP
    SeafarerCertType.STCW_BST,
    SeafarerCertType.STCW_SCRFA,
    SeafarerCertType.MEDICAL_CERTIFICATE,
    SeafarerCertType.SEAMAN_BOOK,
  ],
  // ... dst per rank
};

// Validasi sertifikat saat sign-on
function validateCertificatesForSignOn(
  seafarer: Seafarer,
  rank: CrewRank,
  signOnDate: Date
): CertificateValidationResult {
  const requiredCerts = REQUIRED_CERTIFICATES_BY_RANK[rank];
  const violations: CertViolation[] = [];

  for (const certType of requiredCerts) {
    const cert = seafarer.certificates.find(c => c.certificateType === certType);

    if (!cert) {
      violations.push({
        certType,
        issue: "MISSING",
        message: `Sertifikat ${certType} tidak ditemukan`
      });
      continue;
    }

    if (cert.expiryDate && cert.expiryDate < signOnDate) {
      violations.push({
        certType,
        issue: "EXPIRED",
        message: `Sertifikat ${certType} telah kadaluarsa pada ${formatDate(cert.expiryDate)}`
      });
    }
  }

  return {
    isCompliant: violations.length === 0,
    violations
  };
}
```

---

## 12.4 MLC 2006 — Rest Hours Compliance

```typescript
// MLC 2006 / STCW Rest Hours Requirements
const REST_HOURS_RULES = {
  // Minimum rest: 10 jam dalam 24 jam
  // ATAU minimum 77 jam dalam 7 hari
  minimumRestPer24h: 10,      // hours
  maximumWorkPer24h: 14,      // hours
  minimumRestPer7days: 77,    // hours
  maximumWorkPer7days: 91,    // hours (168 - 77)

  // Pembagian rest minimum 10 jam:
  // Boleh dibagi max 2 periode, salah satunya min 6 jam
  maxRestPeriodsSplit: 2,
  minContinuousRestInSplit: 6, // hours
};

// Pelanggaran harus dicatat dan dilaporkan (MLC Reg. 2.3)
interface RestHoursViolation {
  seafarerId: string;
  vesselId: string;
  date: Date;
  actualRestHours: number;
  requiredRestHours: number;
  violationType: "DAILY" | "WEEKLY";
  reported: boolean;
  reportedAt?: Date;
}
```

---

## 12.5 MARPOL — Pollution Prevention

### Oil Record Book (MARPOL Annex I)
```typescript
// Setiap kapal >400 GT wajib maintain Oil Record Book
// Setiap pembuangan ballast/bilge wajib dicatat

enum OilRecordOperation {
  BALLASTING_CARGO_TANKS = "A",
  CLEANING_CARGO_TANKS = "B",
  DISCHARGE_DIRTY_BALLAST = "C",
  DISCHARGE_BILGE_WATER = "D",
  DISCHARGE_NON_EMULSIFIED_OILY_WATER = "E",
  LOADING_BUNKERS = "F",
  BUNKERING_MACHINERY_SPACES = "G",
  ACCIDENTAL_DISCHARGE = "H",
  CONDITION_OIL_FUEL_SYSTEM = "I",
}

// Setiap entry harus ditandatangani Master
interface OilRecordEntry {
  vesselId: string;
  date: DateTime;
  operation: OilRecordOperation;
  position?: string;            // Lat/Long jika di laut
  portName?: string;            // Jika di pelabuhan
  quantity?: number;            // Liter/m³
  retention?: string;           // Deskripsi retensi
  remarks: string;
  signedByMaster: boolean;
  masterSignatureAt?: DateTime;
}
```

### Garbage Management Plan (MARPOL Annex V)
```typescript
enum GarbeeCategory {
  PLASTICS = "A",
  FOOD_WASTE_OUTSIDE_SPECIAL_AREA = "B",
  FOOD_WASTE_INSIDE_SPECIAL_AREA = "C",
  CARGO_RESIDUES_NOT_HARMFUL = "D",
  CARGO_RESIDUES_HARMFUL = "E",
  INCINERATOR_ASHES = "F",
  OPERATIONAL_WASTE = "G",
  ANIMAL_CARCASSES = "H",
  FISHING_GEAR = "I",
  E_WASTE = "J",
  CARGO_RESIDUES_SEWAGE = "K",
}
```

---

## 12.6 PSC Inspection — Deficiency Tracking

```typescript
// Port State Control Inspection tracking
interface PscInspection {
  id: string;
  vesselId: string;
  companyId: string;
  inspectionDate: DateTime;
  port: string;
  portStateCountry: string;           // ISO 3166-1 alpha-2
  pscOfficer: string;
  inspectionType: PscInspectionType;
  result: PscResult;
  deficiencies: PscDeficiency[];
  isDetained: boolean;
  detentionFrom?: DateTime;
  detentionTo?: DateTime;
  releaseConditions?: string;
}

enum PscInspectionType {
  INITIAL = "INITIAL",
  MORE_DETAILED = "MORE_DETAILED",
  EXPANDED = "EXPANDED",
}

enum PscResult {
  NO_DEFICIENCY = "NO_DEFICIENCY",
  DEFICIENCY_NO_DETENTION = "DEFICIENCY_NO_DETENTION",
  DETAINED = "DETAINED",
}

interface PscDeficiency {
  id: string;
  inspectionId: string;
  deficiencyCode: string;             // IMO deficiency code
  description: string;
  actionCode: string;                 // Action taken
  isRectified: boolean;
  rectifiedAt?: DateTime;
  rectifiedPort?: string;
  evidence?: string;                  // URL dokumen bukti perbaikan
}

// Alert jika kapal sering kena PSC (>3x dalam 12 bulan = high risk)
const PSC_HIGH_RISK_THRESHOLD = 3;   // Deficiencies per 12 months
```

---

## 12.7 Certificate Expiry Alert System

### Alert Thresholds
```typescript
const CERT_ALERT_THRESHOLDS = {
  VESSEL: {
    SMC: { warning: 90, critical: 30 },
    DOC: { warning: 90, critical: 30 },
    ISSC: { warning: 90, critical: 30 },
    IOPP: { warning: 90, critical: 30 },
    LOAD_LINE: { warning: 90, critical: 30 },
  },
  SEAFARER: {
    COC: { warning: 90, critical: 30 },
    BST: { warning: 90, critical: 30 },
    MEDICAL: { warning: 60, critical: 30 },     // Medical lebih pendek
    SEAMAN_BOOK: { warning: 180, critical: 90 }, // Seaman book lebih panjang
  },
};
```

### Cron Job — Daily Expiry Check
```typescript
// Jalankan setiap hari pukul 06:00 WIB
@Cron("0 6 * * *", { timeZone: "Asia/Jakarta" })
async checkCertificateExpiry(): Promise<void> {
  const today = new Date();

  // Cek semua sertifikat kapal
  const expiringVesselCerts = await this.prisma.vesselCertificate.findMany({
    where: {
      deletedAt: null,
      expiryDate: {
        lte: addDays(today, 90),  // Dalam 90 hari ke depan
        gte: today,               // Belum expired
      },
    },
    include: { vessel: { include: { company: true } } },
  });

  // Update status dan kirim notifikasi
  for (const cert of expiringVesselCerts) {
    const daysLeft = differenceInDays(cert.expiryDate, today);
    const newStatus = this.calculateStatus(daysLeft);

    if (cert.status !== newStatus) {
      await this.prisma.vesselCertificate.update({
        where: { id: cert.id },
        data: { status: newStatus },
      });

      // Emit event untuk notifikasi
      this.eventEmitter.emit(
        "certificate.status.changed",
        new CertificateStatusChangedEvent(cert, newStatus, daysLeft)
      );
    }
  }
}
```

---

## 12.8 Compliance Dashboard Metrics

KPI yang wajib tampil di dashboard compliance:

```typescript
interface ComplianceKpis {
  // Vessel Compliance
  totalVessels: number;
  vesselsFullyCompliant: number;          // Semua cert valid
  vesselsWithExpiringSoon: number;        // Ada cert < 90 hari
  vesselsWithCritical: number;            // Ada cert < 30 hari
  vesselsWithExpired: number;             // Ada cert expired
  complianceRate: number;                 // % vessels fully compliant

  // Crew Compliance
  totalSeafarers: number;
  seafarersFullyCompliant: number;
  seafarersWithExpiringSoon: number;
  seafarersWithExpired: number;

  // PSC Performance
  pscInspectionsLast12Months: number;
  pscDetentionsLast12Months: number;
  pscDeficienciesLast12Months: number;
  pscDetentionRate: number;               // % dari total inspeksi

  // ISM
  openNonConformities: number;
  overdueCorrectiveActions: number;
  upcomingAudits: number;
}
```

---

## 12.9 Compliance Blocking Rules

Business rules yang mem-BLOCK operasi jika ada violation:

| Kondisi | Blokir Operasi | Level |
|---|---|---|
| SMC expired | ❌ Kapal tidak boleh berangkat | HARD BLOCK |
| DOC expired | ❌ Kapal tidak boleh berangkat | HARD BLOCK |
| ISSC expired | ❌ Kapal tidak boleh memasuki port tertentu | HARD BLOCK |
| Master CoC expired | ❌ Sign-on tidak diizinkan | HARD BLOCK |
| Manning di bawah minimum | ❌ Voyage tidak bisa diapprove | HARD BLOCK |
| SMC critical (< 30 hari) | ⚠️ Warning, butuh approval manager | SOFT BLOCK |
| Crew cert expired | ⚠️ Sign-on butuh justifikasi | SOFT BLOCK |
| PSC detained | ❌ Kapal tidak bisa berangkat | HARD BLOCK |

```typescript
// Implementasi blocking di application layer
async function approveVoyageDeparture(
  voyageId: string,
  approvedBy: RequestUser
): Promise<void> {
  const voyage = await this.voyageRepo.findById(voyageId);
  const vessel = await this.vesselRepo.findById(voyage.vesselId);

  // Run semua compliance checks
  const checks = await Promise.all([
    this.validateVesselCertificates(vessel),
    this.validateCompanyDoc(vessel.companyId),
    this.validateManningSafety(vessel.id, voyage.departureDate),
    this.validatePscStatus(vessel.id),
  ]);

  const hardBlocks = checks.flatMap(c => c.violations.filter(v => v.level === "HARD"));

  if (hardBlocks.length > 0) {
    throw new ComplianceBlockException(hardBlocks);
  }

  // Soft blocks hanya log warning
  const softBlocks = checks.flatMap(c => c.violations.filter(v => v.level === "SOFT"));
  if (softBlocks.length > 0) {
    await this.auditService.log({ action: "COMPLIANCE_WARNING", details: softBlocks });
  }

  await this.voyageRepo.approve(voyageId, approvedBy.userId);
}
```

---

*Setiap business rule compliance yang baru ditemukan dari regulasi harus segera ditambahkan ke file ini dan diimplementasikan di domain layer.*
