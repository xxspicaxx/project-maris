# 02 — Architecture

> **AI Instruction:** Ikuti arsitektur ini secara ketat. Jangan campur layer. Jangan shortcut dengan menaruh business logic di controller atau di komponen React.

---

## 2.1 Prinsip Arsitektur

Sistem menggunakan kombinasi:

| Prinsip                        | Implementasi                                                                |
| ------------------------------ | --------------------------------------------------------------------------- |
| **Clean Architecture**         | Dependency rule: domain ← application ← infrastructure                      |
| **Domain-Driven Design (DDD)** | Bounded context per domain maritim                                          |
| **API-First**                  | Semua fitur diakses via API; UI adalah consumer pertama                     |
| **CQRS (lightweight)**         | Pisahkan read model (query) dari write model (command) untuk modul kompleks |
| **Event-Driven (internal)**    | Domain events untuk side effects (email, audit, notification)               |

---

## 2.2 Layer Architecture (per NestJS Module)

```
┌─────────────────────────────────────────────────────────┐
│                   PRESENTATION LAYER                    │
│   Controllers → Guards → Interceptors → Pipes           │
│   (HTTP, WebSocket — NO business logic here)            │
├─────────────────────────────────────────────────────────┤
│                   APPLICATION LAYER                     │
│   Use Cases / Command Handlers / Query Handlers         │
│   DTOs → Validation → Orchestration                     │
├─────────────────────────────────────────────────────────┤
│                     DOMAIN LAYER                        │
│   Entities → Value Objects → Domain Services            │
│   Domain Events → Repository Interfaces → Aggregates    │
│   (Pure TypeScript — NO framework dependencies)         │
├─────────────────────────────────────────────────────────┤
│                 INFRASTRUCTURE LAYER                    │
│   Prisma Repositories → External APIs → Message Queue  │
│   Email → File Storage → Cache (Redis)                  │
└─────────────────────────────────────────────────────────┘
```

### Dependency Rule (WAJIB)

```
Domain  ←  Application  ←  Infrastructure
Domain  ←  Application  ←  Presentation
```

- **Domain** tidak boleh import dari layer manapun
- **Application** hanya boleh import dari Domain
- **Infrastructure** mengimplementasikan interface yang didefinisikan di Domain

---

## 2.3 Bounded Context (DDD)

Setiap domain adalah **bounded context** yang berdiri sendiri:

```
contexts/
├── fleet/           ← Vessel, Flag State, Class Certificate
├── crew/            ← Seafarer, Certificate, Contract, Assignment
├── voyage/          ← Voyage, Port Call, Log Entry
├── technical/       ← PMS, Work Order, Defect, Dry Dock
├── document/        ← Document, Revision, Expiry Alert
├── hsseq/           ← Incident, Near Miss, Audit, Drill
├── financial/       ← Voyage Cost, Disbursement, Budget
├── procurement/     ← Purchase Order, Inventory, Supplier
├── company/         ← Company, Branch, Department
└── iam/             ← User, Role, Permission, Tenant
```

### Anti-Corruption Layer

Komunikasi antar bounded context **hanya** melalui:

1. **Domain Events** (async, via internal event bus)
2. **Application Service interfaces** (sync, via dependency injection)

**Jangan** import entity dari bounded context lain secara langsung.

---

## 2.4 System Architecture Diagram

```
┌──────────────────────────────────────────────────────────────┐
│                         CLIENT LAYER                         │
│  ┌─────────────────┐  ┌──────────────────┐                  │
│  │   Next.js Web   │  │  Mobile (Future) │                  │
│  │   (Port 3000)   │  │   React Native   │                  │
│  └────────┬────────┘  └────────┬─────────┘                  │
└───────────┼─────────────────────┼────────────────────────────┘
            │ HTTPS               │ HTTPS
┌───────────┼─────────────────────┼────────────────────────────┐
│           ▼         API GATEWAY ▼                            │
│  ┌────────────────────────────────────┐                      │
│  │         Nginx Reverse Proxy        │                      │
│  │    Rate Limiting / SSL Termination │                      │
│  └────────────────┬───────────────────┘                      │
└───────────────────┼──────────────────────────────────────────┘
                    │
┌───────────────────┼──────────────────────────────────────────┐
│                   ▼     BACKEND LAYER                        │
│  ┌─────────────────────────────────────┐                     │
│  │         NestJS Application          │                     │
│  │         (Port 4000)                 │                     │
│  │  ┌──────────┐  ┌──────────────────┐ │                     │
│  │  │ REST API │  │   WebSocket      │ │                     │
│  │  │ /api/v1  │  │   (real-time)    │ │                     │
│  │  └──────────┘  └──────────────────┘ │                     │
│  └─────────────────────────────────────┘                     │
└──────────────────────────────────────────────────────────────┘
                    │
┌───────────────────┼──────────────────────────────────────────┐
│                   ▼     DATA LAYER                           │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────────────┐  │
│  │  PostgreSQL  │ │    Redis     │ │   MinIO / S3         │  │
│  │  (Primary)   │ │  (Cache &    │ │   (File Storage)     │  │
│  │              │ │   Sessions)  │ │                      │  │
│  └──────────────┘ └──────────────┘ └──────────────────────┘  │
└──────────────────────────────────────────────────────────────┘
```

