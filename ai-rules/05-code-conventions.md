# 05 — Code Conventions

> **AI Instruction:** TypeScript strict mode aktif. Tidak ada `any`, tidak ada logika duplikat, tidak ada magic string. SOLID principles berlaku di setiap file.

---

## 5.1 TypeScript Configuration

```json
// tsconfig.json (berlaku untuk semua apps)
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noImplicitReturns": true,
    "exactOptionalPropertyTypes": true,
    "target": "ES2022",
    "lib": ["ES2022"],
    "moduleResolution": "bundler",
    "paths": {
      "@/*": ["./src/*"],
      "@shared/*": ["../../packages/shared/src/*"]
    }
  }
}
```

**Aturan TypeScript yang tidak boleh dilanggar:**

- ❌ DILARANG: `any`, `unknown` tanpa type guard, `@ts-ignore`, `@ts-expect-error`
- ❌ DILARANG: Non-null assertion operator (`!`) kecuali ada comment justifikasi
- ✅ WAJIB: Semua fungsi memiliki explicit return type
- ✅ WAJIB: Semua parameter fungsi memiliki explicit type

---

## 5.2 Naming Conventions

### Variabel & Fungsi

```typescript
// camelCase untuk variabel dan fungsi
const vesselName = "MV Nusantara";
const crewCount = 25;

async function getActiveVessels(companyId: string): Promise<Vessel[]> {}
function calculateDaysUntilExpiry(expiryDate: Date): number {}
```

### Kelas & Interface

```typescript
// PascalCase untuk class, interface, type, enum

// Interface — prefix 'I' hanya untuk Repository
interface IVesselRepository { ... }       // Repository interface
interface VesselCardProps { ... }         // React props (NO prefix)
interface CreateVesselDto { ... }         // DTO (NO prefix)

// Type alias
type VesselStatus = "active" | "drydock" | "laid-up" | "scrapped";
type UUID = string;

// Enum — PascalCase nama, SCREAMING_SNAKE_CASE values
enum CertificateType {
  SAFETY_MANAGEMENT = "SAFETY_MANAGEMENT",
  LOAD_LINE = "LOAD_LINE",
  IOPP = "IOPP",
}
```

### Konstanta

```typescript
// SCREAMING_SNAKE_CASE untuk konstanta global
const MAX_CREW_CAPACITY = 50;
const CERTIFICATE_EXPIRY_WARNING_DAYS = 90;
const API_VERSION = "v1";

// Letakkan di packages/shared/src/constants/
```

### File dan Folder

```
# Backend (NestJS) — kebab-case
vessel.controller.ts
create-vessel.command.ts
prisma-vessel.repository.ts
vessel-not-found.exception.ts

# Frontend (React/Next) — PascalCase untuk komponen
VesselCard.tsx
CrewDataTable.tsx
CertificateExpiryBadge.tsx

# Hooks — kebab-case dengan prefix use-
use-vessels.ts
use-certificate-alerts.ts

# Utilities — kebab-case
format-date.ts
validate-imo-number.ts
```

---

## 5.3 SOLID Principles — Implementasi Konkret

### Single Responsibility Principle

```typescript
// ✅ BENAR — satu class, satu tanggung jawab
class VesselCertificateExpiryChecker {
  check(certificate: Certificate): ExpiryStatus { ... }
}

class CertificateExpiryNotifier {
  notify(expired: Certificate[]): Promise<void> { ... }
}

// ❌ SALAH — satu class, banyak tanggung jawab
class VesselService {
  checkExpiry() { ... }
  sendEmail() { ... }
  saveToDb() { ... }
  generateReport() { ... }
}
```

### Open/Closed Principle

```typescript
// ✅ BENAR — gunakan strategy pattern untuk variasi perilaku
interface NotificationStrategy {
  send(message: NotificationMessage): Promise<void>;
}

class EmailNotificationStrategy implements NotificationStrategy { ... }
class PushNotificationStrategy implements NotificationStrategy { ... }
class SmsNotificationStrategy implements NotificationStrategy { ... }
```

### Liskov Substitution Principle

```typescript
// ✅ BENAR — subclass harus bisa menggantikan parent
abstract class BaseDocument {
  abstract validate(): ValidationResult;
  abstract getExpiryDate(): Date;
}

class SafetyManagementCertificate extends BaseDocument {
  validate(): ValidationResult { ... }     // Harus implement
  getExpiryDate(): Date { ... }             // Harus implement
}
```

### Interface Segregation Principle

```typescript
// ✅ BENAR — interface spesifik, tidak fat
interface IReadableVesselRepository {
  findById(id: string, companyId: string): Promise<Vessel | null>;
  findAll(companyId: string): Promise<Vessel[]>;
}

interface IWritableVesselRepository {
  save(vessel: Vessel): Promise<Vessel>;
  delete(id: string): Promise<void>;
}

// ❌ SALAH — fat interface
interface IVesselRepository {
  findById(): ...
  findAll(): ...
  save(): ...
  delete(): ...
  generateReport(): ...
  sendAlert(): ...
}
```

### Dependency Inversion Principle

```typescript
// ✅ BENAR — depend on abstraction
class RegisterVesselHandler {
  constructor(
    private readonly vesselRepo: IVesselRepository, // Interface
    private readonly eventEmitter: IEventEmitter, // Interface
  ) {}
}

// ❌ SALAH — depend on concrete
class RegisterVesselHandler {
  constructor(
    private readonly vesselRepo: PrismaVesselRepository, // Concrete
  ) {}
}
```

---