---

## 2.5 Multi-Tenancy Architecture

Model: **Row-Level Tenant Isolation** (bukan schema-per-tenant)

```typescript
// Setiap tabel utama memiliki companyId
model Vessel {
  id        String  @id
  companyId String  // ← Tenant identifier
  company   Company @relation(fields: [companyId], references: [id])
  // ...
}

// Setiap request di-inject dengan companyId dari JWT
interface RequestContext {
  userId: string;
  companyId: string;  // ← Dari JWT claim
  role: Role;
  permissions: Permission[];
}
```

### Tenant Isolation Middleware (WAJIB ada di setiap query)

```typescript
// Di setiap repository, selalu sertakan companyId filter
async findAll(companyId: string): Promise<Vessel[]> {
  return this.prisma.vessel.findMany({
    where: { companyId, deletedAt: null }  // ← WAJIB
  });
}
```

**AI RULES:**

- ❌ JANGAN pernah buat query tanpa `companyId` filter pada data yang tenant-scoped
- ❌ JANGAN expose `companyId` selection ke user biasa (hanya dari JWT)
- ✅ Super Admin dapat query lintas company dengan explicit flag

---

## 2.6 Event-Driven Patterns

### Domain Events

```typescript
// Domain event didefinisikan di domain layer
class CertificateExpiredEvent {
  constructor(
    public readonly certificateId: string,
    public readonly vesselId: string,
    public readonly expiryDate: Date,
    public readonly occurredAt: Date = new Date(),
  ) {}
}

// Event handler di application/infrastructure layer
@EventsHandler(CertificateExpiredEvent)
class SendCertificateExpiryAlertHandler {
  async handle(event: CertificateExpiredEvent): Promise<void> {
    // Send email, push notification, create audit log
  }
}
```

### Events yang Harus Ada (Critical)

| Event                      | Trigger                       | Handler                        |
| -------------------------- | ----------------------------- | ------------------------------ |
| `CertificateExpiringEvent` | 90/60/30 hari sebelum expired | Email + Dashboard alert        |
| `CrewSignedOnEvent`        | Kru naik kapal                | Update manning list, audit log |
| `VoyageCompletedEvent`     | Voyage selesai                | Trigger cost finalization      |
| `IncidentReportedEvent`    | Incident baru dibuat          | Notify ISM Manager             |
| `AuditFindingOpenedEvent`  | Finding audit dibuka          | Assign responsible party       |

---

## 2.7 CQRS Pattern (untuk modul kompleks)

Gunakan CQRS untuk modul dengan read/write yang sangat berbeda:

```typescript
// Command — mengubah state
class CreateVoyageCommand {
  constructor(
    public readonly vesselId: string,
    public readonly companyId: string,
    public readonly departurePort: string,
    public readonly arrivalPort: string,
  ) {}
}

// Query — hanya membaca
class GetVoyageSummaryQuery {
  constructor(
    public readonly voyageId: string,
    public readonly companyId: string,
  ) {}
}
```

**Modul yang WAJIB gunakan CQRS:**

- Voyage Management
- Financial Management
- Audit & Reporting

---

## 2.8 Error Architecture

Semua error harus berjenjang dan ter-handle:

```
Domain Layer      → DomainException (business rule violations)
Application Layer → ApplicationException (use case failures)
Infrastructure    → InfrastructureException (DB, network, IO)
Presentation      → HttpException (mapped from above)
```

Detail implementasi → lihat `13-error-handling.md`

---

_Arsitektur ini bersifat final untuk Phase 1-3. Perubahan arsitektur butuh review eksplisit._