## 5.4 No Duplicate Logic

```typescript
// ❌ SALAH — logika duplikat di dua tempat
// di vessel.service.ts
const daysUntilExpiry = Math.ceil(
  (expiryDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24),
);

// di crew.service.ts (copy-paste!)
const daysUntilExpiry = Math.ceil(
  (expiryDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24),
);

// ✅ BENAR — satu sumber kebenaran
// packages/shared/src/utils/date.utils.ts
export function calculateDaysUntilDate(targetDate: Date): number {
  return Math.ceil((targetDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
}
```

**Aturan DRY:**

- Logika yang sama di 2+ tempat → **wajib** di-extract ke shared utility
- Validasi yang sama di FE & BE → **wajib** di-extract ke shared Zod schema
- Konstanta yang sama di 2+ file → **wajib** di `packages/shared/constants/`

---

## 5.5 No Magic Strings / Numbers

```typescript
// ❌ SALAH
if (days <= 90) { ... }
if (status === "EXPIRING_SOON") { ... }

// ✅ BENAR
import { CERTIFICATE_EXPIRY_WARNING_DAYS } from "@shared/constants";
import { CertificateStatus } from "@shared/enums";

if (days <= CERTIFICATE_EXPIRY_WARNING_DAYS) { ... }
if (status === CertificateStatus.EXPIRING_SOON) { ... }
```

---

## 5.6 Error Handling

```typescript
// ✅ BENAR — explicit error handling
async function findVesselById(id: string, companyId: string): Promise<Vessel> {
  const vessel = await this.vesselRepo.findById(id, companyId);

  if (!vessel) {
    throw new VesselNotFoundException(id); // Domain exception
  }

  return vessel;
}

// ❌ SALAH — silent failure
async function findVesselById(id: string): Promise<Vessel | null> {
  try {
    return await this.vesselRepo.findById(id);
  } catch {
    return null; // Error ditelan
  }
}
```

---

## 5.7 Async/Await Rules

```typescript
// ✅ BENAR
async function getVesselWithCrew(vesselId: string): Promise<VesselWithCrew> {
  const [vessel, crew] = await Promise.all([
    this.vesselService.findById(vesselId),
    this.crewService.findByVessel(vesselId),
  ]);
  return { vessel, crew };
}

// ❌ SALAH — sequential await yang tidak perlu
async function getVesselWithCrew(vesselId: string): Promise<VesselWithCrew> {
  const vessel = await this.vesselService.findById(vesselId);
  const crew = await this.crewService.findByVessel(vesselId); // Bisa parallel
  return { vessel, crew };
}
```

---

## 5.8 Comments & Documentation

```typescript
/**
 * Menghitung status expiry sertifikat berdasarkan tanggal kadaluarsa.
 *
 * Business Rule:
 * - > 90 hari: VALID
 * - 30–90 hari: EXPIRING_SOON (trigger warning)
 * - 0–29 hari: CRITICAL (trigger urgent alert)
 * - < 0 hari: EXPIRED (vessel tidak boleh beroperasi)
 *
 * @param expiryDate - Tanggal kadaluarsa sertifikat
 * @returns CertificateExpiryStatus
 */
function calculateCertificateExpiryStatus(expiryDate: Date): CertificateExpiryStatus {
  const days = calculateDaysUntilDate(expiryDate);

  if (days > CERTIFICATE_EXPIRY_WARNING_DAYS) return CertificateExpiryStatus.VALID;
  if (days >= CERTIFICATE_EXPIRY_CRITICAL_DAYS) return CertificateExpiryStatus.EXPIRING_SOON;
  if (days >= 0) return CertificateExpiryStatus.CRITICAL;
  return CertificateExpiryStatus.EXPIRED;
}
```

**Aturan komentar:**

- ✅ JSDoc wajib untuk semua public function di service & domain layer
- ✅ Komentar business rule wajib — terutama untuk logika compliance maritim
- ❌ Jangan komentar hal yang obvious dari kode itu sendiri
- ❌ Jangan komentar kode yang di-comment-out — hapus saja

---

## 5.9 Import Order

```typescript
// 1. Node built-ins
import { resolve } from "path";

// 2. External packages
import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";

// 3. Internal packages (monorepo)
import { VesselStatus } from "@shared/enums";
import { calculateDaysUntilDate } from "@shared/utils";

// 4. Internal modules (same app)
import { IVesselRepository } from "../domain/repositories/vessel.repository.interface";
import { Vessel } from "../domain/entities/vessel.entity";

// 5. Relative imports
import { CreateVesselDto } from "./dtos/create-vessel.dto";
```

ESLint `import/order` rule harus di-enforce secara otomatis.

---

## 5.10 Forbidden Patterns

```typescript
// ❌ any type
const data: any = ...

// ❌ Type assertion tanpa guard
const vessel = data as Vessel;

// ❌ Non-null assertion tanpa justifikasi
const name = vessel!.name;

// ❌ Empty catch
try { ... } catch {}

// ❌ console.log di production code
console.log("debug:", data);

// ❌ Hardcoded credentials
const apiKey = "sk-12345-hardcoded";

// ❌ Direct DB query di controller
@Get()
async getVessels() {
  return this.prisma.vessel.findMany();  // Bypass service layer!
}

// ❌ Business logic di React component
function VesselCard({ vessel }) {
  const isExpired = new Date(vessel.expiryDate) < new Date();  // Logic di UI!
  ...
}
```

---

_Konvensi ini di-enforce via ESLint + Prettier + pre-commit hooks. Tidak ada pengecualian._
